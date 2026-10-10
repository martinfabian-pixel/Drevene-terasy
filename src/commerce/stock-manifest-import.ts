import { productCatalog, type Product } from './catalog';
import { stockManifest } from './stock-catalog';
import { reviewStockCatalog } from './stock-policy';

export interface StockPendingSource {
  id: string; title: string; date: string; sha256: string; pages: number[];
  supplier: string; pricesIncludeVat: true; liveAvailability: false; vatRate: null;
}
export interface StockManifestDraft {
  products: Product[]; errors: string[]; warnings: string[];
  changedArticles: string[]; pendingSource?: StockPendingSource;
}

const identityFields = ['name', 'sourceCategory', 'thickness', 'format', 'salesUnit', 'referenceUnit', 'rebateGroup', 'stockStatus', 'dimensionsText', 'quality', 'packageContent', 'packageUnit'] as const;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const cents = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 100_000_000;
const text = (value: unknown, max = 200): value is string => typeof value === 'string' && value.length > 0 && value.length <= max && value.trim() === value;

/**
 * Stages a machine-generated manifest, never publishes it. The complete approved
 * article identity set is fixed; only the two literal gross prices may change.
 * The new PDF metadata remains pending until a human has reviewed its source.
 */
export function prepareStockManifestDraft(value: unknown): StockManifestDraft {
  const errors: string[] = [];
  const failure = (): StockManifestDraft => ({ products: [], errors, warnings: [], changedArticles: [] });
  if (!record(value) || value.version !== 1 || !record(value.source) || !Array.isArray(value.articles)) {
    errors.push('Neplatný manifest. Očakáva sa JSON verzie 1 so zdrojom a zoznamom artiklov.');
    return failure();
  }
  const source = value.source;
  const sourcePages = source.pages;
  const validDate = typeof source.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(source.date) && Number.isFinite(Date.parse(`${source.date}T00:00:00Z`)) && new Date(`${source.date}T00:00:00Z`).toISOString().slice(0, 10) === source.date;
  if (!text(source.id) || !text(source.title) || !validDate || typeof source.sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(source.sha256) || !Array.isArray(sourcePages) || sourcePages.length < 1 || sourcePages.length > 100 || sourcePages.some(page => !Number.isInteger(page) || page < 1 || page > 1000) || new Set(sourcePages).size !== sourcePages.length) {
    errors.push('Zdroj manifestu musí obsahovať ID, názov, platný dátum, SHA-256 PDF a jedinečné čísla strán.');
    return failure();
  }
  if ((source.supplier !== undefined && source.supplier !== stockManifest.source.supplier) || (source.vatRate !== undefined && source.vatRate !== null) || (source.pricesIncludeVat !== undefined && source.pricesIncludeVat !== true) || (source.liveAvailability !== undefined && source.liveAvailability !== false)) {
    errors.push('Import nesmie zmeniť dodávateľa, odvodiť sadzbu DPH, použiť ceny bez DPH ani potvrdiť aktuálnu skladovú dostupnosť.');
    return failure();
  }
  const pendingSource: StockPendingSource = {
    id: source.id as string, title: source.title as string, date: source.date as string,
    sha256: source.sha256.toLowerCase(), pages: [...sourcePages] as number[],
    supplier: stockManifest.source.supplier, pricesIncludeVat: true, liveAvailability: false, vatRate: null,
  };
  const approvedArticles = new Map(stockManifest.articles.map(article => [article.article, article]));
  if (value.articles.length !== approvedArticles.size) {
    errors.push(`Nový manifest musí obsahovať všetkých ${approvedArticles.size} schválených artiklov; obsahuje ${value.articles.length}. Pridanie alebo odstránenie sortimentu vyžaduje výslovné schválenie.`);
    return failure();
  }
  const incoming = new Map<string, { gross: number; reference: number }>();
  for (const row of value.articles) {
    if (!record(row) || typeof row.article !== 'string') { errors.push('Artikel musí mať presné textové artiklové číslo.'); continue; }
    const original = approvedArticles.get(row.article);
    if (!original || incoming.has(row.article)) { errors.push(`Artikel ${row.article}: nie je schválený alebo je duplicitný.`); continue; }
    if (identityFields.some(field => row[field] !== original[field])) { errors.push(`Artikel ${row.article}: názov, rozmery, jednotka, rabatová skupina a stav skladového programu musia zostať presne podľa schváleného sortimentu.`); continue; }
    if (!Number.isInteger(row.page) || (row.page as number) < 1 || (row.page as number) > 1000 || !pendingSource.pages.includes(row.page as number)) { errors.push(`Artikel ${row.article}: neplatná zdrojová strana nového PDF.`); continue; }
    if (!cents(row.priceGrossCents) || !cents(row.referenceGrossCents)) { errors.push(`Artikel ${row.article}: ceny musia byť celé nezáporné eurocenty, najviac 1 000 000 €.`); continue; }
    incoming.set(row.article, { gross: row.priceGrossCents, reference: row.referenceGrossCents });
  }
  for (const article of approvedArticles.keys()) if (!incoming.has(article)) errors.push(`Chýba platný schválený artikel ${article}.`);
  if (errors.length) return failure();
  const draft = structuredClone(productCatalog);
  const changedArticles: string[] = [];
  for (const product of draft) {
    for (const variant of product.variants) {
      const articleNumber = variant.articleNumber;
      const updated = articleNumber ? incoming.get(articleNumber) : undefined;
      const original = articleNumber ? approvedArticles.get(articleNumber) : undefined;
      if (!updated || !original) { errors.push(`Katalógový variant ${variant.id} nemožno priradiť k schválenému artiklu.`); continue; }
      if (updated.gross !== original.priceGrossCents || updated.reference !== original.referenceGrossCents) changedArticles.push(articleNumber!);
      // Primary piece/package price and secondary bm price are copied separately.
      // Never recompute one from the other, apply a rebate or infer a VAT rate.
      variant.priceGross = updated.gross / 100;
      variant.pricePerBmGross = original.referenceUnit === 'bm' ? updated.reference / 100 : null;
    }
  }
  if (errors.length) return failure();
  const review = reviewStockCatalog(draft, { allowPriceChanges: true, requireComplete: true });
  if (review.errors.length) { errors.push(...review.errors); return failure(); }
  return {
    products: review.products, errors: [], changedArticles,
    pendingSource,
    warnings: ['Import je iba lokálny návrh. Pred publikovaním porovnajte ceny s novým PDF a potvrďte jeho pôvod. SHA-256 v JSON sám nepreukazuje obsah nahraného cenníka.', 'Verejný katalóg, pôvodný schválený zdroj a aktuálna skladová dostupnosť sa týmto importom nemenia.'],
  };
}

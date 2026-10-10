import { categoryLabels, productCatalog, type CategoryId, type Product, type SaleUnit } from './catalog';
export const csvColumns = ['product_id', 'name', 'category', 'manufacturer', 'wood_species', 'surface', 'variant_id', 'length_mm', 'width_mm', 'thickness_mm', 'profile', 'color', 'unit', 'price_gross_eur', 'vat_percent', 'availability', 'technical_sheet', 'source_url', 'article_number', 'source_name', 'rebate_group', 'source_page', 'source_format', 'source_thickness', 'source_size', 'source_unit', 'price_per_bm_gross_eur', 'package_quantity', 'stock_program_status', 'stock_source_id', 'stock_source_title', 'stock_source_date', 'stock_source_sha256', 'source_category'] as const;
export interface CsvImportResult { products: Product[]; errors: string[]; warnings: string[] }
export function parseCsv(input: string): string[][] {
  if (input.length > 2_000_000) throw new Error('CSV prekračuje limit 2 MB.');
  const source = input.replace(/^\uFEFF/, ''), rows: string[][] = [];
  const separator = source.slice(0, source.indexOf('\n') < 0 ? source.length : source.indexOf('\n')).includes(';') ? ';' : ',';
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < source.length; i++) {
    const character = source[i];
    if (character === '"') {
      if (quoted && source[i + 1] === '"') { cell += '"'; i++; }
      else if (!quoted && cell.trim()) throw new Error('Úvodzovka môže začínať iba na začiatku poľa.');
      else quoted = !quoted;
    } else if (!quoted && character === separator) { row.push(cell.trim()); cell = ''; }
    else if (!quoted && (character === '\n' || character === '\r')) {
      if (character === '\r' && source[i + 1] === '\n') i++;
      row.push(cell.trim()); if (row.some(value => value !== '')) rows.push(row); row = []; cell = '';
    } else cell += character;
  }
  if (quoted) throw new Error('CSV obsahuje neuzavreté úvodzovky.');
  row.push(cell.trim()); if (row.some(value => value !== '')) rows.push(row);
  if (rows.length > 5001) throw new Error('Maximálne 5 000 variantov na import.');
  return rows;
}
export function importProductCsv(input: string): CsvImportResult {
  const errors: string[] = [], warnings: string[] = ['Import je iba lokálny návrh aktualizácie. Verejný katalóg, ceny a dostupnosť sa nemenia bez kontroly zdrojového cenníka.'];
  let rows: string[][];
  try { rows = parseCsv(input); } catch (error) { return { products: [], errors: [error instanceof Error ? error.message : 'Neplatné CSV.'], warnings }; }
  const headers = rows.shift() || [];
  for (const name of ['product_id', 'name', 'category', 'variant_id', 'unit']) if (!headers.includes(name)) errors.push(`Chýba stĺpec ${name}.`);
  if (errors.length) return { products: [], errors, warnings };
  const products = new Map<string, Product>(), variantIds = new Set<string>();
  rows.forEach((values, index) => {
    const line = index + 2, value = (key: string) => values[headers.indexOf(key)] || '';
    const id = value('product_id'), variantId = value('variant_id'), category = value('category') as CategoryId, unit = value('unit') as SaleUnit;
    const fail = (message: string) => errors.push(`Riadok ${line}: ${message}`);
    if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id) || !/^[a-z0-9][a-z0-9_-]{0,119}$/.test(variantId)) { fail('ID používa malé písmená, číslice, pomlčku alebo podčiarkovník.'); return; }
    if (variantIds.has(variantId)) { fail('Duplicitné ID variantu.'); return; }
    if (!Object.hasOwn(categoryLabels, category) || !['ks', 'bm', 'm²', 'bal', 'l'].includes(unit)) { fail('Neznáma kategória alebo jednotka.'); return; }
    const name = value('name'); if (!name || name.length > 200) { fail('Názov je povinný, najviac 200 znakov.'); return; }
    let rowValid = true;
    const numeric = (key: string, maximum: number, allowZero = false): number | null => {
      const raw = value(key); if (!raw) return null;
      const parsed = Number(raw.replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed < (allowZero ? 0 : 0.001) || parsed > maximum) { fail(`Neplatná hodnota ${key}.`); rowValid = false; return null; }
      return parsed;
    };
    const lengthMm = numeric('length_mm', 20_000), widthMm = numeric('width_mm', 2000), thicknessMm = numeric('thickness_mm', 500), priceGross = numeric('price_gross_eur', 1_000_000, true), vatRate = numeric('vat_percent', 100, true);
    if (priceGross !== null && vatRate === null) warnings.push(`Riadok ${line}: cena je s DPH; cenník neuvádza sadzbu DPH, cena bez DPH sa nevypočíta.`);
    const sourcePage = numeric('source_page', 10000), pricePerBmGross = numeric('price_per_bm_gross_eur', 1_000_000, true), packageQuantity = numeric('package_quantity', 100_000);
    const articleNumber = value('article_number');
    if (articleNumber && !/^[0-9]{5}\/[0-9]{4}$/.test(articleNumber)) { fail('Neplatné artiklové číslo.'); rowValid = false; }
    if (packageQuantity !== null && !Number.isInteger(packageQuantity)) { fail('Obsah balenia musí byť celé číslo.'); rowValid = false; }
    const sourceUnit = value('source_unit'), stockProgramStatus = value('stock_program_status');
    if (sourceUnit && !['ks', 'balenie'].includes(sourceUnit) || stockProgramStatus && !['stock-program', 'while-stocks-last'].includes(stockProgramStatus)) { fail('Neplatná jednotka alebo označenie skladového programu.'); rowValid = false; }
    if ((unit === 'bm' && lengthMm === null) || (unit === 'm²' && (!lengthMm || !widthMm))) { fail('Jednotka bm/m² potrebuje rozmery.'); rowValid = false; }
    const safeUrl = (key: string) => {
      const raw = value(key); if (!raw) return null;
      try { const url = new URL(raw); if (url.protocol === 'https:' && !url.username && !url.password) return url.href; } catch { /* Validation follows. */ }
      fail(`Pole ${key} musí byť HTTPS URL.`); rowValid = false; return null;
    };
    const technicalSheet = safeUrl('technical_sheet'), source = safeUrl('source_url');
    if (!rowValid) return;
    let product = products.get(id);
    if (product && (product.name !== name || product.category !== category)) { fail('Varianty toho istého produktu majú rozdielne meno alebo kategóriu.'); return; }
    if (!product) {
      product = { id, name, category, family: categoryLabels[category], manufacturer: value('manufacturer') || null, woodSpecies: value('wood_species') || null, surface: value('surface') || null,
        images: [category === 'wpc' ? 'material-wpc-2027.webp' : category === 'thermo' ? 'material-thermo-2027.webp' : 'material-drevo-2027.webp'],
        description: 'Lokálne importované demonštračné údaje. Správca musí overiť pôvod, cenu, dostupnosť a kompatibilitu.', variants: [], technicalSheet, installationRules: null,
        status: 'demo', sourceUrls: source ? [source] : [], relatedProductIds: [], imageKind: 'illustration',
        stockSource: value('stock_source_id') ? { id: value('stock_source_id'), title: value('stock_source_title'), date: value('stock_source_date'), sha256: value('stock_source_sha256'), pages: [] } : undefined }; 
      products.set(id, product);
    }
    variantIds.add(variantId);
    product.variants.push({ id: variantId, lengthMm, widthMm, thicknessMm, profile: value('profile') || 'Neurčený', color: value('color') || 'Neurčená', unit, priceGross, vatRate, availability: value('availability') || null,
      articleNumber: articleNumber || undefined, sourceName: value('source_name') || undefined, sourceCategory: value('source_category') || undefined, rebateGroup: value('rebate_group') || undefined, sourcePage: sourcePage ?? undefined,
      sourceFormat: articleNumber ? value('source_format') : undefined, sourceThickness: articleNumber ? value('source_thickness') : undefined, sourceSize: value('source_size') || null, sourceUnit: sourceUnit as 'ks' | 'balenie' || undefined,
      pricePerBmGross, packageQuantity, stockProgramStatus: stockProgramStatus as 'stock-program' | 'while-stocks-last' || undefined, availabilityBasis: articleNumber ? 'pricelist' : undefined });
    if (sourcePage !== null && product.stockSource && !product.stockSource.pages.includes(sourcePage)) product.stockSource.pages.push(sourcePage);
  });
  return { products: [...products.values()], errors, warnings };
}
const csvCell = (value: unknown) => {
  const text = String(value ?? '');
  const safe = /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};
export function exportProductCsv(products: Product[]): string {
  const rows = products.flatMap(product => product.variants.map(variant => [product.id, product.name, product.category, product.manufacturer, product.woodSpecies, product.surface,
    variant.id, variant.lengthMm, variant.widthMm, variant.thicknessMm, variant.profile, variant.color, variant.unit, variant.priceGross, variant.vatRate, variant.availability, product.technicalSheet, product.sourceUrls[0], variant.articleNumber, variant.sourceName, variant.rebateGroup, variant.sourcePage, variant.sourceFormat, variant.sourceThickness, variant.sourceSize, variant.sourceUnit, variant.pricePerBmGross, variant.packageQuantity, variant.stockProgramStatus, product.stockSource?.id, product.stockSource?.title, product.stockSource?.date, product.stockSource?.sha256, variant.sourceCategory].map(csvCell).join(';')));
  return '\uFEFF' + csvColumns.join(';') + '\n' + rows.join('\n');
}

/** Complete approved stock export: use it as a draft price-update template. */
export const csvTemplate = exportProductCsv(productCatalog);

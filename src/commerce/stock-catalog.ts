import manifest from '../data/jaf-stock-2026-10-10.json';
import type { CategoryId, Product, ProductVariant } from './catalog';

function freezeStockData<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freezeStockData(item);
    Object.freeze(value);
  }
  return value;
}
// A draft must be cloned. No shared nested record can change the public source.
export const stockManifest = freezeStockData(manifest);
export function stockCategory(sourceCategory: string, name: string): CategoryId {
  if (sourceCategory === 'Terasy z masívneho dreva') return 'massive';
  if (sourceCategory === 'Terasy z tepelne upraveného dreva') return name.startsWith('Termoborovica hranol') ? 'joists' : 'thermo';
  if (sourceCategory === 'WPC terasy') return 'wpc';
  if (sourceCategory.endsWith('Povrchová úprava')) return 'care';
  if (sourceCategory.endsWith('Podkladové konštrukcie')) return name.startsWith('Hliníková') ? 'aluminium' : 'joists';
  if (sourceCategory.endsWith('Terasové podpery')) return 'pedestals';
  if (sourceCategory.endsWith('Skrutky')) return 'fixings';
  if (/^(?:Klip|Clip|Fasádny klip|Štartovací klip|Plastový.*klip|Skryté kovanie|Skrutka|UPM.*Clip)/i.test(name)) return 'fixings';
  if (/^WPC (?:krycia lišta|schodový profil)|^Koncovka/.test(name)) return 'finish';
  return 'accessories';
}
export function stockGroupName(name: string): string {
  if (name.startsWith('Terasová podpera Lifto')) return 'Terasová podpera Lifto';
  return name;
}
// Stable content identity: independent of row order, price, length and date.
export function stockProductId(category: CategoryId, name: string): string {
  let hash = 2166136261;
  for (const c of `${category}|${stockGroupName(name)}`) hash = Math.imul(hash ^ c.charCodeAt(0), 16777619) >>> 0;
  return `jaf-${hash.toString(16).padStart(8, '0')}`;
}
export const stockVariantId = (article: string) => `jaf-${article.replace('/', '-')}`;
function number(value: string): number | null {
  const result = Number(value.replaceAll(' ', '').replace(',', '.'));
  return value && Number.isFinite(result) && result > 0 ? result : null;
}
function dimensions(article: typeof manifest.articles[number]): Pick<ProductVariant, 'lengthMm' | 'widthMm' | 'thicknessMm'> {
  const [first = '', second = ''] = article.format.split(/\s*x\s*/);
  const widthFirst = article.sourceCategory.startsWith('Terasy') || article.sourceCategory === 'WPC terasy';
  const longFirst = /Podkladové konštrukcie|WPC Príslušenstvo|Podložky|Skrutky/.test(article.sourceCategory);
  return { lengthMm: number(widthFirst ? second : longFirst ? first : second),
    widthMm: number(widthFirst ? first : longFirst ? second : first), thicknessMm: number(article.thickness) };
}
function profile(name: string, size: string | null): string {
  const value = name.match(/(?:hladký\s*\/\s*hladký|jemn(?:e|é|ý) (?:vlnka|drážkovaný).*|kartáčovaný\s*\/\s*hladký|obojstr\. drážk\. jemné\/hrubé|Profil X2|35-55 mm|55-95 mm|95-135 mm)/)?.[0];
  return value || size || 'Profil v cenníku nešpecifikovaný';
}
function color(name: string): string {
  const value = name.match(/(?:Golden Oak|Orech antik|Sand Teak|Silver Limba|Walnut|Graphite Fir|California Oak|Royal Elm|Silver Teak|Streaked Ebony|Jedľa strieborná|Gaštan|Jantár|Woody Sivá|Woody Teak|Java \(svetlohnedý\)|Kongo \(tmavohnedý\)|Farblos \(Natur\))/)?.[0];
  return value || 'Farba v cenníku nešpecifikovaná';
}
function image(category: CategoryId): string[] {
  if (category === 'massive') return ['material-drevo-2027.webp'];
  if (category === 'thermo') return ['material-thermo-2027.webp'];
  if (category === 'wpc') return ['material-wpc-2027.webp'];
  // Neutral technical tile, not a made-up photograph of a particular SKU.
  return ['stock-accessory.svg'];
}
export function buildStockCatalog(): Product[] {
  const groups = new Map<string, Product>();
  for (const article of manifest.articles) {
    const category = stockCategory(article.sourceCategory, article.name);
    const id = stockProductId(category, article.name);
    let product = groups.get(id);
    if (!product) {
      product = { id, name: stockGroupName(article.name), category, family: article.sourceCategory,
        manufacturer: null, supplier: manifest.source.supplier, woodSpecies: null, surface: null,
        images: image(category), imageKind: 'illustration',
        description: 'Artikel skladového programu JAF HOLZ podľa dodaného cenníka z 10. 10. 2026. Cenníková cena obsahuje DPH; bez zľavy alebo prirážky. Aktuálnu dostupnosť treba potvrdiť. Montážne pravidlá a technický list cenník neobsahuje.',
        variants: [], technicalSheet: null, installationRules: null, engineRules: null, status: 'verified',
        stockSource: manifest.source, sourceUrls: [], relatedProductIds: [] };
      groups.set(id, product);
    } else if (product.name !== stockGroupName(article.name) || product.category !== category) {
      throw new Error('Stock product identity collision');
    }
    const quantityMatch = article.name.match(/(?:, |\b)(\d+) ks\b/);
    product.variants.push({ id: stockVariantId(article.article), ...dimensions(article),
      profile: profile(article.name, article.dimensionsText), color: color(article.name),
      unit: article.salesUnit === 'balenie' ? 'bal' : 'ks', priceGross: article.priceGrossCents / 100,
      vatRate: null, availability: article.stockStatus, articleNumber: article.article, sourceName: article.name,
      rebateGroup: article.rebateGroup, sourceCategory: article.sourceCategory, sourcePage: article.page, sourceFormat: article.format,
      sourceThickness: article.thickness, sourceSize: article.dimensionsText, sourceUnit: article.salesUnit as 'ks' | 'balenie',
      pricePerBmGross: article.referenceUnit === 'bm' ? article.referenceGrossCents / 100 : null,
      packageQuantity: quantityMatch ? Number(quantityMatch[1]) : null,
      stockProgramStatus: article.stockStatus === 'Skladom do vypredania zásob' ? 'while-stocks-last' : 'stock-program',
      availabilityBasis: 'pricelist',
    });
  }
  for (const product of groups.values()) {
    product.family = [...new Set(product.variants.map(variant => variant.sourceCategory))].join(' / ');
  }
  return freezeStockData([...groups.values()]);
}

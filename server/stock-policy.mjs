import { readFileSync } from 'node:fs';
import { ApiError, validateProductCatalog } from './domain.mjs';

// The checked-in, owner-supplied PDF manifest is the only approved assortment.
// No environment variable, admin request or supplier website expands this list.
export const approvedStockManifest = JSON.parse(readFileSync(new URL('../src/data/jaf-stock-2026-10-10.json', import.meta.url), 'utf8'));
const source = approvedStockManifest.source;
if (!source?.pricesIncludeVat || source.vatRate !== null || source.liveAvailability !== false || !/^[a-f0-9]{64}$/.test(source.sha256) || !Array.isArray(approvedStockManifest.articles)) throw new Error('Invalid approved stock source.');
function categoryOf(section, name) {
  if (section === 'Terasy z masívneho dreva') return 'massive';
  if (section === 'Terasy z tepelne upraveného dreva') return name.startsWith('Termoborovica hranol') ? 'joists' : 'thermo';
  if (section === 'WPC terasy') return 'wpc';
  if (section.endsWith('Povrchová úprava')) return 'care';
  if (section.endsWith('Podkladové konštrukcie')) return name.startsWith('Hliníková') ? 'aluminium' : 'joists';
  if (section.endsWith('Terasové podpery')) return 'pedestals';
  if (section.endsWith('Skrutky')) return 'fixings';
  if (/^(?:Klip|Clip|Fasádny klip|Štartovací klip|Plastový.*klip|Skryté kovanie|Skrutka|UPM.*Clip)/i.test(name)) return 'fixings';
  if (/^WPC (?:krycia lišta|schodový profil)|^Koncovka/.test(name)) return 'finish';
  return 'accessories';
}
const groupName = name => name.startsWith('Terasová podpera Lifto') ? 'Terasová podpera Lifto' : name;
function productId(category, name) {
  let hash = 2166136261;
  for (const character of `${category}|${groupName(name)}`) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619) >>> 0;
  return `jaf-${hash.toString(16).padStart(8, '0')}`;
}
const positive = raw => { const number = Number(raw.replaceAll(' ', '').replace(',', '.')); return raw && Number.isFinite(number) && number > 0 ? number : null; };
function dimensions(article) {
  const [first = '', second = ''] = article.format.split(/\s*x\s*/);
  const widthFirst = article.sourceCategory.startsWith('Terasy') || article.sourceCategory === 'WPC terasy';
  const longFirst = /Podkladové konštrukcie|WPC Príslušenstvo|Podložky|Skrutky/.test(article.sourceCategory);
  return { lengthMm: positive(widthFirst ? second : longFirst ? first : second), widthMm: positive(widthFirst ? first : longFirst ? second : first), thicknessMm: positive(article.thickness) };
}
function profile(name, size) {
  const value = name.match(/(?:hladký\s*\/\s*hladký|jemn(?:e|é|ý) (?:vlnka|drážkovaný).*|kartáčovaný\s*\/\s*hladký|obojstr\. drážk\. jemné\/hrubé|Profil X2|35-55 mm|55-95 mm|95-135 mm)/)?.[0];
  return value || size || 'Profil v cenníku nešpecifikovaný';
}
function color(name) {
  const value = name.match(/(?:Golden Oak|Orech antik|Sand Teak|Silver Limba|Walnut|Graphite Fir|California Oak|Royal Elm|Silver Teak|Streaked Ebony|Jedľa strieborná|Gaštan|Jantár|Woody Sivá|Woody Teak|Java \(svetlohnedý\)|Kongo \(tmavohnedý\)|Farblos \(Natur\))/)?.[0];
  return value || 'Farba v cenníku nešpecifikovaná';
}
const illustration = category => category === 'massive' ? 'material-drevo-2027.webp' : category === 'thermo' ? 'material-thermo-2027.webp' : category === 'wpc' ? 'material-wpc-2027.webp' : 'stock-accessory.svg';
export function buildApprovedStockCatalog() {
  const groups = new Map(), articles = new Set();
  for (const article of approvedStockManifest.articles) {
    if (!/^\d{5}\/\d{4}$/.test(article.article) || articles.has(article.article) || !Number.isSafeInteger(article.priceGrossCents) || article.priceGrossCents < 0 || !['ks', 'balenie'].includes(article.salesUnit)) throw new Error('Invalid approved stock article.');
    articles.add(article.article);
    const category = categoryOf(article.sourceCategory, article.name), id = productId(category, article.name);
    let product = groups.get(id);
    if (!product) {
      product = { id, name: groupName(article.name), category, family: article.sourceCategory, manufacturer: null, supplier: source.supplier, woodSpecies: null, surface: null,
        images: [illustration(category)], imageKind: 'illustration', description: 'Artikel skladového programu JAF HOLZ podľa dodaného cenníka z 10. 10. 2026. Cenníková cena obsahuje DPH; bez zľavy alebo prirážky. Aktuálnu dostupnosť treba potvrdiť. Montážne pravidlá a technický list cenník neobsahuje.',
        variants: [], technicalSheet: null, installationRules: null, engineRules: null, status: 'verified', sourceUrls: [], relatedProductIds: [], stockSource: structuredClone(source) };
      groups.set(id, product);
    } else if (product.name !== groupName(article.name) || product.category !== category) throw new Error('Stock identity collision.');
    const quantity = article.name.match(/(?:, |\b)(\d+) ks\b/);
    product.variants.push({ id: `jaf-${article.article.replace('/', '-')}`, ...dimensions(article), profile: profile(article.name, article.dimensionsText), color: color(article.name), unit: article.salesUnit === 'balenie' ? 'bal' : 'ks', priceGross: article.priceGrossCents / 100, vatRate: null, availability: article.stockStatus,
      articleNumber: article.article, sourceName: article.name, rebateGroup: article.rebateGroup, sourceCategory: article.sourceCategory, sourcePage: article.page, sourceFormat: article.format, sourceThickness: article.thickness, sourceSize: article.dimensionsText, sourceUnit: article.salesUnit,
      pricePerBmGross: article.referenceUnit === 'bm' ? article.referenceGrossCents / 100 : null, packageQuantity: quantity ? Number(quantity[1]) : null,
      stockProgramStatus: article.stockStatus === 'Skladom do vypredania zásob' ? 'while-stocks-last' : 'stock-program', availabilityBasis: 'pricelist', stock: null });
  }
  for (const product of groups.values()) product.family = [...new Set(product.variants.map(variant => variant.sourceCategory))].join(' / ');
  return [...groups.values()];
}
const stockVariantFields = ['id', 'lengthMm', 'widthMm', 'thicknessMm', 'profile', 'color', 'unit', 'priceGross', 'vatRate', 'availability', 'articleNumber', 'sourceName', 'sourceCategory', 'rebateGroup', 'sourcePage', 'sourceFormat', 'sourceThickness', 'sourceSize', 'sourceUnit', 'pricePerBmGross', 'packageQuantity', 'stockProgramStatus', 'availabilityBasis'];
const stockProductFields = ['id', 'name', 'category', 'family', 'manufacturer', 'supplier', 'status'];
const sourceFields = ['id', 'title', 'date', 'sha256', 'supplier', 'vatRate', 'pricesIncludeVat', 'liveAvailability'];
const approvedCatalog = buildApprovedStockCatalog();
function enforceApprovedStockCatalog(incoming) {
  if (!Array.isArray(incoming) || incoming.length !== approvedCatalog.length) throw new ApiError(409, 'Catalog must contain the complete approved PDF assortment.');
  const seen = new Set(), seenVariants = new Set();
  return incoming.map(product => {
    const approved = approvedCatalog.find(item => item.id === product.id);
    if (!approved || seen.has(product.id)) throw new ApiError(409, 'Product is outside the approved PDF assortment.');
    seen.add(product.id);
    if (stockProductFields.some(field => (product[field] ?? null) !== (approved[field] ?? null)) || !product.stockSource || sourceFields.some(field => (product.stockSource[field] ?? null) !== (approved.stockSource[field] ?? null)) || JSON.stringify(product.stockSource.pages) !== JSON.stringify(approved.stockSource.pages)) throw new ApiError(409, 'Product identity or PDF provenance differs from the approved source.');
    if (!Array.isArray(product.variants) || product.variants.length !== approved.variants.length) throw new ApiError(409, 'All approved PDF variants are required.');
    const variants = product.variants.map(variant => {
      const original = approved.variants.find(item => item.id === variant.id);
      if (!original || seenVariants.has(variant.id) || stockVariantFields.some(field => (variant[field] ?? null) !== (original[field] ?? null))) throw new ApiError(409, 'Article, gross price, unit, rebate or PDF metadata differ from the approved source.');
      seenVariants.add(variant.id);
      return { ...structuredClone(original), stock: variant.stock == null ? null : structuredClone(variant.stock) };
    });
    return { ...structuredClone(approved), images: [...product.images], imageKind: product.imageKind || approved.imageKind, technicalSheet: product.technicalSheet, variants };
  });
}
const testPolicyBrand = Symbol('isolated backend catalog fixture');
/** Trusted test code only. start.mjs never reads this option from the environment. */
export function createTestOnlyCatalogPolicy(approved) {
  if (!Array.isArray(approved)) throw new Error('An explicit isolated test assortment is required.');
  const fixture = validateProductCatalog(approved);
  return { [testPolicyBrand]: true, approved: fixture, enforce: incoming => {
    if (JSON.stringify(incoming) !== JSON.stringify(fixture)) throw new ApiError(409, 'Catalog differs from the isolated test fixture.');
    return structuredClone(fixture);
  }, allowLiveOrders: true, testOnly: true };
}
export function backendCatalogPolicy(config) {
  if (config.testOnlyCatalogPolicy !== undefined) {
    if (config.testOnly !== true || config.testOnlyCatalogPolicy?.[testPolicyBrand] !== true) throw new Error('Test catalog policy requires explicit trusted test-only configuration.');
    return config.testOnlyCatalogPolicy;
  }
  return { approved: structuredClone(approvedCatalog), enforce: enforceApprovedStockCatalog, allowLiveOrders: false, testOnly: false };
}

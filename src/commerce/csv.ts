import { categoryLabels, type CategoryId, type Product, type SaleUnit } from './catalog';
export const csvColumns = ['product_id', 'name', 'category', 'manufacturer', 'wood_species', 'surface', 'variant_id', 'length_mm', 'width_mm', 'thickness_mm', 'profile', 'color', 'unit', 'price_gross_eur', 'vat_percent', 'availability', 'technical_sheet', 'source_url'] as const;
export const csvTemplate = `${csvColumns.join(';')}\n"demo-import";"Vlastný produkt · DEMO";"massive";"";"";"";"demo-import-4000";4000;140;26;"Hladký";"Prírodný";"ks";;;;;\n`;
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
  const errors: string[] = [], warnings: string[] = ['Import je lokálne demo. Ceny, dostupnosť a montážne pravidlá pred publikovaním overí správca.'];
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
    if (priceGross !== null && vatRate === null) { fail('Pri cene je povinná overená sadzba DPH.'); rowValid = false; }
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
        status: 'demo', sourceUrls: source ? [source] : [], relatedProductIds: [] };
      products.set(id, product);
    }
    variantIds.add(variantId);
    product.variants.push({ id: variantId, lengthMm, widthMm, thicknessMm, profile: value('profile') || 'Neurčený', color: value('color') || 'Neurčená', unit, priceGross, vatRate, availability: value('availability') || null });
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
    variant.id, variant.lengthMm, variant.widthMm, variant.thicknessMm, variant.profile, variant.color, variant.unit, variant.priceGross, variant.vatRate, variant.availability, product.technicalSheet, product.sourceUrls[0]].map(csvCell).join(';')));
  return '\uFEFF' + csvColumns.join(';') + '\n' + rows.join('\n');
}

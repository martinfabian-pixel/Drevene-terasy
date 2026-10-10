import { categoryLabels, type Product } from './catalog';
import { exportProductCsv, importProductCsv } from './csv';
import { validateRulesJson } from './rules-import';
export const isLocalImage = (source: string) => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(source) && source.length <= 2_800_000;
export function validateLocalCatalog(value: unknown): Product[] | null {
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('products' in value) || !Array.isArray(value.products) || value.products.length > 1000) return null;
  const products: Product[] = [];
  for (const raw of value.products) {
    if (!raw || typeof raw !== 'object' || !Object.hasOwn(categoryLabels, raw.category) || typeof raw.name !== 'string' || typeof raw.id !== 'string' || !Array.isArray(raw.variants) || !raw.variants.length || !Array.isArray(raw.images)) return null;
    try {
      const imported = importProductCsv(exportProductCsv([raw]));
      if (imported.errors.length || imported.products.length !== 1) return null;
      const product = imported.products[0];
      if (raw.images.some((source: unknown) => typeof source !== 'string' || !(isLocalImage(source) || source === 'stock-accessory.svg' || /^[a-zA-Z0-9_-]+\.(webp|png|jpg|jpeg)$/.test(source)))) return null;
      product.images = raw.images.slice(0, 6);
      product.imageKind = raw.imageKind === 'product' ? 'product' : 'illustration';
      product.supplier = typeof raw.supplier === 'string' ? raw.supplier.slice(0, 200) : null;
      if (!product.images.length) return null;
      product.description = typeof raw.description === 'string' ? raw.description.slice(0, 10000) : product.description;
      product.relatedProductIds = Array.isArray(raw.relatedProductIds) ? raw.relatedProductIds.filter((id: unknown) => typeof id === 'string' && /^[a-z0-9_-]+$/.test(id)).slice(0, 100) : [];
      if (raw.engineRules !== undefined && raw.engineRules !== null) { const result = validateRulesJson(raw.engineRules); if (!result.rules) return null; product.engineRules = result.rules; }
      else product.engineRules = null;
      // Restored technical values remain explicitly demo, never silently verified.
      if (raw.installationRules && raw.status === 'demo' && raw.installationRules.status === 'demo') {
        const rules = raw.installationRules;
        const numbers = ['boardGapMm', 'endGapMm', 'wallGapMm', 'maxJoistSpacingMm', 'maxPedestalSpacingMm', 'fixingsPerSupport', 'kerfMm', 'minReusableOffcutMm'];
        if (numbers.some(key => typeof rules[key] !== 'number' || !Number.isFinite(rules[key]) || rules[key] < 0 || rules[key] > 20000)) return null;
        product.installationRules = { status: 'demo', boardGapMm: rules.boardGapMm, endGapMm: rules.endGapMm, wallGapMm: rules.wallGapMm, maxJoistSpacingMm: rules.maxJoistSpacingMm, maxPedestalSpacingMm: rules.maxPedestalSpacingMm,
          fixingsPerSupport: rules.fixingsPerSupport, kerfMm: rules.kerfMm, minReusableOffcutMm: rules.minReusableOffcutMm, allowButtJoints: rules.allowButtJoints === true, sourceUrl: null,
          joistProductId: String(rules.joistProductId || ''), pedestalProductId: String(rules.pedestalProductId || ''), fixingProductId: String(rules.fixingProductId || ''), finishProductId: rules.finishProductId ? String(rules.finishProductId) : null };
      }
      products.push(product);
    } catch { return null; }
  }
  if (new Set(products.map(product => product.id)).size !== products.length) return null;
  return products;
}

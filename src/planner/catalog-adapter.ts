import { technicalContext } from './technical/rules';
import { parseTechnicalOptions } from './technical/options';
import type { Product, ProductVariant } from '../commerce/catalog';
import type { EngineProduct, ManufacturingRules, PlanInput, Point } from '../engine/types';

const boardCategoryIds = new Set(['massive', 'thermo', 'wpc']);

/** The planner uses the same authoritative, PDF-only catalogue as the shop. */
export function stockBoardProducts(catalog: readonly Product[]): Product[] {
  return catalog.filter(product => product.status === 'verified' && boardCategoryIds.has(product.category) && product.variants.length > 0);
}

/** A priced stock article is not evidence of a compatible mounting system. */
function completeStockRules(product: Product, catalog: readonly Product[]): ManufacturingRules | null {
  const rules = product.engineRules;
  if (!rules || rules.verification !== 'verified' || !/^https:\/\//i.test(rules.source.trim())) return null;
  const ids = rules.accessoryProductIds;
  if (!ids?.joist || !ids.pedestal || !ids.fixing) return null;
  const joist = catalog.find(item => item.id === ids.joist && ['joists', 'aluminium'].includes(item.category));
  const pedestal = catalog.find(item => item.id === ids.pedestal && item.category === 'pedestals');
  const fixing = catalog.find(item => item.id === ids.fixing && item.category === 'fixings');
  const edge = ids.edge ? catalog.find(item => item.id === ids.edge && item.category === 'finish') : undefined;
  if (!joist || !pedestal || !fixing || (ids.edge && !edge) || [joist, pedestal, fixing, ...(edge ? [edge] : [])].some(item => item.status !== 'verified' || !item.variants.length)) return null;
  const allowedJoistLengths = new Set(joist.variants.filter(variant => variant.widthMm === rules.joistWidthMm && variant.thicknessMm === rules.joistHeightMm).map(variant => variant.lengthMm));
  if (!rules.joistStockLengthsMm?.length || rules.joistStockLengthsMm.some(length => !allowedJoistLengths.has(length))) return null;
  return rules;
}

export function toEngineProduct(product: Product, variant: ProductVariant, catalog: readonly Product[]): EngineProduct {
  return {
    id: product.id, name: product.name, variantId: variant.id,
    widthMm: variant.widthMm, thicknessMm: variant.thicknessMm,
    // Different colours or profiles may not be mixed to make a cheaper cut plan.
    availableLengthsMm: [...new Set(product.variants.filter(item => item.widthMm === variant.widthMm && item.thicknessMm === variant.thicknessMm && item.profile === variant.profile && item.color === variant.color).map(item => item.lengthMm).filter((length): length is number => length !== null && length > 0))].sort((a, b) => a - b),
    status: product.status,
    technical: product.stockSource ? technicalContext(product, variant, catalog) : undefined,
    installationRules: product.status === 'verified' ? completeStockRules(product, catalog) : null,
  };
}

/** Reject old demonstration products and any article removed from the programme. */
export function parseStockProject(value: unknown, catalog: readonly Product[]): PlanInput | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Partial<PlanInput>;
  const ring = (item: unknown): item is Point[] => Array.isArray(item) && item.length >= 3 && item.length <= 64 && item.every(point => point && typeof point.x === 'number' && typeof point.y === 'number' && Number.isFinite(point.x) && Number.isFinite(point.y) && Math.abs(point.x) <= 30000 && Math.abs(point.y) <= 30000);
  const product = stockBoardProducts(catalog).find(item => item.id === input.productId);
  if (!product || !ring(input.outline) || !Array.isArray(input.holes) || input.holes.length > 8 || !input.holes.every(ring) || !['x', 'y'].includes(input.orientation ?? '')) return null;
  if (input.substrate !== undefined && !['concrete', 'paving', 'soil'].includes(input.substrate)) return null;
  if (![input.heightMm, input.gapMm, input.reservePercent].every(number => typeof number === 'number' && Number.isFinite(number)) || input.heightMm! < 0 || input.heightMm! > 3000 || input.gapMm! < 0 || input.gapMm! > 30 || input.reservePercent! < 0 || input.reservePercent! > 30) return null;
  if (typeof input.variantId !== 'string' || !product.variants.some(variant => variant.id === input.variantId)) return null;
  const technical = parseTechnicalOptions(input.technical);
  if (technical === null) return null;
  return { technical, outline: input.outline, holes: input.holes, orientation: input.orientation!, substrate: input.substrate ?? 'concrete', heightMm: input.heightMm!, gapMm: input.gapMm!, productId: product.id, variantId: input.variantId, reservePercent: input.reservePercent! };
}

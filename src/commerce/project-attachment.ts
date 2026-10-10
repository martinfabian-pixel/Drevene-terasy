import { validateGeometry } from '../engine/geometry';
import type { PlanInput, Point } from '../engine/types';
import { boardCategories, findProduct, findVariant } from './catalog';
export function parseProjectAttachment(value: unknown): { version: 1; input: PlanInput } | null {
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('input' in value) || !value.input || typeof value.input !== 'object') return null;
  const input = value.input as Partial<PlanInput>;
  const ring = (points: unknown): points is Point[] => Array.isArray(points) && points.length >= 3 && points.length <= 64 && points.every(point => point && typeof point.x === 'number' && Number.isFinite(point.x) && typeof point.y === 'number' && Number.isFinite(point.y) && Math.abs(point.x) <= 30000 && Math.abs(point.y) <= 30000);
  if (!ring(input.outline) || !Array.isArray(input.holes) || input.holes.length > 8 || !input.holes.every(ring) || !['x', 'y'].includes(input.orientation || '') || typeof input.productId !== 'string' || !/^[a-z0-9_-]{1,80}$/.test(input.productId)) return null;
  if (![input.heightMm, input.gapMm, input.reservePercent].every(number => typeof number === 'number' && Number.isFinite(number)) || input.heightMm! < 0 || input.heightMm! > 3000 || input.gapMm! < 0 || input.gapMm! > 30 || input.reservePercent! < 0 || input.reservePercent! > 30) return null;
  if (input.substrate !== undefined && !['concrete', 'paving', 'soil'].includes(input.substrate)) return null;
  const product = findProduct(input.productId);
  if (!product || !boardCategories.includes(product.category) || !product.variants.some(variant => variant.articleNumber) || typeof input.variantId !== 'string' || !findVariant(product, input.variantId)) return null;
  if (validateGeometry(input.outline, input.holes).length) return null;
  return { version: 1, input: { outline: input.outline, holes: input.holes, orientation: input.orientation!, heightMm: input.heightMm!, gapMm: input.gapMm!, reservePercent: input.reservePercent!, productId: input.productId, variantId: typeof input.variantId === 'string' ? input.variantId.slice(0, 120) : undefined, substrate: input.substrate ?? 'concrete' } };
}

import { findProduct, findVariant, productCatalog, saleQuantity, type Product, type ProductVariant } from './catalog';
export interface CartItem { key: string; productId: string; variantId: string; quantity: number }
export interface CartTotals { knownGross: number; knownNet: number | null; knownVat: number | null; unpricedCount: number; canOrder: boolean }
export const cartKey = (productId: string, variantId: string) => `${productId}:${variantId}`;
export const validQuantity = (quantity: number) => Number.isFinite(quantity) && quantity > 0 && quantity <= 100_000;
export const validProductQuantity = (quantity: number, variant: ProductVariant) => validQuantity(quantity) && (variant.unit === 'l' || Number.isInteger(quantity));
export function validateCart(value: unknown, catalog: Product[] = productCatalog): CartItem[] {
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('items' in value) || !Array.isArray(value.items)) return [];
  const items: CartItem[] = [];
  for (const item of value.items.slice(0, 500)) {
    if (!item || typeof item !== 'object' || typeof item.productId !== 'string' || typeof item.variantId !== 'string' || !validQuantity(item.quantity)) continue;
    const product = findProduct(item.productId, catalog);
    const variant = product && findVariant(product, item.variantId);
    if (!product || !variant || !validProductQuantity(item.quantity, variant)) continue;
    const key = cartKey(item.productId, item.variantId);
    const existing = items.find(row => row.key === key);
    if (existing) existing.quantity = Math.min(100_000, existing.quantity + item.quantity);
    else items.push({ key, productId: item.productId, variantId: item.variantId, quantity: item.quantity });
  }
  return items;
}
export function getCartTotals(items: CartItem[], catalog: Product[] = productCatalog): CartTotals {
  let knownGross = 0, knownNet = 0, unpricedCount = 0, hasUnknownTax = false, hasDemo = false;
  for (const item of items) {
    const product = findProduct(item.productId, catalog), variant = product && findVariant(product, item.variantId);
    if (!product || !variant) { unpricedCount++; continue; }
    hasDemo ||= product.status === 'demo';
    if (variant.priceGross === null) { unpricedCount++; continue; }
    const gross = Math.round(variant.priceGross * saleQuantity(item.quantity, variant) * 100) / 100;
    knownGross += gross;
    if (variant.vatRate === null) hasUnknownTax = true;
    else knownNet += Math.round(gross / (1 + variant.vatRate / 100) * 100) / 100;
  }
  knownGross = Math.round(knownGross * 100) / 100;
  knownNet = Math.round(knownNet * 100) / 100;
  return { knownGross, knownNet: hasUnknownTax ? null : knownNet, knownVat: hasUnknownTax ? null : Math.round((knownGross - knownNet) * 100) / 100, unpricedCount,
    canOrder: items.length > 0 && !unpricedCount && !hasUnknownTax && !hasDemo };
}

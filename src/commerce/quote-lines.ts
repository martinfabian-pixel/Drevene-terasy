import { findProduct, findVariant, saleQuantity, type Product, type SaleUnit } from './catalog';
import type { CartItem } from './cart-core';
export interface QuoteLine {
  productId: string; variantId: string; name: string | null; manufacturer: string | null;
  status: 'demo' | 'verified' | 'unavailable'; category: string | null; profile: string | null; color: string | null;
  dimensionsMm: { length: number | null; width: number | null; thickness: number | null };
  physicalQuantity: number; physicalUnit: 'ks' | 'bal' | 'l' | null; saleQuantity: number | null; unit: SaleUnit | null;
  priceGross: number | null; priceNet: number | null; vatRate: number | null;
  subtotalGross: number | null; subtotalNet: number | null; subtotalVat: number | null;
  availability: string | null; technicalSheet: string | null; sourceUrls: string[];
}
const cents = (amount: number) => Math.round(amount * 100) / 100;
export function quoteLines(items: CartItem[], catalog: Product[]): QuoteLine[] {
  return items.map(item => {
    const product = findProduct(item.productId, catalog), variant = product && findVariant(product, item.variantId);
    if (!product || !variant) return { productId: item.productId, variantId: item.variantId, name: null, manufacturer: null, status: 'unavailable', category: null, profile: null, color: null,
      dimensionsMm: { length: null, width: null, thickness: null }, physicalQuantity: item.quantity, physicalUnit: null, saleQuantity: null, unit: null,
      priceGross: null, priceNet: null, vatRate: null, subtotalGross: null, subtotalNet: null, subtotalVat: null, availability: null, technicalSheet: null, sourceUrls: [] };
    const completeSaleDimensions = variant.unit !== 'bm' && variant.unit !== 'm²' || !!variant.lengthMm && (variant.unit !== 'm²' || !!variant.widthMm);
    const units = completeSaleDimensions ? saleQuantity(item.quantity, variant) : null;
    const gross = units === null || variant.priceGross === null ? null : cents(units * variant.priceGross);
    const net = gross === null || variant.vatRate === null ? null : cents(gross / (1 + variant.vatRate / 100));
    return { productId: product.id, variantId: variant.id, name: product.name, manufacturer: product.manufacturer, status: product.status, category: product.category, profile: variant.profile, color: variant.color,
      dimensionsMm: { length: variant.lengthMm, width: variant.widthMm, thickness: variant.thicknessMm }, physicalQuantity: item.quantity,
      physicalUnit: variant.unit === 'l' ? 'l' : variant.unit === 'bal' ? 'bal' : 'ks', saleQuantity: units, unit: variant.unit,
      priceGross: variant.priceGross, priceNet: variant.priceGross === null || variant.vatRate === null ? null : variant.priceGross / (1 + variant.vatRate / 100), vatRate: variant.vatRate,
      subtotalGross: gross, subtotalNet: net, subtotalVat: gross === null || net === null ? null : cents(gross - net),
      availability: variant.availability, technicalSheet: product.technicalSheet, sourceUrls: [...product.sourceUrls] };
  });
}

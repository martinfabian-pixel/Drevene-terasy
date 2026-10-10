import type { ManufacturingRules } from '../engine/types';
import { buildStockCatalog } from './stock-catalog';
export type CategoryId = 'massive' | 'thermo' | 'wpc' | 'joists' | 'aluminium' | 'fixings' | 'pedestals' | 'finish' | 'care' | 'accessories';
export type SaleUnit = 'ks' | 'bm' | 'm²' | 'bal' | 'l';
export interface ProductVariant {
  id: string; lengthMm: number | null; widthMm: number | null; thicknessMm: number | null;
  profile: string; color: string; unit: SaleUnit; priceGross: number | null; vatRate: number | null; availability: string | null;
  articleNumber?: string; sourceName?: string; sourceCategory?: string; rebateGroup?: string; sourcePage?: number;
  sourceFormat?: string; sourceThickness?: string; sourceSize?: string | null; sourceUnit?: 'ks' | 'balenie';
  pricePerBmGross?: number | null; packageQuantity?: number | null;
  stockProgramStatus?: 'stock-program' | 'while-stocks-last'; availabilityBasis?: 'pricelist';
}
export interface InstallationRules {
  status: 'demo' | 'verified'; boardGapMm: number; endGapMm: number; wallGapMm: number;
  maxJoistSpacingMm: number; maxPedestalSpacingMm: number; fixingsPerSupport: number;
  kerfMm: number; minReusableOffcutMm: number; allowButtJoints: boolean; sourceUrl: string | null;
  joistProductId: string; pedestalProductId: string; fixingProductId: string; finishProductId: string | null;
}
export interface Product {
  id: string; name: string; category: CategoryId; family: string; manufacturer: string | null;
  woodSpecies: string | null; surface: string | null; images: string[]; description: string;
  variants: ProductVariant[]; technicalSheet: string | null; installationRules: InstallationRules | null;
  status: 'demo' | 'verified'; sourceUrls: string[]; relatedProductIds: string[];
  engineRules?: ManufacturingRules | null;
  stockSource?: { id: string; title: string; date: string; sha256: string; pages: number[] };
  imageKind?: 'illustration' | 'product'; supplier?: string | null;
}
export const categoryLabels: Record<CategoryId, string> = {
  massive: 'Masívne drevo', thermo: 'Thermowood', wpc: 'WPC terasy', joists: 'Podkladové hranoly', aluminium: 'Hliníkové profily',
  fixings: 'Skrutky a klipy', pedestals: 'Rektifikačné terče', finish: 'Ukončovacie profily', care: 'Oleje a údržba', accessories: 'Príslušenstvo',
};
export const boardCategories: CategoryId[] = ['massive', 'thermo', 'wpc'];
export const accessoryCategories: CategoryId[] = ['joists', 'aluminium', 'fixings', 'pedestals', 'finish', 'care', 'accessories'];
export const productCatalog: Product[] = buildStockCatalog();
export const findProduct = (id: string, catalog: Product[] = productCatalog) => catalog.find(product => product.id === id);
export const findVariant = (product: Product, id: string) => product.variants.find(variant => variant.id === id);
export const money = (value: number) => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(value);
export const variantLabel = (variant: ProductVariant) => variant.articleNumber ? [variant.sourceName, variant.sourceSize, variant.sourceFormat ? `Formát ${variant.sourceFormat} mm` : null, variant.sourceThickness ? `Hrúbka ${variant.sourceThickness} mm` : null, `Artikel ${variant.articleNumber}`].filter(Boolean).join(' · ') : [variant.lengthMm ? `${variant.lengthMm / 1000} m` : null, variant.widthMm && variant.thicknessMm ? `${variant.thicknessMm} × ${variant.widthMm} mm` : null, variant.profile].filter(Boolean).join(' · ');
export function piecesForArea(areaM2: number, variant: ProductVariant): number | null {
  if (!(areaM2 > 0) || !variant.lengthMm || !variant.widthMm) return null;
  return Math.ceil(areaM2 * 1_000_000 / (variant.lengthMm * variant.widthMm));
}
export function saleQuantity(pieces: number, variant: ProductVariant): number {
  if (variant.unit === 'bm' && variant.lengthMm) return pieces * variant.lengthMm / 1000;
  if (variant.unit === 'm²' && variant.lengthMm && variant.widthMm) return pieces * variant.lengthMm * variant.widthMm / 1_000_000;
  return pieces;
}

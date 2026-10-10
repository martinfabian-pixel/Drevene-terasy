import type { ManufacturingRules } from '../engine/types';
export type CategoryId = 'massive' | 'thermo' | 'wpc' | 'joists' | 'aluminium' | 'fixings' | 'pedestals' | 'finish' | 'care' | 'accessories';
export type SaleUnit = 'ks' | 'bm' | 'm²' | 'bal' | 'l';
export interface ProductVariant {
  id: string; lengthMm: number | null; widthMm: number | null; thicknessMm: number | null;
  profile: string; color: string; unit: SaleUnit; priceGross: number | null; vatRate: number | null; availability: string | null;
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
}
export const categoryLabels: Record<CategoryId, string> = {
  massive: 'Masívne drevo', thermo: 'Thermowood', wpc: 'WPC terasy', joists: 'Podkladové hranoly', aluminium: 'Hliníkové profily',
  fixings: 'Skrutky a klipy', pedestals: 'Rektifikačné terče', finish: 'Ukončovacie profily', care: 'Oleje a údržba', accessories: 'Príslušenstvo',
};
export const boardCategories: CategoryId[] = ['massive', 'thermo', 'wpc'];
export const accessoryCategories: CategoryId[] = ['joists', 'aluminium', 'fixings', 'pedestals', 'finish', 'care', 'accessories'];
const demoRules = (category: CategoryId): InstallationRules => ({
  status: 'demo', boardGapMm: category === 'wpc' ? 5 : 6, endGapMm: 6, wallGapMm: 20,
  maxJoistSpacingMm: category === 'wpc' ? 350 : category === 'thermo' ? 450 : 400,
  maxPedestalSpacingMm: 500, fixingsPerSupport: category === 'wpc' ? 1 : 2,
  kerfMm: 3, minReusableOffcutMm: 500, allowButtJoints: true, sourceUrl: null,
  joistProductId: category === 'wpc' ? 'demo-aluminium' : 'demo-joists', pedestalProductId: 'demo-pedestals',
  fixingProductId: 'demo-fixings', finishProductId: 'demo-finish',
});
const board = (id: string, name: string, category: CategoryId, image: string, thickness: number, widths: number[], lengths: number[]): Product => ({
  id, name, category, family: categoryLabels[category], manufacturer: null, woodSpecies: null, surface: 'Demonštračný vzhľad',
  images: [image], description: 'Ukážkový produkt na vyskúšanie katalógu a plánovača. Rozmery a montážne hodnoty sú demonštračné; nejde o potvrdený artikel dodávateľa.',
  variants: widths.flatMap((width, i) => lengths.map(length => ({ id: `${id}-${width}-${length}`, lengthMm: length, widthMm: width, thicknessMm: thickness,
    profile: i ? 'Drážkovaný · demo' : 'Hladký · demo', color: category === 'wpc' ? 'Grafit · vizualizácia' : 'Prírodný · vizualizácia',
    unit: 'ks' as const, priceGross: null, vatRate: null, availability: null }))),
  technicalSheet: null, installationRules: demoRules(category), status: 'demo', sourceUrls: [],
  relatedProductIds: [category === 'wpc' ? 'demo-aluminium' : 'demo-joists', 'demo-fixings', 'demo-pedestals', 'demo-finish'],
});
const accessory = (id: string, name: string, category: CategoryId, unit: SaleUnit, length: number | null, width: number | null, thickness: number | null): Product => ({
  id, name, category, family: categoryLabels[category], manufacturer: null, woodSpecies: null, surface: null,
  images: ['deck-exploded-2027-v2.webp'], description: 'Demonštračná položka materiálového zoznamu. Kompatibilitu, rozmery, cenu a dostupnosť musí potvrdiť dodávateľ pred objednávkou.',
  variants: [{ id: `${id}-default`, lengthMm: length, widthMm: width, thicknessMm: thickness, profile: 'Demonštračný variant', color: 'Ilustračný', unit, priceGross: null, vatRate: null, availability: null }],
  technicalSheet: null, installationRules: null, status: 'demo', sourceUrls: [], relatedProductIds: [],
});
export const productCatalog: Product[] = [
  board('demo-massive', 'Masívne terasové drevo · DEMO', 'massive', 'material-drevo-2027.webp', 26, [140, 145], [2400, 3000, 4000, 5000]),
  board('demo-thermo', 'Thermowood terasa · DEMO', 'thermo', 'material-thermo-2027.webp', 26, [140, 150], [3000, 3600, 4200, 4800]),
  board('demo-wpc', 'WPC terasová doska · DEMO', 'wpc', 'material-wpc-2027.webp', 23, [140, 145], [3000, 4000, 5000]),
  accessory('demo-joists', 'Podkladový hranol · DEMO', 'joists', 'ks', 3000, 60, 40),
  accessory('demo-aluminium', 'Nosný hliníkový profil · DEMO', 'aluminium', 'ks', 4000, 60, 40),
  accessory('demo-fixings', 'Spojovací prvok · DEMO', 'fixings', 'ks', null, null, null),
  accessory('demo-pedestals', 'Rektifikačný terč · DEMO', 'pedestals', 'ks', null, null, null),
  accessory('demo-finish', 'Ukončovací profil · DEMO', 'finish', 'ks', 3000, 50, 20),
  accessory('demo-care', 'Ochranný olej · DEMO', 'care', 'l', null, null, null),
  accessory('demo-accessories', 'Ochranná podložka · DEMO', 'accessories', 'ks', null, null, null),
];
export const findProduct = (id: string, catalog: Product[] = productCatalog) => catalog.find(product => product.id === id);
export const findVariant = (product: Product, id: string) => product.variants.find(variant => variant.id === id);
export const money = (value: number) => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(value);
export const variantLabel = (variant: ProductVariant) => [variant.lengthMm ? `${variant.lengthMm / 1000} m` : null, variant.widthMm && variant.thicknessMm ? `${variant.thicknessMm} × ${variant.widthMm} mm` : null, variant.profile].filter(Boolean).join(' · ');
export function piecesForArea(areaM2: number, variant: ProductVariant): number | null {
  if (!(areaM2 > 0) || !variant.lengthMm || !variant.widthMm) return null;
  return Math.ceil(areaM2 * 1_000_000 / (variant.lengthMm * variant.widthMm));
}
export function saleQuantity(pieces: number, variant: ProductVariant): number {
  if (variant.unit === 'bm' && variant.lengthMm) return pieces * variant.lengthMm / 1000;
  if (variant.unit === 'm²' && variant.lengthMm && variant.widthMm) return pieces * variant.lengthMm * variant.widthMm / 1_000_000;
  return pieces;
}

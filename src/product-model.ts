/** Data contract for future verified supplier imports. No prices or rules are seeded here. */
export type SaleUnit = 'piece' | 'linear-metre' | 'square-metre' | 'pack' | 'litre';
export interface AuthorisedImage {
  url: string;
  alt: string;
  source: string;
  rights: 'owned' | 'licensed' | 'supplier-authorised';
}
export interface VerifiedPrice {
  unit: SaleUnit;
  currency: 'EUR';
  net: number;
  gross: number;
  vatRate: number;
  validFrom: string;
  source: string;
}
export interface ProductVariantDraft {
  id: string;
  sku: string | null;
  widthMm: number | null;
  thicknessMm: number | null;
  availableLengthsMm: number[] | null;
  surfaceFinish: string | null;
  color: string | null;
  saleUnit: SaleUnit | null;
  packQuantity: number | null;
  price: VerifiedPrice | null;
  availability: { state: 'in-stock' | 'on-order' | 'unavailable'; checkedAt: string; source: string } | null;
  installationProfileId: string | null;
  compatibleAccessoryIds: string[];
}
export interface ProductDraft {
  id: string;
  name: string;
  categoryId: string;
  manufacturer: string | null;
  woodSpecies: string | null;
  material: string | null;
  images: AuthorisedImage[];
  technicalProperties: Record<string,string> | null;
  installationMethod: string | null;
  recommendedSupportSpacing: { valueMm: number; conditions: string; source: string }[] | null;
  variants: ProductVariantDraft[];
  technicalSheet: { url: string; source: string; version: string } | null;
  status: 'demo' | 'draft' | 'verified';
  verification: { verifiedAt: string; source: string; verifiedBy: string } | null;
}

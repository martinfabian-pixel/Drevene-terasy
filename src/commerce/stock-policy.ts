import { productCatalog, type Product, type ProductVariant } from './catalog';

export interface StockReviewOptions { allowPriceChanges?: boolean; requireComplete?: boolean }
export interface StockReview { products: Product[]; errors: string[]; changedArticleIds: string[] }
const identityFields = ['lengthMm', 'widthMm', 'thicknessMm', 'profile', 'color', 'unit', 'articleNumber', 'sourceName', 'sourceCategory', 'rebateGroup', 'sourcePage', 'sourceFormat', 'sourceThickness', 'sourceSize', 'sourceUnit', 'packageQuantity', 'stockProgramStatus', 'availabilityBasis'] as const;

/** Imports are drafts. This check never publishes them or claims live availability. */
export function reviewStockCatalog(candidate: Product[], options: StockReviewOptions = {}, approved: Product[] = productCatalog): StockReview {
  const errors: string[] = [], products: Product[] = [], changedArticleIds: string[] = [];
  const seenProducts = new Set<string>(), seenVariants = new Set<string>();
  for (const incoming of candidate) {
    const source = approved.find(product => product.id === incoming.id);
    if (!source || seenProducts.has(incoming.id)) { errors.push(`Produkt ${incoming.id}: nie je jedinečným produktom schváleného skladového programu.`); continue; }
    seenProducts.add(incoming.id);
    if (incoming.name !== source.name || incoming.category !== source.category || incoming.manufacturer !== source.manufacturer) { errors.push(`Produkt ${incoming.id}: názov, výrobca a kategória musia zodpovedať schválenému cenníku.`); continue; }
    if (source.stockSource && (incoming.stockSource?.id !== source.stockSource.id || incoming.stockSource?.sha256 !== source.stockSource.sha256 || incoming.stockSource?.date !== source.stockSource.date)) { errors.push(`Produkt ${incoming.id}: chýba alebo sa nezhoduje schválený zdrojový cenník.`); continue; }
    const variants: ProductVariant[] = [];
    for (const variant of incoming.variants) {
      const original = source.variants.find(item => item.id === variant.id);
      if (!original || seenVariants.has(variant.id)) { errors.push(`Variant ${variant.id}: artikel nie je v schválenom skladovom programe alebo je duplicitný.`); continue; }
      seenVariants.add(variant.id);
      if (identityFields.some(field => variant[field] !== original[field])) { errors.push(`Variant ${variant.id}: rozmery, profil, farba a jednotka musia zostať podľa cenníka.`); continue; }
      if (variant.priceGross === null || !Number.isFinite(variant.priceGross) || variant.priceGross < 0 || variant.priceGross > 1_000_000) { errors.push(`Variant ${variant.id}: cenníková cena s DPH je povinná.`); continue; }
      if (!options.allowPriceChanges && variant.priceGross !== original.priceGross) { errors.push(`Variant ${variant.id}: cena sa nezhoduje so schváleným cenníkom.`); continue; }
      if (variant.availability !== original.availability || variant.vatRate !== original.vatRate) { errors.push(`Variant ${variant.id}: dostupnosť a sadzbu DPH nemožno meniť cenníkovým importom bez overenia.`); continue; }
      if (variant.pricePerBmGross !== null && variant.pricePerBmGross !== undefined && (!Number.isFinite(variant.pricePerBmGross) || variant.pricePerBmGross < 0)) { errors.push(`Variant ${variant.id}: neplatná informačná cena za bm.`); continue; }
      if (!options.allowPriceChanges && (variant.pricePerBmGross ?? null) !== (original.pricePerBmGross ?? null)) { errors.push(`Variant ${variant.id}: informačná cena za bm sa nezhoduje s cenníkom.`); continue; }
      // Provenance, availability, article metadata and mounting rules come only from the approved record.
      if (variant.priceGross !== original.priceGross || (variant.pricePerBmGross ?? null) !== (original.pricePerBmGross ?? null)) changedArticleIds.push(variant.id);
      variants.push({ ...original, priceGross: variant.priceGross, pricePerBmGross: variant.pricePerBmGross ?? null });
    }
    if (variants.length) products.push({ ...source, variants });
  }
  if (options.requireComplete) {
    for (const product of approved) for (const variant of product.variants) if (!seenVariants.has(variant.id)) errors.push(`Chýba artikel ${variant.id}. Nový cenník musí obsahovať celý schválený sortiment.`);
  }
  return { products: errors.length ? [] : products, errors, changedArticleIds: errors.length ? [] : changedArticleIds };
}

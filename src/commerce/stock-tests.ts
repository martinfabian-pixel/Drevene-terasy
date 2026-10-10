import audit from '../../scripts/fixtures/jaf-stock-2026-10-10-audit.json';
import { productCatalog, saleQuantity } from './catalog';
import { stockManifest } from './stock-catalog';
import { getCartTotals, validateCart } from './cart-core';
import { quoteLines } from './quote-lines';

export function runStockTests() {
  let passed = 0;
  const check = (condition: boolean, label: string) => { if (!condition) throw new Error(label); passed++; };
  const clean = (value: string | null) => (value || '').replace(/(\w)-\s+(?=\w)/g, '$1-').replace(/\s+/g, ' ').trim();
  const articles = productCatalog.flatMap(product => product.variants.map(variant => ({ product, variant })));
  check(articles.length === audit.expectedArticleCount, 'All 137 PDF articles imported');
  check(new Set(articles.map(row => row.variant.articleNumber)).size === 137, 'No duplicate article numbers');
  check(stockManifest.source.sha256 === audit.sourceSha256 && stockManifest.source.date === audit.pricelistDate, 'Exact source PDF/date fingerprint');
  check(productCatalog.every(product => product.status === 'verified' && product.stockSource?.sha256 === audit.sourceSha256 && !product.id.startsWith('demo')), 'Only approved stock source products are public');
  check(productCatalog.every(product => product.installationRules === null && product.engineRules === null && product.relatedProductIds.every(id => productCatalog.some(item => item.id === id))), 'No invented manufacturer mounting rules or outside recommendations');
  check(articles.filter(({ variant }) => variant.stockProgramStatus === 'while-stocks-last').length === 13, 'All 13 clearance icons preserved');
  check(articles.reduce((sum, row) => sum + Math.round(row.variant.priceGross! * 100), 0) === audit.articles.reduce((sum, row) => sum + row.priceGrossCents, 0), 'Exact gross-cent checksum 495999');
  for (const expected of audit.articles) {
    const row = articles.find(({ variant }) => variant.articleNumber === expected.article);
    check(!!row, `Article ${expected.article} present`);
    if (!row) continue;
    const { product, variant } = row;
    check(clean(variant.sourceName || null) === clean(expected.name) && variant.sourceCategory === expected.sourceCategory, `Article ${expected.article} exact source name/category`);
    check(clean(variant.sourceThickness || null) === clean(expected.thickness) && clean(variant.sourceFormat || null) === clean(expected.format) && clean(variant.sourceSize || null) === clean(expected.dimensionsText), `Article ${expected.article} exact raw dimensions`);
    check(variant.sourcePage === expected.page && variant.rebateGroup === expected.rebateGroup && variant.sourceUnit === expected.salesUnit, `Article ${expected.article} page/unit/rebate`);
    check(Math.round(variant.priceGross! * 100) === expected.priceGrossCents && variant.pricePerBmGross === (expected.referenceUnit === 'bm' ? expected.referenceGrossCents / 100 : null), `Article ${expected.article} exact piece/package and informational bm prices`);
    check(variant.availability === expected.stockStatus && variant.availabilityBasis === 'pricelist' && variant.vatRate === null && variant.unit === (expected.salesUnit === 'balenie' ? 'bal' : 'ks'), `Article ${expected.article} honest availability/VAT/sale unit`);
    check(saleQuantity(3, variant) === 3, `Article ${expected.article} order prices use three source sale units`);
    const items = validateCart({ version: 1, items: [{ productId: product.id, variantId: variant.id, quantity: 3 }] });
    const totals = getCartTotals(items), line = quoteLines(items, productCatalog)[0];
    check(items.length === 1 && Math.round(totals.knownGross * 100) === expected.priceGrossCents * 3 && totals.knownNet === null && !totals.canOrder && Math.round(line.subtotalGross! * 100) === expected.priceGrossCents * 3, `Article ${expected.article} cart/quote totals exact without VAT assumptions`);
  }
  check(validateCart({ version: 1, items: [{ productId: 'demo-massive', variantId: 'demo-massive-140-4000', quantity: 5 }] }).length === 0, 'Removed demo SKUs cannot survive saved cart migration');
  const wpc = articles.find(row => row.variant.articleNumber === '55638/0103')!;
  check(wpc.variant.priceGross === 18.70 && wpc.variant.pricePerBmGross === 4.67 && wpc.variant.priceGross !== wpc.variant.lengthMm! / 1000 * wpc.variant.pricePerBmGross, 'Independently rounded bm never replaces PDF piece price');
  const screws = articles.find(row => row.variant.articleNumber === '55013/0277')!;
  check(screws.variant.packageQuantity === null && screws.variant.unit === 'bal' && screws.variant.lengthMm === 40 && screws.variant.widthMm === null, 'Unknown screw pack count and raw zero dimension not invented');
  const cumaru = productCatalog.find(product => product.variants.some(variant => variant.articleNumber === '55954/2183'))!;
  check(cumaru.variants.length === 9 && cumaru.variants.some(variant => variant.lengthMm === 1830 && variant.priceGross === 23.57) && cumaru.variants.some(variant => variant.lengthMm === 4270 && variant.priceGross === 67.49), 'All Cumaru lengths grouped with individual exact prices');
  return { passed, failed: 0, articles: articles.length, products: productCatalog.length };
}

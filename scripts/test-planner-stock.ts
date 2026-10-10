import { calculatePlan, DEMO_RULES, shapeOutline } from '../src/engine';
import { parseStockProject, stockBoardProducts, toEngineProduct } from '../src/planner/catalog-adapter';
import { productCatalog, type Product, type ProductVariant } from '../src/commerce/catalog';
import type { PlanInput } from '../src/engine';

/** Synthetic fixtures only; these products never enter the public catalogue. */
const variant = (id: string, lengthMm = 4000, color = 'Testová farba'): ProductVariant => ({ id, lengthMm, widthMm: 140, thicknessMm: 26, profile: 'Testový profil', color, unit: 'ks', priceGross: 12.34, vatRate: null, availability: null });
const product = (id: string, category: Product['category'] = 'massive'): Product => ({ id, name: `Test ${id}`, category, family: 'TEST', manufacturer: null, woodSpecies: null, surface: null, images: [], description: 'Testovací fixture, nie produkt dodávateľa.', variants: [variant(`${id}-a`)], technicalSheet: null, installationRules: null, status: 'verified', sourceUrls: [], relatedProductIds: [] });
const inputFor = (item: Product): PlanInput => ({ outline: shapeOutline('rectangle', 4000, 2500), holes: [], orientation: 'x', heightMm: 180, gapMm: 6, productId: item.id, variantId: item.variants[0].id, reservePercent: 5, substrate: 'concrete' });

export function runPlannerStockTests(): { suite: string; passed: number; failed: number } {
  let passed = 0;
  const check = (value: unknown, name: string) => { if (!value) throw new Error(`Planner stock: ${name}`); passed++; };
  const board = product('stock-board');
  const oldDemo = { ...product('old-demo'), status: 'demo' as const, engineRules: { ...DEMO_RULES } };
  const accessory = product('stock-joist', 'joists');
  check(stockBoardProducts([board, oldDemo, accessory]).map(item => item.id).join() === board.id, 'Only verified board products are offered, not demo or accessories.');
  const engineProduct = toEngineProduct(board, board.variants[0], [board]);
  const result = calculatePlan(inputFor(board), engineProduct);
  check(engineProduct.installationRules === null && result.valid && result.areaM2 === 10 && result.boards.length > 0 && result.materials.length === 0 && result.joists.length === 0 && result.pedestals.length === 0 && result.stock.length === 0 && result.technicalStatus === 'unavailable', 'PDF dimensions yield exact visual geometry without invented construction, cut plan or purchase quantities.');
  const demoRulesOnVerified = { ...board, engineRules: { ...DEMO_RULES } };
  check(toEngineProduct(demoRulesOnVerified, board.variants[0], [demoRulesOnVerified]).installationRules === null, 'Demo mounting rules cannot be assigned to a verified article.');
  const compatible = { ...board, variants: [variant('a', 4000), variant('b', 3000), variant('c', 4000), variant('other-color', 5000, 'Iná testová farba'), { ...variant('other-profile', 6000), profile: 'Iný profil' }, { ...variant('other-width', 7000), widthMm: 145 }] };
  check(JSON.stringify(toEngineProduct(compatible, compatible.variants[0], [compatible]).availableLengthsMm) === '[3000,4000]', 'Stock lengths never mix profile, width or colour and are unique and sorted.');
  const withoutFixedLength = { ...board, variants: [{ ...variant('variable-length'), lengthMm: null }] };
  check(toEngineProduct(withoutFixedLength, withoutFixedLength.variants[0], [withoutFixedLength]).availableLengthsMm.length === 0, 'An unspecified length is not replaced with invented manufacturing lengths.');
  check(parseStockProject(inputFor(oldDemo), [board, oldDemo]) === null && parseStockProject(inputFor(accessory), [board, accessory]) === null && parseStockProject({ ...inputFor(board), variantId: 'removed-article' }, [board]) === null && parseStockProject({ ...inputFor(board), variantId: undefined }, [board]) === null, 'Old demo projects, accessory projects, missing and removed exact article variants are rejected.');
  const soilProject = { ...inputFor(board), substrate: 'soil' as const };
  const restored = parseStockProject(soilProject, [board]);
  check(restored?.substrate === 'soil' && restored.productId === board.id && restored.variantId === board.variants[0].id && JSON.stringify(restored.outline) === JSON.stringify(soilProject.outline), 'Saved exact stock article and substrate survive project restoration.');
  const verifiedRules = { ...DEMO_RULES, verification: 'verified' as const, source: 'https://example.com/test-only-mounting-rules', accessoryProductIds: { joist: 'stock-joist', pedestal: 'stock-pedestal', fixing: 'stock-fixing' } };
  const needsOutsideAccessories = { ...board, engineRules: verifiedRules };
  check(toEngineProduct(needsOutsideAccessories, board.variants[0], [needsOutsideAccessories]).installationRules === null, 'A rule profile cannot reintroduce accessory products outside the current programme.');
  const joist = { ...product('stock-joist', 'joists'), variants: [{ ...variant('joist-a', 3000), widthMm: verifiedRules.joistWidthMm, thicknessMm: verifiedRules.joistHeightMm }, { ...variant('joist-b', 4000), widthMm: verifiedRules.joistWidthMm, thicknessMm: verifiedRules.joistHeightMm }] };
  const pedestal = product('stock-pedestal', 'pedestals'), fixing = product('stock-fixing', 'fixings');
  const catalogue = [needsOutsideAccessories, joist, pedestal, fixing];
  check(toEngineProduct(needsOutsideAccessories, board.variants[0], catalogue).installationRules === verifiedRules, 'A complete externally verified mounting profile may reference exact in-programme accessories.');
  const badJoistLength = { ...needsOutsideAccessories, engineRules: { ...verifiedRules, joistStockLengthsMm: [6000] } };
  check(toEngineProduct(badJoistLength, board.variants[0], [badJoistLength, joist, pedestal, fixing]).installationRules === null, 'Unsupported stock lengths in a mounting profile are rejected rather than manufactured.');
  const actualBoards = stockBoardProducts(productCatalog);
  check(actualBoards.length > 0, 'The actual stock catalogue exposes at least one verified board family.');
  for (const item of actualBoards) {
    for (const selected of item.variants) {
      const engine = toEngineProduct(item, selected, productCatalog);
      const selectedInput = { ...inputFor(item), variantId: selected.id };
      const visual = calculatePlan(selectedInput, engine);
      check(engine.widthMm === selected.widthMm && engine.thicknessMm === selected.thicknessMm && engine.installationRules === null && visual.valid && visual.areaM2 === 10 && visual.materials.length === 0 && visual.stock.length === 0 && visual.joists.length === 0 && visual.pedestals.length === 0 && visual.technicalStatus === 'unavailable' && selected.articleNumber && selected.priceGross !== null && selected.availabilityBasis === 'pricelist', `Actual PDF article ${selected.articleNumber ?? selected.id} uses exact dimensions, PDF price provenance and no invented mounting rules.`);
    }
  }
  return { suite: 'planner-stock-catalogue', passed, failed: 0 };
}

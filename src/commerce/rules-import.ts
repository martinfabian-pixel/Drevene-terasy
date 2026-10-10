import type { ManufacturingRules } from '../engine/types';
export function validateRulesJson(value: unknown): { rules: ManufacturingRules | null; errors: string[] } {
  const errors: string[] = [];
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { rules: null, errors: ['Pravidlá musia byť JSON objekt.'] };
  const item = value as Record<string, unknown>;
  if (!['demo', 'verified'].includes(String(item.verification))) errors.push('Pole verification: demo alebo verified.');
  if (typeof item.source !== 'string' || !item.source.trim() || item.source.length > 2000) errors.push('Povinný zdroj alebo označenie demo pravidiel.');
  if (item.verification === 'verified') { try { if (new URL(String(item.source)).protocol !== 'https:') errors.push('Overené pravidlá potrebujú HTTPS zdroj.'); } catch { errors.push('Overené pravidlá potrebujú platnú HTTPS URL zdroja.'); } }
  const keys = ['minGapMm', 'maxGapMm', 'perimeterGapMm', 'maxJoistSpacingMm', 'maxPedestalSpacingMm', 'maxBoardOverhangMm', 'minBoardWidthMm', 'minBoardCutLengthMm', 'joistWidthMm', 'joistHeightMm', 'pedestalMinHeightMm', 'pedestalMaxHeightMm', 'jointGapMm', 'sawKerfMm', 'minReusableOffcutMm', 'fixingsPerIntersection'];
  for (const key of keys) if (typeof item[key] !== 'number' || !Number.isFinite(item[key]) || (item[key] as number) < 0 || (item[key] as number) > 20000) errors.push(`Neplatné alebo chýbajúce pole ${key}.`);
  for (const key of ['maxJoistSpacingMm', 'maxPedestalSpacingMm', 'minBoardWidthMm', 'minBoardCutLengthMm', 'joistWidthMm', 'joistHeightMm', 'fixingsPerIntersection']) if (item[key] === 0) errors.push(`${key} musí byť kladné.`);
  if (typeof item.allowButtJoints !== 'boolean') errors.push('Pole allowButtJoints musí byť boolean.');
  if ((item.minGapMm as number) > (item.maxGapMm as number)) errors.push('Minimálna škára prekračuje maximálnu.');
  if ((item.pedestalMinHeightMm as number) > (item.pedestalMaxHeightMm as number)) errors.push('Neplatný rozsah výšky terčov.');
  for (const key of ['joistStockLengthsMm', 'edgeStockLengthsMm']) { const list = item[key]; if (key === 'edgeStockLengthsMm' && list === undefined) continue; if (!Array.isArray(list) || !list.length || list.length > 50 || list.some(length => typeof length !== 'number' || !Number.isFinite(length) || length <= 0 || length > 20000)) errors.push(`Neplatné výrobné dĺžky ${key}.`); }
  if (item.accessoryProductIds !== undefined) {
    if (!item.accessoryProductIds || typeof item.accessoryProductIds !== 'object' || Array.isArray(item.accessoryProductIds)) errors.push('Neplatné accessoryProductIds.');
    else for (const id of Object.values(item.accessoryProductIds)) if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(id)) errors.push('Neplatné ID príslušenstva.');
  }
  if (errors.length) return { rules: null, errors };
  const clean: Record<string, unknown> = { verification: item.verification, source: item.source, allowButtJoints: item.allowButtJoints };
  for (const key of [...keys, 'joistStockLengthsMm', 'edgeStockLengthsMm', 'accessoryProductIds']) if (item[key] !== undefined) clean[key] = item[key];
  return { rules: clean as unknown as ManufacturingRules, errors };
}

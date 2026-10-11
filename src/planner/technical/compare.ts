import { calculatePlan } from '../../engine';
import type { EngineProduct, PlanInput } from '../../engine/types';
import { fixingCompatible } from './rules';
import { resolveOptions } from './options';
export interface AssemblyComparison {article:string;material:'wood'|'aluminium';subtotalGross:number|null;orderableLines:number;joistMetres:number;clearanceMm:number;status:'blocked'|'requiresReview';reasons:string[];premiumPreference:boolean;economyCandidate:boolean}
/** Partial prices must never be presented as the price of a complete, approved assembly. */
export function compareAssemblies(input:PlanInput,product:EngineProduct):AssemblyComparison[]{
 const ctx=product.technical;if(!ctx)return [];const o=resolveOptions(input.technical,ctx.profile);
 const seen=new Set<string>();const results:AssemblyComparison[]=[];
 for(const v of ctx.accessories.filter(v=>ctx.profile.joistArticles.value?.includes(v.article))){
  const key=v.productId+':'+v.widthMm+':'+v.thicknessMm;if(seen.has(key))continue;seen.add(key);
  const result=calculatePlan({...input,technical:{...input.technical,joistArticle:v.article}},product);
  const rows=result.materials;let priced=true;let cents=0;
  for(const line of rows){const item=[...ctx.boardStock,...ctx.accessories].find(v=>v.article===line.article);if(item?.priceGross==null){priced=false;continue;}cents+=Math.round(item.priceGross*100)*line.quantity;}
  const height=v.article==='55016/0008'?30:o.joistFlat?v.thicknessMm:v.widthMm;
  const rejected=result.warnings.filter(w=>w.severity==='error'||['low-height','close-supports','end-support-review','joist-length-review','short-piece'].includes(w.code));
  const blocked=!result.valid||!fixingCompatible(ctx.profile,o.fixing,v.article)||!result.joistStock.length||rejected.length>0;
  results.push({article:v.article,material:v.article==='55016/0008'?'aluminium':'wood',subtotalGross:priced&&rows.length?cents/100:null,orderableLines:rows.length,joistMetres:result.totals.joistLinearMetres,clearanceMm:input.heightMm-ctx.profile.thicknessMm-height-(o.fixing==='visible'?o.spacerMm:0),status:blocked?'blocked':'requiresReview',reasons:[...rejected.map(w=>w.message),...(result.technicalReport?.missingItems??[]),'Statika a úplná technická prípustnosť skladby nie sú potvrdené.'],premiumPreference:v.article==='55016/0008',economyCandidate:false});
 }
 // Same completeness is essential: do not rank a cheaper partial BOM with omitted fixing as the economic winner.
 const eligible=results.filter(r=>r.status!=='blocked'&&r.subtotalGross!==null&&r.orderableLines===Math.max(...results.map(r=>r.orderableLines)));
 const cheapest=eligible.sort((a,b)=>a.subtotalGross!-b.subtotalGross!||a.article.localeCompare(b.article))[0];if(cheapest)cheapest.economyCandidate=true;
 return results;
}

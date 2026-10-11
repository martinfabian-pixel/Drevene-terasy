import type { EngineProduct, PlanInput, PlanResult } from '../engine/types';
import { resolveOptions } from './technical/options';
import { fixingCompatible } from './technical/rules';
import type { Evidence, FixingSystem, TechnicalOptions } from './technical/types';
const labels:Record<FixingSystem,string>={visible:'Viditeľné skrutky','profix-x':'Profix X','profix-x2':'Profix X2',dila:'DILA 2/17',juan:'JuAn — profil s drážkami','ligo-s47':'LIGO S47','ligo-s34':'LIGO S34',upm:'UPM'};
export const sourceLabel=(s:Evidence)=>s.document+(s.pages.length?' · PDF s. '+s.pages.join(', '):'')+(s.year?' · '+s.year:'');
export function TechnicalControls({input,product,onChange}:{input:PlanInput;product:EngineProduct;onChange:(p:PlanInput)=>void}){
 const context=product.technical;if(!context)return null;
 const profile=context.profile,options=resolveOptions(input.technical,profile);
 const update=(patch:TechnicalOptions)=>onChange({...input,technical:{...input.technical,...patch}});
 const joists=context.accessories.filter(v=>profile.joistArticles.value?.includes(v.article));
 return <div className="planner-technical-controls" data-testid="technical-controls">
 <p>Pravidlá {profile.version} · {profile.article}<br/><strong data-testid="technical-spacing">{profile.spacing.value===null?'Rozstup vyžaduje potvrdenie':'Max. osová vzdialenosť roštu '+profile.spacing.value+' mm'}</strong></p>
 <label className="planner-label">Spôsob kotvenia<select data-testid="technical-fixing" value={options.fixing} onChange={e=>update({fixing:e.target.value as FixingSystem,joistArticle:undefined})}>{(profile.systems.value??['visible']).map(s=><option key={s} value={s}>{labels[s]}</option>)}</select></label>
 <label className="planner-label">Podkladový profil<select data-testid="technical-joist" value={options.joistArticle} onChange={e=>update({joistArticle:e.target.value})}>{joists.map(v=><option key={v.article} value={v.article} disabled={!fixingCompatible(profile,options.fixing,v.article)}>{v.article} · {v.thicknessMm} × {v.widthMm} × {v.lengthMm} mm{v.article==='55016/0008'?' · hliník':''}{v.article==='55638/0103'?' · iba pevné podopretie':''}</option>)}</select></label>
 <p className="planner-muted">Prémiovú ani ekonomickú skladbu neoznačujeme za technicky schválenú, kým chýba únosnosť nosného systému. Porovnávať možno predbežné množstvá jednotlivých profilov.</p>
 <details><summary>Pokročilé technické nastavenia</summary><div className="planner-fields">
 {([['perimeterGapMm','Odstup od okrajov / prekážok [mm]',200],['jointGapMm','Čelná škára [mm]',50],['sawKerfMm','Rezná škára píly [mm]',10],['trimEachEndMm','Zarovnanie každého čela [mm]',200],['spacerMm','Dištančné oddelenie pri skrutkách [mm]',20]] as const).map(([key,label,max])=><label key={key}>{label}<input data-testid={'technical-'+key} type="number" min="0" max={max} step="0.1" value={options[key]} onChange={e=>update({[key]:Number(e.target.value)})}/></label>)}
 <label>Nameraná vlhkosť dreva [%]<input type="number" min="0" max="50" step="0.1" value={options.moisturePercent??''} placeholder="Nezmeraná" onChange={e=>update({moisturePercent:e.target.value===''?undefined:Number(e.target.value)})}/></label></div>
 <label><input type="checkbox" checked={options.joistFlat} onChange={e=>update({joistFlat:e.target.checked})}/> Hranol naplocho — overiť prierez a lepené spoje</label>
 <label><input type="checkbox" checked={options.pool} onChange={e=>update({pool:e.target.checked})}/> Terasa pri bazéne</label>
 <label><input type="checkbox" checked={options.drainageConfirmed} onChange={e=>update({drainageConfirmed:e.target.checked})}/> Odtok vody a priechodné odvetranie boli preverované</label>
 <p className="planner-muted">Zadané hodnoty nie sú potvrdením statiky. Neoverené škáry, odvetranie a kotvenie ostávajú označené vo výstupe.</p></details></div>;
}
export function TechnicalReport({result}:{result:PlanResult}){
 const report=result.technicalReport;if(!report)return null;
 return <section className="planner-technical-report" data-testid="technical-report"><h3>Predbežný materiálový návrh</h3><p>Nie je staticky overenou realizačnou dokumentáciou. Verzia pravidiel {report.version}.</p>
 <dl><div><dt>Spojovacie prieniky</dt><dd data-testid="technical-connections">{report.connections.length}</dd></div><div><dt>Rošt</dt><dd>{result.totals.joistLinearMetres.toLocaleString('sk-SK',{maximumFractionDigits:3})} bm</dd></div><div><dt>Odpad z výrezov a pozdĺžneho zúženia</dt><dd>{report.cutoutWasteM2.toLocaleString('sk-SK',{maximumFractionDigits:3})} m²</dd></div><div><dt>Podpery a statika</dt><dd>Vyžaduje odborné overenie</dd></div></dl>
 <h4>Nezahrnuté / na doplnenie</h4><ul>{report.missingItems.map(s=><li key={s}>{s}</li>)}</ul>
 <details><summary>Predpoklady a technické zdroje</summary><ul>{report.assumptions.map(s=><li key={s}>{s}</li>)}</ul><p>Čelná škára {report.options.jointGapMm} mm · okraj {report.options.perimeterGapMm} mm · píla {report.options.sawKerfMm} mm · každé čelo {report.options.trimEachEndMm} mm · kotvenie {labels[report.options.fixing]} · profil {report.joistArticle??'nepotvrdený'}.</p><ul>{report.sources.map((s,i)=><li key={i}>{sourceLabel(s)}</li>)}</ul></details>
 <details><summary>Detail čelného spoja — vlastná schéma</summary><svg viewBox="0 0 500 160" role="img" aria-label="Dve dosky s čelnou škárou, každá má vlastný oddelený nosník"><path d="M20 30H245V55H20ZM255 30H480V55H255Z" fill="#b58e67" stroke="#111"/><path d="M165 63H205V125H165ZM295 63H335V125H295Z" fill="#353c3f"/><path d="M185 35V85M315 35V85M210 105H290" stroke="#101010" strokeWidth="3"/><text x="250" y="150" textAnchor="middle" fontSize="13">Dve samostatné podpory · voda musí odtekať</text></svg><p>Schéma nie je v mierke. Lunawood: medzi hranolmi najmenej 50 mm (návod 2023, PDF s. 23). Iné systémy vyžadujú vlastný detail.</p></details>
 </section>;
}

import { scenario } from './test-technical';
import { parseTechnicalOptions } from '../src/planner/technical/options';
export function runRapitecTests(){let passed=0;const check=(x:unknown,n:string)=>{if(!x)throw new Error('RAPI-TEC '+n);passed++;};
 const get=(family:any,patch:any={},article='55954/2183')=>scenario(article,{technical:{fixing:'visible',fastenerReference:family,...patch}});
 const plus=get('plus'),r=plus.technicalReport!.fastenerReference!;
 check(r.quantity===352,'actual 176 intersections x2');check(r.pilotMm===3.5&&r.diameterMm===5,'PLUS pilot');check(r.lengthsMm.includes(70)&&!r.lengthsMm.includes(60),'28mm assembly needs full thread below');check(r.commercial===false,'reference not commerce');
 check(get('teraso').technicalReport!.fastenerReference!.status==='incompatible','Cumaru C rejected');check(get('eko').technicalReport!.fastenerReference!.status==='incompatible','Cumaru A2 rejected');
 check(get('top').technicalReport!.fastenerReference!.pilotMm===4,'TOP pilot4');
 for(const exposure of ['salt','condensation','aggressive','chlorine','unknown']){const v=get('plus',{exposure});check(!v.materials.some(m=>m.key==='fixings'),'no uncertified JAF fixing '+exposure);check(v.warnings.some(w=>w.code==='fastener-exposure-review'),'source warning '+exposure);}
 check(get('plus',{pool:true}).technicalReport!.fastenerReference!.status==='incompatible','pool not blanket A4');check(get('plus',{increasedLoad:true}).technicalReport!.fastenerReference!.status==='incompatible','5mm higher load');
 check(get('alu').technicalReport!.fastenerReference!.status==='incompatible','ALU on wood');check(get('wings').technicalReport!.fastenerReference!.status==='incompatible','steel not wood');
 check(get('plus',{fixing:'profix-x'},'55978/0230').technicalReport!.fastenerReference!.quantity===null,'hidden no visible screw count');
 check(get('teraso',{},'55973/7275').technicalReport!.fastenerReference!.notes.some(n=>n.includes('poznámky e)')),'ipe conditional C note');
 check(get('teraso',{fixing:'visible'},'55978/0230').technicalReport!.fastenerReference!.status==='incompatible','thermo aggressive');
 check(parseTechnicalOptions({exposure:'typo'})===null,'invalid exposure');check(parseTechnicalOptions({fastenerReference:'other'})===null,'invalid family');check(parseTechnicalOptions({increasedLoad:'yes'})===null,'invalid load');
 check(parseTechnicalOptions({exposure:'salt',fastenerReference:'plus',increasedLoad:true})?.exposure==='salt','roundtrip');
 check(!plus.materials.some(m=>m.article?.startsWith('905')),'HPM not BOM');
 check(JSON.stringify(scenario().materials)===JSON.stringify(plus.materials),'normal JAF BOM unchanged by reference');
 return {suite:'rapitec-reference',passed,failed:0};}

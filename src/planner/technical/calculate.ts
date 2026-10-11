import { bounds, clipPolygonX, EPSILON, isOrthogonal, lineIntervals, offsetOrthogonal, polygonArea, roundMm, validateGeometry } from '../../engine/geometry';
import { optimizeStock } from '../../engine/stock';
import type { BoardPiece, EngineProduct, PlanInput, PlanResult, Point, StockBoard } from '../../engine/types';
import { fixingCompatible, jaf, luna, RULE_VERSION } from './rules';
import { parseTechnicalOptions, resolveOptions } from './options';
import type { Evidence, TechnicalStock } from './types';
const swap=(p:Point):Point=>({x:p.y,y:p.x});
const unique=(values:number[])=>[...new Set(values.map(roundMm))].sort((a,b)=>a-b);
const method:Evidence={document:'docs/planner-rules.md — geometrická metodika',pages:[],year:2026};
function stockPlan(boards:{id:string;lengthMm:number}[],variants:TechnicalStock[],kerf:number,trim:number,reserve:number) {
 const lengths=unique(variants.map(v=>v.lengthMm).filter(n=>n>2*trim));
 const packed=optimizeStock(boards.map(b=>({boardId:b.id,lengthMm:b.lengthMm})),lengths.map(n=>n-2*trim),kerf,200,reserve);
 packed.stock=packed.stock.map(s=>{const length=roundMm(s.lengthMm+2*trim);const sku=variants.filter(v=>v.lengthMm===length).sort((a,b)=>a.article.localeCompare(b.article))[0];
 return {...s,lengthMm:length,trimMm:s.reserve?0:2*trim,offcutMm:s.reserve?length:s.offcutMm,article:sku?.article,variantId:sku?.variantId};});
 return packed;
}
export function calculateTechnicalPlan(input:PlanInput,product:EngineProduct,base:(input:PlanInput)=>PlanResult):PlanResult {
 const result=base(input);const context=product.technical!;const profile=context.profile;
 result.warnings=result.warnings.filter(w=>!['missing-rules','unsupported-substrate'].includes(w.code));
 const warn=(code:string,message:string,source:Evidence=method,severity:'review'|'error'='review')=>{
  if(!result.warnings.some(w=>w.code===code))result.warnings.push({code,message,source,severity});
 };
 if(!result.valid)return result;
 if(parseTechnicalOptions(input.technical)===null){result.valid=false;warn('invalid-technical-options','Technické nastavenia nie sú platné.',method,'error');return result;}
 const options=resolveOptions(input.technical,profile);
 const report=result.technicalReport={version:RULE_VERSION,structuralVerification:'requiresReview' as const,profile,options,
 assumptions:['Rozmery sú v mm; výstup je predbežný materiálový návrh, nie staticky overená realizačná dokumentácia.',
 'Rezerva je počet ďalších celých dosiek zaokrúhlený nahor. Hranica použiteľného zvyšku 200 mm je účtovný predpoklad, nie montážne povolenie.',
 'Rezná škára, zarovnanie čiel a neoverené škáry sú vstupy návrhu. Cenník nepotvrdzuje aktuálnu zásobu.'],
 sources:[] as Evidence[],connections:[] as NonNullable<PlanResult['technicalReport']>['connections'],
 missingItems:['Statika nosníkov a podpier, únosnosť podložia, zavetrenie a kotvenie rámu.','Podpery, základy a okrajové profily vyžadujú projektový detail.'],incomplete:true,joistArticle:null as string|null,cutoutWasteM2:0};
 const source=profile.spacing.sources[0]??method;
 warn('structural-review','Vyžaduje odborné overenie: rozpätie a únosnosť nosníkov/podpier, zaťaženie, podložie a stabilita rámu nie sú doložené. Počet terčov sa preto nevymýšľa.',jaf(17));
 for(const [i,note] of profile.notes.entries())warn('profile-note-'+i,note,source);
 const finish=()=>{report.sources=[...new Map([...Object.values(profile).flatMap(value=>value&&typeof value==='object'&&'sources' in value?(value as {sources:Evidence[]}).sources:[]),...result.warnings.flatMap(w=>w.source?[w.source]:[])].map(s=>[JSON.stringify(s),s])).values()];return result;};
 if(profile.spacing.value===null){warn('unknown-sku-rule','Chýba overené priradenie presného artikla, rozmeru a profilu. Dostupný je pôdorys; výrobný výpočet vyžaduje potvrdenie JAF.',source);return finish();}
 const joist=context.accessories.find(a=>a.article===options.joistArticle);
 if(!joist||!fixingCompatible(profile,options.fixing,joist.article)){warn('incompatible-system','Vybrané kotvenie a podkonštrukcia nie sú doložené pre tento presný profil. Zvoľ kompatibilnú kombináciu; výpočet materiálu je zablokovaný.',source,'error');return finish();}
 report.joistArticle=joist.article;
 if(joist.article==='55638/0103'){
  warn('wpc-nonstructural','WPC hranol Gardin nie je nosný konštrukčný prvok. Vyžaduje pevné podopretie a overený montážny detail; nesmie sa automaticky ukladať na terče ako nosník.',jaf(25),'error');return finish();
 }
 if(options.fixing==='visible'&&profile.sideGap.value!==null&&input.gapMm<profile.sideGap.value||options.fixing.startsWith('profix')&&profile.sideGap.value!==null&&Math.abs(input.gapMm-profile.sideGap.value)>.01||options.fixing==='ligo-s47'&&(input.gapMm<5||input.gapMm>6)){
  warn('gap-outside-rules','Škára nezodpovedá vybranému systému. Lunawood vyžaduje najmenej 6 mm; klip Profix v tomto návrhu 6 mm; LIGO približne 5–6 mm.',profile.sideGap.sources[0]??source,'error');return finish();
 }
 if(profile.material!=='wpc'&&profile.sideGap.value===null){
  if(options.moisturePercent===16&&input.gapMm+EPSILON<profile.widthMm*.06){warn('moisture-gap','Pri zadanej vlhkosti 16 % je škára menšia než 6 % šírky dosky podľa JAF. Uprav škáru alebo dolož produktový montážny predpis.',jaf(27),'error');return finish();}
  warn('moisture-review','Bočnú aj čelnú škáru treba potvrdiť podľa nameranej vlhkosti a konkrétneho profilu. Hodnota v návrhu nie je všeobecným odporúčaním.',jaf(27));
 }
 if(profile.jointGap.value!==null&&options.jointGapMm<profile.jointGap.value||profile.wallGap.value!==null&&options.perimeterGapMm<profile.wallGap.value){warn('expansion-gap','Čelná alebo obvodová škára je menšia než produktové minimum.',luna(28,29),'error');return finish();}
 if(profile.jointGap.value===null||profile.wallGap.value===null)warn('assumed-gaps','Čelná a obvodová škára sú pracovné vstupy; pre tento artikel nie je doložené ich konečné minimum.',source);
 if(profile.movement.value?.startsWith('Tepelný'))warn('wpc-thermal-review','Gardin: chýba tabuľka dilatácií podľa teploty dosky, dĺžky a pevného bodu. Použitá škára je len predpoklad. Koeficient UPM Piazza sa na tento výrobok neprenáša.',jaf(25));
 if(!options.drainageConfirmed)warn('drainage-review','Over odtok vody, spád podkladu a priechodné odvetranie. Podložky nesmú vytvárať vodné bariéry.',jaf(27));
 if(options.pool)warn('pool-review','Pri bazéne over koróznu odolnosť kotvenia, odvetranie a vymeniteľnosť dosiek. Dosky nesmú presahovať do vody.',luna(36,37));
 const aluminium=joist.article==='55016/0008';
 // Explicit cross-section orientation: timber stands on its narrow face; aluminium JAF 40 x 30 lies 40 wide / 30 high.
 const joistWidth=aluminium?40:options.joistFlat?joist.widthMm:joist.thicknessMm;
 const joistHeight=aluminium?30:options.joistFlat?joist.thicknessMm:joist.widthMm;
 const spacer=options.fixing==='visible'?options.spacerMm:0;
 if(options.joistFlat)warn('joist-orientation','Položenie hranola naplocho nie je všeobecne zakázané. Over prierez, únosnosť, lepené spoje vodorovne a ochranu styčnej plochy; plocha nad 50 mm potrebuje konštrukčné oddelenie.',jaf(27));
 const clearance=input.heightMm-profile.thicknessMm-joistHeight-spacer;
 const ventilation=input.substrate==='soil'?profile.minVentilationSoil:profile.minVentilationConcrete;
 if(clearance<0||ventilation.value!==null&&clearance<ventilation.value)warn('low-height','Dostupná výška nestačí na zvolený rošt a požadované odvetranie. Individuálne posúdenie: preveriť nižší kovový systém, odvodnenie alebo úpravu podkladu; nejde o automatické zamietnutie terasy.',ventilation.sources[0]??source);
 if(ventilation.value===null)warn('ventilation-unknown','Minimálna voľná výška odvetrania nie je pre túto presnú skladbu potvrdená. Over ju vrátane uzavretia bokov.',source);
 const oriented={...input,orientation:'x' as const,outline:input.orientation==='x'?input.outline:input.outline.map(swap),holes:input.orientation==='x'?input.holes:input.holes.map(h=>h.map(swap))};
 if(![oriented.outline,...oriented.holes].every(isOrthogonal)){warn('unsupported-outline','Šikmý pôdorys sa zobrazí, ale výrobné a nosné detaily potrebujú individuálny návrh.',method);return finish();}
 const outline=offsetOrthogonal(oriented.outline,options.perimeterGapMm),holes=oriented.holes.map(h=>offsetOrthogonal(h,-options.perimeterGapMm));
 if(validateGeometry(outline,holes).length||polygonArea(outline)>polygonArea(oriented.outline)+EPSILON){warn('offset-collapse','Po odpočítaní okrajových škár je pôdorys neplatný alebo príliš úzky.',method,'error');return finish();}
 const layout=base({...oriented,outline,holes});if(!layout.valid||!layout.boards.length){warn('layout-limit','Pôdorys nemožno spracovať v mobilných limitoch výpočtu.',method,'error');return finish();}
 const lengths=context.boardStock.map(v=>v.lengthMm).filter(l=>l>options.trimEachEndMm*2);
 const maxNet=Math.max(...lengths)-2*options.trimEachEndMm;
 if(!Number.isFinite(maxNet)||maxNet<=100){warn('no-stock-length','Chýba použiteľná skladová dĺžka po zarovnaní čiel.',method,'error');return finish();}
 const pieces:BoardPiece[]=[];const jointAxes:number[]=[];
 for(const board of layout.boards){
  const count=Math.max(1,Math.ceil((board.lengthMm+options.jointGapMm)/(maxNet+options.jointGapMm)));
  const net=board.lengthMm-(count-1)*options.jointGapMm;
  // Compare balanced joints and longest-first joints; score actual catalogue purchase lengths, never arbitrary lengths.
  const balanced=Array.from({length:count},()=>net/count);
  const longFirst=Array.from({length:count},(_,i)=>i<count-1?maxNet:net-maxNet*(count-1));
  const score=(cuts:number[])=>cuts.some(n=>n<Math.max(100,2*(profile.endFixingOffset.value??50)+joistWidth))?Infinity:cuts.reduce((sum,n)=>sum+(lengths.filter(l=>l-2*options.trimEachEndMm>=n-EPSILON).sort((a,b)=>a-b)[0]??Infinity),0);
  const cuts=score(longFirst)<=score(balanced)?longFirst:balanced;
  let start=board.start.x;
  cuts.forEach((n,i)=>{const end=i===count-1?board.end.x:start+n;const parts=board.footprintParts.map(p=>clipPolygonX(p,start,end)).filter(p=>p.length>=3&&polygonArea(p)>EPSILON);
   pieces.push({...board,id:board.id+'-part-'+(i+1),start:{...board.start,x:roundMm(start)},end:{...board.end,x:roundMm(end)},lengthMm:roundMm(end-start),footprintParts:parts,jointBefore:i>0,jointAfter:i<count-1});
   if(i<count-1)jointAxes.push(end+options.jointGapMm/2);start=end+options.jointGapMm;
  });
 }
 if(pieces.length>6000){warn('complexity-limit','Návrh má priveľa rezných dielov.',method,'error');return finish();}
 const mapPoint=input.orientation==='x'?(p:Point)=>p:swap;
 result.boards=pieces.map(b=>({...b,start:mapPoint(b.start),end:mapPoint(b.end),footprintParts:b.footprintParts.map(r=>r.map(mapPoint))}));
 result.boardAreaM2=pieces.reduce((s,b)=>s+b.footprintParts.reduce((n,p)=>n+polygonArea(p),0),0)/1e6;
 report.cutoutWasteM2=Math.max(0,pieces.reduce((s,b)=>s+b.lengthMm*profile.widthMm,0)/1e6-result.boardAreaM2);
 if(pieces.some(b=>Math.abs(b.lengthMm*b.widthMm-b.footprintParts.reduce((s,p)=>s+polygonArea(p),0))>.1))warn('notched-board','Výrez zasahuje do šírky dosky. Nárez obsahuje celý polotovar, 2D/3D presný výrez; lokálne kotvenie a zostávajúca šírka vyžadujú detail.',method);
 const cutPlan=stockPlan(pieces,context.boardStock,options.sawKerfMm,options.trimEachEndMm,input.reservePercent);
 if(cutPlan.unassigned.length){warn('unassigned-cuts','Niektoré rezy sa nezmestia do doložených dĺžok.',method,'error');return finish();}
 result.stock=cutPlan.stock;
 const addStock=(stock:StockBoard[],variants:TechnicalStock[],key:'boards'|'joists')=>{
  const counts=new Map<string,number>();stock.forEach(s=>{if(s.article)counts.set(s.article,(counts.get(s.article)??0)+1);});
  for(const [article,quantity] of counts){const v=variants.find(v=>v.article===article)!;result.materials.push({key,id:key+':'+article,article,productId:v.productId,variantId:v.variantId,name:(key==='boards'?product.name:'Nosný profil')+' · '+article,quantity,unit:'ks',stockLengthMm:v.lengthMm,verified:false});}
 };
 addStock(result.stock,context.boardStock,'boards');result.technicalStatus='preliminary';
 const endOffset=Math.max(profile.endFixingOffset.value??50,(joistWidth+(profile.doubleJoistClearance.value??0)-options.jointGapMm)/2);
 if(profile.endFixingOffset.value===null)warn('assumed-end-support','Odsadenie podpory od čela 50 mm je pracovná geometria; pri tomto skrytom systéme treba potvrdiť presah a polohu klipu.',source);
 const mandatory=unique(pieces.flatMap(b=>[b.start.x+endOffset,b.end.x-endOffset,...b.footprintParts.flatMap(p=>{const box=bounds(p);return [box.minX+endOffset,box.maxX-endOffset];})]));
 let axes=[...mandatory];for(let i=1;i<mandatory.length;i++){const n=Math.ceil((mandatory[i]-mandatory[i-1])/profile.spacing.value);for(let k=1;k<n;k++)axes.push(mandatory[i-1]+(mandatory[i]-mandatory[i-1])*k/n);}
 if(profile.minSupports.value===3)for(const b of pieces)if(axes.filter(x=>x>=b.start.x+endOffset-EPSILON&&x<=b.end.x-endOffset+EPSILON).length<3)axes.push((b.start.x+b.end.x)/2);
 axes=unique(axes);
 let structureUsable=true;
 if(pieces.some(b=>b.lengthMm<endOffset*2+joistWidth)){warn('short-piece','Niektorý diel je príliš krátky na oddelené koncové podpory. Nárez je materiálový polotovar; detail vyžaduje úpravu.',source);structureUsable=false;}
 const joistOutline=offsetOrthogonal(oriented.outline,Math.max(options.perimeterGapMm,joistWidth/2));
 const joistHoles=oriented.holes.map(h=>offsetOrthogonal(h,-Math.max(options.perimeterGapMm,joistWidth/2)));
 if(validateGeometry(joistOutline,joistHoles).length)structureUsable=false;
 const joists:PlanResult['joists']=[];
 if(structureUsable)for(const axis of axes){
  for(const [from,to] of lineIntervals(joistOutline.map(swap),joistHoles.map(r=>r.map(swap)),axis+EPSILON*10)){
   if(to-from<joistWidth)continue;
   joists.push({id:'joist-'+(joists.length+1),start:{x:axis,y:roundMm(from)},end:{x:axis,y:roundMm(to)},lengthMm:roundMm(to-from),widthMm:joistWidth,heightMm:joistHeight,
    pairedAtJoint:jointAxes.some(x=>Math.abs(Math.abs(axis-x)-(endOffset+options.jointGapMm/2))<.02)});
  }
 }
 if(joists.length>3000){structureUsable=false;warn('joist-limit','Rozsah roštu prekračuje mobilný limit.',method);}
 for(let i=0;structureUsable&&i<joists.length;i++)for(let j=i+1;j<joists.length;j++){
  if(Math.abs(joists[i].start.x-joists[j].start.x)<joistWidth-.01&&Math.min(joists[i].end.y,joists[j].end.y)-Math.max(joists[i].start.y,joists[j].start.y)>EPSILON){structureUsable=false;warn('close-supports','Odsadené hrany vyžadujú individuálny rošt: navrhnuté hranoly by sa prekrývali.',method);break;}
 }
 const contact=(b:BoardPiece,j:PlanResult['joists'][number])=>{
  const spans=b.footprintParts.flatMap(p=>lineIntervals(p.map(swap),[],j.start.x+EPSILON*10));
  const hits=spans.map(([lo,hi])=>[Math.max(lo,j.start.y-joistWidth/2),Math.min(hi,j.end.y+joistWidth/2)]).filter(([lo,hi])=>hi-lo>EPSILON);
  if(!hits.length)return null;return {low:Math.min(...hits.map(s=>s[0])),high:Math.max(...hits.map(s=>s[1]))};
 };
 const supportCache=new Map<string,PlanResult['joists']>();
 const supportFor=(b:BoardPiece)=>{if(!supportCache.has(b.id))supportCache.set(b.id,joists.filter(j=>j.start.x>=b.start.x+endOffset-.02&&j.start.x<=b.end.x-endOffset+.02&&contact(b,j)!==null).sort((a,b)=>a.start.x-b.start.x));return supportCache.get(b.id)!;};
 if(structureUsable)for(const b of pieces){const supports=supportFor(b);if(supports.length<(profile.minSupports.value??2)||Math.abs((supports[0]?.start.x??Infinity)-b.start.x-endOffset)>.1||Math.abs(b.end.x-(supports.at(-1)?.start.x??-Infinity)-endOffset)>.1||supports.some((j,i)=>i>0&&j.start.x-supports[i-1].start.x>profile.spacing.value!+.1)){
  structureUsable=false;warn('end-support-review','Niektorý koniec alebo výrez nemá pravidelné podopretie. Dosky sú spočítané ako polotovary; rošt a kotvenie treba individuálne vyriešiť.',method);break;
 }}
 if(structureUsable){
  result.joists=joists.map(j=>({...j,start:mapPoint(j.start),end:mapPoint(j.end)}));
  const compatibleJoists=context.accessories.filter(v=>v.productId===joist.productId&&v.widthMm===joist.widthMm&&v.thicknessMm===joist.thicknessMm&&profile.joistArticles.value?.includes(v.article));
  const joistPlan=stockPlan(joists,compatibleJoists,options.sawKerfMm,options.trimEachEndMm,0);
  if(joistPlan.unassigned.length)warn('joist-length-review','Dĺžka nosníka presahuje skladový profil. Bez pravidla napojenia nosníkov sa ich nákupný počet nevytvoril.',source);
  else{result.joistStock=joistPlan.stock;addStock(result.joistStock,compatibleJoists,'joists');}
  for(const b of pieces)for(const j of supportFor(b))report.connections.push({boardId:b.id,joistId:j.id,position:mapPoint({x:j.start.x,y:(contact(b,j)!.low+contact(b,j)!.high)/2}),kind:options.fixing==='visible'?'visible':'hidden',count:options.fixing==='visible'?2:1});
  if(options.fixing==='visible'){
   const narrow=pieces.some(b=>b.widthMm<2*(profile.sideFixingOffset.value??15)+1);
   if(narrow)warn('narrow-rip','Pozdĺžne zúženie dosky neumožňuje oba odstupy skrutiek od hrán. Úzky diel vyžaduje zmenu rozloženia alebo vlastný detail.',source);
   const required=report.connections.reduce((n,c)=>n+c.count,0);
   const minimum=profile.sideGap.sources.some(s=>s.document.includes('LUNAWOOD'))?2.5*(profile.thicknessMm+spacer):2.5*profile.thicknessMm+spacer;
   const screwCandidates=[{article:'55013/0291',length:60,pack:200},{article:'55013/0134',length:70,pack:200}];
   const screw=!aluminium&&!narrow?screwCandidates.find(s=>s.length>=minimum&&s.length<=profile.thicknessMm+spacer+joistHeight&&context.accessories.some(a=>a.article===s.article)):undefined;
   if(screw){const v=context.accessories.find(v=>v.article===screw.article)!;result.materials.push({key:'fixings',id:'fixings:'+v.article,article:v.article,productId:v.productId,variantId:v.variantId,name:'Skrutky A4 · '+v.article,quantity:Math.ceil(required/screw.pack),unit:'bal',requiredPieces:required,packagePieces:screw.pack,verified:false});}
   else{report.missingItems.push('Skrutky: '+required+' ks spojovacích bodov; presný variant a dĺžku potvrdiť.');warn('screw-review','Počet skrutiek je odvodený z prienikov dosiek a nosníkov, ale vhodná skladová skrutka pre túto skladbu nie je doložená. Nepridáva sa nesprávny artikel.',jaf(22));}
  }else{
   // A shared clip is counted once at a real gap between neighbouring rows on the same joist.
   const clipArticle=options.fixing==='profix-x'?'55985/0003':options.fixing==='profix-x2'?'55985/0007':options.fixing==='ligo-s47'&&!aluminium?'55031/0102':null;
   const clip=clipArticle?context.accessories.find(v=>v.article===clipArticle):undefined;
   if(clip){
    let interiorClips=0;
    for(const j of joists){const rows=new Map<number,BoardPiece[]>();for(const b of pieces)if(supportFor(b).some(s=>s.id===j.id))rows.set(b.row,[...(rows.get(b.row)??[]),b]);
     for(const [row,list] of rows)for(const a of list)for(const b of rows.get(row+1)??[]){const aa=contact(a,j)!,bb=contact(b,j)!;if(Math.abs(bb.low-aa.high-input.gapMm)<.1)interiorClips++;}
    }
    const pack=clipArticle==='55985/0003'?200:clipArticle==='55985/0007'?100:80;
    if(interiorClips)result.materials.push({key:'fixings',id:'fixings:'+clip.article,article:clip.article,productId:clip.productId,variantId:clip.variantId,name:'Vnútorné klipy · '+clip.article,quantity:Math.ceil(interiorClips/pack),unit:'bal',requiredPieces:interiorClips,packagePieces:pack,verified:false});
    report.missingItems.push('Štart, koniec, orezané bočné drážky a spojovacie skrutky nie sú zahrnuté do počtu vnútorných klipov.');
   }
   report.missingItems.push('Skryté kotvenie: '+report.connections.length+' prienikov doska/nosník. Počet klipov nie je zhodný s počtom prienikov; overiť štarty, okraje, delenie a skrutky.');
   warn('hidden-fixing-review','Vnútorné klipy sa počítajú raz na skutočnej spoločnej škáre a nosníku. Úplný počet a skrutky potrebujú detail okrajov, delených dosiek a konkrétnej generácie klipu. Klipy sa nezamieňajú koeficientom na m².',source);
  }
 }else report.missingItems.push('Rošt: individuálny detail pri výrezoch alebo krátkych dieloch.');
 const used=result.stock.filter(s=>!s.reserve);const cuts=pieces.reduce((n,b)=>n+b.lengthMm,0),purchased=used.reduce((n,s)=>n+s.lengthMm,0);
 const kerf=used.reduce((n,s)=>n+s.kerfMm,0),trim=used.reduce((n,s)=>n+(s.trimMm??0),0);
 result.totals={boardPieces:pieces.length,boardLinearMetres:roundMm(cuts)/1000,purchasedLinearMetres:result.stock.reduce((n,s)=>n+s.lengthMm,0)/1000,
 joistLinearMetres:roundMm(result.joists.reduce((n,j)=>n+j.lengthMm,0))/1000,wasteMm:roundMm(kerf+trim+used.filter(s=>!s.reusable).reduce((n,s)=>n+s.offcutMm,0)),
 reusableOffcutMm:roundMm(used.filter(s=>s.reusable).reduce((n,s)=>n+s.offcutMm,0)),kerfMm:kerf,utilizationPercent:purchased?cuts/purchased*100:null,reserveBoards:result.stock.filter(s=>s.reserve).length};
 warn('preliminary-only','Predbežný materiálový návrh. Súčet zahŕňa iba vypočítané položky; chýbajúce podpery, ukončenia a montážne detaily nie sú nulové náklady.',method);
 return finish();
}

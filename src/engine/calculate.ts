import { bounds, clipPolygonX, connectedRibbonParts, EPSILON, isOrthogonal, lineIntervals,
  offsetOrthogonal, perimeter, polygonArea, ribbonParts, roundMm, validateGeometry } from './geometry';
import { optimizeStock } from './stock';
import type { BoardPiece, EngineProduct, ManufacturingRules, PlanInput, PlanResult, Point } from './types';

/** Solely a visual/test fixture. These values are not verified supplier mounting rules. */
export const DEMO_RULES: ManufacturingRules = {
  verification:'demo',source:'Demonštračná geometria; vyžaduje montážny list výrobcu a odborné overenie.',
  minGapMm:4,maxGapMm:8,perimeterGapMm:10,maxJoistSpacingMm:400,maxPedestalSpacingMm:600,
  maxBoardOverhangMm:30,minBoardWidthMm:40,minBoardCutLengthMm:200,
  joistWidthMm:50,joistHeightMm:50,pedestalMinHeightMm:25,pedestalMaxHeightMm:300,
  jointGapMm:5,sawKerfMm:3,minReusableOffcutMm:200,allowButtJoints:true,fixingsPerIntersection:2,
  joistStockLengthsMm:[3000,4000],
};
const warning = (code:string,message:string)=>({code,message});
function emptyResult(input:PlanInput,product:EngineProduct):PlanResult {
  return {valid:false,technicalStatus:'unavailable',warnings:[],outline:input.outline,holes:input.holes,
    orientation:input.orientation,heightMm:input.heightMm,substrate:input.substrate??'concrete',boardThicknessMm:product.thicknessMm||0,
    areaM2:0,perimeterM:0,boardAreaM2:0,boards:[],joists:[],pedestals:[],stock:[],joistStock:[],materials:[],
    totals:{boardPieces:0,boardLinearMetres:0,purchasedLinearMetres:0,joistLinearMetres:0,
      wasteMm:0,reusableOffcutMm:0,kerfMm:0,utilizationPercent:null,reserveBoards:0}};
}
function ruleErrors(rules:ManufacturingRules):string[] {
  const positives=['maxJoistSpacingMm','maxPedestalSpacingMm','joistWidthMm','joistHeightMm','minBoardWidthMm','minBoardCutLengthMm',
    'pedestalMinHeightMm','pedestalMaxHeightMm','fixingsPerIntersection'] as const;
  const nonnegatives=['minGapMm','maxGapMm','perimeterGapMm','maxBoardOverhangMm','jointGapMm',
    'sawKerfMm','minReusableOffcutMm'] as const;
  const errors:string[]=[];
  if(positives.some(k=>!Number.isFinite(rules[k])||rules[k]<=0)||nonnegatives.some(k=>!Number.isFinite(rules[k])||rules[k]<0))
    errors.push('Montážny profil obsahuje chýbajúce alebo neplatné hodnoty.');
  if(rules.maxGapMm<rules.minGapMm||rules.pedestalMaxHeightMm<rules.pedestalMinHeightMm||
    rules.maxJoistSpacingMm<rules.joistWidthMm||rules.maxPedestalSpacingMm<rules.joistWidthMm||
    !Number.isInteger(rules.fixingsPerIntersection)||!rules.joistStockLengthsMm?.length||
    rules.joistStockLengthsMm.some(n=>!Number.isFinite(n)||n<=0)||!rules.source?.trim())
    errors.push('Montážny profil nie je kompletný.');
  return errors;
}
function boardGeometry(outline:Point[],holes:Point[][],width:number,gap:number,minWidth=0):BoardPiece[] | null {
  const b=bounds(outline), boards:BoardPiece[]=[];
  const span=b.maxY-b.minY,count=Math.ceil(span/(width+gap));
  if(count>1500)return null;
  let partCount=0,vertexCount=0;
  const lastWidth=Math.min(width,span-(count-1)*(width+gap));
  // Balance two edge rips when a full-width-first layout leaves a sliver.
  const edgeWidth=count>1&&lastWidth<minWidth?(width+lastWidth)/2:width;
  let low=b.minY;
  for(let row=0;low<b.maxY-EPSILON;row++) {
    const high=Math.min(low+(row===0?edgeWidth:width),b.maxY);
    const parts=ribbonParts(outline,holes,low,high);
    partCount+=parts.length;vertexCount+=parts.reduce((sum,p)=>sum+p.length,0);
    if(partCount>12000||vertexCount>48000)return null;
    const groups=connectedRibbonParts(parts);
    if(boards.length+groups.length>6000)return null;
    groups.forEach((parts,column)=>{
      const box=bounds(parts.flat());
      boards.push({id:`board-${row+1}-${column+1}`,row,start:{x:roundMm(box.minX),y:roundMm((box.minY+box.maxY)/2)},
        end:{x:roundMm(box.maxX),y:roundMm((box.minY+box.maxY)/2)},widthMm:roundMm(box.maxY-box.minY),
        lengthMm:roundMm(box.maxX-box.minX),footprintParts:parts,jointBefore:false,jointAfter:false});
    });
    low=high+gap;
  }
  return boards;
}
function roundedUnique(values:number[]) {
  return [...new Set(values.map(roundMm))].sort((a,b)=>a-b);
}
function hasSupport(piece:BoardPiece,axis:number) {
  return piece.footprintParts.some(part=>{const box=bounds(part);return axis>=box.minX-EPSILON&&axis<=box.maxX+EPSILON;});
}
function splitBoards(boards:BoardPiece[],positions:number[],maxStock:number,rules:ManufacturingRules) {
  const output:BoardPiece[]=[], joints:number[]=[], errors:string[]=[];
  for(const board of boards) {
    if(board.lengthMm<=maxStock+EPSILON){output.push(board);continue;}
    if(!rules.allowButtJoints){errors.push(`Doska ${board.id} potrebuje ${board.lengthMm.toFixed(0)} mm; napájanie tento profil nepovoľuje.`);continue;}
    let start=board.start.x,part=0;
    while(board.end.x-start>maxStock+EPSILON) {
      const joint=positions.filter(p=>p>start+Math.max(100,rules.joistWidthMm*2)&&
        p-rules.jointGapMm/2<=start+maxStock+EPSILON&&
        p+rules.jointGapMm/2<=board.end.x-rules.minBoardCutLengthMm+EPSILON&&hasSupport(board,p))
        .at(-1);
      if(joint===undefined){errors.push(`Dosku ${board.id} nemožno napojiť na podporu pri dostupných výrobných dĺžkach.`);break;}
      const end=joint-rules.jointGapMm/2;
      const footprints=board.footprintParts.map(p=>clipPolygonX(p,start,end)).filter(p=>p.length>=3&&polygonArea(p)>EPSILON);
      output.push({...board,id:`${board.id}-cut-${++part}`,start:{...board.start,x:roundMm(start)},
        end:{...board.end,x:roundMm(end)},lengthMm:roundMm(end-start),footprintParts:footprints,jointBefore:part>1,jointAfter:true});
      joints.push(joint);start=joint+rules.jointGapMm/2;
    }
    if(board.end.x-start<=maxStock+EPSILON) {
      output.push({...board,id:`${board.id}-cut-${++part}`,start:{...board.start,x:roundMm(start)},
        lengthMm:roundMm(board.end.x-start),footprintParts:board.footprintParts.map(p=>clipPolygonX(p,start,board.end.x))
          .filter(p=>p.length>=3&&polygonArea(p)>EPSILON),jointBefore:true,jointAfter:false});
    }
  }
  return {boards:output,joints:roundedUnique(joints),errors};
}
function transformResult(result:PlanResult):PlanResult {
  if(result.orientation==='x')return result;
  const swap=(p:Point)=>({x:p.y,y:p.x});
  result.boards=result.boards.map(b=>({...b,start:swap(b.start),end:swap(b.end),footprintParts:b.footprintParts.map(p=>p.map(swap))}));
  result.joists=result.joists.map(j=>({...j,start:swap(j.start),end:swap(j.end)}));
  result.pedestals=result.pedestals.map(p=>({...p,x:p.y,y:p.x}));
  return result;
}
export function calculatePlan(input:PlanInput,product:EngineProduct):PlanResult {
  const result=emptyResult(input,product);
  const errors=validateGeometry(input.outline,input.holes);
  if(!['x','y'].includes(input.orientation))errors.push('Neplatný smer kladenia.');
  if(input.substrate!==undefined&&!['concrete','paving','soil'].includes(input.substrate))errors.push('Neplatný typ podkladu.');
  if(!Number.isFinite(input.heightMm)||input.heightMm<30||input.heightMm>1000)errors.push('Výška musí byť od 30 do 1 000 mm.');
  if(!Number.isFinite(input.gapMm)||input.gapMm<0||input.gapMm>30)errors.push('Škára musí byť od 0 do 30 mm.');
  if(!Number.isFinite(input.reservePercent)||input.reservePercent<0||input.reservePercent>50)errors.push('Rezerva musí byť od 0 do 50 %.');
  if(input.productId!==product.id || (input.variantId && input.variantId!==product.variantId))errors.push('Produkt alebo variant nezodpovedá vybranému materiálu.');
  if(errors.length){result.warnings=errors.map(message=>warning('invalid-input',message));return result;}
  result.valid=true;
  result.areaM2=(polygonArea(input.outline)-input.holes.reduce((s,h)=>s+polygonArea(h),0))/1e6;
  result.perimeterM=(perimeter(input.outline)+input.holes.reduce((s,h)=>s+perimeter(h),0))/1000;
  if(!product.widthMm||!product.thicknessMm||product.widthMm<20||product.widthMm>500||product.thicknessMm<=0||
    !Number.isFinite(product.widthMm)||!Number.isFinite(product.thicknessMm)) {
    result.warnings.push(warning('missing-dimensions','Chýbajú overené rozmery variantu. Zobrazuje sa pôdorys bez výpočtu dosiek.'));return result;
  }
  const swap=(p:Point)=>({x:p.y,y:p.x});
  const outline=input.orientation==='x'?input.outline:input.outline.map(swap);
  const holes=input.orientation==='x'?input.holes:input.holes.map(h=>h.map(swap));
  const orthogonal=[outline,...holes].every(isOrthogonal),rules=product.installationRules;
  let effectiveOutline=outline,effectiveHoles=holes;
  let usableRules=rules!==null&&ruleErrors(rules).length===0&&orthogonal;
  if(result.substrate!=='concrete'){
    usableRules=false;
    result.warnings.push(warning('unsupported-substrate',result.substrate==='soil'
      ? 'Zemina vyžaduje samostatný návrh základov, odvodnenia a uloženia nosného systému. Táto verzia nevypočítava konštrukciu ani materiálový zoznam pre tento podklad.'
      : 'Dlažba vyžaduje overenie únosnosti a spôsobu uloženia nosného systému. Táto verzia nevypočítava konštrukciu ani materiálový zoznam pre tento podklad.'));
  }
  if(!rules)result.warnings.push(warning('missing-rules','Montážne pravidlá výrobcu nie sú dostupné. Nosný systém a materiálový zoznam sa nevypočítavajú.'));
  else ruleErrors(rules).forEach(message=>result.warnings.push(warning('incomplete-rules',message)));
  if(!orthogonal)result.warnings.push(warning('unsupported-installation','Šikmý pôdorys sa presne vizualizuje, ale nárezový a montážny výpočet podporuje zatiaľ iba pravouhlé obrysy a výrezy.'));
  if(usableRules&&rules) {
    if(input.gapMm<rules.minGapMm||input.gapMm>rules.maxGapMm){
      result.warnings.push(warning('gap-outside-rules',`Škára musí byť podľa zvoleného profilu ${rules.minGapMm}–${rules.maxGapMm} mm.`));usableRules=false;
    }
    const pedestalHeight=input.heightMm-product.thicknessMm-rules.joistHeightMm;
    if(pedestalHeight<rules.pedestalMinHeightMm||pedestalHeight>rules.pedestalMaxHeightMm){
      result.warnings.push(warning('height-outside-rules','Po odpočítaní dosky a roštu zostáva výška mimo rozsahu vybraných terčov.'));usableRules=false;
    }
    if(usableRules) {
      effectiveOutline=offsetOrthogonal(outline,rules.perimeterGapMm);
      effectiveHoles=holes.map(h=>offsetOrthogonal(h,-rules.perimeterGapMm));
      if(validateGeometry(effectiveOutline,effectiveHoles).length || polygonArea(effectiveOutline)>polygonArea(outline)+EPSILON) {
        result.warnings.push(warning('offset-collapse','Pôdorys je po dilatačnom odsadení príliš úzky alebo neplatný. Výpočet konštrukcie nie je dostupný.'));
        usableRules=false;effectiveOutline=outline;effectiveHoles=holes;
      }
    }
  }
  const boardResult=boardGeometry(effectiveOutline,effectiveHoles,product.widthMm,input.gapMm,usableRules&&rules?rules.minBoardWidthMm:0);
  if(!boardResult){result.valid=false;result.warnings.push(warning('complexity-limit','Návrh obsahuje priveľa pásov alebo orezaných dosiek pre mobilnú vizualizáciu.'));return result;}
  result.boards=boardResult;
  result.boardAreaM2=result.boards.reduce((s,b)=>s+b.footprintParts.reduce((a,p)=>a+polygonArea(p),0),0)/1e6;
  if(!usableRules||!rules)return transformResult(result);
  // A corner through a board ribbon produces a notched plank, not a rectangular
  // cut. It requires its own fixing/end support detail and cannot be priced as
  // an ordinary straight cut by this version of the manufacturing algorithm.
  if(result.boards.some(b=>{
    const box=bounds(b.footprintParts.flat());
    const actual=b.footprintParts.reduce((sum,p)=>sum+polygonArea(p),0);
    return Math.abs(actual-(box.maxX-box.minX)*(box.maxY-box.minY))>0.1;
  })){
    result.warnings.push(warning('unsupported-notched-board','Roh alebo výrez prechádza vnútrom pásu dosky. Vzniká doska s výrezom, ktorá potrebuje individuálny detail podpory a kotvenia. Materiálový zoznam sa nevytvoril.'));
    return transformResult(result);
  }
  if(result.boards.some(b=>b.widthMm<rules.minBoardWidthMm-EPSILON||b.lengthMm<rules.minBoardCutLengthMm-EPSILON)){
    result.warnings.push(warning('unsupported-small-board','Vzniká príliš úzka alebo krátka doska podľa montážneho profilu. Uprav pôdorys alebo polohu dosiek; materiálový zoznam sa nevytvoril.'));
    return transformResult(result);
  }
  if(!product.availableLengthsMm.length||product.availableLengthsMm.some(n=>!Number.isFinite(n)||n<=0)) {
    result.warnings.push(warning('missing-stock','Chýbajú výrobné dĺžky. Materiálový zoznam sa nevytvoril.'));return transformResult(result);
  }
  const supportInset=Math.min(rules.maxBoardOverhangMm,rules.joistWidthMm/2);
  if(supportInset<rules.joistWidthMm/2-EPSILON){
    result.warnings.push(warning('unsupported-overhang','Profil roštu a povolený presah vyžadujú osobitný okrajový detail.'));return transformResult(result);
  }
  const mandatory=roundedUnique(result.boards.flatMap(b=>[b.start.x+supportInset,b.end.x-supportInset]));
  if(mandatory.some((p,i)=>i>0&&p-mandatory[i-1]<rules.joistWidthMm-EPSILON)) {
    result.warnings.push(warning('unsupported-close-supports','Úzke alebo odsadené okraje potrebujú individuálny detail roštu.'));return transformResult(result);
  }
  let positions:number[]=[...mandatory];
  for(let i=1;i<mandatory.length;i++) {
    const span=mandatory[i]-mandatory[i-1],steps=Math.ceil(span/rules.maxJoistSpacingMm);
    for(let j=1;j<steps;j++)positions.push(mandatory[i-1]+span*j/steps);
  }
  positions=roundedUnique(positions);
  const split=splitBoards(result.boards,positions,Math.max(...product.availableLengthsMm),rules);
  if(split.errors.length){result.warnings.push(...split.errors.map(message=>warning('unsupported-joint',message)));return transformResult(result);}
  result.boards=split.boards;
  if(result.boards.some(b=>b.lengthMm<rules.minBoardCutLengthMm-EPSILON)) {
    result.warnings.push(warning('unsupported-small-cut','Po napojení vzniká príliš krátky odrezok podľa montážneho profilu. Materiálový zoznam sa nevytvoril.'));
    return transformResult(result);
  }
  // Every butt joint has two distinct end joists in this single structural plane.
  const halfPair=rules.jointGapMm/2+rules.joistWidthMm/2;
  positions=roundedUnique([...positions.filter(p=>!split.joints.some(j=>Math.abs(p-j)<halfPair+rules.joistWidthMm-EPSILON)),
    ...split.joints.flatMap(j=>[j-halfPair,j+halfPair])]);
  if(positions.some((p,i)=>i>0&&p-positions[i-1]<rules.joistWidthMm-EPSILON)){
    result.warnings.push(warning('unsupported-overlapping-joists','Napojenia dosiek vytvárajú prekrývajúce sa podporové profily. Potrebný je individuálny detail; materiálový zoznam sa nevytvoril.'));
    return transformResult(result);
  }
  const joistOutline=offsetOrthogonal(outline,rules.joistWidthMm/2);
  const joistHoles=holes.map(h=>offsetOrthogonal(h,-rules.joistWidthMm/2));
  if(validateGeometry(joistOutline,joistHoles).length){
    result.warnings.push(warning('unsupported-joist-offset','Konštrukcia pri tomto úzkom obryse potrebuje individuálny okrajový detail.'));return transformResult(result);
  }
  // Swap axes to clip perpendicular joist centre lines against the same solid polygon.
  for(const axis of positions){
    const joistBox=bounds(joistOutline);
    const lineY=axis>=joistBox.maxX-EPSILON?axis-EPSILON*10:axis+EPSILON*10;
    for(const [from,to] of lineIntervals(joistOutline.map(swap),joistHoles.map(h=>h.map(swap)),lineY)) {
      if(to-from<rules.joistWidthMm)continue;
      const steps=Math.max(1,Math.ceil((to-from)/rules.maxPedestalSpacingMm));
      if(result.joists.length>=3000||result.pedestals.length+steps+1>12000){
        result.joists=[];result.pedestals=[];result.warnings.push(warning('complexity-limit','Nosný systém prekračuje limit podporových prvkov pre túto verziu plánovača.'));return transformResult(result);
      }
      const id=`joist-${result.joists.length+1}`;
      result.joists.push({id,start:{x:axis,y:roundMm(from)},end:{x:axis,y:roundMm(to)},
        lengthMm:roundMm(to-from),widthMm:rules.joistWidthMm,heightMm:rules.joistHeightMm,
        pairedAtJoint:split.joints.some(j=>Math.abs(Math.abs(axis-j)-halfPair)<0.01)});
      for(let i=0;i<=steps;i++)result.pedestals.push({id:`pedestal-${result.pedestals.length+1}`,joistId:id,
        x:axis,y:roundMm(from+(to-from)*i/steps),heightMm:input.heightMm-product.thicknessMm!-rules.joistHeightMm});
    }
  }
  // Refuse unsupported board ends rather than silently counting an incomplete system.
  const unsupported=result.boards.some(b=>[b.start.x,b.end.x].some(end=>!result.joists.some(j=>
    Math.abs(j.start.x-end)<=rules.maxBoardOverhangMm+EPSILON&&
    b.start.y>=Math.min(j.start.y,j.end.y)-rules.joistWidthMm/2&&b.start.y<=Math.max(j.start.y,j.end.y)+rules.joistWidthMm/2)));
  if(unsupported){result.joists=[];result.pedestals=[];result.warnings.push(warning('unsupported-end-support','Niektoré konce dosiek potrebujú osobitnú podporu. Materiálový zoznam nie je bezpečné vytvoriť.'));return transformResult(result);}
  const excessiveSpan=result.boards.some(b=>{
    const supports=result.joists.filter(j=>j.start.x>=b.start.x-EPSILON&&j.start.x<=b.end.x+EPSILON&&
      b.start.y>=j.start.y-rules.joistWidthMm/2&&b.start.y<=j.end.y+rules.joistWidthMm/2).map(j=>j.start.x).sort((a,b)=>a-b);
    return supports.some((p,i)=>i>0&&p-supports[i-1]>rules.maxJoistSpacingMm+0.01);
  });
  if(excessiveSpan){result.joists=[];result.pedestals=[];result.warnings.push(warning('unsupported-support-span','Pri výreze alebo napojení vzniká rozstup podporových profilov mimo montážneho profilu. Materiálový zoznam sa nevytvoril.'));return transformResult(result);}
  const stockResult=optimizeStock(result.boards.map(b=>({boardId:b.id,lengthMm:b.lengthMm})),
    product.availableLengthsMm,rules.sawKerfMm,rules.minReusableOffcutMm,input.reservePercent);
  if(stockResult.unassigned.length){result.warnings.push(warning('unassigned-cuts','Niektoré rezy nemožno vyrobiť z dostupných dĺžok.'));return transformResult(result);}
  result.stock=stockResult.stock;
  const verified=rules.verification==='verified'&&product.status==='verified';
  result.technicalStatus=verified?'verified':'demo';
  if(!verified)result.warnings.push(warning('demo-rules','DEMO: množstvá vychádzajú z ukážkového montážneho profilu. Nie sú objednávkovým ani realizačným podkladom.'));
  result.warnings.push(warning('technical-review','Orientačný výpočet vyžaduje kontrolu montážnych pravidiel, únosnosti podkladu a detailov napojenia odborníkom.'));
  const boardCounts=new Map<number,number>();result.stock.forEach(s=>boardCounts.set(s.lengthMm,(boardCounts.get(s.lengthMm)||0)+1));
  [...boardCounts].sort((a,b)=>a[0]-b[0]).forEach(([length,quantity])=>result.materials.push({key:'boards',productId:product.id,
    variantId:product.variantId,name:`${product.name} · ${length} mm`,quantity,unit:'ks',stockLengthMm:length,verified}));
  const joistStock=optimizeStock(result.joists.map(j=>({boardId:j.id,lengthMm:j.lengthMm})),rules.joistStockLengthsMm,
    rules.sawKerfMm,rules.minReusableOffcutMm,0);
  if(joistStock.unassigned.length){
    result.technicalStatus='unavailable';result.stock=[];result.materials=[];
    result.warnings.push(warning('unsupported-joist-length','Rošt vyžaduje dĺžky alebo napojenia mimo tohto montážneho profilu. Materiálový zoznam sa nevytvoril.'));
    return transformResult(result);
  }
  const joistCounts=new Map<number,number>();joistStock.stock.forEach(s=>joistCounts.set(s.lengthMm,(joistCounts.get(s.lengthMm)||0)+1));
  result.joistStock=joistStock.stock;
  [...joistCounts].sort((a,b)=>a[0]-b[0]).forEach(([length,quantity])=>result.materials.push({key:'joists',
    productId:rules.accessoryProductIds?.joist||null,variantId:null,name:`Nosný profil · ${length} mm`,quantity,unit:'ks',stockLengthMm:length,verified}));
  const intersections=result.boards.reduce((n,b)=>n+result.joists.filter(j=>j.start.x>=b.start.x-EPSILON&&j.start.x<=b.end.x+EPSILON&&
    b.start.y>=j.start.y-rules.joistWidthMm/2&&b.start.y<=j.end.y+rules.joistWidthMm/2).length,0);
  result.materials.push({key:'pedestals',productId:rules.accessoryProductIds?.pedestal||null,variantId:null,
    name:'Rektifikačné terče',quantity:result.pedestals.length,unit:'ks',verified},
    {key:'fixings',productId:rules.accessoryProductIds?.fixing||null,variantId:null,name:'Spojovacie prvky',
      quantity:intersections*rules.fixingsPerIntersection,unit:'ks',verified});
  if(rules.accessoryProductIds?.edge)result.materials.push({key:'edges',productId:rules.accessoryProductIds.edge,
    variantId:null,name:'Ukončenie obvodu · dĺžka bez optimalizácie',quantity:Math.ceil(result.perimeterM*1000)/1000,unit:'bm',verified});
  const used=result.stock.filter(s=>!s.reserve), kerf=used.reduce((n,s)=>n+s.kerfMm,0);
  const cutTotal=result.boards.reduce((n,b)=>n+b.lengthMm,0),purchased=used.reduce((n,s)=>n+s.lengthMm,0);
  result.boardAreaM2=result.boards.reduce((n,b)=>n+b.footprintParts.reduce((s,p)=>s+polygonArea(p),0),0)/1e6;
  result.totals={boardPieces:result.boards.length,boardLinearMetres:roundMm(cutTotal)/1000,
    purchasedLinearMetres:result.stock.reduce((n,s)=>n+s.lengthMm,0)/1000,
    joistLinearMetres:result.joists.reduce((n,j)=>n+j.lengthMm,0)/1000,
    wasteMm:roundMm(kerf+used.filter(s=>!s.reusable).reduce((n,s)=>n+s.offcutMm,0)),
    reusableOffcutMm:roundMm(used.filter(s=>s.reusable).reduce((n,s)=>n+s.offcutMm,0)),kerfMm:kerf,
    utilizationPercent:purchased?cutTotal/purchased*100:null,reserveBoards:result.stock.filter(s=>s.reserve).length};
  return transformResult(result);
}

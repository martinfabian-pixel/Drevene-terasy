import { calculatePlan, DEMO_RULES, optimizeStock, pointInPolygon, polygonArea, ribbonParts, shapeOutline,
  validateGeometry, type EngineProduct, type PlanInput } from '../src/engine';

const tests: {name:string;run:()=>void}[]=[];
function test(name:string,run:()=>void){tests.push({name,run});}
function assert(value:unknown,message='Assertion failed'):asserts value {if(!value)throw new Error(message);}
function close(a:number,b:number,tolerance=0.001){assert(Math.abs(a-b)<=tolerance,`${a} differs from ${b}`);}
function same(a:unknown,b:unknown){assert(JSON.stringify(a)===JSON.stringify(b),'Values differ');}
const rect=shapeOutline('rectangle',4000,2500);
const product:EngineProduct={id:'demo',name:'Demo doska',variantId:'140x26',widthMm:140,thicknessMm:26,
  availableLengthsMm:[3000,4000],status:'demo',installationRules:{...DEMO_RULES}};
const input:PlanInput={outline:rect,holes:[],orientation:'x',heightMm:200,gapMm:6,productId:'demo',
  variantId:'140x26',reservePercent:0};
const squareHole=[{x:1200,y:700},{x:2200,y:700},{x:2200,y:1700},{x:1200,y:1700}];
test('Rectangle area and geometry validity',()=>{close(polygonArea(rect),10000000);same(validateGeometry(rect),[]);});
test('Square, L and U shape construction',()=>{
  close(polygonArea(shapeOutline('square',4000,2500)),16000000);
  assert(polygonArea(shapeOutline('l',4000,2500))<10000000);
  assert(polygonArea(shapeOutline('u',4000,2500))<10000000);
  for(const s of ['l','u'] as const) same(validateGeometry(shapeOutline(s,4000,2500)),[]);
});
test('U notch numeric width changes its centered geometry and exact area',()=>{
  const narrow=shapeOutline('u',4000,2500,500),wide=shapeOutline('u',4000,2500,1500);
  same(validateGeometry(narrow),[]);same(validateGeometry(wide),[]);
  close(narrow[3].x-narrow[6].x,500);close(wide[3].x-wide[6].x,1500);
  close((narrow[3].x+narrow[6].x)/2,2000);close((wide[3].x+wide[6].x)/2,2000);
  close(polygonArea(narrow),10000000-500*2500*0.55);
  close(polygonArea(wide),10000000-1500*2500*0.55);
  close(polygonArea(shapeOutline('u',4000,2500)),10000000-1600*2500*0.55);
  close(shapeOutline('u',4000,2500,3000)[3].x-shapeOutline('u',4000,2500,3000)[6].x,1800);
});
test('Self intersection rejects bow tie',()=>assert(validateGeometry([{x:0,y:0},{x:4000,y:2500},{x:0,y:2500},{x:4000,y:0}]).length>0));
test('Nonconsecutive boundary touch rejected',()=>assert(validateGeometry([{x:0,y:0},{x:4000,y:0},{x:4000,y:2500},{x:2000,y:0},{x:0,y:2500}]).length>0));
test('Duplicate adjacent vertices rejected',()=>assert(validateGeometry([...rect.slice(0,1),rect[0],...rect.slice(1)]).length>0));
test('Nonfinite coordinate rejected',()=>assert(validateGeometry([{x:NaN,y:0},...rect.slice(1)]).length>0));
test('Tiny and excessive footprints rejected',()=>{
  assert(validateGeometry(shapeOutline('rectangle',10,10)).length>0);
  assert(validateGeometry(shapeOutline('rectangle',31000,2500)).length>0);
});
test('Hole inside footprint accepted, exact net area',()=>{
  same(validateGeometry(rect,[squareHole]),[]);
  close(calculatePlan({...input,holes:[squareHole]},product).areaM2,9);
});
test('Touching and outside holes rejected',()=>{
  assert(validateGeometry(rect,[[{x:0,y:500},{x:500,y:500},{x:500,y:1000},{x:0,y:1000}]]).length>0);
  assert(validateGeometry(rect,[[{x:3500,y:500},{x:4500,y:500},{x:4500,y:1000},{x:3500,y:1000}]]).length>0);
});
test('Overlapping and nested holes rejected',()=>{
  assert(validateGeometry(rect,[squareHole,squareHole.map(p=>({x:p.x+500,y:p.y}))]).length>0);
  assert(validateGeometry(rect,[squareHole,[{x:1400,y:900},{x:1600,y:900},{x:1600,y:1100},{x:1400,y:1100}]]).length>0);
});
test('Exact scanline ribbon clipping subtracts cutouts',()=>{
  const parts=ribbonParts(rect,[squareHole],0,2500);
  close(parts.reduce((n,p)=>n+polygonArea(p),0),9000000);
});
test('Exact general polygon clipping including diagonal edges',()=>{
  const triangle=[{x:0,y:0},{x:4000,y:0},{x:0,y:2500}];
  close(ribbonParts(triangle,[],0,2500).reduce((n,p)=>n+polygonArea(p),0),5000000);
});
test('Missing rules gives visual geometry without fabricated quantities',()=>{
  const r=calculatePlan(input,{...product,installationRules:null});
  assert(r.valid&&r.boards.length>0&&r.materials.length===0&&r.joists.length===0&&r.stock.length===0);
  assert(r.technicalStatus==='unavailable'&&r.warnings.some(w=>w.code==='missing-rules'));
});
test('Missing product dimensions gives only exact footprint',()=>{
  const r=calculatePlan(input,{...product,widthMm:null});assert(r.boards.length===0&&r.materials.length===0);close(r.areaM2,10);
});
test('Product variant mismatch rejected',()=>assert(!calculatePlan({...input,variantId:'other'},product).valid));
test('Invalid numeric dimensions rejected',()=>{
  for(const altered of [{heightMm:NaN},{heightMm:29},{gapMm:-1},{reservePercent:51}]) assert(!calculatePlan({...input,...altered},product).valid);
});
test('Valid demo produces perpendicular single roost and truthful demo label',()=>{
  const r=calculatePlan(input,product);
  assert(r.valid&&r.technicalStatus==='demo'&&r.materials.length>0&&r.pedestals.length>0);
  assert(r.warnings.some(w=>w.code==='demo-rules'));
  assert(r.joists.every(j=>j.start.x===j.end.x&&j.start.y!==j.end.y));
  assert(r.boards.every(b=>b.start.y===b.end.y));
  assert(r.materials.every(m=>!m.verified));
});
test('All structural positions derive from same polygon and maintain pedestal span',()=>{
  const r=calculatePlan(input,product);
  r.joists.forEach(j=>{
    const p=r.pedestals.filter(p=>p.joistId===j.id).sort((a,b)=>a.y-b.y);
    close(p[0].y,j.start.y);close(p.at(-1)!.y,j.end.y);
    assert(p.every(x=>x.x===j.start.x));
    for(let i=1;i<p.length;i++)assert(p[i].y-p[i-1].y<=DEMO_RULES.maxPedestalSpacingMm+0.01);
  });
  assert(r.joistStock.length>0);
  r.joistStock.forEach(s=>close(s.lengthMm,s.cuts.reduce((sum,c)=>sum+c.lengthMm,0)+s.kerfMm+s.offcutMm));
});
test('Rotated laying direction swaps exact shared board and joist geometry',()=>{
  const r=calculatePlan({...input,orientation:'y'},product);
  assert(r.materials.length>0&&r.boards.every(b=>b.start.x===b.end.x)&&r.joists.every(j=>j.start.y===j.end.y));
});
test('L and U geometry produces valid orientational demo where supported',()=>{
  for(const shape of ['l','u'] as const){const r=calculatePlan({...input,outline:shapeOutline(shape,4000,2500)},product);
    assert(r.valid&&r.boards.length>0&&r.areaM2<10);
    assert(r.materials.length>0 || r.warnings.some(w=>w.code.startsWith('unsupported')));
  }
});
test('Cutout splits boards without bridging hole',()=>{
  const r=calculatePlan({...input,holes:[squareHole]},product);
  assert(r.valid&&r.boards.some(b=>b.end.x<2200)&&r.boards.some(b=>b.start.x>1200));
  r.boards.forEach(b=>b.footprintParts.forEach(p=>{
    const cx=p.reduce((n,v)=>n+v.x,0)/p.length,cy=p.reduce((n,v)=>n+v.y,0)/p.length;
    assert(!(cx>1200&&cx<2200&&cy>700&&cy<1700));
  }));
});
test('General diagonal geometry honestly refuses mounting and stock calculation',()=>{
  const r=calculatePlan({...input,outline:[{x:0,y:0},{x:4000,y:0},{x:0,y:2500}]},product);
  assert(r.valid&&r.boards.length>0&&r.materials.length===0&&r.technicalStatus==='unavailable');
  assert(r.warnings.some(w=>w.code==='unsupported-installation'));
});
test('Mounting gap and pedestal height outside selected rules give no BOM',()=>{
  assert(calculatePlan({...input,gapMm:2},product).materials.length===0);
  assert(calculatePlan({...input,heightMm:50},product).materials.length===0);
});
test('Incomplete rule profile never creates an orderable BOM',()=>{
  const r=calculatePlan(input,{...product,installationRules:{...DEMO_RULES,maxJoistSpacingMm:NaN}});
  assert(r.materials.length===0&&r.technicalStatus==='unavailable');
});
test('Unknown stock lengths disable BOM',()=>assert(calculatePlan(input,{...product,availableLengthsMm:[]}).materials.length===0));
test('Long board breaks only at paired real end joists and leaves joint gap',()=>{
  const r=calculatePlan({...input,outline:shapeOutline('rectangle',7000,2500)},product);
  assert(r.materials.length>0&&r.boards.some(b=>b.jointAfter)&&r.joists.some(j=>j.pairedAtJoint),JSON.stringify(r.warnings));
  assert(r.boards.every(b=>b.lengthMm<=4000));
  const row=r.boards.filter(b=>b.row===0).sort((a,b)=>a.start.x-b.start.x);
  for(let i=1;i<row.length;i++)close(row[i].start.x-row[i-1].end.x,DEMO_RULES.jointGapMm);
  row.forEach(b=>{
    if(b.jointAfter)assert(r.joists.some(j=>j.pairedAtJoint&&Math.abs(j.start.x-b.end.x+DEMO_RULES.joistWidthMm/2)<0.01));
  });
});
test('Forbidden butt joints refuse long cuts with explicit warning',()=>{
  const r=calculatePlan({...input,outline:shapeOutline('rectangle',7000,2500)},
    {...product,installationRules:{...DEMO_RULES,allowButtJoints:false}});
  assert(r.materials.length===0&&r.warnings.some(w=>w.code==='unsupported-joint'));
});
test('Stock packing is deterministic and maintains exact physical ledger',()=>{
  const cuts=[4100,1700,1700,2900,1000,1000].map((lengthMm,i)=>({boardId:`b${i}`,lengthMm}));
  const a=optimizeStock(cuts,[3000,4200],3,200,10),b=optimizeStock([...cuts].reverse(),[4200,3000],3,200,10);
  same(a,b);
  a.stock.forEach(s=>close(s.lengthMm,s.cuts.reduce((n,c)=>n+c.lengthMm,0)+s.kerfMm+s.offcutMm));
  assert(a.stock.some(s=>s.reserve));
});
test('Whole stock cut consumes zero saw loss, overlength cut remains unassigned',()=>{
  const a=optimizeStock([{boardId:'full',lengthMm:4000}],[4000],3,200);close(a.stock[0].kerfMm,0);
  const b=optimizeStock([{boardId:'over',lengthMm:4001}],[4000],3,200);assert(b.stock.length===0&&b.unassigned.length===1);
});
test('Reserve boards clearly separated from installation offcut and utilization',()=>{
  const a=calculatePlan(input,product),b=calculatePlan({...input,reservePercent:10},product);
  assert(b.totals.reserveBoards===Math.ceil(a.stock.length*0.1));
  close(a.totals.utilizationPercent!,b.totals.utilizationPercent!);
  close(a.totals.wasteMm,b.totals.wasteMm);
  assert(b.totals.purchasedLinearMetres>a.totals.purchasedLinearMetres);
});
test('Clockwise ring computes identical totals',()=>{
  const a=calculatePlan(input,product),b=calculatePlan({...input,outline:[...rect].reverse()},product);
  close(a.areaM2,b.areaM2);same(a.totals,b.totals);
});
test('Collinear extra vertex preserves polygon calculation',()=>{
  const r=calculatePlan({...input,outline:[rect[0],{x:2000,y:0},...rect.slice(1)]},product);
  assert(r.valid&&r.materials.length>0);close(r.areaM2,10);
});
test('Verified mounting profile marks source-dependent result, still asks expert review',()=>{
  const r=calculatePlan(input,{...product,status:'verified',installationRules:{...DEMO_RULES,verification:'verified',source:'Test fixture only'}});
  assert(r.technicalStatus==='verified'&&r.materials.every(m=>m.verified)&&r.warnings.some(w=>w.code==='technical-review'));
});
test('20 m terrace splits every long board on real paired supports',()=>{
  const r=calculatePlan({...input,outline:shapeOutline('rectangle',20000,3000)},product);
  assert(r.valid&&r.materials.length>0,JSON.stringify(r.warnings));
  assert(r.boards.length>80&&r.boards.every(b=>b.lengthMm<=4000&&b.lengthMm>=200));
  r.boards.filter(b=>b.jointAfter).forEach(b=>assert(r.joists.some(j=>j.pairedAtJoint&&Math.abs(j.start.x-b.end.x+25)<0.01)));
  r.stock.forEach(s=>close(s.lengthMm,s.cuts.reduce((n,c)=>n+c.lengthMm,0)+s.kerfMm+s.offcutMm));
});
test('Corner cutting through full board width refuses BOM rather than counting centre line',()=>{
  const r=calculatePlan({...input,holes:[squareHole]},product);
  assert(r.valid&&r.boards.length>0&&r.materials.length===0);
  assert(r.warnings.some(w=>w.code==='unsupported-notched-board'));
});
test('Aligned right angle cutout can retain straight board and support calculation',()=>{
  const aligned=[{x:1000,y:594},{x:2000,y:594},{x:2000,y:1470},{x:1000,y:1470}];
  const r=calculatePlan({...input,holes:[aligned]},product);
  assert(r.valid);
  // A validated mounting result, or a specific unsupported detail, is mandatory.
  assert(r.materials.length>0||r.warnings.some(w=>w.code.startsWith('unsupported')));
});
test('Narrow single ripped board disables ordinary mounting quantities',()=>{
  const r=calculatePlan({...input,outline:shapeOutline('rectangle',4000,55)},product);
  assert(r.materials.length===0&&r.warnings.some(w=>w.code==='unsupported-small-board'));
});
test('Perimeter offset collapsing a narrow neck refuses BOM',()=>{
  const outline=[{x:0,y:0},{x:1500,y:0},{x:1500,y:1100},{x:2500,y:1100},{x:2500,y:0},{x:4000,y:0},
    {x:4000,y:2500},{x:2500,y:2500},{x:2500,y:1300},{x:1500,y:1300},{x:1500,y:2500},{x:0,y:2500}];
  const r=calculatePlan({...input,outline}, {...product,installationRules:{...DEMO_RULES,perimeterGapMm:150}});
  assert(r.materials.length===0&&r.warnings.some(w=>w.code==='offset-collapse'));
});
test('Stock calculation after rotation remains auditable without using wrong axis',()=>{
  const r=calculatePlan({...input,orientation:'y',outline:shapeOutline('rectangle',3000,12000)},product);
  assert(r.valid&&r.materials.length>0,JSON.stringify(r.warnings));
  assert(r.boards.every(b=>b.start.x===b.end.x)&&r.joists.every(j=>j.start.y===j.end.y));
  r.stock.forEach(s=>close(s.lengthMm,s.cuts.reduce((n,c)=>n+c.lengthMm,0)+s.kerfMm+s.offcutMm));
});
test('Joist lengths exceeding verified stock produce explicit warning without BOM',()=>{
  const r=calculatePlan({...input,outline:shapeOutline('rectangle',4000,7000)},product);
  assert(r.materials.length===0&&r.technicalStatus==='unavailable');
  assert(r.warnings.some(w=>w.code==='unsupported-joist-length'||w.code==='unsupported-small-board'));
});
test('Support vectors never introduce a crossed second structural plane',()=>{
  const r=calculatePlan({...input,outline:shapeOutline('rectangle',12000,3000)},product);
  assert(r.joists.every(j=>j.start.x===j.end.x));
  r.joists.forEach(j=>{
    const points=r.pedestals.filter(p=>p.joistId===j.id);
    assert(points.every(p=>p.x===j.start.x&&p.y>=j.start.y&&p.y<=j.end.y));
  });
});
test('Seeded geometric property sweep: exact ribbon area, no cut crosses footprint',()=>{
  let seed=7291;
  const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<60;i++){
    const width=1000+Math.floor(rand()*10000),length=1000+Math.floor(rand()*3000);
    const outline=shapeOutline(i%3===0?'l':i%3===1?'u':'rectangle',width,length);
    close(ribbonParts(outline,[],0,length).reduce((n,p)=>n+polygonArea(p),0),polygonArea(outline),0.01);
    const r=calculatePlan({...input,outline},product);
    assert(r.valid);
    r.boards.forEach(b=>b.footprintParts.forEach(p=>{
      const mid={x:p.reduce((n,q)=>n+q.x,0)/p.length,y:p.reduce((n,q)=>n+q.y,0)/p.length};
      assert(pointInPolygon(mid,outline)!==-1);
    }));
    if(r.materials.length){assert(r.stock.every(s=>s.cuts.every(c=>c.lengthMm<=s.lengthMm+0.001)));}
    else assert(r.warnings.some(w=>w.code.startsWith('unsupported')||w.code==='offset-collapse'));
  }
});
test('Minimum offcut threshold and partial terminal kerf conserve stock exactly',()=>{
  const r=optimizeStock([{boardId:'a',lengthMm:3999}],[4000],3,200);
  close(r.stock[0].kerfMm,1);close(r.stock[0].offcutMm,0);
  const q=optimizeStock([{boardId:'a',lengthMm:3500}],[4000],3,500);
  assert(!q.stock[0].reusable);close(q.stock[0].offcutMm,497);
});
test('Fractional millimetre input is quantized once and conserves each stock ledger',()=>{
  const cuts=Array.from({length:20},(_,i)=>({boardId:`f${i}`,lengthMm:123.456789}));
  const r=optimizeStock(cuts,[3000],2.123456,200);
  r.stock.forEach(s=>close(s.lengthMm,s.cuts.reduce((sum,c)=>sum+c.lengthMm,0)+s.kerfMm+s.offcutMm));
});
test('Old projects default to concrete without mutating the original input',()=>{
  const before=JSON.stringify(input);const result=calculatePlan(input,product);
  assert(result.substrate==='concrete'&&result.materials.length>0);assert(JSON.stringify(input)===before);
});
test('Paving and soil retain exact visual geometry but refuse invented structural quantities',()=>{
  for(const substrate of ['paving','soil'] as const){
    const result=calculatePlan({...input,substrate},product);
    assert(result.valid&&result.substrate===substrate&&result.boards.length>0);
    assert(result.joists.length===0&&result.pedestals.length===0&&result.stock.length===0&&result.materials.length===0);
    assert(result.technicalStatus==='unavailable'&&result.warnings.some(w=>w.code==='unsupported-substrate'));
    close(result.areaM2,10);
  }
});
test('Project JSON keeps the selected substrate and reproduces its unsupported state',()=>{
  const project={...input,substrate:'soil' as const};
  const restored=JSON.parse(JSON.stringify(project)) as PlanInput;
  assert(restored.substrate==='soil');same(calculatePlan(project,product),calculatePlan(restored,product));
});
test('Implausibly narrow imported board rejects geometry before iterating thousands of strips',()=>{
  const result=calculatePlan({...input,outline:shapeOutline('rectangle',1000,30000)}, {...product,widthMm:1});
  assert(result.boards.length===0&&result.materials.length===0&&result.warnings.some(w=>w.code==='missing-dimensions'));
});
test('Malformed dense support rule cannot allocate millions of support objects',()=>{
  const result=calculatePlan(input,{...product,installationRules:{...DEMO_RULES,maxPedestalSpacingMm:0.01}});
  assert(result.joists.length===0&&result.pedestals.length===0&&result.materials.length===0);
  assert(result.warnings.some(w=>w.code==='incomplete-rules'));
});

let passed=0;const failures:{name:string;error:string}[]=[];
for(const t of tests){try{t.run();passed++;}catch(error){failures.push({name:t.name,error:String(error)});}}
console.log(JSON.stringify({suite:'terrace-engine',passed,failed:failures.length,failures},null,2));
if(failures.length)throw new Error(`${failures.length} terrace engine tests failed`);

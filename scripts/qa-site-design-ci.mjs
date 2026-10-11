import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {mkdir,readFile,writeFile,stat} from 'node:fs/promises';
import {resolve,dirname,join,extname,sep} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {chromium,webkit} from 'playwright';

// Visual contract for the FIXINGGROUP-inspired design system. All business and
// technical assertions still use the original, immutable stock/content sources.
const root=dirname(dirname(fileURLToPath(import.meta.url))),dist=join(root,'dist'),out=join(root,'qa/ci-site-design');
await mkdir(out,{recursive:true});
const protectedHashes={
  "src/data/jaf-stock-2026-10-10.json": "0f62ab6fade5c887a892c6bd34ff834f96c6f0742a00776b54e8219b19d44019",
  "src/data/jaf-stock-2026-10-10.csv": "d6263826527f857017413f6f07e7b9121c0ec62c87cddc6d0feaa49f1a803fe9",
  "src/commerce/catalog.ts": "7ac2fb6f22cb056655c79988ac812f786c9763a1d9f81a57f3f6b1536ff867ac",
  "src/commerce/stock-catalog.ts": "21050bff628c40b389afc4d6b7e721fe9488b3f3c2ff530f96337cda04960e47",
  "src/commerce/cart.tsx": "62e892f2e3c5a088b233eec49817b24cd40083d75a937bbe774dc0327262b1fc",
  "src/academy/manual.ts": "422eacec306d1ff5ab01b7930a4a36850d195d1ecab547858dfb06bf0902698c",
  "src/academy/library.ts": "9f156152e924a9da3dfcf04673e28b3947a7528874f8e7b746ceec85fc103d72",
  "src/academy/editorial.ts": "b2f54b589e4f4193d6ae63a69c272272c79bdca63f2b81d18244c80ad1e482d7",
  "src/academy/journeys.ts": "5228713ff1fad68d85320e25163ee9be81d0124679fe9493859d308b9fd1e097",
  "scripts/qa-stock-fixtures.json": "1b1042e2011a46d9decb8a6c7515e507cce0d8ef699453402ec81b497e82681b",
  "src/commerce/articles.ts": "d970c245ee267ae8c1068fa0a76a7a7c553a3db1f185b61db5b616bf5e92ef2c",
  "src/commerce/cart-core.ts": "667c0f3952649bb29e4012f5a6d4f94fb63d36545b3c9a77a348d9b47ac3651a",
  "src/planner/catalog-adapter.ts": "d31bd791fa278cd318987da79546623a904878c4e3838ab4a6a6fc51bd610632",
  "src/engine/calculate.ts": "c8a7c37fc81516bd2558c2eb974b067d3dd8c9ab8b8d7116060019a25b46cbb9",
  "src/engine/geometry.ts": "2b2278f970a871aef69312ddfc5ec394e4d8ff66ed25c471bbc32f0dfab4f44c",
  "src/engine/index.ts": "c3db61c3d9709ab18e3c7602c79036d79f9652547db4ff15dfae0c0b70759471",
  "src/engine/stock.ts": "f1dd34392b9fe0c260eb95058b5117c8fc108508765e8e3f258467fab8233602",
  "src/engine/types.ts": "9725073978d368aaac05cc044ab502729035ad9fcac46ce69c6490db9931b3a6",
  "src/planner/technical/calculate.ts": "afcc571899195e260cdddae557eed0232d010da40b7dcc9ffe5c986232ba29cd",
  "src/planner/technical/compare.ts": "4298486272799f570091c44fa9250157c7c3bfb59b7767bd9caeb31a36236fc5",
  "src/planner/technical/fasteners.ts": "137558391c5592d8f250ff297c9679016897b86c55ffc6ae6af39929f1ae221b",
  "src/planner/technical/options.ts": "b021160b9273aab71e9c41d646960da0e6d7c2255e44b3a1a9e6603dabd01234",
  "src/planner/technical/rapitec.ts": "839fc249c92859f95580f8dd418517c6f882f5ec09632e620495cafe94029ba1",
  "src/planner/technical/rules.ts": "1414b581de476a26de29a82128b6b1b26b36146b469968d854c43307554c5d7e",
  "src/planner/technical/sku-signatures.json": "3879f3df7bebd4145f4f8aae27633a2cace73525f862743869f00621e2b19663",
  "src/planner/technical/types.ts": "740e0baaa785a9680818ac83c0162ba03344206f6a8986d86d05a8707ae8f347"
};
const report={passed:false,base:'e74f095',guards:[],routes:[],interactions:[],screenshots:[],failures:[],pageErrors:[],consoleErrors:[]};
const stock=JSON.parse(await readFile(join(root,'src/data/jaf-stock-2026-10-10.json'),'utf8'));
const fixtures=JSON.parse(await readFile(join(root,'scripts/qa-stock-fixtures.json'),'utf8'));
assert.equal(stock.articles.length,137);assert.equal(new Set(fixtures.map(row=>row.productId)).size,83);
assert.equal(stock.articles.reduce((sum,row)=>sum+row.priceGrossCents,0),495999);
assert.equal(stock.articles.filter(row=>row.stockStatus==='Skladom do vypredania zásob').length,13);
for(const [file,expected] of Object.entries(protectedHashes)){const actual=createHash('sha256').update(await readFile(join(root,file))).digest('hex');assert.equal(actual,expected,'Locked source changed: '+file);report.guards.push({file,sha256:actual,unchanged:true})}
const plannerHint='Ťahaj zelené body · súradnice zadaj presne v paneli · šípky posúvajú o 10 mm';
assert.ok((await readFile(join(root,'src/Planner2027.tsx'),'utf8')).includes(plannerHint),'Existing planner guidance text remains unchanged');

// Read route fixtures from the same existing data layer. This QA-only bundle
// is never copied to dist/public and contains no independent technical rules.
const esbuild=await import('esbuild');
const dataBundle=await esbuild.build({stdin:{contents:"export {journeys} from './academy/journeys'; export {editorial} from './academy/editorial'; export {publications} from './academy/library'; export {articles} from './commerce/articles';",sourcefile:'site-qa-data.ts',resolveDir:join(root,'src'),loader:'ts'},absWorkingDir:root,tsconfigRaw:{compilerOptions:{}},write:false,bundle:true,platform:'node',format:'cjs',target:'node22',logLevel:'warning',plugins:[{name:'site-qa-data',setup(build){build.onResolve({filter:/^\./},async args=>{const target=resolve(args.resolveDir,args.path);for(const candidate of [target,target+'.ts',target+'.json',join(target,'index.ts')]){try{if((await stat(candidate)).isFile())return {path:candidate,namespace:'site-data'}}catch{}}return {errors:[{text:'Missing shared fixture '+target}]}});build.onLoad({filter:/.*/,namespace:'site-data'},async args=>({contents:await readFile(args.path,'utf8'),loader:args.path.endsWith('.json')?'json':'ts',resolveDir:dirname(args.path)}))}}]});
const bundlePath=join(out,'shared-route-fixtures.cjs');await writeFile(bundlePath,dataBundle.outputFiles[0].contents);
const imported=await import(pathToFileURL(bundlePath).href),{journeys,editorial,publications,articles}=imported.default??imported;
assert.equal(journeys.reduce((n,topic)=>n+topic.steps.length,0),39);assert.equal(editorial.length,10);assert.equal(publications.length,5); // Manual 04 is in manual.ts.
const products=[...new Map(fixtures.map(row=>[row.productId,row])).values()];
const board=fixtures.find(row=>row.articleNumber==='55990/2640');assert.ok(board);
const productRoute='/produkt/'+board.productId;
const routeSet=new Set(['/', '/2027','/terasove-dosky','/masivne-drevo','/thermowood','/wpc-terasy','/prislusenstvo','/planovac','/realizacie','/realizacia-na-kluc','/poradna','/o-nas','/kontakt','/kosik','/pokladna','/admin','/pravne-informacie','/pod-povrchom','/pod-povrchom/kniznica','/pod-povrchom/04-podkonstrukcie','/pod-povrchom/technicky-katalog','/pod-povrchom/technicky-katalog?article=55987%2F0230','/pod-povrchom?category=articles','/pod-povrchom?level=pro']);
for(const topic of journeys){routeSet.add('/pod-povrchom/sprievodca/'+topic.id);for(const step of topic.steps)routeSet.add('/pod-povrchom/sprievodca/'+topic.id+'?step='+step.id)}
for(const publication of publications)routeSet.add('/pod-povrchom/'+publication.slug);
for(const article of editorial)routeSet.add('/pod-povrchom/clanky/'+article.slug);
for(const article of articles)routeSet.add('/poradna/'+article.id);
for(const product of products)routeSet.add('/produkt/'+product.productId);
for(const detail of ['joint','orientation','head','end','air','frame','grain','assembly'])routeSet.add('/pod-povrchom/detaily?detail='+detail);
const routes=[...routeSet];report.routeInventory=routes;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.ttf':'font/ttf','.woff2':'font/woff2','.pdf':'application/pdf','.json':'application/json'};
const server=createServer(async(request,response)=>{try{let relative=decodeURIComponent(new URL(request.url,'http://localhost').pathname).replace(/^\/Drevene-terasy\/?/,'');if(!relative||relative.endsWith('/'))relative+='index.html';const file=resolve(dist,relative);if(!file.startsWith(dist+sep)||!(await stat(file)).isFile())throw Error('404');response.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');response.setHeader('Cache-Control','public,max-age=3600');response.end(await readFile(file))}catch{response.writeHead(404);response.end('Not found')}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port+'/Drevene-terasy/';
let browser;let latestPage;
const poll=async(read,expected)=>{let actual;for(let i=0;i<100;i++){actual=await read();if(actual===expected)return;await new Promise(r=>setTimeout(r,40))}assert.equal(actual,expected)};
async function check(name,operation){try{const result=await operation();report.interactions.push({name,passed:true,result});return result}catch(error){const filename='failure-'+(report.failures.length+1)+'.png';await latestPage?.screenshot({path:join(out,filename),fullPage:false}).catch(()=>{});report.failures.push({name,error:error.stack??error.message,screenshot:filename});console.error('SITE_DESIGN_FAIL '+name+' '+error.message);return null}}
async function open(page,route){await page.goto('about:blank');await page.goto(origin+'#'+route,{waitUntil:'domcontentloaded'});await page.locator('main').waitFor();await page.locator('h1').first().waitFor();await page.evaluate(()=>document.fonts.ready)}
async function appearance(page){return page.evaluate(()=>{
 const visible=el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'};
 const grayscale=el=>{for(let node=el;node instanceof Element;node=node.parentElement){const filter=getComputedStyle(node).filter;if(/grayscale\(\s*(?:1(?:\.0+)?|100%)\s*\)|saturate\(\s*0(?:%|\.0+)?\s*\)/.test(filter))return true}return false};
 const colors=text=>[...String(text).matchAll(/rgba?\(([^)]+)\)/g)].map(match=>match[1].replaceAll(',',' ').split(/[\s/]+/).filter(Boolean).slice(0,3).map(Number)).filter(channels=>channels.length===3&&channels.every(Number.isFinite));
 const neon=[],nonMonochrome=[];
 for(const el of [...document.querySelectorAll('body *')].filter(visible)){
  if(grayscale(el))continue;const s=getComputedStyle(el);
  for(const property of ['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','backgroundImage','fill','stroke','stopColor'])for(const [r,g,b] of colors(s[property]))if(r>=150&&g>=230&&b<=110&&g-r>=25)neon.push({tag:el.tagName,classes:String(el.className),property,color:s[property]});
 }
 for(const svg of [...document.querySelectorAll('svg')].filter(visible)){
  if(grayscale(svg))continue;
  for(const el of [svg,...svg.querySelectorAll('*')])for(const property of ['fill','stroke','stopColor']){const s=getComputedStyle(el);if(s[property]==='none'||s[property]==='transparent'||/^rgba\([^)]*,\s*0\)$/.test(s[property]))continue;for(const c of colors(s[property]))if(Math.max(...c)-Math.min(...c)>12)nonMonochrome.push({tag:el.tagName,classes:String(el.className),property,color:s[property],svg:svg.getAttribute('aria-label')??svg.getAttribute('aria-labelledby')})}
 }
 const headings=[...document.querySelectorAll('main h1,main h2,main h3')].filter(visible).map(el=>{const s=getComputedStyle(el);return {text:el.textContent.trim().slice(0,80),fontFamily:s.fontFamily,fontSize:s.fontSize,fontWeight:s.fontWeight,lineHeight:s.lineHeight,transform:s.transform,color:s.color}});
 const style=getComputedStyle(document.documentElement),body=getComputedStyle(document.body);
 return {overflow:document.documentElement.scrollWidth-innerWidth,mains:document.querySelectorAll('main').length,h1:document.querySelectorAll('main h1').length,body:{fontFamily:body.fontFamily,fontSize:body.fontSize,color:body.color,background:body.backgroundColor},tokens:Object.fromEntries(['--ds-paper','--ds-ink','--ds-font','--ds-accent','--ds-line','--ds-muted'].map(key=>[key,style.getPropertyValue(key).trim()])),headings,neon:neon.slice(0,16),nonMonochrome:nonMonochrome.slice(0,16),brokenImages:[...document.images].filter(img=>img.complete&&!img.naturalWidth).map(img=>img.src)};
})}
async function assertAppearance(page,label){const result=await appearance(page);assert.ok(result.overflow<=1,'Page overflow '+label+': '+result.overflow);assert.equal(result.mains,1,label+' main landmark');assert.equal(result.h1,1,label+' main heading');assert.deepEqual(result.brokenImages,[],label+' loaded images');assert.ok(result.tokens['--ds-paper']&&result.tokens['--ds-ink'],label+' central design tokens');assert.deepEqual(result.neon,[],label+' has no visible neon lime');assert.deepEqual(result.nonMonochrome,[],label+' technical SVG is monochrome');for(const heading of result.headings){assert.doesNotMatch(heading.fontFamily,/DT Anton|Impact/i,label+' uses the new heading typography');assert.equal(heading.transform,'none',label+' headings are not skewed');}return result}
async function shot(page,width,view){await page.screenshot({path:join(out,width+'-'+view+'.png'),fullPage:true,animations:'disabled'});report.screenshots.push({width,view,path:'qa/ci-site-design/'+width+'-'+view+'.png'});if(process.env.SITE_DESIGN_REVIEW_EXPORT==='1'&&[320,402,1440].includes(width)){const b=(await page.screenshot({type:'jpeg',quality:68,animations:'disabled'})).toString('base64');for(let offset=0;offset<b.length;offset+=16000)console.log('SITE_DESIGN_'+width+'_'+view.toUpperCase()+':'+b.slice(offset,offset+16000))}}
const shotRoutes=new Map([['/','home'],['/terasove-dosky','catalog'],[productRoute,'detail'],['/planovac','planner'],['/pod-povrchom','academy'],['/pod-povrchom/sprievodca/podkonstrukcia?step=celne-spoje','guide'],['/pod-povrchom/clanky/cumaru-vs-ipe','article']]);
try{
 for(const [name,engine,width,height] of [['320',chromium,320,900],['375',chromium,375,900],['402-webkit',webkit,402,874],['430',chromium,430,932],['768',chromium,768,1080],['1440',chromium,1440,1080],['1920',chromium,1920,1080]]){
  browser=await engine.launch({headless:true,...(engine===chromium?{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}: {})});
  const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<900,locale:'sk-SK',reducedMotion:'reduce',acceptDownloads:true});const page=await context.newPage();latestPage=page;page.setDefaultTimeout(15_000);
  page.on('pageerror',error=>report.pageErrors.push({name,url:page.url(),message:error.message}));page.on('console',message=>{if(message.type()==='error')report.consoleErrors.push({name,url:page.url(),message:message.text()})});
  for(const route of routes)await check(name+' layout '+route,async()=>{
   await open(page,route);const result=await assertAppearance(page,name+' '+route);
   if(route.includes('/sprievodca/'))assert.equal(await page.getByTestId('guide-step').count(),1);
   if(route===productRoute)assert.ok((await page.locator('h1').innerText()).includes(board.productName));
   if(shotRoutes.has(route)){await shot(page,width,shotRoutes.get(route));console.log('SITE_DESIGN_METRICS '+JSON.stringify({viewport:name,route,body:result.body,tokens:result.tokens,headings:result.headings.slice(0,5)}))}
   report.routes.push({name,width,route,passed:true,overflow:result.overflow});return {overflow:result.overflow};
  });
  if(width<500)await check(name+' mobile menu, focus and monochrome controls',async()=>{
   await open(page,'/');const menu=page.getByTestId('homepage-menu');await menu.click();const nav=page.getByTestId('homepage-nav');await nav.waitFor();assert.equal(await nav.getAttribute('role'),'dialog');assert.equal(await menu.getAttribute('aria-expanded'),'true');await assertAppearance(page,name+' menu');await shot(page,width,'menu');
   const controls=nav.locator('a[href],button:not([disabled])');await controls.last().focus();await page.keyboard.press('Tab');assert.equal(await controls.first().evaluate(el=>document.activeElement===el),true);await page.keyboard.press('Escape');await poll(()=>nav.count(),0);assert.equal(await menu.evaluate(el=>document.activeElement===el),true);
  });
  await check(name+' product, cart and disabled real payments',async()=>{
   await open(page,productRoute);await page.getByTestId('product-variant').selectOption(board.variantId);await page.getByTestId('product-quantity').fill('3');await page.getByTestId('product-add-cart').click();
   await open(page,'/kosik');assert.equal(await page.getByTestId('cart-row').count(),1);assert.ok((await page.getByTestId('cart-row').innerText()).includes(board.articleNumber));assert.match(await page.getByTestId('cart-row').locator('strong').innerText(),/69,36/);await assertAppearance(page,name+' populated cart');await page.getByRole('spinbutton').first().fill('5');await page.reload();await poll(()=>page.getByRole('spinbutton').first().inputValue(),'5');
   await open(page,'/pokladna');assert.equal(await page.getByTestId('checkout-export').count(),1);assert.equal(await page.getByRole('button',{name:/Zaplatiť|Záväzne objednať/}).count(),0);await assertAppearance(page,name+' populated checkout');
  });
  await check(name+' planner geometry and retained explanatory text',async()=>{
   await open(page,'/planovac');assert.equal(Number(await page.getByTestId('planner-sync').getAttribute('data-area')),10);assert.equal(await page.locator('.planner-editor-hint').innerText(),plannerHint);
   await page.getByRole('button',{name:'02 Rozmery'}).click();await page.getByTestId('planner-length').fill('5000');await poll(()=>page.getByTestId('planner-sync').getAttribute('data-area'),'12.5');
   await page.getByRole('button',{name:'04 Konštrukcia'}).click();await page.getByTestId('planner-orientation').selectOption('y');await assertAppearance(page,name+' planner orientation');
   await page.getByTestId('planner-3d').click();const scene=page.getByTestId('planner-scene');await scene.waitFor();await poll(()=>scene.getAttribute('data-board-count'),await page.getByTestId('planner-sync').getAttribute('data-boards'));await page.getByTestId('planner-2d').click();await page.getByTestId('plan-editor').waitFor();return {area:12.5,synchronized:true};
  });
  if(width===1440)await check('All 137 displayed product variants retain price/article/status',async()=>{
   let variants=0;
   for(const product of products){await open(page,'/produkt/'+product.productId);const rows=fixtures.filter(row=>row.productId===product.productId);const selector=page.getByTestId('product-variant');assert.equal(await selector.locator('option').count(),rows.length);
    for(const row of rows){await selector.selectOption(row.variantId);await poll(()=>page.locator('.platform-article-meta').innerText().then(text=>text.includes(row.articleNumber)),true);const expectedPrice=new Intl.NumberFormat('sk-SK',{style:'currency',currency:'EUR'}).format(row.priceGross).replace(/\s/g,' ');assert.ok((await page.locator('.platform-price').innerText()).replace(/\s/g,' ').includes(expectedPrice),'Gross price '+row.articleNumber);const article=stock.articles.find(a=>a.article===row.articleNumber);assert.ok((await page.getByTestId('stock-program-status').innerText()).includes(article.stockStatus));variants++}
   }assert.equal(variants,137);return {variants,products:products.length};
  });
  // The indexable, no-JavaScript documents receive exactly the same visual DS.
  const staticContext=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<900,locale:'sk-SK',javaScriptEnabled:false});
  const staticPage=await staticContext.newPage();latestPage=staticPage;staticPage.setDefaultTimeout(15_000);
  for(const topic of journeys)for(const step of topic.steps)await check(name+' static '+topic.id+'/'+step.id,async()=>{
   const suffix='academy-guides/'+topic.id+'/'+step.id+'/';const response=await staticPage.goto(origin+suffix+'index.html',{waitUntil:'networkidle'});assert.equal(response.status(),200);await poll(()=>staticPage.evaluate(()=>{const s=getComputedStyle(document.documentElement);return Boolean(s.getPropertyValue('--ds-paper').trim()&&s.getPropertyValue('--ds-ink').trim())}),true);
   const result=await assertAppearance(staticPage,name+' static '+topic.id+'/'+step.id);assert.ok((await staticPage.locator('main').innerText()).length>250);assert.ok(await staticPage.locator('.sources p').count()>0);assert.equal(await staticPage.locator('link[rel="canonical"]').getAttribute('href'),'https://martinfabian-pixel.github.io/Drevene-terasy/'+suffix);
   report.routes.push({name,width,route:suffix,static:true,passed:true,overflow:result.overflow});return {withoutJavaScript:true};
  });await staticContext.close();latestPage=page;
  for(const id of ['01','02','03','04','05','06'])await check(name+' preserved PDF '+id,async()=>{const response=await context.request.get(origin+'manuals/pod-povrchom-'+id+'.pdf');assert.equal(response.status(),200);assert.equal((await response.body()).subarray(0,5).toString(),'%PDF-');return {status:200}});
  await browser.close();browser=null;
 }
 await check('No runtime regression',async()=>{assert.deepEqual(report.pageErrors,[]);assert.deepEqual(report.consoleErrors.filter(row=>!/webgl|swiftshader|gpu process|context[_ ]lost|failed to create.*context/i.test(row.message)),[])});
 report.passed=report.failures.length===0;console.log('SITE_DESIGN_SUMMARY '+JSON.stringify({passed:report.passed,uniqueRoutes:routes.length,layouts:report.routes.length,checks:report.interactions.length,lockedFiles:report.guards.length,failures:report.failures},null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));await writeFile(join(out,'report.json'),JSON.stringify(report,null,2));if(!report.passed)process.exitCode=1}

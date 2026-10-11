import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

// Run after the production build and qa-academy-ci.mjs. The latter generates
// the six unchanged complete A4 manuals before this guide-only browser suite.
const dist=resolve('dist'),out=resolve('qa/ci-academy-guide');
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{
 try{
  const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/Drevene-terasy\/?/,'');
  const path=resolve(dist,requested||'index.html');
  if(!path.startsWith(dist+sep)||!(await stat(path)).isFile())throw Error('404');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.pdf':'application/pdf','.ttf':'font/ttf','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[extname(path)]||'application/octet-stream');
  res.end(await readFile(path));
 }catch{res.writeHead(404);res.end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port+'/Drevene-terasy/';
const root='#/pod-povrchom',topicRoute=topic=>root+'/sprievodca/'+topic;
const report={checks:[],scenarios:[],errors:[],screenshots:[],pdf:[],staticPages:[]};
const expectedTopics={
 drevo:['vyber','drevo-wpc','cumaru-ipe','rez','povrch','dalsi-krok'],
 terasa:['zameranie','material','podklad','skladba','rost','kotvenie','dilatacie','kontrola'],
 podkonstrukcia:['vrstvy','drevo-hlinik','orientacia','celne-spoje','voda-vzduch','zhrnutie'],
 kotvenie:['ocel','rozmer','drevo-alu','poloha','hlava','skryte'],
 wpc:['system','pohyb','nosnost','voda'],
 chyby:Array.from({length:9},(_,i)=>'chyba-'+i),
};
const poll=async(read,expected,message)=>{
 let actual;
 for(let i=0;i<80;i++){actual=await read();if(actual===expected)return;await new Promise(r=>setTimeout(r,50))}
 assert.equal(actual,expected,message);
};
const noOverflow=async(page,label)=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Page overflow: '+label);
const stepId=page=>page.getByTestId('guide-step').getAttribute('data-step');
const waitGuide=async(page,topic,id)=>{
 await page.getByTestId('guide-screen').waitFor();
 await poll(()=>page.getByTestId('guide-screen').getAttribute('data-topic'),topic,'Stable topic URL');
 await poll(()=>page.getByTestId('guide-step').count(),1,'Only one rendered step');
 if(id)await poll(()=>stepId(page),id,'Direct step URL');
};
const navProgress=async(page)=>{
 const progress=page.getByTestId('guide-progress');
 const current=Number(await progress.getAttribute('data-current'));
 const total=Number(await progress.getAttribute('data-total'));
 assert.ok(Number.isInteger(current)&&Number.isInteger(total)&&current>=1&&total>=current,'Progress has current and total');
 return {current,total};
};
const shot=async(page,name,view)=>{
 await page.evaluate(()=>document.fonts.ready);
 const path=resolve(out,name+'-'+view+'.png');
 await page.screenshot({path,fullPage:true});report.screenshots.push({name,view,path:'qa/ci-academy-guide/'+name+'-'+view+'.png'});
 if(process.env.ACADEMY_GUIDE_REVIEW_EXPORT==='1'&&['320','iphone-webkit','desktop'].includes(name)){
  const b=(await page.screenshot({type:'jpeg',quality:68})).toString('base64');
  for(let offset=0;offset<b.length;offset+=16000)console.log('GUIDE_SCREEN_'+name+'_'+view+':'+b.slice(offset,offset+16000));
 }
};
const accessibility=async(page,label)=>{
 const problems=await page.getByTestId('guide-screen').evaluate(el=>{
  const visible=node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'};
  return [...el.querySelectorAll('button,a[href],input,select,summary')].filter(visible).flatMap(node=>{
   const name=node.getAttribute('aria-label')||node.getAttribute('title')||node.textContent?.trim()||(node instanceof HTMLInputElement?node.labels?.[0]?.textContent:'');
   const failures=[];
   if(!name)failures.push('Control without accessible name: '+node.outerHTML.slice(0,180));
   if(node.getAttribute('tabindex')==='-1')failures.push('Unexpected negative tabindex: '+name);
   return failures;
  });
 });
 assert.deepEqual(problems,[],label+' accessible names');
 const step=page.getByTestId('guide-step');
 assert.ok((await step.innerText()).trim().length>25,label+' contains readable text');
 assert.equal(await page.getByTestId('guide-visual').count(),1,label+' has one dominant visual');
 const svg=page.getByTestId('guide-visual').locator('svg[role="img"]');
 if(await svg.count())for(const image of await svg.all())assert.ok((await image.getAttribute('aria-label'))||(await image.locator('title').count()),label+' SVG accessible description');
 const visual=await page.getByTestId('guide-visual').boundingBox();
 assert.ok(visual&&visual.width>=180&&visual.height>=130,label+' visual is large enough to inspect');
};
const technicalDisclosure=async(page,label)=>{
 const detail=page.getByTestId('guide-technical');
 assert.equal(await detail.count(),1,label+' has optional technical detail');
 assert.equal(await detail.getAttribute('open'),null,label+' starts without mandatory professional choice');
 const summary=detail.locator('summary');await summary.focus();await page.keyboard.press('Enter');
 await poll(()=>detail.getAttribute('open'),'');
 assert.ok((await detail.innerText()).length>50,label+' detail retains technical text or documentation');
 await page.keyboard.press('Enter');await poll(()=>detail.getAttribute('open'),null);
};
const testMainInteraction=async(page)=>{
 const visual=page.getByTestId('guide-visual');
 assert.ok(await visual.locator('.academy-segment,.ag-reveal').count()<=1,'One primary visual interaction per step');
 const alternatives=visual.locator('.academy-segment button');
 if(await alternatives.count()>=2){
  const selected=visual.locator('.ag-selected-material');
  const initialSelection=await selected.count()?await selected.innerText():null;
  await alternatives.nth(1).click();await poll(()=>alternatives.nth(1).getAttribute('aria-pressed'),'true');
  if(initialSelection!==null)await poll(()=>selected.innerText().then(text=>text!==initialSelection),true,'Material comparison updates the exact selected article');
  await alternatives.nth(0).click();await poll(()=>alternatives.nth(0).getAttribute('aria-pressed'),'true');
  if(initialSelection!==null)await poll(()=>selected.innerText(),initialSelection,'Material comparison restores the original article');
 }
 const reveal=visual.locator('.ag-reveal');
 if(await reveal.count()){
  assert.equal(await reveal.getAttribute('aria-pressed'),'false');
  assert.equal(await visual.locator('[data-layer="Dosky"]').count(),1);
  await reveal.click();await poll(()=>reveal.getAttribute('aria-pressed'),'true');
  await poll(()=>visual.locator('[data-layer="Dosky"]').count(),0);
  await reveal.click();await poll(()=>reveal.getAttribute('aria-pressed'),'false');
  await poll(()=>visual.locator('[data-layer="Dosky"]').count(),1);
 }
 const layers=visual.locator('.au-layer-disclosure');
 if(await layers.count()){
  await layers.locator('summary').click();const first=layers.getByRole('checkbox').first();
  const layer=await first.evaluate(el=>el.parentElement.textContent.trim());
  await first.uncheck();await poll(()=>visual.locator('[data-layer="'+layer+'"]').count(),0);
  await first.check();await poll(()=>visual.locator('[data-layer="'+layer+'"]').count(),1);
  await layers.locator('summary').click();
 }
 const zoom=visual.getByRole('button',{name:/Zväčšiť detail/});
 if(await zoom.count()){
  await zoom.click();const dialog=page.getByRole('dialog');await dialog.waitFor();
  assert.equal(await dialog.locator('svg').count(),1);
  const slider=dialog.getByRole('slider');await slider.focus();await page.keyboard.press('End');
  await poll(()=>dialog.innerText().then(s=>s.includes('300 %')),true);
  await page.keyboard.press('Escape');await poll(()=>dialog.count(),0);
  await poll(()=>zoom.evaluate(el=>document.activeElement===el),true,'Zoom returns focus');
 }
};
let browser;
try{
 for(const [name,engine,width,height] of [['320',chromium,320,740],['small-mobile',chromium,375,812],['iphone-webkit',webkit,402,874],['large-mobile',chromium,430,932],['desktop',chromium,1440,1000]]){
  browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500,reducedMotion:'reduce',acceptDownloads:true,locale:'sk-SK'});
  const page=await context.newPage();page.on('pageerror',e=>report.errors.push(name+': '+e.message));
  await page.goto(origin+root);await page.getByTestId('guide-entry').first().waitFor();
  const entries=page.getByTestId('guide-entry');assert.equal(await entries.count(),4,'Home exposes exactly four problem-oriented paths');
  const entryLinks=await entries.evaluateAll(els=>els.map(el=>el.getAttribute('href')));
  assert.ok(entryLinks.some(h=>h?.includes('/sprievodca/drevo')));
  assert.ok(entryLinks.some(h=>h?.includes('/sprievodca/terasa')));
  assert.ok(entryLinks.some(h=>h?.includes('/sprievodca/chyby')));
  assert.ok(entryLinks.some(h=>h?.includes('/kniznica')));
  assert.equal(await page.locator('.au-manual-tile,.au-article-list,.au-catalog-list').count(),0,'Home does not dump library documentation');
  assert.ok((await page.locator('main').innerText()).includes('Rozumieme drevu. Od prvého návrhu až po posledný detail montáže.'));
  await noOverflow(page,name+' home');await shot(page,name,'home');

  // A: First-time visitor can begin the terrace path directly from the home.
  await entries.filter({hasText:'Postaviť terasu'}).click();
  await waitGuide(page,'terasa');const firstTerrace=await stepId(page);
  assert.equal((await navProgress(page)).current,1);assert.equal(await page.getByTestId('guide-back').isDisabled(),true);
  await page.getByTestId('guide-next').click();await poll(()=>stepId(page).then(id=>id!==firstTerrace),true);
  await page.goBack();await waitGuide(page,'terasa',firstTerrace);
  report.scenarios.push({viewport:name,id:'A',passed:true,path:'Home → Postaviť terasu → first step → next → browser back'});

  const topicHistory={};
  for(const [topic,expected] of Object.entries(expectedTopics)){
   await page.goto(origin+topicRoute(topic));await waitGuide(page,topic);
   const visited=[],urls=[];const initial=await navProgress(page);assert.equal(initial.current,1);
   for(let index=1;index<=initial.total;index++){
    const id=await stepId(page);assert.ok(id&&!visited.includes(id),'Unique step in '+topic);visited.push(id);urls.push(page.url());
    const progress=await navProgress(page);assert.equal(progress.current,index);assert.equal(progress.total,initial.total);
    assert.equal(await page.getByTestId('guide-step').count(),1,'Next step never appends content');
    await accessibility(page,name+' '+topic+' '+id);await noOverflow(page,name+' '+topic+' '+id);
    await technicalDisclosure(page,topic+' '+id);
    await testMainInteraction(page);
    assert.equal(await page.getByTestId('guide-back').isDisabled(),index===1);
    const next=page.getByTestId('guide-next');assert.equal(await next.isDisabled(),index===initial.total);
    if(index<initial.total){await next.click();await poll(()=>stepId(page).then(s=>s!==id),true);await page.waitForURL(u=>u.hash.includes('step='));}
   }
   for(const required of expected)assert.ok(visited.includes(required),'Required existing-content step '+topic+'/'+required);
   topicHistory[topic]={visited,urls};
   // Reload preserves the final URL, content and progress instead of resetting.
   const finalId=visited.at(-1);await page.reload();await waitGuide(page,topic,finalId);assert.equal((await navProgress(page)).current,visited.length);
  }
  assert.equal(Object.values(topicHistory).reduce((n,t)=>n+t.visited.length,0),39,'All 39 source-driven guide steps');

  // B and E: Direct mobile deep link, double joist explanation, history and reload.
  await page.goto(origin+topicRoute('podkonstrukcia')+'?step=celne-spoje');await waitGuide(page,'podkonstrukcia','celne-spoje');
  assert.ok((await page.getByTestId('guide-step').innerText()).toLowerCase().includes('kon'));
  await noOverflow(page,name+' direct joint');await shot(page,name,'joint');await testMainInteraction(page);
  const directURL=page.url(),directProgress=await navProgress(page);await page.getByTestId('guide-next').click();await poll(()=>stepId(page).then(id=>id!=='celne-spoje'),true);const afterId=await stepId(page);
  await page.goBack();await waitGuide(page,'podkonstrukcia','celne-spoje');assert.equal(page.url(),directURL);
  await page.goForward();await waitGuide(page,'podkonstrukcia',afterId);await page.reload();await waitGuide(page,'podkonstrukcia',afterId);
  await page.getByTestId('guide-back').click();await waitGuide(page,'podkonstrukcia','celne-spoje');assert.equal((await navProgress(page)).current,directProgress.current);
  report.scenarios.push({viewport:name,id:'B',passed:true,path:'Direct podkonstrukcia/celne-spoje → technical illustration and optional source detail'});
  report.scenarios.push({viewport:name,id:'E',passed:true,path:'Direct step → next → browser back/forward → reload → guide back',engine:engine===webkit?'WebKit':'Chromium'});

  // D: User need is answered in one step, not by searching ten articles.
  await page.goto(origin+topicRoute('drevo')+'?step=cumaru-ipe');await waitGuide(page,'drevo','cumaru-ipe');
  const comparison=await page.getByTestId('guide-step').innerText();assert.match(comparison,/Cumaru/i);assert.match(comparison,/Ipé|Ipe/i);
  await shot(page,name,'comparison');await noOverflow(page,name+' comparison');
  await testMainInteraction(page);
  await technicalDisclosure(page,'Cumaru / Ipé');
  report.scenarios.push({viewport:name,id:'D',passed:true,path:'Vybrať správne drevo → Cumaru / Ipé step → optional technical detail'});

  // C: Complete library remains separate and points to the exact shared SKU.
  await page.goto(origin+root+'/kniznica');await page.locator('.au-portal').waitFor();assert.equal(await page.locator('.au-manual-tile').count(),6);
  await page.getByRole('button',{name:/Rady a skúsenosti/}).click();await poll(()=>page.locator('.au-article-list>a').count(),10);
  await page.getByRole('link',{name:/Technický katalóg/}).last().click();await page.locator('.au-catalog-list').waitFor();
  assert.equal(await page.locator('.au-catalog-list>button').count(),51);assert.equal(await page.locator('.au-catalog-list>button').filter({hasText:'Neoverené'}).count(),8);
  await page.locator('input[type="search"]').fill('55987/0230');await poll(()=>page.locator('.au-catalog-list>button').count(),1);
  await page.locator('.au-catalog-list>button').click();const inspector=page.getByTestId('rule-inspector');await inspector.waitFor();
  assert.match(await inspector.innerText(),/450 mm/);assert.equal(await inspector.locator('dl>div').count(),17);
  const planner=await inspector.getByRole('link',{name:'Plánovať 55987/0230'}).getAttribute('href');assert.ok(planner.includes('product=')&&planner.includes('&variant='));
  await noOverflow(page,name+' technical SKU');report.scenarios.push({viewport:name,id:'C',passed:true,path:'Technická knižnica → exact SKU 55987/0230 → shared 450 mm rule, 17 fields and exact planner variant'});
  for(const id of ['01','02','03','04','05','06']){
   const response=await context.request.get(origin+'manuals/pod-povrchom-'+id+'.pdf');assert.equal(response.status(),200,'Existing PDF '+id);assert.equal((await response.body()).subarray(0,5).toString(),'%PDF-');
   if(name==='desktop')report.pdf.push({id,status:response.status(),bytes:(await response.body()).length});
  }
  if(name==='desktop'){
   const staticContext=await browser.newContext({viewport:{width:375,height:812},javaScriptEnabled:false,locale:'sk-SK'});
   const staticPage=await staticContext.newPage();
   await staticPage.goto(origin);assert.ok(await staticPage.locator('#academy-static-fallback').isVisible(),'No-JavaScript application entry links to readable guides');
   assert.ok((await staticPage.locator('#academy-static-fallback a').getAttribute('href')).includes('/academy-guides/'));
   for(const [topic,{visited}] of Object.entries(topicHistory)){
    for(let index=0;index<visited.length;index++){
     const id=visited[index],suffix='academy-guides/'+topic+'/'+id+'/';
     const response=await staticPage.goto(origin+suffix+'index.html');assert.equal(response.status(),200,'Static direct URL '+topic+'/'+id);
     assert.equal(await staticPage.locator('html').getAttribute('lang'),'sk');
     assert.equal(await staticPage.locator('main h1').count(),1);
     assert.ok((await staticPage.locator('main').innerText()).length>250,'Readable content without JavaScript');
     assert.ok(await staticPage.locator('.sources p').count()>0,'Sources remain readable without interactions');
     assert.ok(await staticPage.locator('.technical p').count()>0,'Complete technical content remains indexable');
     assert.equal(await staticPage.locator('link[rel="canonical"]').getAttribute('href'),'https://martinfabian-pixel.github.io/Drevene-terasy/'+suffix);
     assert.equal(await staticPage.locator('.stepnav a[rel="prev"]').count(),index>0?1:0);
     assert.equal(await staticPage.locator('.stepnav a[rel="next"]').count(),index<visited.length-1?1:0);
     if(index>0)assert.ok((await staticPage.locator('.stepnav a[rel="prev"]').getAttribute('href')).endsWith('/'+visited[index-1]+'/'));
     if(index<visited.length-1)assert.ok((await staticPage.locator('.stepnav a[rel="next"]').getAttribute('href')).endsWith('/'+visited[index+1]+'/'));
     assert.ok((await staticPage.locator('a[href*="/sprievodca/"]').getAttribute('href')).includes('step='+id),'Static page links to exact interactive step');
     assert.equal(await staticPage.locator('script:not([type="application/ld+json"])').count(),0,'No executable JavaScript required by static guide');
     await noOverflow(staticPage,'static '+topic+'/'+id);report.staticPages.push({topic,id,withoutJavaScript:true,passed:true});
    }
   }
   const sitemap=await context.request.get(origin+'academy-guides/sitemap.xml');assert.equal(sitemap.status(),200);assert.equal(((await sitemap.text()).match(/<loc>/g)||[]).length,46);
   await staticContext.close();
  }
  report.checks.push({name,width,height,engine:engine===webkit?'WebKit':'Chromium',passed:true,topics:topicHistory,features:['four task entries','single-step DOM','deep links','progress','next/back','browser history','reload','optional technical disclosure','SVG interaction and zoom','library retained','exact SKU and planner link','six PDF URLs','accessible control names','page overflow']});
  await browser.close();browser=null;
 }
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report,null,2));
}finally{
 await browser?.close();server.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
}

import {createServer} from 'node:http';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
const dist=resolve('dist'),out=resolve('qa/ci-academy');
await mkdir(out,{recursive:true});await mkdir(resolve(dist,'manuals'),{recursive:true});
const server=createServer(async(req,res)=>{try{const path=resolve(dist,decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/Drevene-terasy\/?/,'')||'index.html');if(!path.startsWith(dist+sep)||!(await stat(path)).isFile())throw Error('404');res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.pdf':'application/pdf','.ttf':'font/ttf','.woff2':'font/woff2','.webp':'image/webp'})[extname(path)]||'application/octet-stream');res.end(await readFile(path));}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const origin='http://127.0.0.1:'+server.address().port+'/Drevene-terasy/';
const route='#/pod-povrchom/04-podkonstrukcie';
const report={checks:[],errors:[],pdf:{}};
let browser;
try{
 browser=await chromium.launch({headless:true});
 const pdfPage=await browser.newPage({locale:'sk-SK'});await pdfPage.goto(origin+route+'?print=1');await pdfPage.getByTestId('academy-manual').waitFor();await pdfPage.evaluate(()=>document.fonts.ready);
 assert.equal(await pdfPage.locator('tbody tr').count(),51);
 await pdfPage.evaluate(()=>{for(const anchor of document.querySelectorAll('a[href]')){if(anchor instanceof HTMLAnchorElement && anchor.origin===location.origin)anchor.href=anchor.href.replace(location.origin,'https://martinfabian-pixel.github.io');}});
 await pdfPage.locator('input[type=date]').evaluate(el=>{el.type='text';el.placeholder='DD. MM. RRRR';});
 const pdfPath=resolve(dist,'manuals/pod-povrchom-04.pdf');
 await pdfPage.pdf({path:pdfPath,format:'A4',printBackground:true,preferCSSPageSize:true,displayHeaderFooter:true,headerTemplate:'<div></div>',footerTemplate:'<div style="font-size:8px;width:100%;padding:0 15mm;color:#444;display:flex;justify-content:space-between"><span>DREVENÉ TERASY / POD POVRCHOM / 04 · 2026-10-11.1</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',tagged:true,outline:true});
 const bytes=await readFile(pdfPath);assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>30000);report.pdf={bytes:bytes.length,path:'manuals/pod-povrchom-04.pdf',source:'Actual production manual, professional level, all SKU rows, SVG diagrams'};
 if(process.env.ACADEMY_REVIEW_EXPORT==='1'){const encoded=bytes.toString('base64');for(let offset=0;offset<encoded.length;offset+=16000)console.log('ACADEMY_PDF_CHUNK:'+encoded.slice(offset,offset+16000));}
 await pdfPage.close();await browser.close();browser=null;
 for(const [name,engine,width,height] of [['small-mobile',chromium,375,812],['iphone-webkit',webkit,402,874],['tablet',chromium,820,1180],['desktop',chromium,1440,1000],['wide',chromium,1920,1080]]){
  browser=await engine.launch({headless:true});const context=await browser.newContext({viewport:{width,height},hasTouch:width<900,isMobile:width<500,reducedMotion:'reduce',acceptDownloads:true});const page=await context.newPage();page.on('pageerror',e=>report.errors.push(name+': '+e.message));
  await page.goto(origin+'#/pod-povrchom');await page.getByRole('heading',{name:/POVRCHOM/}).waitFor();assert.equal(await page.locator('.academy-library article').count(),6);await page.getByRole('link',{name:'OTVORIŤ MANUÁL ↗'}).click();await page.getByTestId('academy-manual').waitFor();
  if(process.env.ACADEMY_REVIEW_EXPORT==='1'&&['small-mobile','desktop'].includes(name)){const shot=await page.screenshot({type:'jpeg',quality:65});console.log('ACADEMY_SCREEN_'+name+':'+shot.toString('base64'));}
  assert.equal(await page.locator('.academy-professional:visible').count(),0);await page.getByRole('link',{name:'03 / Prierez má orientáciu',exact:true}).click();assert.equal(await page.locator('#chapter-c').evaluate(el=>document.activeElement===el),true);await page.getByRole('button',{name:'Profesionálna',exact:true}).click();assert.equal(await page.locator('.academy-professional:visible').count(),7);assert.equal(await page.locator('.academy-checklist input[type=checkbox]').count(),14);
  for(const kind of ['assembly','orientation','joint']){const panel=page.getByTestId('diagram-'+kind);await panel.getByRole('button',{name:'Zväčšiť detail'}).click();assert.equal(await panel.locator('.is-zoomed').count(),1);await panel.getByRole('button',{name:'Zmenšiť detail'}).click();await panel.getByRole('button',{name:'Rizikový detail'}).click();assert.equal(await panel.getByRole('button',{name:'Rizikový detail'}).getAttribute('aria-pressed'),'true');await panel.getByRole('button',{name:'Odporúčaný princíp'}).click();if(kind!=='orientation'){for(const label of ['Dosky','Dištančné prvky','Podkonštrukcia','Podpery','Podklad','Spojovací materiál']){await panel.getByRole('checkbox',{name:label,exact:true}).uncheck();assert.equal(await panel.locator('[data-layer="'+label+'"]').count(),0);await panel.getByRole('checkbox',{name:label,exact:true}).check();assert.equal(await panel.locator('[data-layer="'+label+'"]').count(),1);}}}
  await page.getByRole('checkbox',{name:'Presný artikel, profil a platný predpis.'}).check();assert.ok((await page.locator('.academy-checklist [role=status]').innerText()).includes('1 / 14'));
  assert.equal(await page.locator('tbody tr').count(),51);assert.equal(await page.locator('tbody tr').filter({hasText:'Neoverené'}).count(),8);await page.getByPlaceholder('Napr. 55987/0230 alebo Cumaru').fill('55987/0230');assert.equal(await page.locator('tbody tr').count(),1);assert.ok((await page.locator('tbody').innerText()).includes('450 mm'));
  const href=await page.getByRole('link',{name:'Plánovať 55987/0230'}).getAttribute('href');assert.ok(href.includes('product=')&&href.includes('variant='));
  const downloadPromise=page.waitForEvent('download');await page.getByRole('link',{name:'STIAHNUŤ MANUÁL PDF ↓'}).click();const download=await downloadPromise;assert.equal(download.suggestedFilename(),'pod-povrchom-04.pdf');await download.saveAs(resolve(out,name+'.pdf'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow at '+width);
  await page.getByRole('button',{name:'Základná',exact:true}).click();assert.equal(await page.locator('.academy-professional:visible').count(),0);await page.screenshot({path:resolve(out,name+'.png'),fullPage:true});
  await page.getByRole('link',{name:'Plánovať 55987/0230'}).click();await page.waitForURL(u=>u.hash.includes('/planovac?product='));await page.waitForTimeout(500);assert.equal(await page.locator('main').count(),1);
  report.checks.push({name,width,height,passed:true,features:['index','levels','all diagram toggles','checklist','SKU filter and exact rule','planner deep link','PDF download','overflow']});await browser.close();browser=null;
 }
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.close();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2))}

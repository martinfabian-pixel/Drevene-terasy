import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {chromium} from 'playwright';

// Read-only design research. All captures remain in QA artifacts. No source,
// font, photograph, PDF or stylesheet from this site is added to dist/public.
const reference='https://www.fixinggroup.com/terrasse/';
const catalog='https://www.fixinggroup.com/wp-content/uploads/2026/01/FXG_Katalog_CZ.pdf';
const output=resolve('qa/ci-fixing-reference');await mkdir(output,{recursive:true});
const report={reference,catalog,auditedAt:new Date().toISOString(),scope:'Public reference appearance and style metadata only; no asset reuse or publication.',viewports:[],resources:[],pdf:{available:false},warnings:[]};
const run=promisify(execFile);const resources=new Map();let browser;
const exportImage=(name,bytes)=>{if(process.env.FIXING_REFERENCE_EXPORT!=='1')return;const encoded=bytes.toString('base64');for(let i=0;i<encoded.length;i+=16000)console.log('FIXING_REFERENCE_'+name+':'+encoded.slice(i,i+16000))};
const capture=async(page,width,state)=>{
 await page.screenshot({path:resolve(output,width+'-'+state+'.png'),fullPage:state==='closed',animations:'disabled'});
 exportImage(width+'_'+state.toUpperCase(),await page.screenshot({type:'jpeg',quality:72,animations:'disabled'}));
};
async function measure(page){return page.evaluate(()=>{
 const properties=['fontFamily','fontSize','fontWeight','fontStyle','lineHeight','letterSpacing','textTransform','textAlign','color','backgroundColor','borderColor','borderWidth','borderRadius','display','position','gap','gridTemplateColumns','padding','paddingTop','paddingRight','paddingBottom','paddingLeft','margin','width','height','maxWidth','minHeight','boxShadow'];
 const visible=el=>{const box=el.getBoundingClientRect(),style=getComputedStyle(el);return box.width>0&&box.height>0&&style.display!=='none'&&style.visibility!=='hidden'};
 const describe=(el,kind)=>{const style=getComputedStyle(el),box=el.getBoundingClientRect();return {kind,tag:el.tagName,id:el.id,classes:el.className?.baseVal??String(el.className??''),label:(el.getAttribute('aria-label')||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,100),box:{x:box.x,y:box.y,width:box.width,height:box.height},styles:Object.fromEntries(properties.map(key=>[key,style[key]]))}};
 const entries=[];entries.push(describe(document.body,'body'));
 for(const selector of ['h1','h2','h3','header','nav','nav a','button','main','section','footer'])for(const el of [...document.querySelectorAll(selector)].filter(visible).slice(0,selector==='h2'?8:3))entries.push(describe(el,selector));
 const headingBlocks=[...document.querySelectorAll('h2')].filter(visible).slice(0,8).map(el=>el.closest('article,li,[class*="product"],[class*="produkt"]')||el.parentElement.parentElement);
 for(const el of [...new Set(headingBlocks)])entries.push(describe(el,'product-block'));
 const stylesheets=[...document.styleSheets].map(sheet=>({url:sheet.href??'inline',disabled:sheet.disabled,media:sheet.media.mediaText}));
 const fontFaces=[],inspect=(rules,url)=>{for(const rule of rules){if(rule.type===CSSRule.FONT_FACE_RULE)fontFaces.push({stylesheet:url,family:rule.style.getPropertyValue('font-family'),style:rule.style.getPropertyValue('font-style'),weight:rule.style.getPropertyValue('font-weight'),sources:rule.style.getPropertyValue('src')});if(rule.cssRules)inspect(rule.cssRules,url)}};
 const unavailableStylesheets=[];for(const sheet of document.styleSheets){try{inspect(sheet.cssRules,sheet.href??'inline')}catch{unavailableStylesheets.push(sheet.href)}}
 const fontStatus=[...document.fonts].map(font=>({family:font.family,weight:font.weight,style:font.style,status:font.status}));
 const controls=[...document.querySelectorAll('header button,header [role="button"],[class*="menu-toggle"],[class*="hamburger"],[class*="nav-toggle"]')].filter(visible).map(el=>({tag:el.tagName,id:el.id,classes:String(el.className),label:el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent?.trim(),expanded:el.getAttribute('aria-expanded')}));
 return {url:location.href,title:document.title,viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,styles:entries,stylesheets,fontFaces,fontStatus,unavailableStylesheets,controls};
})}
async function dismissConsent(page){
 const labels=[/nur notwendige/i,/alle ablehnen/i,/ablehnen/i,/reject all/i,/essential only/i];
 for(const name of labels){const button=page.getByRole('button',{name}).first();if(await button.isVisible().catch(()=>false)){await button.click({timeout:3000}).catch(()=>{});return name.source}}
 return null;
}
async function openMenu(page){
 const candidates=page.locator('header button,header a,header [role="button"],[class*="menu-toggle"],[class*="hamburger"],[class*="nav-toggle"],[aria-controls*="menu"],[aria-label*="menu"],[aria-label*="Menu"]');
 const eligible=[];
 for(let index=0;index<await candidates.count();index++){
  const candidate=candidates.nth(index);if(!await candidate.isVisible())continue;
  const detail=await candidate.evaluate(el=>({label:el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent?.trim()||'',classes:String(el.className),id:el.id,tag:el.tagName,expanded:el.getAttribute('aria-expanded')}));
  if(/menu|menü|hamburger|nav-toggle|navigation öffnen|navigation toggle/i.test([detail.label,detail.classes,detail.id].join(' '))&&!/cookie|consent|privacy/i.test(detail.classes+' '+detail.label))eligible.push({index,detail});
 }
 for(const {index,detail} of eligible){try{await candidates.nth(index).click({timeout:3000});await page.waitForTimeout(250);return {opened:true,control:detail}}catch{}}
 return {opened:false,reason:'No visible menu toggle identified. Desktop may use permanently visible navigation.',eligible:eligible.map(x=>x.detail)};
}
try{
 browser=await chromium.launch({headless:true});
 for(const width of [320,375,402,430,768,1440,1920]){
  const height=width<768?900:1080;const context=await browser.newContext({viewport:{width,height},hasTouch:width<768,isMobile:width<768,locale:'de-DE',reducedMotion:'reduce'});
  const page=await context.newPage();page.setDefaultTimeout(15_000);
  page.on('response',response=>{const type=response.request().resourceType();if(['stylesheet','font'].includes(type))resources.set(response.url(),{url:response.url(),type,status:response.status(),contentType:response.headers()['content-type'],contentLength:response.headers()['content-length']})});
  page.on('pageerror',error=>report.warnings.push({width,kind:'reference-page-error',message:error.message}));
  await page.goto(reference,{waitUntil:'domcontentloaded',timeout:60_000});await page.locator('h1').first().waitFor();await page.evaluate(()=>document.fonts.ready);
  const consent=dismissConsent(page);await consent;
  await page.evaluate(async()=>{for(const image of document.images)image.loading='eager';for(let y=0;y<Math.min(document.documentElement.scrollHeight,15000);y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,55))}scrollTo(0,0)});
  await page.waitForTimeout(400);const closed=await measure(page);await capture(page,width,'closed');
  const menu=await openMenu(page);const opened=await measure(page);await capture(page,width,'menu');
  const record={width,height,consent:await consent,menu,closed,opened};report.viewports.push(record);await writeFile(resolve(output,width+'-metrics.json'),JSON.stringify(record,null,2));
  console.log('FIXING_REFERENCE_METRICS_'+width+' '+JSON.stringify({menu,styles:closed.styles.filter(row=>['body','h1','h2','nav','button','product-block'].includes(row.kind)).filter((_,i)=>i<18),fontFaces:closed.fontFaces,fontStatus:closed.fontStatus}));
  await context.close();
 }
 report.resources=[...resources.values()];
 const context=await browser.newContext();
 try{
  const response=await context.request.get(catalog,{timeout:90_000});if(!response.ok())throw Error('PDF response '+response.status());
  const bytes=await response.body();if(bytes.subarray(0,5).toString()!=='%PDF-')throw Error('Catalog did not return PDF bytes');
  const pdfPath=resolve(output,'reference-catalog.pdf');await writeFile(pdfPath,bytes);
  const {stdout}=await run('pdfinfo',[pdfPath]);const pages=Number(stdout.match(/^Pages:\s+(\d+)/m)?.[1]);
  const selected=[1,2,8,24,48].filter(page=>page<=pages),renders=[];
  for(const number of selected){const prefix=resolve(output,'pdf-page-'+String(number).padStart(3,'0'));await run('pdftoppm',['-f',String(number),'-l',String(number),'-singlefile','-scale-to','1600','-jpeg','-jpegopt','quality=72',pdfPath,prefix],{timeout:60_000});const rendered=await readFile(prefix+'.jpg');exportImage('PDF_PAGE_'+String(number).padStart(3,'0'),rendered);renders.push({page:number,file:prefix.split(/[\\/]/).at(-1)+'.jpg'})}
  report.pdf={available:true,url:catalog,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),pages,renders,scope:'Private QA artifact only; not published or reused by the website.'};
 }catch(error){report.pdf={available:false,url:catalog,error:error.message};report.warnings.push({kind:'reference-pdf',message:error.message})}
 await context.close();console.log('FIXING_REFERENCE_SUMMARY '+JSON.stringify({viewports:report.viewports.length,resources:report.resources,pdf:report.pdf,warnings:report.warnings}));
}finally{await browser?.close();await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2))}

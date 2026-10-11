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
 for(const [kind,selector,limit] of [['h1','h1',3],['h2','h2',8],['h3','h3',3],['header','header,.masthead,.mobile-header-bar,.elementor-location-header,[data-elementor-type="header"],[role="banner"]',6],['nav','nav,.main-nav,.elementor-nav-menu,.elementor-nav-menu__container,.elementor-location-header [role="navigation"]',5],['nav a','nav a,.main-nav a,.masthead a,.mobile-header-bar a,.elementor-nav-menu a,.elementor-location-header a,[data-elementor-type="header"] a',12],['button','button,.dt-mobile-menu-icon,.menu-toggle,.elementor-menu-toggle,[role="button"]',8],['main','main',3],['section','section',3],['footer','footer',2]])for(const el of [...document.querySelectorAll(selector)].filter(visible).slice(0,limit))entries.push(describe(el,kind));
 const headingBlocks=[...document.querySelectorAll('h2')].filter(visible).slice(0,8).map(el=>el.closest('article,li,[class*="product"],[class*="produkt"]')||el.parentElement.parentElement);
 for(const el of [...new Set(headingBlocks)])entries.push(describe(el,'product-block'));
 const stylesheets=[...document.styleSheets].map(sheet=>({url:sheet.href??'inline',disabled:sheet.disabled,media:sheet.media.mediaText}));
 const fontFaces=[],inspect=(rules,url)=>{for(const rule of rules){if(rule.type===CSSRule.FONT_FACE_RULE)fontFaces.push({stylesheet:url,family:rule.style.getPropertyValue('font-family'),style:rule.style.getPropertyValue('font-style'),weight:rule.style.getPropertyValue('font-weight'),sources:rule.style.getPropertyValue('src')});if(rule.cssRules)inspect(rule.cssRules,url)}};
 const unavailableStylesheets=[];for(const sheet of document.styleSheets){try{inspect(sheet.cssRules,sheet.href??'inline')}catch{unavailableStylesheets.push(sheet.href)}}
 const fontStatus=[...document.fonts].map(font=>({family:font.family,weight:font.weight,style:font.style,status:font.status}));
 const controls=[...document.querySelectorAll('header button,header [role="button"],.dt-mobile-menu-icon,.menu-toggle,[class*="mobile-menu-icon"],[class*="menu-toggle"],[class*="hamburger"],[class*="nav-toggle"]')].filter(visible).map(el=>({tag:el.tagName,id:el.id,classes:String(el.className),label:el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent?.trim(),expanded:el.getAttribute('aria-expanded')}));
 const topInventory=[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return visible(el)&&r.bottom>0&&r.top<140&&r.left<innerWidth&&r.right>0}).slice(0,180).map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {tag:el.tagName,id:el.id,classes:el.className?.baseVal??String(el.className??''),role:el.getAttribute('role'),ariaLabel:el.getAttribute('aria-label'),ariaControls:el.getAttribute('aria-controls'),expanded:el.getAttribute('aria-expanded'),title:el.getAttribute('title'),href:el.getAttribute('href'),label:(el.textContent||'').trim().replace(/\s+/g,' ').slice(0,70),box:{x:r.x,y:r.y,width:r.width,height:r.height},cursor:s.cursor,display:s.display}});
 return {url:location.href,title:document.title,bodyClasses:document.body.className,viewport:{width:innerWidth,height:innerHeight},scrollWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,styles:entries,stylesheets,fontFaces,fontStatus,unavailableStylesheets,controls,topInventory};
})}
async function dismissConsent(page){
 const decline=page.locator('#CybotCookiebotDialogBodyButtonDecline');
 try{
  await decline.waitFor({state:'visible',timeout:15_000});await decline.click({timeout:5000});
  await page.locator('#CybotCookiebotDialog').waitFor({state:'hidden',timeout:7000});
  return {dismissed:true,control:'#CybotCookiebotDialogBodyButtonDecline',choice:'Necessary cookies only'};
 }catch(error){
  if(await decline.isVisible().catch(()=>false))return {dismissed:false,control:'#CybotCookiebotDialogBodyButtonDecline',error:error.message};
 }
 const labels=[/nur notwendige/i,/alle ablehnen/i,/ablehnen/i,/reject all/i,/essential only/i];
 for(const name of labels){const button=page.getByRole('button',{name}).first();if(await button.isVisible().catch(()=>false)){await button.click({timeout:3000}).catch(()=>{});return {dismissed:true,control:name.source}}}
 return {dismissed:false,reason:'No visible consent dialog identified after waiting.'};
}
async function openMenu(page){
 const candidates=page.locator('.dt-mobile-menu-icon,.menu-toggle,[class*="mobile-menu-icon"],header button,header a,header [role="button"],.masthead button,.masthead a,.mobile-header-bar button,.mobile-header-bar a,.elementor-location-header button,.elementor-location-header [role="button"],.elementor-menu-toggle,[class*="menu-toggle"],[class*="hamburger"],[class*="nav-toggle"],[aria-controls*="menu"],[aria-label*="menu"],[aria-label*="Menu"]');
 const eligible=[];
 for(let index=0;index<await candidates.count();index++){
  const candidate=candidates.nth(index);if(!await candidate.isVisible())continue;
  const detail=await candidate.evaluate(el=>{const r=el.getBoundingClientRect();return {label:el.getAttribute('aria-label')||el.getAttribute('title')||el.textContent?.trim()||'',classes:String(el.className),id:el.id,tag:el.tagName,href:el.getAttribute('href'),expanded:el.getAttribute('aria-expanded'),box:{x:r.x,y:r.y,width:r.width,height:r.height}}});
  const semantic=[detail.label,detail.classes,detail.id].join(' '),strong=/hamburger|menu-toggle|nav-toggle|navbar-toggler|eicon-menu|navigation (?:öffnen|toggle)|menü öffnen|menu öffnen/i.test(semantic);
  const compactHeaderControl=detail.box.y>=-5&&detail.box.y<140&&detail.box.width>=25&&detail.box.width<=110&&detail.box.height>=25&&detail.box.height<=110;
  const observedIcon=/mobile-menu-icon|dt-mobile-menu-icon/i.test(semantic);
  if(compactHeaderControl&&(observedIcon||strong||(/menu|menü|navigation/i.test(detail.label)&&detail.tag!=='A'))&&!/cookie|consent|privacy/i.test(semantic)&&!(detail.tag==='A'&&detail.href&&!detail.href.startsWith('#')&&!detail.href.startsWith('javascript:')))eligible.push({index,detail,score:observedIcon?4:strong?2:1});
 }
 eligible.sort((a,b)=>b.score-a.score);
 for(const {index,detail} of eligible){try{
  const before=await page.evaluate(()=>document.body.className);await candidates.nth(index).click({timeout:3000});await page.waitForTimeout(900);
  const state=await candidates.nth(index).evaluate(el=>({expanded:el.getAttribute('aria-expanded'),classes:String(el.className),bodyClasses:document.body.className,dropdowns:[...document.querySelectorAll('.dt-mobile-menu,.mobile-main-nav,.mobile-menu,.mobile-navigation,.elementor-nav-menu--dropdown,[role="dialog"]')].filter(node=>{const r=node.getBoundingClientRect(),s=getComputedStyle(node);return r.width>0&&r.height>0&&r.right>0&&r.left<innerWidth&&s.display!=='none'&&s.visibility!=='hidden'&&s.opacity!=='0'}).map(node=>({classes:String(node.className),text:node.textContent.trim().slice(0,80)}))}));
  const opened=state.expanded==='true'||/elementor-active|is-active|is-open|menu-open|act|opened/.test(state.classes)||(/menu|navigation/.test(state.bodyClasses)&&state.bodyClasses!==before)||state.dropdowns.length>0;
  return {opened,control:detail,state};
 }catch{}}
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
  let consent=await dismissConsent(page);
  await page.evaluate(async()=>{for(const image of document.images)image.loading='eager';for(let y=0;y<Math.min(document.documentElement.scrollHeight,15000);y+=700){scrollTo(0,y);await new Promise(r=>setTimeout(r,55))}scrollTo(0,0)});
  await page.waitForTimeout(400);
  if(await page.locator('#CybotCookiebotDialog').isVisible().catch(()=>false))consent={...consent,retry:await dismissConsent(page)};
  if(await page.locator('#CybotCookiebotDialog').isVisible().catch(()=>false)){await capture(page,width,'consent-blocked');throw Error('Reference audit cannot measure the clean design while the Cookiebot overlay remains visible at '+width+'px')}
  const closed=await measure(page);await capture(page,width,'closed');
  const menu=await openMenu(page);const opened=await measure(page);await capture(page,width,'menu');
  const record={width,height,consent,menu,closed,opened};report.viewports.push(record);await writeFile(resolve(output,width+'-metrics.json'),JSON.stringify(record,null,2));
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

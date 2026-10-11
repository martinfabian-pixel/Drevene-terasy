import {chapters} from './manual';
import {publications, type DetailKind} from './library';
import {editorial} from './editorial';

// Presentation references only. Rules, dimensions and complete prose remain in
// the existing registry and publications, which also drive the PDFs.
export type ContentRef = {manual:string; chapter:string} | {article:string; section:number};
export type TextRef = {source:ContentRef; field:'basic'|'pro'; index:number};
export type GuideInteraction = 'none'|'compare'|'layers';
export type GuideStep = {
  id:string; title:string; source:ContentRef; excerpt?:number;
  diagram:DetailKind|'comparison'|'movement'; interaction:GuideInteraction;
  notices?:TextRef[]; nextTopics?:string[];
};
export type Journey = {id:string; title:string; description:string; manualId:string; steps:GuideStep[]};
const m=(manual:string,chapter:string):ContentRef=>({manual,chapter});
const a=(article:string,section:number):ContentRef=>({article,section});
const warning=(manual:string,chapter:string,field:'basic'|'pro',index:number):TextRef=>({source:m(manual,chapter),field,index});
const step=(id:string,title:string,source:ContentRef,diagram:GuideStep['diagram'],interaction:GuideInteraction='none',extra:Partial<GuideStep>={}):GuideStep=>({id,title,source,diagram,interaction,...extra});

export const journeys:Journey[]=[
  {id:'drevo',title:'Vybrať správne drevo',description:'Od konkrétnej dosky po rozhodnutie o materiáli.',manualId:'01',steps:[
    step('vyber','Drevina je začiatok výberu.',m('01','vyber'),'grain'),
    step('drevo-wpc','Drevo alebo WPC?',a('drevo-vs-wpc',0),'movement','compare'),
    step('cumaru-ipe','Cumaru alebo Ipé?',a('cumaru-vs-ipe',0),'comparison','compare',{notices:[{source:a('cumaru-vs-ipe',1),field:'basic',index:0}]}),
    step('rez','Pozrite sa na čelo dosky.',m('01','rez'),'grain','compare',{excerpt:1,notices:[warning('01','rez','basic',2)]}),
    step('povrch','Skontrolujte skutočný povrch.',a('farba-exotickych-teras',0),'grain'),
    step('dalsi-krok','Vyberajte celý systém.',a('drevo-vs-wpc',2),'frame','none',{nextTopics:['terasa','wpc']})
  ]},
  {id:'terasa',title:'Postaviť terasu',description:'Zrozumiteľná cesta od zamerania po kontrolu.',manualId:'04',steps:[
    step('zameranie','Najskôr zamerajte priestor.',m('04','g'),'assembly','layers',{excerpt:0}),
    step('material','Vyberte presnú dosku.',m('01','vyber'),'grain'),
    step('podklad','Kam odtečie voda?',m('04','a'),'air','compare',{excerpt:1,notices:[warning('04','a','pro',0)]}),
    step('skladba','Čo drží terasu?',m('04','b'),'frame','compare',{notices:[warning('04','b','pro',2)]}),
    step('rost','Nosníky rozvrhnite pred rezaním.',m('04','g'),'assembly','layers',{excerpt:3,notices:[warning('04','f','basic',1)]}),
    step('kotvenie','Spoj musí zodpovedať doske.',m('05','poloha'),'head','compare',{excerpt:1}),
    step('dilatacie','Nechajte materiál pracovať.',a('drevo-vs-wpc',0),'movement','compare'),
    step('kontrola','Skontrolujte pred odovzdaním.',m('04','g'),'air','none',{excerpt:7,notices:[warning('04','g','pro',0)],nextTopics:['podkonstrukcia','kotvenie']})
  ]},
  {id:'podkonstrukcia',title:'Podkonštrukcia terasy',description:'Vrstvy, spoje a cesta vody pod doskami.',manualId:'04',steps:[
    step('vrstvy','Čo je pod terasovými doskami?',m('04','a'),'assembly','layers',{notices:[warning('04','a','pro',0)]}),
    step('drevo-hlinik','Drevený alebo hliníkový rošt?',m('04','b'),'frame','compare',{notices:[warning('04','b','pro',2)]}),
    step('orientacia','Ako otočiť hranol?',m('04','c'),'orientation','none',{notices:[warning('04','c','basic',1),warning('04','c','pro',1)]}),
    step('celne-spoje','Prečo dva konce potrebujú dve podpory?',m('04','d'),'joint','compare',{notices:[warning('04','d','basic',2)]}),
    step('voda-vzduch','Nechajte vodu odtiecť a drevo vyschnúť.',m('04','e'),'air','compare',{excerpt:1,notices:[warning('04','e','pro',0)]}),
    step('zhrnutie','Skladbu overte ako celok.',m('04','f'),'assembly','none',{excerpt:1,notices:[warning('04','f','pro',0)],nextTopics:['kotvenie']})
  ]},
  {id:'kotvenie',title:'Kotvenie dosiek',description:'Od prostredia po polohu konkrétneho spoja.',manualId:'05',steps:[
    step('ocel','Nerez nie je celý predpis.',m('05','ocel'),'head','none',{notices:[warning('05','ocel','basic',2)]}),
    step('rozmer','Dĺžka vrutu nie je jediný rozmer.',m('05','rozmer'),'head','none',{notices:[warning('05','rozmer','basic',1)]}),
    step('drevo-alu','Do dreva a do hliníka inak.',m('05','drevo-alu'),'frame','compare',{notices:[warning('05','drevo-alu','basic',1)]}),
    step('poloha','Čelo potrebuje miesto pre skrutku.',m('05','poloha'),'end','compare',{notices:[warning('05','poloha','basic',2)]}),
    step('hlava','Hlava nemá vytvoriť jamku.',m('05','poloha'),'head','compare',{excerpt:1}),
    step('skryte','Skryté kotvenie je celý systém.',m('05','skryte'),'assembly','none',{notices:[warning('05','skryte','basic',1)],nextTopics:['podkonstrukcia']})
  ]},
  {id:'wpc',title:'WPC ako konkrétny systém',description:'Pohyb, nosnosť a údržba majú vlastné pravidlá.',manualId:'03',steps:[
    step('system','Najskôr určite konkrétny profil.',m('03','system'),'assembly','layers',{notices:[warning('03','system','basic',2)]}),
    step('pohyb','Teplotný pohyb potrebuje priestor.',m('03','pohyb'),'movement','compare',{notices:[warning('03','pohyb','basic',2)]}),
    step('nosnost','WPC hranol nie je nosný rám.',m('03','nosnost'),'frame','none',{excerpt:1,notices:[warning('03','nosnost','basic',0)]}),
    step('voda','Aj WPC potrebuje voľný odtok.',m('03','voda'),'air','compare',{notices:[warning('03','voda','basic',1)],nextTopics:['terasa']})
  ]},
  {id:'chyby',title:'Vyhnúť sa chybám',description:'Spoznajte príčinu skôr, než sa detail zakryje.',manualId:'06',steps:publications.find(p=>p.id==='06')!.chapters.map((c,i)=>step(c.id,c.title.replace(/^\d+\s*\/\s*/,''),m('06',c.id),c.diagram??'air',c.diagram==='orientation'?'none':'compare',{excerpt:2,notices:[warning('06',c.id,'basic',1)],...(i===8?{nextTopics:['terasa']}: {})}))}
];

function read(ref:ContentRef){
  if('article' in ref){const article=editorial.find(x=>x.slug===ref.article)!;const section=article.sections[ref.section];return {lead:article.lead,basic:section.text,pro:[] as string[],evidence:article.sources,manualId:article.manual};}
  const chapter=(ref.manual==='04'?chapters:publications.find(x=>x.id===ref.manual)!.chapters).find(x=>x.id===ref.chapter)!;
  return {...chapter,manualId:ref.manual};
}
const short=(text:string)=>text.replace(/^\d+\.\s*|^(MECHANIZMUS|MOŽNÝ NÁSLEDOK|SPRÁVNY POSTUP)\s*\/\s*/,'').split(/(?<=[.!?])\s+(?=[A-ZÁČĎÉÍĽŇÓÔŔŠŤÚÝŽ])/).slice(0,2).join(' ');
export function getStepData(topicId:string,stepId:string){
  const topic=journeys.find(x=>x.id===topicId)!;
  const item=topic.steps.find(x=>x.id===stepId)!;
  const content=read(item.source);
  const noticeRefs=item.notices??[];
  const notices=noticeRefs.map(n=>read(n.source)[n.field][n.index]).filter(Boolean);
  return {title:item.title,lead:content.lead,summary:short(content.basic[item.excerpt??0]),details:[...content.basic,...content.pro],notices,evidence:[...new Set([...content.evidence,...noticeRefs.flatMap(n=>read(n.source).evidence)])],manualId:content.manualId};
}
export const guidePath=(topic:string,stepId?:string)=>'/pod-povrchom/sprievodca/'+topic+(stepId?'?step='+stepId:'');

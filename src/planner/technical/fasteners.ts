import stock from '../../data/jaf-stock-2026-10-10.json';
import type { TechnicalContext, TechnicalReport, Evidence } from './types';
import { hpm } from './rapitec';
import { jaf } from './rules';
export interface FastenerAssessment {article:string;name:string;diameter:number;length:number;pack:number;pilot:number|null;status:'candidate'|'requiresReview'|'incompatible';reasons:string[];sources:Evidence[];priceGross:number|null;required:number;packages:number;totalGross:number|null}
const specs=[
 {article:'55013/0277',family:'Alu',diameter:5.5,length:40,thread:23,pack:200,pilot:5.5,page:12},
 {article:'55013/0569',family:'ANTIK',diameter:5.5,length:60,thread:24,pack:200,pilot:4,page:10},
 {article:'55013/0148',family:'Plus',diameter:4,length:40,thread:26,pack:250,pilot:3,page:11},
 {article:'55013/0155',family:'Teraso',diameter:4,length:60,thread:36,pack:250,pilot:3,page:11},
 {article:'55013/0107',family:'Teraso',diameter:4,length:40,thread:26,pack:250,pilot:3,page:11},
 {article:'55013/0109',family:'Teraso',diameter:4,length:50,thread:30,pack:250,pilot:3,page:11},
 {article:'55013/0290',family:'Top',diameter:5.5,length:50,thread:17,pack:200,pilot:4,page:10},
 {article:'55013/0291',family:'Top',diameter:5.5,length:60,thread:24,pack:200,pilot:4,page:10},
 {article:'55013/0134',family:'Top',diameter:5.5,length:70,thread:34,pack:200,pilot:4,page:10},
] as const;
export function assessFasteners(context:TechnicalContext,o:TechnicalReport['options'],joistHeight:number,required:number):FastenerAssessment[]{
 const p=context.profile,assembly=p.thicknessMm+o.spacerMm;
 const minimum=p.sideGap.sources.some(s=>s.document.includes('LUNAWOOD'))?2.5*assembly:2.5*p.thicknessMm+o.spacerMm;
 return specs.map(s=>{
  const v=context.accessories.find(v=>v.article===s.article),original=stock.articles.find(v=>v.article===s.article);
  const r:FastenerAssessment={...s,name:original?.name??s.article,status:'candidate',reasons:[],sources:[jaf(18),jaf(22),hpm(s.page),hpm(47)],priceGross:v?.priceGross??null,required,packages:Math.ceil(required/s.pack),totalGross:v?.priceGross==null?null:Math.round(Math.ceil(required/s.pack)*v.priceGross*100)/100};
  const reject=(n:string)=>{r.status='incompatible';r.reasons.push(n);};const review=(n:string)=>{if(r.status!=='incompatible')r.status='requiresReview';r.reasons.push(n);};
  // Exact stock identity + profile dimensions; no matching another product by species or diameter alone.
  if(!v||!original||!original.name.includes(s.family)||Number(original.thickness)!==s.diameter||Number(original.format.split(' x ')[0])!==s.length||v.thicknessMm!==s.diameter||v.lengthMm!==s.length)reject('Artikel alebo rozmery sa nezhodujú s technickým registrom.');
  if(o.fixing!=='visible'||p.material.startsWith('WPC'))reject('Nie je systémovým kotvením vybraného profilu.');
  if(s.diameter<5)reject('Priemer 4 mm je pomocný spoj; nie kotvenie terasovej dosky.');
  if(s.family==='Alu'){
   if(o.joistArticle!=='55016/0008')reject('ALU vrut vyžaduje hliníkový profil.');
   else review('Chýba potvrdená stena a tvar H/jekl profilu. Dosku predvŕtať 5,5 mm bez zahlbenia.');
  }else{
   if(o.joistArticle==='55016/0008'||o.joistArticle==='55638/0103')reject('Tento vrut vyžaduje drevený nosník.');
   if(assembly>s.length-s.thread)reject('Doska s dištanciou presahuje maximálnu pripojovanú hrúbku.');
   if(s.length<minimum)reject('Nespĺňa dĺžku podľa predpisu dosky.');
   if(s.length>assembly+joistHeight)reject('Presahuje dostupnú hĺbku nosníka.');
  }
  if(p.spacing.value===null)review('Neoverený presný profil dosky.');
  if(o.pool||o.exposure!=='normal'||o.increasedLoad)review('Odolnosť alebo únosnosť v zadanom prostredí musí potvrdiť výrobca konkrétneho spoja.');
  r.reasons.push('Predbežné posúdenie; rozmerová vhodnosť nie je potvrdením statickej únosnosti.');
  return r;
 });
}

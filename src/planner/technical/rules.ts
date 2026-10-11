import signatures from './sku-signatures.json';
import type { Product, ProductVariant } from '../../commerce/catalog';
import type { Evidence, Rule, FixingSystem, TechnicalContext, TechnicalProfile, TechnicalStock } from './types';
export const RULE_VERSION = '2026-10-11.1';
export const jaf = (page: number): Evidence => ({document:'Terasy_2_2026_SK.pdf',pages:[page],year:2026,note:'Číslo fyzickej strany PDF; katalóg obsahuje dvojstrany.'});
export const luna = (...pages: number[]): Evidence => ({document:'LUNAWOOD-navod-k-montazi-drevenych-teras-2023-CZ.pdf',pages,year:2023});
export const known = <T,>(value:T,...sources:Evidence[]):Rule<T> => ({value,status:'verified',sources});
export const unknown = <T,>(...sources:Evidence[]):Rule<T> => ({value:null,status:'unknown',sources});
const review = <T,>(value:T,...sources:Evidence[]):Rule<T> => ({value,status:'requiresReview',sources});
type Entry = {articles:string[];width:number;thickness:number;spacing:number;page:number;systems:FixingSystem[];kind:'wood'|'luna'|'ash'|'wpc';joists:string[]};
const exotic=['55927/0275','55927/0305','55927/0336','55927/0366','55927/0397','55927/0458'];
const larch=['55905/0330','55905/0340'];
const thermo=['55982/0030']; // The 4200 mm stock SKU differs from the technical catalogue SKU; no inferred alias.
const aluminium=['55016/0008'];
const entries:Entry[]=[
 {articles:['55990/2640'],width:145,thickness:28,spacing:600,page:11,systems:['visible'],kind:'wood',joists:['54335/0140']},
 {articles:['55954/2183','55954/2214','55954/2244','55954/2275','55954/2305','55954/2336','55954/2366','55954/2397','55954/2427'],width:145,thickness:21,spacing:400,page:7,systems:['visible'],kind:'wood',joists:[...exotic,...aluminium]},
 {articles:['55949/6183','55949/6214','55949/6244','55949/6275','55949/6305','55949/6336','55949/6366','55949/6397'],width:145,thickness:21,spacing:400,page:7,systems:['visible','dila'],kind:'wood',joists:[...exotic,...aluminium]},
 {articles:['55973/7275'],width:140,thickness:21,spacing:400,page:8,systems:['visible','dila'],kind:'wood',joists:[...exotic,...aluminium]},
 {articles:['55921/0305','55921/0336'],width:145,thickness:25,spacing:500,page:6,systems:['visible'],kind:'wood',joists:[...exotic,...aluminium]},
 {articles:['55903/1330'],width:145,thickness:25,spacing:500,page:9,systems:['visible'],kind:'wood',joists:[...larch,...aluminium]},
 {articles:['55991/1942','55991/1948'],width:140,thickness:26,spacing:500,page:10,systems:['visible'],kind:'wood',joists:larch},
 {articles:['55978/0230','55978/0242','55978/0251'],width:117,thickness:26,spacing:450,page:4,systems:['visible','profix-x','profix-x2'],kind:'luna',joists:[...thermo,...larch,'54335/0140',...aluminium]},
 {articles:['55987/0230','55987/0245'],width:140,thickness:26,spacing:450,page:4,systems:['visible','profix-x','profix-x2'],kind:'luna',joists:[...thermo,...larch,'54335/0140',...aluminium]},
 {articles:['55977/8125','55977/8128','55977/8140'],width:100,thickness:21,spacing:400,page:5,systems:['profix-x','profix-x2'],kind:'ash',joists:[...thermo,...larch,...exotic]},
 {articles:['55693/1122','55693/1134','55693/1137'],width:118,thickness:21,spacing:400,page:5,systems:['juan'],kind:'ash',joists:[...thermo,...larch,...exotic]},
 {articles:['55656/0100','55656/0020','55656/0040','55656/0090','55656/0080','55656/0060'],width:146,thickness:23,spacing:350,page:14,systems:['ligo-s47'],kind:'wpc',joists:[...exotic,...aluminium,'55638/0103']},
 {articles:['55937/0141','55937/0131'],width:145,thickness:22,spacing:400,page:13,systems:['ligo-s47'],kind:'wpc',joists:[...exotic,...aluminium,'55638/0103']},
];
export function technicalProfile(product:Product,variant:ProductVariant):TechnicalProfile {
 const article=variant.articleNumber??variant.id;
 const signature=(signatures as Record<string,{productId:string;widthMm:number;thicknessMm:number;lengthMm:number;profile:string}>)[article];
 const unchanged=signature&&signature.productId===product.id&&signature.widthMm===variant.widthMm&&signature.thicknessMm===variant.thicknessMm&&signature.lengthMm===variant.lengthMm&&signature.profile===variant.profile;
 const entry=unchanged?entries.find(e=>e.articles.includes(article)&&e.width===variant.widthMm&&e.thickness===variant.thicknessMm):undefined;
 const isLuna=entry?.kind==='luna', isWood=entry?.kind==='wood', isWpc=entry?.kind==='wpc';
 const source=entry?jaf(entry.page):jaf(1);
 return {version:RULE_VERSION,article,productId:product.id,variantId:variant.id,material:product.woodSpecies??product.category,profile:variant.profile,
 widthMm:variant.widthMm??0,thicknessMm:variant.thicknessMm??0,lengthMm:variant.lengthMm??0,
 spacing:entry?known(entry.spacing,source):unknown(),
 sideGap:isLuna?known(6,luna(26,28,30)):isWpc?review(6,jaf(25)):unknown(jaf(27)),
 jointGap:isLuna?known(6,luna(28)):unknown(source),wallGap:isLuna?known(20,luna(23,29)):unknown(source),
 endFixingOffset:isLuna?known(50,luna(28)):isWood?known(50,jaf(27)):unknown(source),
 sideFixingOffset:isLuna?known(20,luna(28)):isWood?known(15,jaf(27)):unknown(source),
 maxOverhang:isLuna?known(36,luna(29)):unknown(source),
 doubleJoistClearance:isLuna?known(50,luna(23)):unknown(jaf(27)),
 minVentilationConcrete:isLuna?review(50,luna(5,19)):unknown(jaf(27)),
 minVentilationSoil:isLuna?known(100,luna(19)):unknown(jaf(27)),
 predilling:isLuna?known('Čelné otvory vždy predvŕtať; odporúčané aj ostatné. Odstup skrutky od čela najmenej 50 mm.',luna(28,41)):isWood?known('Predvŕtať a dodržať odstupy od okrajov.',jaf(27)):unknown(source),
 screwDepth:isLuna?known('Lícovať, najviac 2 mm; pri povrchovej úprave najviac 1 mm.',luna(29)):isWood?known('Hlava lícuje s povrchom.',jaf(27)):unknown(source),
 movement:isWpc?review('Tepelný pohyb WPC; údaje UPM sa nesmú použiť na Gardin.',jaf(25)):entry?known('Vlhkostný pohyb dreva; škáru potvrdiť pre konkrétny profil a podmienky.',source):unknown(),
 systems:entry?known(entry.systems,source):unknown(),joistArticles:entry?known(entry.joists,source,jaf(17)):unknown(),
 minSupports:isLuna?known(3,luna(11,25)):unknown(source),structuralSpan:unknown(jaf(17)),verification:entry?'requiresReview':'unknown',
 notes:isLuna?['Lunawood s. 5 všeobecne žiada 100 mm; s. 19 rozlišuje 50 mm nad nepriepustným podkladom / 100 mm nad zeminou. Rozpor vyžaduje potvrdenie.','Profix X/X2 v JAF nemožno automaticky zameniť za všetky generácie Luna Profix Plus. Skrutku a hlavicu potvrdiť výrobcom.']:
 isWood?['JAF s. 27: pri vlhkosti 16 % škára aspoň 6 % šírky; schéma 7 mm nie je univerzálne pravidlo.','Nedatovaný pokladací list uvádza 70 mm, JAF 2026 s. 27 text 40 mm; minimálnu výšku potvrdiť pre skladbu.']:
 isWpc?['WPC hranol Gardin nie je nosný prvok vyvýšenej terasy. Chýba produktová tabuľka teplotných dilatácií Gardin.']:['Rozmery alebo presný artikel nie sú jednoznačne priradené k montážnemu systému. Potrebné potvrdenie JAF.']};
}
const stock=(p:Product,v:ProductVariant):TechnicalStock=>({productId:p.id,variantId:v.id,article:v.articleNumber??v.id,lengthMm:v.lengthMm??0,widthMm:v.widthMm??0,thicknessMm:v.thicknessMm??0,priceGross:v.priceGross,unit:v.unit,profile:v.profile});
export function technicalContext(p:Product,v:ProductVariant,catalog:readonly Product[]):TechnicalContext {
 return {profile:technicalProfile(p,v),boardStock:p.variants.filter(x=>x.widthMm===v.widthMm&&x.thicknessMm===v.thicknessMm&&x.profile===v.profile&&x.color===v.color&&technicalProfile(p,x).spacing.value!==null).map(x=>stock(p,x)),accessories:catalog.filter(x=>!['massive','thermo','wpc'].includes(x.category)).flatMap(x=>x.variants.map(v=>stock(x,v)))};
}
/** The coefficient is valid for Piazza One/Pro only; not a universal WPC rule. */
export function upmPiazzaMovement(lengthMm:number,deltaMaterialTemperatureC:number):number|null {
 return Number.isFinite(lengthMm)&&lengthMm>0&&Number.isFinite(deltaMaterialTemperatureC)?Math.abs(lengthMm*deltaMaterialTemperatureC*0.00004):null;
}
export function fixingCompatible(profile:TechnicalProfile,system:FixingSystem,joistArticle:string):boolean {
 if(!profile.systems.value?.includes(system)||!profile.joistArticles.value?.includes(joistArticle))return false;
 if(['profix-x','profix-x2','juan','dila'].includes(system)&&joistArticle==='55016/0008')return false;
 return true;
}

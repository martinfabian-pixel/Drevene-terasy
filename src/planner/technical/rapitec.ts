import type { Evidence, TechnicalProfile, TechnicalReport } from './types';
export const HPM_VERSION='2026-08.1';
export const hpm=(...pages:number[]):Evidence=>({document:'HPM TEC RAPI-TEC — Katalog nerezove vruty 08-2026',pages,year:2026});
export type Exposure='normal'|'salt'|'condensation'|'aggressive'|'chlorine'|'unknown';
export type ReferenceFamily='none'|'teraso'|'plus'|'eko'|'top'|'alu'|'wings'|'bimetal'|'fasad'|'twin-a4';
export const referenceLabels:Record<ReferenceFamily,string>={none:'Bez referenčnej voľby',teraso:'TERASO C',plus:'TERASO PLUS A4',eko:'TERASO EKO A2',top:'TERASO TOP A4',alu:'RAPI-TEC ALU A4',wings:'WINGS C',bimetal:'Bimetal A4 / oceľ',fasad:'FASAD C','twin-a4':'TWIN-TEC A4'};
export interface FastenerReference {version:string;status:'requiresReview'|'incompatible'|'notApplicable';family:ReferenceFamily;quantity:number|null;diameterMm:number|null;pilotMm:number|null;lengthsMm:number[];notes:string[];sources:Evidence[];commercial:false}
/** Manufacturer reference, deliberately without product IDs, price, stock status or cart entries. */
export function evaluateRapitec(p:TechnicalProfile,o:TechnicalReport['options'],joistHeight:number|null,connections:number):FastenerReference {
 const f=o.fastenerReference,r:FastenerReference={version:HPM_VERSION,status:'requiresReview',family:f,quantity:o.fixing==='visible'&&connections>0?connections*2:null,diameterMm:null,pilotMm:null,lengthsMm:[],notes:[],sources:[hpm(3,4,5,7,19,47)],commercial:false};
 const reject=(s:string)=>{r.status='incompatible';r.notes.push(s);};
 const aggressive=['Cumaru','Garapa','Termoborovica Lunawood','Termojaseň','Impregnovaná borovica Cancun Max'].includes(p.material);
 const conditional=['Ipé','Bangkirai','Európsky smrekovec','Kanadská douglaska'].includes(p.material);
 const known=aggressive||conditional;
 if(f==='none'){r.status='notApplicable';return r;}
 r.notes.push('Technická referencia mimo sortimentu. Bez ceny, potvrdenej dostupnosti a možnosti pridať do košíka. Spotreba je bez rezervy.');
 if(o.fixing!=='visible'||p.material.startsWith('WPC')){reject('Tieto vruty nie sú náhradou systémových klipov ani automatickým kotvením WPC.');r.quantity=null;return r;}
 if(p.spacing.value===null||!known)reject('Chýba jednoznačné produktové priradenie dreviny alebo montážneho profilu.');
 if(o.pool||['aggressive','chlorine','unknown'].includes(o.exposure))reject('Bazén, chlór, agresívne alebo neurčené prostredie vyžadujú individuálne potvrdenie HPM TEC. A4 nie je automaticky postačujúca; HCR a A5 sa nezamieňajú.');
 const grade=['plus','top','alu','bimetal','twin-a4'].includes(f)?'A4':f==='eko'?'A2':'C';
 if((aggressive||['55982/0030','54335/0140'].includes(o.joistArticle)||['salt','condensation'].includes(o.exposure))&&grade!=='A4')reject('Táto drevina alebo prostredie vyžaduje podľa HPM referenciu A4; podmienečné výnimky A2 sa pre terasu automaticky nepovoľujú.');
 if(conditional&&grade==='C')r.notes.push('C je podľa poznámky e) na s. 47 podmienečné: korózia a zafarbenie závisia od pôvodu dreva. Potvrdiť dodávateľom.');
 const alu=o.joistArticle==='55016/0008';
 if(f==='alu'){
  r.diameterMm=5.5;r.pilotMm=5.5;r.sources.push(hpm(12));
  if(!alu)reject('ALU patrí výhradne ku kompatibilnému hliníkovému profilu.');
  r.notes.push('Dosku predvŕtať 5,5 mm BEZ zahlbenia. Výber 40/50 mm závisí od typu H/jekl, steny a pripojovanej hrúbky. Skladový profil nemá doloženú stenu a geometriu: dĺžka sa automaticky nevyberá.');
 }else if(f==='wings'||f==='bimetal'){
  r.diameterMm=5.5;r.sources.push(hpm(13));reject('Systém vyžaduje oceľový profil; v aktuálnej voľbe podkonštrukcie nie je doložený. Rozpor hrúbky steny v texte, schéme a tabuľke musí potvrdiť HPM.');
 }else{
  if(alu)reject('Vruty do dreva sa nesmú automaticky použiť do hliníka.');
  const thick=p.thicknessMm+o.spacerMm;
  const top=f==='top'||f==='eko';r.diameterMm=top?5.5:5;r.pilotMm=top?4:f==='fasad'?null:3.5;
  r.sources.push(hpm(top?10:f==='fasad'?14:f==='twin-a4'?15:11));
  const rows=top?[[50,17],[60,24],[70,34],[80,44]]:f==='twin-a4'?[[50,32],[60,42]]:f==='fasad'?[[40,26],[50,30],[60,36],[70,42]]:[[40,26],[45,28],[50,30],[60,36],[70,42],[80,48],[100,60]];
  const minimum=p.sideGap.sources.some(s=>s.document.includes('LUNAWOOD'))?2.5*thick:2.5*p.thicknessMm+o.spacerMm;
  r.lengthsMm=rows.filter(([len,thread])=>(f!=='plus'||len>=50)&&thick<=len-thread&&len>=minimum&&joistHeight!==null&&len<=thick+joistHeight).map(([len])=>len);
  if(!r.lengthsMm.length)r.notes.push('Žiadna tabuľková dĺžka nevyhovuje súčasne hrúbke dosky s dištanciou, závitu, predpisu dosky a hĺbke nosníka.');
  r.notes.push(top?'EKO/TOP: predvŕtanie 4 mm podľa produktovej tabuľky; potvrdiť celý detail hlavy.':f==='fasad'?'FASAD má vrtaciu špičku; výnimka z predvŕtania neprepisuje povinnosť výrobcu dosky.':f==='teraso'?'TERASO 5 mm: odporúčané predvŕtanie 3,5 mm.':'A4 PLUS/TWIN: predvŕtanie 3,5 mm je nutné.');
  r.notes.push('Dĺžky sú len rozmerovo vyhovujúce referencie, nie schválenie únosnosti. Pri výbere sa započítava aj dištancia.');
 }
 if(o.increasedLoad){r.notes.push('Zvýšená záťaž: HPM s. 19 žiada min. 6 mm alebo špeciálny 5,5 mm so zosilneným driekom; únosnosť musí byť overená.');if(r.diameterMm===5)reject('Zvolený 5 mm vrut nie je referenciou pre zvýšenú záťaž.');}
 if(p.widthMm>146)reject('Šírka presahuje referenčnú hranicu HPM 146 mm.');
 r.notes.push('Poloha spoja: rozhoduje predpis dosky; HPM uvádza bok min. 15 mm a čelo 50–100 mm. Lunawood si ponecháva prísnejší bok 20 mm. Dve skrutky na skutočný prienik, nie koeficient na m².');
 r.notes.push('Dištančná lišta HPM 7 mm, hviezda 5 mm. Zvolená dištancia '+o.spacerMm+' mm musí patriť k potvrdenému systému; bez nej rastie namáhanie na strih. Počet líšt a ich pomocných vrutov sa bez detailu krátenia nevymýšľa.');
 if(o.spacerMm===0)r.notes.push('Chýba dištančné oddelenie: potvrdiť ochranu dreva a pohyb spoja.');
 if(r.status==='incompatible')r.lengthsMm=[];
 return r;
}

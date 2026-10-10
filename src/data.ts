export type ConceptId = 'a' | 'b' | 'c';
export type ViewId = 'domov' | 'katalog' | 'produkt' | 'planovac' | 'realizacia' | 'poradna' | 'identita';
export const concepts = {
  a: { name: 'Premium Nature', subtitle: 'Príroda, pokoj a materiál.', tone: 'Prírodná elegancia', colors: ['#faf8f1','#23483c','#ba8d60','#e5e9dc'], fonts: 'Georgia · Arial', hero: 'terrace-garden-v2.webp' },
  b: { name: 'Architectural Studio', subtitle: 'Presnosť s vlastným rukopisom.', tone: 'Architektonický minimalizmus', colors: ['#f4f2ed','#171a18','#f2683e','#d5d5ce'], fonts: 'Arial · Courier New', hero: 'architecture-terrace.webp' },
  c: { name: 'Interactive Design Experience', subtitle: 'Vaša terasa sa začína návrhom.', tone: 'Interaktívny pracovný priestor', colors: ['#edf2ef','#173e35','#d7ef70','#dbe5df'], fonts: 'Arial · Courier New', hero: 'terrace-garden-v2.webp' },
} satisfies Record<ConceptId, {name:string;subtitle:string;tone:string;colors:string[];fonts:string;hero:string}>;
export const categories = ['Všetky materiály','Masívne drevené terasy','Thermowood a tepelne upravené drevo','WPC terasy','Podkladové hranoly a nosné profily','Terasové skrutky a klipy','Rektifikačné terče a podložky','Ukončovacie profily','Ochranné oleje a údržba','Ostatné príslušenstvo'];
export interface DemoProduct {id:string;name:string;category:string;family:string;color:string;swatch:string;unit:null;price:null;manufacturer:null;technicalSheet:null;status:'demo'}
export const products: DemoProduct[] = [
 {id:'drevo',name:'Masívne terasové drevo',family:'Prírodný materiál',category:categories[1],color:'Prírodný odtieň · vizuál',swatch:'natural',unit:null,price:null,manufacturer:null,technicalSheet:null,status:'demo'},
 {id:'thermo',name:'Tepelne upravené drevo',family:'Thermowood',category:categories[2],color:'Teplý hnedý odtieň · vizuál',swatch:'thermo',unit:null,price:null,manufacturer:null,technicalSheet:null,status:'demo'},
 {id:'wpc',name:'WPC terasová doska',family:'Kompozitný materiál',category:categories[3],color:'Grafitový odtieň · vizuál',swatch:'wpc',unit:null,price:null,manufacturer:null,technicalSheet:null,status:'demo'},
 {id:'hranoly',name:'Podkladová konštrukcia',family:'Príslušenstvo',category:categories[4],color:'Ukážka kategórie',swatch:'joists',unit:null,price:null,manufacturer:null,technicalSheet:null,status:'demo'},
 {id:'klipy',name:'Montážne klipy a skrutky',family:'Príslušenstvo',category:categories[5],color:'Ukážka kategórie',swatch:'clips',unit:null,price:null,manufacturer:null,technicalSheet:null,status:'demo'},
 {id:'oleje',name:'Oleje na terasové drevo',family:'Údržba',category:categories[8],color:'Ukážka kategórie',swatch:'oil',unit:null,price:null,manufacturer:null,technicalSheet:null,status:'demo'},
];
export const nav: {label:string;view:ViewId}[] = [{label:'Terasové dosky',view:'katalog'},{label:'Plánovač terasy',view:'planovac'},{label:'Realizácia terás',view:'realizacia'},{label:'Poradňa',view:'poradna'}];
export const asset = (name:string) => `${import.meta.env.BASE_URL}images/${name}`;

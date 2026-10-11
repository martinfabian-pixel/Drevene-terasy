import {DetailsHub,Portal} from './academy/Portal';
import {Guide} from './academy/Guide';
import {TechnicalCatalog} from './academy/TechnicalCatalog';
import {LibraryManual,EditorialArticle} from './academy/LibraryPage';
import { AcademyIndex, SubstructureManual } from './academy/Academy';
import { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { asset, concepts, nav, type ConceptId, type ViewId } from './data';
import Home from './Home';
import { Catalog, ProductDetail } from './CatalogProduct';
import Planner from './Planner';
import Homepage2027 from './Homepage2027';
import PlatformShell, { LegalPreview } from './PlatformShell';
import Planner2027 from './Planner2027';
import { CartProvider } from './commerce/cart';
import { CatalogPage, ProductPage, CartPage, CheckoutPage, ServicePage, RealizationsPage, AdvicePage, AboutPage, ContactPage, AdminPage } from './PlatformPages';
import './home.css';
import './catalog.css';
import './planner.css';

const ids: ConceptId[] = ['a','b','c'];
const views: {id:ViewId;label:string}[] = [
 {id:'domov',label:'Titulka'}, {id:'katalog',label:'Katalóg'}, {id:'produkt',label:'Detail produktu'},
 {id:'planovac',label:'Plánovač'}, {id:'identita',label:'Paleta a písmo'},
];
function Arrow({diagonal=false}:{diagonal?:boolean}) {return <span aria-hidden="true">{diagonal?'↗':'→'}</span>}
function Mark() {return <span className="brand-mark" aria-hidden="true"><i/><i/><i/><i/></span>}

function Comparison() {
 const [device,setDevice] = useState<'desktop'|'mobile'>('desktop');
 const [selected,setSelected] = useState<ConceptId>('a');
 return <div className="review-home">
  <header className="review-header"><Link to="/" className="review-brand"><Mark/> Drevené terasy <span>/ dizajnové štúdio</span></Link><span className="phase-pill">ETAPA 0 · NA SCHVÁLENIE</span></header>
  <main>
   <section className="review-intro"><p className="review-kicker">TRI POHĽADY NA JEDNU ZNAČKU</p><h1>Vaša terasa.<br/><em>Nový priestor pre značku.</em></h1><p>Navrhni → Nakúp → Zrealizuj. Vyberte si vizuálny smer pre platformu, ktorá spojí materiál, presný návrh a realizáciu.</p><div className="review-note">Toto sú dizajnové prototypy. Produkty sú demo, ceny ani montážne parametre nie sú overené. Identita je pracovná a fotografie sú ilustračné vizuály vytvorené pomocou AI.</div></section>
   <section className="concept-grid" aria-label="Dizajnové koncepty">{ids.map(id=><article className={`concept-card preview-${id}`} key={id}>
    <Link to={`/${id}/domov`} className="concept-cover" aria-label={`Otvoriť koncept ${id.toUpperCase()} – ${concepts[id].name}`}>
     {id==='c'?<div className="cover-c"><span>Váš priestor.<br/>Váš návrh.</span><div className="cover-deck"><i/><i/><i/><i/><i/><i/><i/><i/></div><small>2D ↔ 3D</small></div>:<img src={asset(concepts[id].hero)} alt="Ilustračná drevená terasa"/>}
     <span className="concept-letter">{id.toUpperCase()}</span>{id==='a'&&<span className="cover-a-title">Prirodzene<br/><em>doma.</em></span>}{id==='b'&&<span className="cover-b-title">PRIESTOR.<br/>MATERIÁL.<br/>DETAIL.</span>}
    </Link><div className="concept-card-body"><span className="review-kicker">KONCEPT {id.toUpperCase()}</span><h2>{concepts[id].name}</h2><p>{concepts[id].subtitle}</p><div className="mini-palette">{concepts[id].colors.map(color=><span key={color} style={{background:color}} title={color}/>)}</div><Link className="review-open" to={`/${id}/domov`}>Preskúmať návrh <Arrow/></Link><div className="concept-view-links">{views.slice(1).map(view=><Link key={view.id} to={`/${id}/${view.id}`}>{view.label}</Link>)}</div></div>
   </article>)}</section>
   <section className="review-live"><div className="review-live-head"><div><p className="review-kicker">OTVORTE, PREKLIKAJTE, POROVNAJTE</p><h2>Živý náhľad.</h2></div><div className="review-controls"><div className="review-segment" aria-label="Koncept">{ids.map(id=><button key={id} aria-pressed={selected===id} onClick={()=>setSelected(id)}>{id.toUpperCase()}</button>)}</div><div className="review-segment" aria-label="Zariadenie"><button aria-pressed={device==='desktop'} onClick={()=>setDevice('desktop')}>Desktop</button><button aria-pressed={device==='mobile'} onClick={()=>setDevice('mobile')}>Mobil</button></div></div></div><div className={`frame-stage frame-${device}`}><iframe title={`Živý ${device==='mobile'?'mobilný':'desktopový'} náhľad konceptu ${selected.toUpperCase()}`} src={`${import.meta.env.BASE_URL}?embed=1#/${selected}/domov`} key={selected+device}/></div><p className="frame-caption">Mobilný náhľad má šírku 390 px. Na iPhone otvorte priamo ktorýkoľvek návrh vyššie.</p></section>
   <section className="review-next"><span>ĎALŠÍ KROK</span><h2>Najskôr váš výber.<br/>Potom finálny dizajn.</h2><p>Vyberte A, B alebo C a napíšte, čo zachovať a čo upraviť. Na ďalšiu etapu prejdeme až po vašom výslovnom schválení.</p><a href={`${import.meta.env.BASE_URL}docs/analyza.html`}>Prečítať analýzu a architektúru <Arrow diagonal/></a></section>
  </main><footer className="review-footer">Drevené terasy · Etapa 0 <span>Žiadne platby ani objednávky sa nevykonávajú.</span></footer>
 </div>;
}

function ReviewToolbar({concept,view}:{concept:ConceptId;view:string}) {
 const location=useLocation();
 return <aside className="review-toolbar" aria-label="Porovnanie návrhov"><Link to="/" className="back-review">← Porovnanie</Link><div className="theme-switch">{ids.map(id=><Link to={`/${id}/${view}${location.search}${location.hash??''}`} key={id} aria-current={concept===id?'page':undefined}>{id.toUpperCase()}<span> {concepts[id].name}</span></Link>)}</div><span className="toolbar-phase">DIZAJNOVÝ PROTOTYP</span></aside>;
}
function SiteHeader({concept}:{concept:ConceptId}) {
 const [open,setOpen]=useState(false);
 const location=useLocation();
 useEffect(()=>setOpen(false),[location.pathname,location.search]);
 return <header className="site-header"><div className="header-inner"><Link to={`/${concept}/domov`} className="site-brand"><Mark/><span>Drevené<br/><strong>terasy</strong><small>{concept==='b'?'MATERIÁL. NÁVRH. REALIZÁCIA.':'navrhni · nakúp · zrealizuj'}</small></span></Link><button className="mobile-menu" aria-label={open?'Zavrieť navigáciu':'Otvoriť navigáciu'} aria-expanded={open} onClick={()=>setOpen(!open)}>{open?'✕':'☰'}</button><nav className={open?'site-nav is-open':'site-nav'} aria-label="Hlavná navigácia">{nav.map(item=><Link key={item.view} to={`/${concept}/${item.view}`} aria-current={location.pathname.endsWith(item.view)?'page':undefined}>{item.label}</Link>)}<Link className="nav-cta" to={`/${concept}/planovac`}>{concept==='b'?'NAVRHNÚŤ TERASU':'Navrhnúť terasu'} <Arrow diagonal/></Link></nav></div></header>;
}
function Footer({concept}:{concept:ConceptId}) {
 return <footer className="site-footer"><div className="section-inner footer-main"><div><Link className="footer-brand" to={`/${concept}/domov`}>Drevené terasy<span>Priestor, ktorý patrí vám.</span></Link><p>Návrh · materiál · realizácia</p></div><div><h3>Preskúmať</h3><Link to={`/${concept}/katalog`}>Terasové dosky</Link><Link to={`/${concept}/katalog?prislusenstvo=1`}>Príslušenstvo</Link><Link to={`/${concept}/planovac`}>Plánovač terasy</Link></div><div><h3>Spolu s vami</h3><Link to={`/${concept}/realizacia`}>Realizácia terás</Link><Link to={`/${concept}/poradna`}>Poradňa</Link><Link to={`/${concept}/realizacia#o-nas`}>O nás</Link><Link to={`/${concept}/realizacia#kontakt`}>Kontakt</Link></div><div><h3>Naša značka</h3><a href="https://www.instagram.com/dreveneterasy" target="_blank" rel="noreferrer">Instagram ↗</a><a href="https://www.facebook.com/share/17q1RTU6bu/" target="_blank" rel="noreferrer">Facebook ↗</a><Link to={`/${concept}/identita`}>Paleta a typografia</Link><span>Košík · v ďalšej etape</span></div></div><div className="section-inner footer-bottom"><span>© Drevené terasy · dizajnový návrh {concept.toUpperCase()}</span><span>Demo produkty · AI vizuály · bez objednávok</span></div></footer>;
}

function Identity({concept}:{concept:ConceptId}) {
 const c=concepts[concept];
 return <main className="identity-page section-inner"><p className="eyebrow">KONCEPT {concept.toUpperCase()} / PRACOVNÁ IDENTITA</p><h1>{c.name}</h1><p className="identity-lead">{c.subtitle} Tento návrh ešte nenahrádza vaše existujúce logo. Finálnu identitu zladíme s podkladmi značky.</p><section className="palette-grid">{c.colors.map((color,i)=><div key={color}><div style={{background:color}}/><span>{['Pozadie','Základ','Akcent','Doplnok'][i]}</span><code>{color}</code></div>)}</section><section className="type-specimen"><p className="eyebrow">TYPOGRAFIA / {c.fonts}</p><h2>Priestor pre<br/><em>vaše leto.</em></h2><p className="type-alphabet">Aa Bb Cc Čč Dd Ďď Ee Ff Gg Hh Ii Jj Kk Ll Ľľ Mm Nn Ňň Oo Pp Qq Rr Ss Šš Tt Ťť Uu Vv Ww Xx Yy Zz Žž</p><p>Jednoduché slová. Presné údaje. Zrozumiteľný návrh od prvého rozmeru po posledný detail.</p></section><div className="identity-actions"><Link className="button button-primary" to={`/${concept}/domov`}>Pozrieť titulku <Arrow/></Link><Link className="button button-ghost" to={`/${concept}/planovac`}>Rozhranie plánovača <Arrow/></Link></div></main>;
}
function Service({concept}:{concept:ConceptId}) {
 const [sent,setSent]=useState(false);
 return <main className="service-page"><section className="service-hero section-inner"><div><p className="eyebrow">OD PRVÉHO NÁČRTU PO HOTOVÚ TERASU</p><h1>Terasa na mieru.<br/><em>S nami pri každom kroku.</em></h1><p>Návrh, technické poradenstvo, výber a dodávka materiálu, podkladová konštrukcia aj kompletná montáž.</p><Link to={`/${concept}/realizacia#dopyt`} className="button button-primary">Naplánovať realizáciu <Arrow/></Link></div><figure><img src={asset(concepts[concept].hero)} alt="Ilustračný návrh drevenej terasy pri dome"/><figcaption>Ilustračný vizuál · AI. Skutočné realizácie doplníme z vašich fotografií.</figcaption></figure></section><section className="service-steps section-inner"><p className="eyebrow">JEDEN PROJEKT, PREHĽADNÝ POSTUP</p><div>{['Porozumieme vášmu priestoru','Vyberieme vhodný materiál','Pripravíme konštrukciu a montáž'].map((title,i)=><article key={title}><span>0{i+1}</span><h2>{title}</h2><p>{['Rozmery, miesto, výška a spôsob využitia terasy.','Spoločne posúdime vzhľad, podklad a požiadavky na údržbu.','Individuálne riešenie nadväzujúce na technický návrh.'][i]}</p></article>)}</div></section><section className="service-inquiry section-inner" id="dopyt"><div><p className="eyebrow">REALIZÁCIA TERÁS</p><h2>Povedzte nám<br/>o vašom priestore.</h2><p>Ukážka dopytového formulára. Údaje ani fotografie sa nikam neposielajú.</p></div><form onSubmit={event=>{event.preventDefault();setSent(true);}}><div className="form-pair"><label>Dĺžka terasy (m)<input type="number" min="0.1" max="100" step="0.1" placeholder="4,8" required/></label><label>Šírka terasy (m)<input type="number" min="0.1" max="100" step="0.1" placeholder="3,2" required/></label></div><label>Miesto realizácie<input placeholder="Mesto alebo obec" required maxLength={100}/></label><div className="form-pair"><label>Vaše meno<input autoComplete="name" required maxLength={100}/></label><label>E-mail<input type="email" autoComplete="email" required maxLength={254}/></label></div><label>Vaša predstava<textarea rows={3} maxLength={1000} placeholder="Materiál, podklad, termín…"/></label><label className="file-input">Fotografie priestoru<input type="file" accept="image/*" multiple/><small>V tejto ukážke zostávajú iba na vašom zariadení.</small></label><button className="button button-primary" type="submit">Vyskúšať formulár <Arrow/></button>{sent&&<p role="status" className="form-status">Ukážka formulára je vyplnená. Žiadny dopyt nebol odoslaný.</p>}</form></section><section id="kontakt" className="service-contact section-inner"><p className="eyebrow">KONTAKT A O NÁS</p><h2>Za značkou je váš tím.</h2><p id="o-nas">Overené kontaktné údaje, príbeh značky a vaše realizácie doplníme pred spustením. Zatiaľ nás nájdete na <a href="https://www.instagram.com/dreveneterasy" target="_blank" rel="noreferrer">Instagrame ↗</a>.</p></section></main>;
}
function Advice({concept}:{concept:ConceptId}) {
 return <main className="advice-page section-inner"><p className="eyebrow">PORADŇA / NÁVRH OBSAHU</p><h1>Dobrý návrh sa začína<br/><em>správnou otázkou.</em></h1><p>Šesť tém, ktoré pomôžu zákazníkovi rozhodnúť sa. Odborný obsah doplníme z overených podkladov.</p><div className="advice-grid">{['Drevo alebo WPC?','Ako vybrať drevinu','Podkladová konštrukcia','Montáž a napojenie dosiek','Údržba počas roka','Ako zamerať terasu'].map((title,i)=><article key={title}><span>0{i+1} / TÉMA</span><h2>{title}</h2><p>Pripravovaný odborný článok. Montážne odporúčania budú vychádzať z konkrétneho produktu.</p><Link to={`/${concept}/planovac`}>Preskúmať plánovač <Arrow/></Link></article>)}</div></main>;
}
function ConceptSite() {
 const {concept:rawConcept,view:rawView}=useParams();
 const location=useLocation();
 const concept=ids.includes(rawConcept as ConceptId)?rawConcept as ConceptId:null;
 const view=rawView??'domov';
 const embedded=new URLSearchParams(window.location.search).get('embed')==='1';
 useEffect(()=>{if(location.hash){document.getElementById(location.hash.slice(1))?.scrollIntoView();}else{window.scrollTo(0,0);}if(concept)document.title=`${concepts[concept].name} · Drevené terasy · dizajnový návrh`;},[location.pathname,location.search,location.hash,concept]);
 if(!concept)return <Navigate to="/" replace/>;
 return <div className={`concept concept-${concept}`}>{!embedded&&<ReviewToolbar concept={concept} view={view}/>}<SiteHeader concept={concept}/>{view==='domov'?<Home concept={concept}/>:view==='katalog'?<Catalog concept={concept}/>:view==='produkt'?<ProductDetail concept={concept}/>:view==='planovac'?<Planner concept={concept}/>:view==='identita'?<Identity concept={concept}/>:view==='realizacia'?<Service concept={concept}/>:view==='poradna'?<Advice concept={concept}/>:<Navigate to={`/${concept}/domov`} replace/>}<Footer concept={concept}/></div>;
}
export default function App(){return <CartProvider><Routes><Route element={<PlatformShell/>}><Route path="/" element={<Homepage2027/>}/><Route path="/2027" element={<Homepage2027/>}/><Route path="/terasove-dosky" element={<CatalogPage/>}/><Route path="/masivne-drevo" element={<Navigate to="/terasove-dosky?category=massive" replace/>}/><Route path="/thermowood" element={<Navigate to="/terasove-dosky?category=thermo" replace/>}/><Route path="/wpc-terasy" element={<Navigate to="/terasove-dosky?category=wpc" replace/>}/><Route path="/prislusenstvo" element={<CatalogPage accessories/>}/><Route path="/produkt/:productId" element={<ProductPage/>}/><Route path="/planovac" element={<Planner2027/>}/><Route path="/realizacie" element={<RealizationsPage/>}/><Route path="/realizacia-na-kluc" element={<ServicePage/>}/><Route path="/pod-povrchom" element={<AcademyIndex/>}/><Route path="/pod-povrchom/kniznica" element={<Portal/>}/><Route path="/pod-povrchom/sprievodca/:topic" element={<Guide/>}/><Route path="/pod-povrchom/04-podkonstrukcie" element={<SubstructureManual/>}/><Route path="/pod-povrchom/detaily" element={<DetailsHub/>}/><Route path="/pod-povrchom/technicky-katalog" element={<TechnicalCatalog/>}/><Route path="/pod-povrchom/:slug" element={<LibraryManual/>}/><Route path="/pod-povrchom/clanky/:slug" element={<EditorialArticle/>}/><Route path="/poradna/:articleId?" element={<AdvicePage/>}/><Route path="/o-nas" element={<AboutPage/>}/><Route path="/kontakt" element={<ContactPage/>}/><Route path="/kosik" element={<CartPage/>}/><Route path="/pokladna" element={<CheckoutPage/>}/><Route path="/admin" element={<AdminPage/>}/><Route path="/pravne-informacie" element={<LegalPreview/>}/></Route><Route path="/atelier/:view?" element={<Navigate to="/2027" replace/>}/><Route path="/archiv" element={<Navigate to="/2027" replace/>}/><Route path="/:concept/:view?" element={<Navigate to="/2027" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes></CartProvider>}

// Named exports also support the offline, static design review export.
export { Comparison, ConceptSite };


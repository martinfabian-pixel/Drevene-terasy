import { useState } from 'react';
import { Link } from 'react-router-dom';
import { asset, type ConceptId } from './data';
import './home.css';

const route = (concept: ConceptId, view: string) => `/${concept}/${view}`;
const Arrow = ({ diagonal = false }: { diagonal?: boolean }) => <span aria-hidden="true">{diagonal ? '↗' : '→'}</span>;

function TerraceDrawing({ tone = 'natural', flat = false, technical = false }: { tone?: string; flat?: boolean; technical?: boolean }) {
  const palette: Record<string, string[]> = {
    natural: ['#bb936d', '#cfaa83', '#aa7d56', '#ddbc97'],
    thermo: ['#855a3e', '#9d7050', '#724b35', '#ac805d'],
    wpc: ['#626b64', '#7b827b', '#505b55', '#91978d'],
  };
  const shades = palette[tone] || palette.natural;
  const boards = Array.from({ length: 20 }, (_, i) => i);
  return <svg className={`terrace-drawing ${technical ? 'is-technical' : ''}`} viewBox="0 0 720 500" role="img" aria-label={flat ? 'Ilustračný pôdorys terasy s doskami' : 'Ilustračný priestorový návrh terasy s doskami'}>
    <defs>
      <filter id={`scene-shadow-${tone}-${flat}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="13" /></filter>
      <pattern id={`scene-grid-${tone}-${flat}`} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="currentColor" strokeWidth=".6" opacity=".13" /></pattern>
    </defs>
    <rect x="20" y="20" width="680" height="450" fill={`url(#scene-grid-${tone}-${flat})`} />
    {flat ? <g>
      <rect x="151" y="111" width="440" height="276" fill="#000" opacity=".09" transform="translate(0 12)" />
      {boards.map(i => <g key={i}><rect x="151" y={111 + i * 13.8} width="440" height="12.1" fill={shades[i % 4]} /><path d={`M164 ${115 + i * 13.8}h174m17 2h219`} stroke="#fff" opacity=".18" strokeWidth=".7" /></g>)}
      <path d="M151 91V62M591 91V62M151 76H591M143 68l16 16m424-16 16 16M127 111H99M127 387H99M113 111V387M105 103l16 16m-16 260 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <text x="370" y="60" textAnchor="middle" fill="currentColor" fontSize="13" fontFamily="monospace">4 800 mm</text><text x="89" y="260" transform="rotate(-90 89 260)" textAnchor="middle" fill="currentColor" fontSize="13" fontFamily="monospace">3 200 mm</text>
    </g> : <g>
      <ellipse cx="358" cy="367" rx="224" ry="49" fill="#152b20" opacity=".15" filter={`url(#scene-shadow-${tone}-${flat})`} />
      <path d="M143 250l298 103 163-130v22L441 375 143 273z" fill={shades[2]} />
      <path d="M143 250l298 103v22L143 273z" fill="#694c36" opacity=".65" />
      <g transform="matrix(.83 .285 -.50 .39 306 121)">
        <rect x="0" y="0" width="360" height="327" fill="#352d26" />
        {boards.map(i => <g key={i}><rect x="0" y={i * 16.35} width="360" height="14.2" fill={shades[i % 4]} /><path d={`M12 ${i * 16.35 + 4}c61-2 122 3 189 0s100-2 149 0M18 ${i * 16.35 + 10}h143m25 0h126`} fill="none" stroke="#f4e9d3" opacity=".2" strokeWidth=".8" /></g>)}
      </g>
      <path d="M119 267l298 104M130 255l-20 26M428 359l-20 26M463 383l166-131M452 374l23 20M618 243l23 20" fill="none" stroke="currentColor" strokeWidth="1" opacity=".65" />
      <text x="253" y="337" transform="rotate(19 253 337)" fill="currentColor" fontSize="13" fontFamily="monospace">4 800 mm</text><text x="556" y="324" transform="rotate(-38 556 324)" fill="currentColor" fontSize="13" fontFamily="monospace">3 200 mm</text>
      {technical && <g stroke="currentColor" fill="none" opacity=".5"><path d="M306 121V70H555M143 250H62V401M604 223h61V98" strokeDasharray="3 5" /><circle cx="306" cy="121" r="5" /><circle cx="143" cy="250" r="5" /><circle cx="604" cy="223" r="5" /></g>}
    </g>}
  </svg>;
}

function Journey({ concept }: { concept: ConceptId }) {
  const steps = [
    { number: '01', title: 'Navrhni', description: 'Dajte svojmu priestoru tvar. Vyberte materiál a pozrite si svoju predstavu v plánovači.', path: 'planovac', action: 'Objaviť plánovač' },
    { number: '02', title: 'Nakúp', description: 'Dosky, podklad aj drobnosti, ktoré držia terasu pokope. Všetko pre jeden premyslený celok.', path: 'katalog', action: 'Preskúmať materiály' },
    { number: '03', title: 'Zrealizuj', description: 'Od prvého rozhodnutia po poslednú dosku. Spojte sa s nami a preberieme realizáciu vašej terasy.', path: 'realizacia', action: 'Realizácia na kľúč' },
  ];
  return <div className={`home-journey home-journey-${concept}`}>{steps.map(step => <Link to={route(concept, step.path)} className="home-journey-step" key={step.number}>
    <span className="journey-number">{step.number}</span><h3>{step.title}<Arrow /></h3><p>{step.description}</p><span className="journey-action">{step.action}<Arrow diagonal /></span>
  </Link>)}</div>;
}

const materials = [
  { label: 'Masívne drevo', subtitle: 'Originál od prírody', className: 'natural', id: 'drevo' },
  { label: 'Thermowood', subtitle: 'Drevo s novým charakterom', className: 'thermo', id: 'thermo' },
  { label: 'WPC', subtitle: 'Moderný pohľad na terasu', className: 'wpc', id: 'wpc' },
];

function Atmosphere({ concept }: { concept: ConceptId }) {
  const photographs = {
    garden: { asset: 'terrace-garden-v2.webp', title: 'Záhrada pokračuje terasou.', alt: 'Ilustračná drevená terasa v zelenej záhrade pri dome' },
    detail: { asset: 'terrace-detail-v2.webp', title: 'Kresba dreva. Čistý detail.', alt: 'Ilustračný detail terasových dosiek a dreveného stupňa' },
    architecture: { asset: 'architecture-terrace.webp', title: 'Priestor medzi domom a záhradou.', alt: 'Ilustračná drevená terasa pri modernej architektúre' },
  };
  const images = concept === 'a'
    ? [photographs.architecture, photographs.detail]
    : concept === 'b'
      ? [photographs.detail, photographs.garden, photographs.architecture]
      : [photographs.garden, photographs.detail];
  return <section className={`home-atmosphere atmosphere-${concept} section-inner`} aria-labelledby={`atmosphere-title-${concept}`}>
    <div className="atmosphere-heading">
      <p className="eyebrow">{concept === 'a' ? 'Malé chvíle. Vlastný priestor.' : concept === 'b' ? 'ATMOSFÉRA / MATERIÁL / DETAIL' : 'Z NÁVRHU MIESTO NA ŽIVOT'}</p>
      <h2 id={`atmosphere-title-${concept}`}>Priestor pre<br /><span>život vonku.</span></h2>
      <p className="atmosphere-intro">{concept === 'a' ? 'Prvé slnko, pokoj v záhrade a drevo pod nohami. Takto si predstavujeme miesto, ktoré patrí vám.' : concept === 'b' ? 'Štruktúra dosky. Línia stupňa. Prechod medzi domom a záhradou. Atmosféru vytvárajú premyslené detaily.' : 'Za každým rozmerom je budúca chvíľa. Ranná káva, večerné posedenie alebo jednoducho čas pre seba.'}</p>
    </div>
    <div className="atmosphere-photo-grid">{images.map((photograph, index) => <figure className={`atmosphere-photo atmosphere-photo-${index + 1}`} key={photograph.asset}>
      <div className="atmosphere-image-frame"><img src={asset(photograph.asset)} alt={photograph.alt} loading="lazy" decoding="async" /></div>
      <figcaption><span>{photograph.title}</span><span>Ilustračný vizuál · AI</span></figcaption>
    </figure>)}</div>
    <div className="atmosphere-footer"><p>Obrazová štúdia atmosféry · AI vizuály. Skutočné fotografie našich realizácií doplníme z vlastných podkladov.</p><Link className="home-text-link" to={route(concept, 'realizacia')}>Prebrať váš priestor <Arrow diagonal /></Link></div>
  </section>;
}

function NatureHome() {
  return <>
    <section className="nature-hero-immersive" aria-labelledby="nature-home-title">
      <figure className="nature-hero-backdrop"><img src={asset('terrace-garden-v2.webp')} alt="Ilustračná drevená terasa v stredoeurópskej záhrade" fetchPriority="high" /><figcaption>Ilustračný vizuál · AI</figcaption></figure>
      <div className="nature-hero-shade" aria-hidden="true" />
      <div className="section-inner nature-hero-content"><div className="nature-photo-copy"><p className="eyebrow">Prirodzene bližšie k domovu</p><h1 id="nature-home-title">Váš priestor.<br />Pod <em>holým nebom.</em></h1><p className="home-hero-description">Ranná káva. Bosé nohy. Dlhé letné večery.<br />{' '}Začína sa to terasou, ktorá je presne vaša.</p>
        <div className="home-actions"><Link className="button button-primary" to="/a/planovac">Navrhnúť moju terasu <Arrow /></Link><Link className="home-text-link" to="/a/katalog">Objaviť materiály <Arrow diagonal /></Link></div>
        <div className="nature-hero-foot"><span className="nature-small-line" /><span>Drevo. Detail. Dobrý pocit.</span></div>
      </div></div>
    </section>
    <section className="nature-path section-inner"><div className="home-section-heading"><p className="eyebrow">Od predstavy po hotový priestor</p><h2>Jedna terasa.<br /><em>Tri dobré kroky.</em></h2><p>Vyberte si, kde sa vaša cesta začne.<br />Pri návrhu, pri materiáli alebo pri rozhovore.</p></div><Journey concept="a" /></section>
    <Atmosphere concept="a" />
    <section className="nature-materials"><div className="section-inner"><div className="home-section-heading"><p className="eyebrow">Materiál robí rozdiel</p><h2>Charakter, ktorý<br /><em>cítite na dotyk.</em></h2><Link className="home-text-link" to="/a/katalog">Všetky materiály <Arrow diagonal /></Link></div><div className="nature-material-grid">{materials.map((material, i) => <Link className="nature-material" to={`/a/produkt?id=${material.id}`} key={material.id}><div className={`home-material-surface surface-${material.className}`}><span className="material-number">0{i + 1}</span><span className="material-surface-arrow"><Arrow diagonal /></span></div><div className="material-caption"><h3>{material.label}</h3><p>{material.subtitle}</p></div></Link>)}</div><p className="home-demo-note">Ukážkové materiálové rodiny · konkrétny sortiment a parametre doplníme z overených podkladov.</p></div></section>
    <section className="nature-planner"><div className="section-inner nature-planner-inner"><div className="nature-planner-art"><TerraceDrawing tone="natural" /><span className="planner-art-caption">Vaša predstava dostáva tvar.</span></div><div className="nature-planner-copy"><p className="eyebrow">Priestor pre vaše nápady</p><h2>Najprv si ju<br /><em>predstavte.</em></h2><p>Vyskúšajte si rozhranie plánovača. Tvar, materiál a pohľad na budúcu terasu na jednom mieste.</p><Link className="button" to="/a/planovac">Otvoriť návrh plánovača <Arrow /></Link><small>Dizajnová ukážka · materiálový výpočet ešte nie je aktívny.</small></div></div></section>
    <section className="nature-install section-inner"><figure><img src={asset('architecture-terrace.webp')} alt="Ilustračná terasa pri modernej architektúre" loading="lazy" /><figcaption>Ilustračný vizuál · AI</figcaption></figure><div><p className="eyebrow">Realizácia terás na kľúč</p><h2>Vy si užívajte.<br /><em>My riešime detaily.</em></h2><p>Výber materiálu, návrh podkladu, dodávka a montáž. Preberieme váš priestor a pripravíme ďalší krok.</p><Link className="home-text-link" to="/a/realizacia">Poďme sa porozprávať <Arrow diagonal /></Link></div></section>
  </>;
}

function ArchitecturalHome() {
  return <>
    <section className="architect-hero section-inner"><div className="architect-hero-top"><p className="eyebrow">DREVENÉ TERASY — NÁVRH / MATERIÁL / REALIZÁCIA</p><span className="architect-index">KONCEPT B / 01</span></div><div className="architect-title-row"><h1>PRIESTOR<br />MÁ <span>CHARAKTER.</span></h1><Link to="/b/planovac" className="architect-circle" aria-label="Navrhnúť terasu"><Arrow diagonal /><span>NAVRHNÚŤ<br />TERASU</span></Link></div><div className="architect-hero-bottom"><p>Premyslený od prvej línie.<br />Postavený na správnom materiáli.</p><p>Navrhni. Nakúp. Zrealizuj.<br /><Link to="/b/katalog">Preskúmať materiály <Arrow /></Link></p></div><figure className="architect-hero-image"><img src={asset('architecture-terrace.webp')} alt="Ilustračná architektonická terasa pri modernom dome" fetchPriority="high" /><figcaption><span>01 — ŽIVOT ZA PRAHOM</span><span>Ilustračný vizuál · AI</span></figcaption></figure></section>
    <section className="architect-intro section-inner"><span className="architect-chapter">01 / MYŠLIENKA</span><div><h2>Dobrá terasa<br />sa začína<br /><span>dobrým návrhom.</span></h2><p>Niekoľko štvorcových metrov mení spôsob, akým bývate. Preto sa pozeráme na priestor ako na celok — od kresby dreva až po posledný montážny detail.</p></div></section>
    <Atmosphere concept="b" />
    <section className="architect-material-section section-inner"><div className="architect-section-title"><span className="architect-chapter">02 / MATERIÁLY</span><h2>TRI ROZDIELNE<br />RUKOPISY.</h2><Link to="/b/katalog" className="home-text-link">Katalóg materiálov <Arrow diagonal /></Link></div><div className="architect-material-list">{materials.map((material, i) => <Link to={`/b/produkt?id=${material.id}`} className="architect-material-row" key={material.id}><span className="architect-material-index">0{i + 1}</span><div className={`architect-material-sample surface-${material.className}`} /><h3>{material.label}</h3><span className="architect-material-description">{material.subtitle}</span><span className="architect-row-arrow"><Arrow diagonal /></span></Link>)}</div><p className="home-demo-note">Materiálové ukážky · produktové parametre a dostupnosť čakajú na overené údaje.</p></section>
    <section className="architect-plan"><div className="section-inner architect-plan-inner"><div className="architect-plan-copy"><span className="architect-chapter">03 / PRESNOSŤ</span><h2>OD LÍNIE<br />K <span>PRIESTORU.</span></h2><p>Náčrt, rozmery, smer dosiek.<br />Plánovač, ktorý má priestor pre vašu predstavu aj technické rozhodnutia.</p><Link to="/b/planovac" className="button">Preskúmať plánovač <Arrow diagonal /></Link><small>Ilustračná geometria · ukážka rozhrania bez overeného výpočtu.</small></div><div className="architect-plan-drawing"><div className="drawing-topline"><span>DT / STUDY_01</span><span>NÁVRH TERASY</span></div><TerraceDrawing tone="thermo" technical /><div className="drawing-bottomline"><span>2D ↔ 3D</span><span>KÓTY / MATERIÁL / VRSTVY</span></div></div></div></section>
    <section className="architect-process section-inner"><div className="architect-section-title"><span className="architect-chapter">04 / CELÝ PROCES</span><h2>JEDNA PREDSTAVA.<br />OD ZAČIATKU DO KONCA.</h2></div><Journey concept="b" /></section>
    <section className="architect-contact section-inner"><span className="architect-chapter">05 / VÁŠ PROJEKT</span><Link to="/b/realizacia"><h2>POĎME JU<br /><span>ZREALIZOVAŤ.</span></h2><span className="architect-contact-arrow"><Arrow diagonal /></span></Link><p>Porozprávajte nám o svojom priestore.</p></section>
  </>;
}

function InteractiveHome() {
  const [material, setMaterial] = useState('natural');
  const [flat, setFlat] = useState(false);
  const selected = materials.find(item => item.className === material)!;
  return <>
    <section className="interactive-hero"><div className="section-inner interactive-hero-inner"><div className="interactive-hero-copy"><p className="eyebrow"><span className="interactive-status-dot" /> OD NÁPADU K VLASTNEJ TERASE</p><h1>Vonkajší priestor.<br /><span>Podľa vás.</span></h1><p>Materiál, návrh a realizácia v jednej predstave. Začnite tým, ako by mala vyzerať vaša terasa.</p><Link className="button button-primary" to="/c/planovac">Začať môj návrh <Arrow /></Link><div className="interactive-hero-micro"><span>01 Navrhni</span><Arrow /><span>02 Nakúp</span><Arrow /><span>03 Zrealizuj</span></div></div><div className="interactive-scene"><div className="interactive-scene-top"><span><span className="scene-project-mark">DT</span> Váš prvý priestor</span><div className="scene-view-switch" aria-label="Zobrazenie ukážky"><button className={flat ? 'active' : ''} onClick={() => setFlat(true)} aria-pressed={flat}>2D</button><button className={!flat ? 'active' : ''} onClick={() => setFlat(false)} aria-pressed={!flat}>3D</button></div></div><div className="interactive-scene-canvas"><span className="scene-canvas-label">VIZUÁLNY NÁVRH / 01</span><TerraceDrawing tone={material} flat={flat} /><span className="scene-dimension-tag">4,8 × 3,2 m <span>· ilustračné rozmery</span></span></div><div className="interactive-material-picker"><div><small>VÁŠ MATERIÁL</small><strong>{selected.label}</strong></div><div className="scene-swatches">{materials.map(item => <button key={item.id} className={`scene-swatch surface-${item.className} ${material === item.className ? 'selected' : ''}`} onClick={() => setMaterial(item.className)} aria-label={`Zobraziť materiál ${item.label}`} aria-pressed={material === item.className}>{material === item.className && <span aria-hidden="true">✓</span>}</button>)}</div><span className="scene-picker-hint">Skúste iný povrch <Arrow /></span></div><p className="scene-demo-disclaimer">Interaktívna dizajnová ukážka. Výpočet materiálu a ceny nie je aktívny.</p></div></div><div className="interactive-feature-line section-inner"><span>VYBERTE MATERIÁL</span><span>POZRITE SI PRIESTOR</span><span>PREBERTE REALIZÁCIU</span><Link to="/c/planovac">Objaviť plánovač <Arrow diagonal /></Link></div></section>
    <Atmosphere concept="c" />
    <section className="interactive-material-section section-inner"><div className="home-section-heading"><p className="eyebrow">Každý priestor má svoju náladu</p><h2>Začnite tým,<br /><span>čo vám je blízke.</span></h2><Link to="/c/katalog" className="home-text-link">Preskúmať katalóg <Arrow diagonal /></Link></div><div className="interactive-material-grid">{materials.map((item, i) => <Link to={`/c/produkt?id=${item.id}`} className="interactive-material-card" key={item.id}><span className="interactive-card-label">MATERIÁL / 0{i + 1}</span><div className={`interactive-board-stack stack-${item.className}`}><span /><span /><span /></div><div className="interactive-material-card-bottom"><div><h3>{item.label}</h3><p>{item.subtitle}</p></div><Arrow diagonal /></div></Link>)}</div><p className="home-demo-note">Ukážkové materiály · ceny a technické pravidlá budú viazané na konkrétne overené produkty.</p></section>
    <section className="interactive-journey-section section-inner"><div className="interactive-journey-title"><p className="eyebrow">Všetko na seba nadväzuje</p><h2>Vaša cesta.<br /><span>Bez zbytočných odbočiek.</span></h2></div><Journey concept="c" /></section>
    <section className="interactive-life section-inner"><figure><img src={asset('nature-terrace.webp')} alt="Ilustračný pohľad na drevenú terasu s posedením" loading="lazy" /><figcaption>Ilustračný vizuál · AI</figcaption></figure><div className="interactive-life-copy"><p className="eyebrow">Z návrhu miesto na život</p><h2>Vymyslite si ju.<br /><span>My pomôžeme<br />s ďalším krokom.</span></h2><p>Potrebujete vybrať materiál alebo terasu kompletne zrealizovať? Začnime vašou predstavou.</p><Link to="/c/realizacia" className="button button-primary">Prebrať realizáciu <Arrow diagonal /></Link></div></section>
    <section className="interactive-final-cta section-inner"><div><p className="eyebrow">PRVÝ KROK JE VÁŠ</p><h2>Aká bude<br /><span>vaša terasa?</span></h2></div><Link to="/c/planovac" className="interactive-start-circle" aria-label="Otvoriť návrh plánovača"><Arrow diagonal /><span>ZAČAŤ<br />NÁVRH</span></Link></section>
  </>;
}

export default function Home({ concept }: { concept: ConceptId }) {
  if (concept === 'a') return <main><NatureHome /></main>;
  if (concept === 'b') return <main><ArchitecturalHome /></main>;
  return <main><InteractiveHome /></main>;
}

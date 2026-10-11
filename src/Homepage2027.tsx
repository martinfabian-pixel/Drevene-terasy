import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { asset } from './data';
import { useCart } from './commerce/cart';
import DeckScene2027 from './DeckScene2027';
import './homepage2027.css';

const links = [
  { label: 'Terasové dosky', to: '/terasove-dosky' },
  { label: 'Príslušenstvo', to: '/prislusenstvo' },
  { label: 'Plánovač', to: '/planovac' },
  { label: 'Realizácie', to: '/realizacie' },
  { label: 'Pod povrchom', to: '/pod-povrchom' },
  { label: 'Poradňa', to: '/poradna' },
  { label: 'O nás', to: '/o-nas' },
  { label: 'Kontakt', to: '/kontakt' },
];
const layers = ['Dosky', 'Jeden nosný rošt', 'Terče', 'Podklad'];
const gallery = [
  { image: 'architecture-home-2027.webp', alt: 'AI ilustrácia terasy pri súčasnom dome s drevenou fasádou' },
  { image: 'terrace-garden-v2.webp', alt: 'AI ilustrácia drevenej terasy otvorenej do záhrady' },
  { image: 'architecture-terrace.webp', alt: 'AI ilustrácia terasy pri minimalistickej architektúre' },
];

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="arch2027-arrow"><path d={diagonal ? 'M5 19 19 5M5 5h14v14' : 'M3 12h17m-7-7 7 7-7 7'} /></svg>;
}

function Symbol({ kind }: { kind: 'bag' | 'search' | 'leaf' | 'ruler' | 'layers' | 'build' | 'plus' }) {
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true" className="arch2027-symbol">
    {kind === 'bag' && <><path d="M6 10h20l1 18H5L6 10Z" /><path d="M11 12V8a5 5 0 0 1 10 0v4" /><path d="M11 15h.1M21 15h.1" /></>}
    {kind === 'search' && <><circle cx="13" cy="13" r="8" /><path d="m19 19 9 9" /></>}
    {kind === 'leaf' && <><path d="M9 27c0-11 7-18 17-23 1 9-4 18-15 19M9 27l-5-5M13 18l6-1M18 12l5 1" /><path d="M9 27v3" /></>}
    {kind === 'ruler' && <><path d="m5 25 21-21 4 4L9 29Z" /><path d="m10 20 3 3m2-8 3 3m2-8 3 3" /></>}
    {kind === 'layers' && <><path d="m3 11 13-7 13 7-13 7L3 11Zm0 7 13 7 13-7M3 24l13 7 13-7" /></>}
    {kind === 'build' && <><path d="M5 27h23M8 27V14h6v13m4 0V7h6v20M6 9l3-5 3 5M15 3h11" /></>}
    {kind === 'plus' && <path d="M6 16h20M16 6v20" />}
  </svg>;
}

function Brand() {
  return <Link to="/" className="arch2027-brand" aria-label="Drevené terasy, úvodná stránka"><span className="arch2027-brand-mark" aria-hidden="true"><i /><i /></span><span>DREVENÉ<br />TERASY</span></Link>;
}

export function Header2027() {
  const cart = useCart();
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.pathname, location.search]);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    focusable()[0]?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); }
      if (event.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleKey); toggle.current?.focus(); };
  }, [open]);
  return <header className="arch2027-header">
    <div className="arch2027-header-brand"><Brand /><p>PRÍRODA<br />V TVOJOM<br />PRIESTORE</p></div>
    <nav className="arch2027-desktop-nav" aria-label="Hlavná navigácia">{links.map(link => <Link key={link.label} to={link.to}>{link.label}</Link>)}</nav>
    <div className="arch2027-header-tools">
      <Link className="arch2027-search" to="/terasove-dosky" aria-label="Vyhľadať materiál"><Symbol kind="search" /></Link>
      <Link className="arch2027-cart" to="/kosik" aria-label={`Košík, ${cart.items.length} položiek`}><Symbol kind="bag" /><span>({cart.items.length})</span></Link>
      <Link to="/planovac" className="arch2027-header-cta">NAVRHNÚŤ<br />TERASU <Arrow /></Link>
      <button ref={toggle} data-testid="homepage-menu" className="arch2027-menu-toggle" aria-label="Otvoriť navigáciu" aria-expanded={open} aria-controls="arch2027-menu" onClick={() => setOpen(true)}><i /><i /><i /></button>
    </div>
    {open && <div id="arch2027-menu" ref={menu} data-testid="homepage-nav" className="arch2027-menu" role="dialog" aria-modal="true" aria-label="Navigácia">
      <div className="arch2027-menu-top"><Brand /><button aria-label="Zavrieť navigáciu" onClick={() => setOpen(false)}>×</button></div>
      <nav aria-label="Mobilná navigácia"><Link to="/" onClick={() => setOpen(false)}>Domov</Link>{links.map(link => <Link key={link.label} to={link.to} onClick={() => setOpen(false)}>{link.label}</Link>)}</nav>
      <Link className="arch2027-menu-search" to="/terasove-dosky"><Symbol kind="search" />Hľadať materiál <Arrow /></Link>
      <Link className="arch2027-menu-photo" to="/terasove-dosky"><img src={asset('terrace-detail-v2.webp')} alt="Ilustračný detail terasového dreva" /><span>MATERIÁLY,<br />KTORÉ MAJÚ CHARAKTER</span><Arrow /></Link>
    </div>}
  </header>;
}

function Dimensions() {
  return <svg className="arch2027-dimensions" viewBox="0 0 1000 820" fill="none" aria-hidden="true">
    <defs><marker id="arch2027-dimension-tip" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto-start-reverse"><path d="m0 0 6 3-6 3Z" fill="currentColor" /></marker></defs>
    <g className="arch2027-construction-lines"><path d="M60 621 682 806 975 389M63 457l622 177 290-382M154 606v135M669 447v350M914 214v385M310 201v-88M882 181V97M308 122l574 56M88 439l-2 167M227 376 85 442M906 303l47-21M900 438l51-23" /><path d="M310 137V74M882 190v-56" /></g>
    <g className="arch2027-dimension-measures"><path d="m310 112 572 58" markerStart="url(#arch2027-dimension-tip)" markerEnd="url(#arch2027-dimension-tip)" /><path d="M86 454v144" markerStart="url(#arch2027-dimension-tip)" markerEnd="url(#arch2027-dimension-tip)" /><path d="M950 288v133" markerStart="url(#arch2027-dimension-tip)" markerEnd="url(#arch2027-dimension-tip)" /></g>
    <g className="arch2027-dimension-labels"><text x="583" y="131">4000 mm</text><text x="11" y="533">2500 mm</text><text x="960" y="367">120 mm</text></g>
  </svg>;
}

function Hero() {
  const [layer, setLayer] = useState(0);
  const [assembled, setAssembled] = useState(false);
  const [modelActive, setModelActive] = useState(false);
  const selectLayer = (selected: number) => { setModelActive(true); setLayer(selected); };
  return <section className="arch2027-hero" aria-labelledby="arch2027-hero-title">
    <div className="arch2027-hero-main">
      <p className="arch2027-section-number arch2027-hero-number">03 <span /></p>
      <h1 id="arch2027-hero-title" className="arch2027-title"><span className="arch2027-title-black">PRIESTOR.</span><span className="arch2027-title-green">TVOJ.</span></h1>
      <p className="arch2027-hero-detail">PREMYSLENÉ<br />DO POSLEDNÉHO<br />DETAILU</p>
      <div className={`arch2027-construction${modelActive ? ' is-active' : ''}`}><div className="arch2027-hero-model"><DeckScene2027 active={modelActive} assembled={assembled} layer={layer} className="arch2027-hero-render" /></div><Dimensions /></div>
      <div className="arch2027-layer-legend" aria-label="Vrstvy terasy">{layers.map((name, index) => <button key={name} data-testid={`deck-layer-${index + 1}`} aria-pressed={layer === index + 1} onClick={() => selectLayer(layer === index + 1 ? 0 : index + 1)}><span>0{index + 1}</span>{name}</button>)}<span className="arch2027-layer-space">05 <span>VÁŠ PRIESTOR</span></span></div>
      <p className="arch2027-hero-mantra">DIZAJN.<br />MATERIÁL.<br />REALIZÁCIA.</p>
      <div className="arch2027-hero-start"><Link to="/planovac" className="arch2027-black-button">ZAČAŤ NAVRHOVAŤ <Arrow /></Link><Link to="/planovac" className="arch2027-circle-button" aria-label="Otvoriť plánovač terasy"><Arrow /></Link></div>
      <div className="arch2027-material-study"><img className="arch2027-study-photo" src={asset('architecture-terrace.webp')} alt="Ilustračný architektonický detail" /><img className="arch2027-study-grain" src={asset('material-drevo-2027.webp')} alt="Ilustračná kresba terasového dreva" /><span className="arch2027-study-number">03</span><p>FUNKČNÝ DIZAJN<br />SKUTOČNÉ MATERIÁLY<br />TRVALÁ HODNOTA</p></div>
      <button data-testid="deck-layer-next" className="arch2027-layer-plus" aria-label={layer === 0 ? 'Zvýrazniť dosky terasy' : 'Zvýrazniť ďalšiu vrstvu terasy'} onClick={() => selectLayer((layer + 1) % 5)}><Symbol kind="plus" /></button>
      <button data-testid="deck-discovery" className="arch2027-discover" onClick={() => { setModelActive(true); setAssembled(!assembled); }} aria-pressed={assembled}><span><Symbol kind="plus" /></span>{assembled ? <>ROZLOŽIŤ<br />KONŠTRUKCIU</> : <>OBJAVIŤ<br />KONŠTRUKCIU</>}</button>
      <p className="arch2027-hero-model-note" aria-live="polite">{layer ? `Zvýraznená vrstva: ${layers[layer - 1]}. ` : ''}Ilustračná konštrukcia a rozmery.</p>
      <div className="arch2027-slide-indicator" aria-hidden="true"><span className="is-current">01</span><span>02</span><span>03</span></div>
    </div>
    <figure className="arch2027-hero-photo"><img src={asset('architecture-home-2027.webp')} alt="AI ilustrácia terasy v lesnej záhrade pri modernom dome" /><figcaption><span className="arch2027-band-number">04</span>TERASY,<br />KTORÉ<br className="arch2027-desktop-break" /> PRESAHUJÚ<br />ŠTANDARD</figcaption><span className="arch2027-band-note">ILUSTRÁCIA · AI</span><div className="arch2027-mobile-scroll" aria-hidden="true"><span>SCROLL</span><Arrow /></div></figure>
  </section>;
}

type Shape = 'rectangle' | 'l' | 'u' | 'custom';
const shapeChoices: { id: Shape; name: string; path: string }[] = [
  { id: 'rectangle', name: 'Obdĺžnik', path: 'M8 9h50v34H8Z' },
  { id: 'l', name: 'L-tvar', path: 'M10 7h18v22h29v16H10Z' },
  { id: 'u', name: 'U-tvar', path: 'M8 8h15v22h20V8h15v38H8Z' },
  { id: 'custom', name: 'Vlastný tvar', path: 'M14 9h40l6 8-5 13 3 12H9l-3-13 8-10Z' },
];

function ShapeIcon({ shape }: { shape: Shape }) {
  const path = shapeChoices.find(item => item.id === shape)?.path;
  return <svg viewBox="0 0 66 54" aria-hidden="true"><path d={path} /></svg>;
}

function PlanPreview({ shape }: { shape: Shape }) {
  const outline = shape === 'l' ? 'M45 42h180v150h190v110H45Z' : shape === 'u' ? 'M45 42h130v145h110V42h130v260H45Z' : shape === 'custom' ? 'M60 42h290l65 55-40 100 20 105H45l-15-90 30-80Z' : 'M45 42h370v260H45Z';
  return <svg className="arch2027-plan-drawing" viewBox="0 0 460 360" role="img" aria-label={`Ilustračný 2D pôdorys: ${shapeChoices.find(item => item.id === shape)?.name}`}><defs><pattern id="arch2027-plan-boards" width="17" height="17" patternUnits="userSpaceOnUse"><rect width="17" height="17" fill="#93724f" /><path d="M0 0v17" stroke="#292921" strokeWidth="2" /></pattern></defs><path d={outline} fill="url(#arch2027-plan-boards)" stroke="#C8FF32" strokeWidth="1.4" /><path d="M45 18h370M45 10v23m370-23v23M24 42v260M17 42h14m-14 260h14" stroke="#868b82" fill="none" /><text x="216" y="12" fill="#ededdf" fontSize="11">4,0 m</text><text x="4" y="178" fill="#ededdf" fontSize="11" transform="rotate(-90 4 178)">Ilustračný pôdorys</text></svg>;
}

function PlannerPreview() {
  const [mode, setMode] = useState<'2d' | '3d'>('3d');
  const [shape, setShape] = useState<Shape>('rectangle');
  return <section className="arch2027-planner" aria-labelledby="arch2027-planner-title" id="arch2027-planner">
    <div className="arch2027-planner-message"><p className="arch2027-section-number">02</p><h2 id="arch2027-planner-title">NAVRHNI.<br />VIZUALIZUJ.<br />OBJEDNAJ.<br />ZREALIZUJ.</h2></div>
    <div className="arch2027-planner-controls"><h3>PLÁNOVAČ TERÁS</h3><div className="arch2027-planner-steps"><span>TVAR</span><span>ROZMERY</span><span>MATERIÁL</span><span>3D NÁHĽAD</span><span>VÝSLEDOK</span></div><div className="arch2027-shapes" aria-label="Ukážka výberu tvaru">{shapeChoices.map(item => <button key={item.id} data-testid={`deck-shape-${item.id}`} aria-pressed={shape === item.id} onClick={() => { setShape(item.id); if (item.id !== 'rectangle') setMode('2d'); }}><ShapeIcon shape={item.id} /><span>{item.name}</span></button>)}</div><Link to="/planovac" className="arch2027-lime-button">ĎALEJ <Arrow /></Link><p className="arch2027-preview-note">Otvor plánovač pre presné rozmery, 2D / 3D a materiálový zoznam.</p></div>
    <div className="arch2027-planner-view"><div className="arch2027-view-switch" role="group" aria-label="Zobrazenie návrhu"><button data-testid="deck-view2d" aria-pressed={mode === '2d'} onClick={() => setMode('2d')}>2D</button><button data-testid="deck-view3d" aria-pressed={mode === '3d'} disabled={shape !== 'rectangle'} onClick={() => setMode('3d')}>3D</button></div>{mode === '3d' ? <div className="arch2027-planner-model"><DeckScene2027 active={false} assembled className="arch2027-planner-render" /></div> : <PlanPreview shape={shape} />}<span className="arch2027-preview-visual-note">{shape === 'rectangle' ? 'ILUSTRAČNÝ NÁHĽAD' : '3D TOHTO TVARU PRIPRAVUJEME'}</span></div>
  </section>;
}

function Materials() {
  const materials = [
    { name: 'MASÍVNE DREVO', subtitle: 'AUTENTICKÁ KRÁSA', image: 'material-drevo-2027.webp', kind: 'solid', to: '/masivne-drevo' },
    { name: 'THERMOWOOD', subtitle: 'TEPELNE UPRAVENÉ DREVO', image: 'material-thermo-2027.webp', kind: 'thermo', to: '/thermowood' },
    { name: 'WPC TERASY', subtitle: 'KOMPOZITNÝ MATERIÁL', image: 'material-wpc-2027.webp', kind: 'wpc', to: '/wpc-terasy' },
    { name: 'PRÍSLUŠENSTVO', subtitle: 'VŠETKO PRE MONTÁŽ', image: 'deck-exploded-2027-v2.webp', kind: 'accessories', to: '/prislusenstvo' },
  ];
  return <section className="arch2027-materials" aria-labelledby="arch2027-materials-title" id="arch2027-materials"><div className="arch2027-materials-copy"><p className="arch2027-section-number">03</p><h2 id="arch2027-materials-title">MATERIÁLY,<br />KTORÉ MAJÚ<br />CHARAKTER</h2><p>Starostlivo vyberané dreviny a moderné WPC materiály pre váš priestor.</p><Link to="/terasove-dosky">OBJAVIŤ VŠETKY MATERIÁLY <Arrow /></Link></div><div className="arch2027-material-tiles">{materials.map(material => <Link key={material.name} to={material.to} className={`arch2027-material-tile arch2027-material-${material.kind}`}><img src={asset(material.image)} alt={`Ilustračný vizuál kategórie ${material.name.toLowerCase()}`} loading="lazy" decoding="async" /><span className="arch2027-material-tile-caption"><strong>{material.name}</strong><small>{material.subtitle}</small></span><span className="arch2027-tile-note">ILUSTRÁCIA · AI</span></Link>)}</div></section>;
}

function Realizations() {
  const [slide, setSlide] = useState(0);
  const change = (offset: number) => setSlide((slide + offset + gallery.length) % gallery.length);
  return <section className="arch2027-realizations" aria-labelledby="arch2027-realizations-title" id="arch2027-realizations"><img data-testid="homepage-gallery-image" className="arch2027-realizations-image" src={asset(gallery[slide].image)} alt={gallery[slide].alt} loading="lazy" decoding="async" /><div className="arch2027-realizations-shade" /><div className="arch2027-realizations-copy"><p className="arch2027-section-number">04</p><h2 id="arch2027-realizations-title">REALIZÁCIE<br />NA MIERU</h2><p>INŠPIRÁCIA<br />PRE VÁŠ PROJEKT</p><span className="arch2027-short-rule" /><Link to="/realizacie" className="arch2027-outline-button">ZOBRAZIŤ REALIZÁCIE <Arrow /></Link></div><div className="arch2027-gallery-controls"><button data-testid="homepage-gallery-previous" className="arch2027-gallery-previous" onClick={() => change(-1)} aria-label="Predchádzajúca ilustračná fotografia"><Arrow /></button><div className="arch2027-gallery-thumbs">{gallery.map((image, index) => <button key={image.image} data-testid={`homepage-gallery-thumb-${index}`} aria-label={`Zobraziť ilustračnú fotografiu ${index + 1}`} aria-pressed={slide === index} onClick={() => setSlide(index)}><img src={asset(image.image)} alt="" loading="lazy" /></button>)}</div><button data-testid="homepage-gallery-next" className="arch2027-gallery-next" onClick={() => change(1)} aria-label="Nasledujúca ilustračná fotografia"><Arrow /></button></div><div className="arch2027-realizations-quote"><blockquote>„DREVO MENÍ<br />OBYČAJNÉ MIESTO<br />NA VÝNIMOČNÝ<br />PRIESTOR.“</blockquote><Link to="/realizacie"><span />NÁŠ PRÍSTUP</Link></div><p className="arch2027-realizations-note" aria-live="polite">0{slide + 1} / 03 · AI ilustrácie. Skutočné realizácie doplníme z vlastných fotografií.</p></section>;
}

function Benefits() {
  const benefits: { name: string; kind: 'leaf' | 'ruler' | 'layers' | 'build' }[] = [
    { name: 'VÝBER\nMATERIÁLU', kind: 'leaf' },
    { name: 'TECHNICKÉ\nPORADENSTVO', kind: 'ruler' },
    { name: 'NÁVRH\nNA MIERU', kind: 'layers' },
    { name: 'KOMPLETNÁ\nREALIZÁCIA', kind: 'build' },
  ];
  return <section className="arch2027-benefits" aria-label="Návrh, materiál a realizácia"><div className="arch2027-benefits-lime"><p>PREMYSLENÉ<br />RIEŠENIE<br />PRE VÁŠ<br />PRIESTOR</p><Symbol kind="leaf" /></div><div className="arch2027-benefit-items">{benefits.map(item => <Link key={item.name} to={item.kind === 'leaf' ? '/terasove-dosky' : '/realizacia-na-kluc'}><Symbol kind={item.kind} /><span>{item.name.split('\n').map(line => <span key={line}>{line}</span>)}</span></Link>)}</div><Link className="arch2027-benefits-black" to="/realizacie"><p>VIAC NEŽ TERASA.<br />PRIESTOR<br />PRE VÁŠ ŽIVOT.</p><span className="arch2027-circle-button"><Arrow /></span></Link></section>;
}

export default function Homepage2027() {
  useEffect(() => { document.title = 'Drevené terasy — Priestor. Tvoj.'; }, []);
  return <div className="arch2027"><a className="arch2027-skip" href="#arch2027-main" onClick={event => { event.preventDefault(); document.getElementById('arch2027-main')?.focus(); }}>Preskočiť na obsah</a><main id="arch2027-main" tabIndex={-1}><Hero /><PlannerPreview /><Materials /><Realizations /><Benefits /></main></div>;
}

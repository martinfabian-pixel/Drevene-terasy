import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { products, categories, type ConceptId } from './data';
import './catalog.css';

function MaterialVisual({ type, large = false }: { type: string; large?: boolean }) {
  if (type === 'clips') return <div className={`material-visual material-clips ${large ? 'material-large' : ''}`} role="img" aria-label="Autorská ilustrácia montážnych klipov">
    <svg viewBox="0 0 400 300" aria-hidden="true"><defs><linearGradient id="clip-metal" x2="1" y2="1"><stop stopColor="#a9b0ac" /><stop offset=".5" stopColor="#323b36" /><stop offset="1" stopColor="#7d8981" /></linearGradient></defs><ellipse cx="205" cy="230" rx="125" ry="20" fill="#bfc8bc" opacity=".35" /><g transform="translate(78 70) rotate(-16 80 65)"><path d="M0 35 35 13h100l25 20v76l-25 20H35L0 110Z" fill="url(#clip-metal)" /><path d="M32 45h96v53H32Z" fill="#d9ddd3" /><path d="M57 58h45v27H57Z" fill="#59675e" /><path d="m35 13 10-16h80l10 16" fill="#6d7971" /><path d="m35 129 10 16h80l10-16" fill="#5c6861" /></g><g transform="translate(260 115) rotate(18)"><path d="M0 0h37v12H0Z" fill="#606c64" /><path d="M14 12h9v86l-4.5 16L14 98Z" fill="#829087" /><path d="m13 22 12-4m-12 15 12-4m-12 15 12-4m-12 15 12-4m-12 15 12-4m-12 15 12-4m-12 15 12-4" stroke="#35433a" strokeWidth="2" /></g></svg>
  </div>;
  if (type === 'oil') return <div className={`material-visual material-oil ${large ? 'material-large' : ''}`} role="img" aria-label="Autorská ilustrácia prípravku na údržbu"><div className="oil-shadow" /><div className="oil-can"><div className="oil-handle" /><div className="oil-cap" /><div className="oil-label"><span>DREVENÉ<br />TERASY</span><strong>Starostlivosť<br />o drevo</strong><small>VIZUÁLNA UKÁŽKA</small></div></div><div className="oil-brush"><i /><span /></div></div>;
  return <div className={`material-visual material-${type} ${large ? 'material-large' : ''}`} role="img" aria-label="Autorská vizualizácia materiálu"><div className="plank-shadow" /><div className="plank-set">{Array.from({ length: type === 'joists' ? 4 : 7 }, (_, i) => <span className="material-plank" key={i}><i /><b /></span>)}</div><span className="material-watermark">KONCEPTOVÝ VIZUÁL</span></div>;
}

const introductions: Record<ConceptId, { eyebrow: string; title: string; copy: string }> = {
  a: { eyebrow: 'Katalóg materiálov', title: 'Dobrá terasa začína\ndobrým materiálom.', copy: 'Nájdite si povrch, s ktorým sa budete radi vracať von. Prírodné drevo, tepelne upravené drevo aj WPC na jednom mieste.' },
  b: { eyebrow: '02 / Kolekcia materiálov', title: 'MATERIÁL.\nZÁKLAD NÁVRHU.', copy: 'Povrch. Konštrukcia. Detail. Všetko pre premyslenú terasu, prehľadne od prvého výberu.' },
  c: { eyebrow: 'Váš projekt / Výber materiálu', title: 'Čo bude pod\nvašimi nohami?', copy: 'Preskúmajte materiály. Potom si v plánovači pozrite, ako zapadnú do vašej vlastnej terasy.' },
};

export function Catalog({ concept }: { concept: ConceptId }) {
  const location = useLocation();
  const accessoriesMode = new URLSearchParams(location.search).get('prislusenstvo') === '1';
  const [category, setCategory] = useState(categories[0]);
  const [query, setQuery] = useState('');
  useEffect(() => { setCategory(categories[0]); setQuery(''); }, [accessoriesMode]);
  const filterCategories = accessoriesMode ? [categories[0], ...categories.slice(4)] : categories;
  const groupProducts = accessoriesMode ? products.filter(product => categories.slice(4).includes(product.category)) : products;
  const visible = useMemo(() => products.filter(product => (!accessoriesMode || categories.slice(4).includes(product.category)) && (category === categories[0] || product.category === category) && `${product.name} ${product.family}`.toLocaleLowerCase('sk').includes(query.toLocaleLowerCase('sk').trim())), [category, query, accessoriesMode]);
  const intro = accessoriesMode ? { eyebrow: 'Príslušenstvo / kompletná skladba', title: concept === 'b' ? 'DETAILY.\nPEVNÝ ZÁKLAD.' : 'Každý detail\nmá svoje miesto.', copy: 'Podkladová konštrukcia, upevnenie aj starostlivosť. Preskúmajte ukážku príslušenstva k vašej terase.' } : introductions[concept];
  return <main className="catalog-page">
    <section className="catalog-intro section-inner">
      <div><p className="eyebrow">{intro.eyebrow}</p><h1>{intro.title.split('\n').map((line, i) => <span key={line}>{i > 0 && <br />}{line}</span>)}</h1><p className="catalog-lead">{intro.copy}</p></div>
      <Link className="catalog-planner-card" to={`/${concept}/planovac`}><span className="catalog-planner-symbol">↗</span><span><small>NAVRHNI → NAKÚP → ZREALIZUJ</small><strong>Materiál vo vašom návrhu</strong><span>Otvoriť ukážku plánovača</span></span></Link>
    </section>
    <section className="section-inner catalog-workspace" aria-label="Katalóg demo materiálov">
      <aside className="catalog-filters"><div className="filter-heading"><strong>Kategórie</strong><span>{filterCategories.length - 1}</span></div><div className="category-list">{filterCategories.map((item, i) => <button key={item} className={category === item ? 'category-filter active' : 'category-filter'} onClick={() => setCategory(item)} aria-pressed={category === item}><span>{accessoriesMode && i === 0 ? 'Všetko príslušenstvo' : item}</span>{i === 0 && <small>{groupProducts.length}</small>}</button>)}</div><div className="filter-note"><span className="demo-badge">DEMO</span><p>Ukážka dizajnu katalógu. Ceny, varianty a dostupnosť doplníme z overených údajov.</p></div></aside>
      <div className="catalog-results"><div className="catalog-toolbar"><span>{visible.length} {visible.length === 1 ? 'ukážková položka' : visible.length > 1 && visible.length < 5 ? 'ukážkové položky' : 'ukážkových položiek'}</span><label className="catalog-search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Hľadať materiál" aria-label="Hľadať demo materiál" /></label></div>
        <div className="product-grid">{visible.map((product, i) => <article className="demo-product-card" key={product.id}><Link className="product-visual-link" to={`/${concept}/produkt?id=${product.id}`} aria-label={`Pozrieť ukážku detailu produktu: ${product.name}`}><MaterialVisual type={product.swatch} /><span className="demo-badge card-demo">DEMO</span><span className="product-card-index">0{i + 1}</span><span className="product-card-arrow" aria-hidden="true">↗</span></Link><div className="product-card-info"><p className="product-family">{product.family}</p><h2><Link to={`/${concept}/produkt?id=${product.id}`}>{product.name}</Link></h2><p className="product-color">{product.color}</p><div className="product-card-bottom"><strong>Cena na vyžiadanie</strong><Link to={`/${concept}/produkt?id=${product.id}`} aria-label={`Zobraziť dizajnový detail pre ${product.name}`}>Detail <span aria-hidden="true">→</span></Link></div></div></article>)}</div>
        {visible.length === 0 && <div className="catalog-empty"><span>⌕</span><h2>Zatiaľ bez ukážkových položiek.</h2><p>Táto kategória je pripravená pre budúci sortiment. Skúste iný filter alebo kratší výraz.</p><button className="button button-ghost" onClick={() => { setCategory(categories[0]); setQuery(''); }}>Zobraziť všetky ukážky</button></div>}
        <p className="catalog-footer-note">Fotografie produktov nahrádzajú autorské vizualizácie. Táto stránka slúži na schválenie dizajnu.</p>
      </div>
    </section>
  </main>;
}

export function ProductDetail({ concept }: { concept: ConceptId }) {
  const location = useLocation();
  const requestedId = new URLSearchParams(location.search).get('id');
  const product = products.find(item => item.id === requestedId) ?? products.find(item => item.id === 'thermo')!;
  const [tone, setTone] = useState(product.swatch);
  const [tab, setTab] = useState('popis');
  useEffect(() => { setTone(product.swatch); setTab('popis'); }, [product.id, product.swatch]);
  const hasWoodTones = product.swatch === 'natural' || product.swatch === 'thermo';
  const isAccessory = categories.slice(4).includes(product.category);
  const catalogPath = `/${concept}/katalog${isAccessory ? '?prislusenstvo=1' : ''}`;
  const tabs = [{ id: 'popis', label: 'Popis' }, { id: 'montaz', label: 'Montáž' }, { id: 'dokumenty', label: 'Dokumenty' }];
  return <main className="product-page section-inner">
    <nav className="product-breadcrumb" aria-label="Navigačná cesta"><Link to={`/${concept}/domov`}>Domov</Link><span>/</span><Link to={catalogPath}>{isAccessory ? 'Príslušenstvo' : 'Terasové dosky'}</Link><span>/</span><span>{product.name}</span></nav>
    <div className="product-detail-layout"><section className="product-gallery" aria-label={`Konceptová vizualizácia: ${product.name}`}><MaterialVisual type={hasWoodTones ? tone : product.swatch} large /><div className="gallery-caption"><span>{isAccessory ? '01 / SYSTÉM & DETAIL' : '01 / POVRCH & DETAIL'}</span><span>Autorská vizualizácia · DEMO</span></div>{hasWoodTones ? <div className="product-gallery-thumbnails"><button aria-label="Zobraziť teplý hnedý vizuál" onClick={() => setTone('thermo')} className={tone === 'thermo' ? 'active' : ''}><MaterialVisual type="thermo" /></button><button aria-label="Zobraziť svetlý prírodný vizuál" onClick={() => setTone('natural')} className={tone === 'natural' ? 'active' : ''}><MaterialVisual type="natural" /></button><div><strong>Dotyk prírodného materiálu.</strong><span>Konceptová prezentácia textúry.</span></div></div> : <p className="product-static-visual-note">{product.color} · autorská ilustrácia kategórie.</p>}</section>
      <section className="product-summary"><div className="product-detail-kicker"><span className="demo-badge">DEMO PRODUKT</span><span>{product.family.toLocaleUpperCase('sk')} / KONCEPT</span></div><h1>{product.name}</h1><p className="product-description">{isAccessory ? 'Premyslená terasa sa skladá z dobre zvolených detailov. Ukážka spôsobu, akým budeme prezentovať príslušenstvo, jeho použitie a väzby na celý systém.' : 'Povrch pre váš život vonku. Ukážka spôsobu, akým budeme prezentovať materiál, jeho vzhľad a možnosti použitia do posledného detailu.'}</p><div className="product-price"><strong>Cena na vyžiadanie</strong><span>Predajnú jednotku a cenu s DPH aj bez DPH doplníme po overení.</span></div>{hasWoodTones && <div className="tone-picker"><div><strong>Vizuálna ukážka odtieňov</strong><span>{tone === 'thermo' ? 'Teplý hnedý' : 'Svetlý prírodný'}</span></div><button onClick={() => setTone('thermo')} className={`tone-swatch tone-thermo ${tone === 'thermo' ? 'selected' : ''}`} aria-label="Teplý hnedý konceptový odtieň" aria-pressed={tone === 'thermo'} /><button onClick={() => setTone('natural')} className={`tone-swatch tone-natural ${tone === 'natural' ? 'selected' : ''}`} aria-label="Svetlý prírodný konceptový odtieň" aria-pressed={tone === 'natural'} /><p>Odtiene slúžia na porovnanie dizajnu; nejde o dostupné varianty produktu.</p></div>}<Link className="button button-primary product-planner-cta" to={`/${concept}/planovac`}>{isAccessory ? 'Pozrieť skladbu terasy' : 'Pozrieť v návrhu terasy'} <span aria-hidden="true">↗</span></Link><Link className="product-back" to={catalogPath}>← Späť na {isAccessory ? 'príslušenstvo' : 'materiály'}</Link><div className="product-verification-note"><span aria-hidden="true">i</span><p>Výrobcu, rozmery, dostupnosť a technické parametre doplníme podľa konkrétneho overeného produktu. Objednávanie v tomto prototype nie je aktívne.</p></div></section>
    </div>
    <section className="product-information"><div className="product-tabs" role="tablist" aria-label="Informácie o ukážkovom produkte" onKeyDown={event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const current = tabs.findIndex(item => item.id === tab);
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      const next = tabs[nextIndex].id;
      setTab(next);
      event.currentTarget.querySelector<HTMLButtonElement>(`#tab-${next}`)?.focus();
    }}>{tabs.map(item => <button key={item.id} id={`tab-${item.id}`} role="tab" tabIndex={tab === item.id ? 0 : -1} aria-controls="product-info-panel" aria-selected={tab === item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div><div className="product-tab-body" id="product-info-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
      {tab === 'popis' && <><div><p className="eyebrow">{product.family} v súvislostiach</p><h2>{isAccessory ? <>Každý detail.<br />Jeden systém.</> : <>Krása povrchu.<br />Presnosť pod ním.</>}</h2><p>Pri výbere terasy je dobré pozerať sa na celú skladbu: dosky, nosnú konštrukciu, spojovací materiál aj údržbu. Konkrétne varianty a ich odporúčané použitie predstavíme po doplnení dodávateľských údajov.</p></div><dl className="product-spec-list">{(isAccessory ? ['Výrobca', 'Materiál a vyhotovenie', 'Rozmery alebo balenie', 'Kompatibilita a použitie', 'Jednotka predaja', 'Dostupnosť'] : ['Výrobca', 'Drevina a materiál', 'Rozmery a dostupné dĺžky', 'Povrchová úprava', 'Jednotka predaja', 'Dostupnosť']).map(label => <div key={label}><dt>{label}</dt><dd>Čaká na overenie</dd></div>)}</dl></>}
      {tab === 'montaz' && <><div><p className="eyebrow">Technicky správny návrh</p><h2>Každý materiál<br />má svoje pravidlá.</h2><p>Rozstupy podkladovej konštrukcie, škáry, dilatácie, podpora koncov a spôsob upevnenia budú vychádzať z montážneho návodu konkrétneho výrobcu. Univerzálne hodnoty v prototype nepoužívame.</p></div><div className="product-document-placeholder"><span aria-hidden="true">⌘</span><h3>Montážny profil pripravujeme</h3><p>Technické podmienky prepojíme s konkrétnou produktovou variantou a neskôr s výpočtom materiálu v plánovači.</p></div></>}
      {tab === 'dokumenty' && <><div><p className="eyebrow">Všetko na jednom mieste</p><h2>Údaje, ktorým<br />sa dá rozumieť.</h2><p>Technický list, montážny návod a informácie o údržbe budú dostupné pri každom overenom produkte. V tejto fáze nie je priložený dokument dodávateľa.</p></div><div className="product-document-placeholder"><span aria-hidden="true">▤</span><h3>Technický list čaká na doplnenie</h3><p>Dokumenty zverejníme s uvedením zdroja, verzie a overených pravidiel použitia.</p><span className="demo-badge">ŽIADNY SÚBOR NA STIAHNUTIE</span></div></>}
    </div></section>
    <section className="product-next"><p className="eyebrow">Ďalší krok</p><h2>Materiál je začiatok.<br />Terasa je výsledok.</h2><Link className="button button-primary" to={`/${concept}/planovac`}>Navrhnúť moju terasu <span aria-hidden="true">↗</span></Link></section>
  </main>;
}

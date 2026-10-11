import { useId, useState } from 'react';
import type { ConceptId } from './data';
import './planner.css';

type Material = 'drevo' | 'thermo' | 'wpc';
type Point = [number, number];
const MATERIALS: Record<Material, { label: string; note: string; light: string; mid: string; dark: string }> = {
  drevo: { label: 'Masívne drevo', note: 'Prírodný vzhľad', light: '#d3af79', mid: '#b78b56', dark: '#795532' },
  thermo: { label: 'Thermowood', note: 'Teplý hnedý odtieň', light: '#a97850', mid: '#885b39', dark: '#573822' },
  wpc: { label: 'WPC', note: 'Pokojný grafitový tón', light: '#89918f', mid: '#626c68', dark: '#3d4744' },
};
const headings: Record<ConceptId, string> = {
  a: 'Začnite priestorom. Nájdite svoj materiál.',
  b: 'Dobrý návrh sa začína presným rozmerom.',
  c: 'Vaša terasa. Vo vlastných rukách.',
};
const LIMITS = { min: 1, max: 12 };
const fmt = (value: number) => value.toLocaleString('sk-SK', { maximumFractionDigits: 2 });
const points = (vertices: Point[]) => vertices.map(vertex => vertex.join(',')).join(' ');
const shift = (point: Point, x: number, y: number): Point => [point[0] + x, point[1] + y];

export default function Planner({ concept }: { concept: ConceptId }) {
  const instance = useId().replace(/:/g, '');
  const [length, setLength] = useState(5);
  const [width, setWidth] = useState(3.6);
  const [lengthDraft, setLengthDraft] = useState('5');
  const [widthDraft, setWidthDraft] = useState('3.6');
  const [material, setMaterial] = useState<Material>('thermo');
  const [mode, setMode] = useState<'2d' | '3d'>('3d');
  const [boards, setBoards] = useState(true);
  const [joists, setJoists] = useState(false);
  const [orientation, setOrientation] = useState<'length' | 'width'>('length');
  const [notice, setNotice] = useState('');
  const appearance = MATERIALS[material];
  const lengthInvalid = !Number.isFinite(Number(lengthDraft)) || lengthDraft.trim() === '' || Number(lengthDraft) < LIMITS.min || Number(lengthDraft) > LIMITS.max;
  const widthInvalid = !Number.isFinite(Number(widthDraft)) || widthDraft.trim() === '' || Number(widthDraft) < LIMITS.min || Number(widthDraft) > LIMITS.max;
  const area = length * width;

  function changeDimension(kind: 'length' | 'width', raw: string) {
    const value = Number(raw);
    (kind === 'length' ? setLengthDraft : setWidthDraft)(raw);
    if (raw.trim() !== '' && Number.isFinite(value) && value >= LIMITS.min && value <= LIMITS.max) {
      (kind === 'length' ? setLength : setWidth)(value);
      setNotice('');
    }
  }

  function commitDimension(kind: 'length' | 'width') {
    const raw = kind === 'length' ? lengthDraft : widthDraft;
    const current = kind === 'length' ? length : width;
    const value = raw.trim() === '' || !Number.isFinite(Number(raw)) ? current : Math.min(LIMITS.max, Math.max(LIMITS.min, Number(raw)));
    const rounded = Math.round(value * 100) / 100;
    (kind === 'length' ? setLength : setWidth)(rounded);
    (kind === 'length' ? setLengthDraft : setWidthDraft)(String(rounded));
    if (raw.trim() === '' || Number(raw) !== rounded) setNotice('Rozmer bol upravený na platnú hodnotu v rozsahu 1 až 12 metrov.');
  }

  function reset() {
    setLength(5); setWidth(3.6); setLengthDraft('5'); setWidthDraft('3.6');
    setMaterial('thermo'); setBoards(true); setJoists(false); setOrientation('length');
    setNotice('Ukážka bola obnovená na rozmery 5 × 3,6 m.');
  }

  function plan2D() {
    const scale = Math.min(480 / length, 300 / width);
    const rectWidth = length * scale;
    const rectHeight = width * scale;
    const x = (760 - rectWidth) / 2;
    const y = (500 - rectHeight) / 2;
    const boardLines = Array.from({ length: 19 }, (_, index) => (index + 1) / 20);
    return <svg className="planner-drawing technical-svg" viewBox="0 0 760 510" role="img" aria-label={`Pôdorys obdĺžnikovej terasy, dĺžka ${fmt(length)} metrov, šírka ${fmt(width)} metrov, plocha ${fmt(area)} metrov štvorcových.`}>
      <defs>
        <pattern id={`${instance}-grid`} width="25" height="25" patternUnits="userSpaceOnUse"><path d="M25 0H0V25" fill="none" stroke="currentColor" strokeWidth=".45" opacity=".1" /></pattern>
        <linearGradient id={`${instance}-planwood`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={appearance.light} /><stop offset="1" stopColor={appearance.mid} /></linearGradient>
        <marker id={`${instance}-arrow`} viewBox="0 0 8 8" refX="4" refY="4" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L7 4L1 7" fill="none" stroke="currentColor" strokeWidth="1.2" /></marker>
      </defs>
      <rect width="760" height="510" fill={`url(#${instance}-grid)`} />
      <rect x={x + 7} y={y + 10} width={rectWidth} height={rectHeight} rx="2" fill="#243b2c" opacity=".09" />
      <rect x={x} y={y} width={rectWidth} height={rectHeight} fill={boards ? `url(#${instance}-planwood)` : '#e6e9e1'} stroke={appearance.dark} strokeWidth="1.3" />
      {boards && boardLines.map((fraction, index) => orientation === 'length'
        ? <g key={index}><line x1={x} y1={y + fraction * rectHeight} x2={x + rectWidth} y2={y + fraction * rectHeight} stroke={appearance.dark} strokeWidth="2" opacity=".55" /><line x1={x + 25} y1={y + fraction * rectHeight - 3} x2={x + rectWidth - 50} y2={y + fraction * rectHeight - 3} stroke={appearance.light} strokeWidth=".7" opacity=".65" /></g>
        : <g key={index}><line x1={x + fraction * rectWidth} y1={y} x2={x + fraction * rectWidth} y2={y + rectHeight} stroke={appearance.dark} strokeWidth="2" opacity=".55" /><line x1={x + fraction * rectWidth - 3} y1={y + 20} x2={x + fraction * rectWidth - 3} y2={y + rectHeight - 30} stroke={appearance.light} strokeWidth=".7" opacity=".65" /></g>)}
      {joists && Array.from({ length: 7 }, (_, index) => {
        const fraction = (index + .4) / 7;
        return orientation === 'length'
          ? <line key={index} x1={x + fraction * rectWidth} y1={y + 4} x2={x + fraction * rectWidth} y2={y + rectHeight - 4} stroke="#234d49" strokeWidth="8" opacity={boards ? '.5' : '.85'} strokeDasharray={boards ? '6 3' : undefined} />
          : <line key={index} x1={x + 4} y1={y + fraction * rectHeight} x2={x + rectWidth - 4} y2={y + fraction * rectHeight} stroke="#234d49" strokeWidth="8" opacity={boards ? '.5' : '.85'} strokeDasharray={boards ? '6 3' : undefined} />;
      })}
      <g className="planner-dimensions" fill="none" stroke="currentColor" strokeWidth="1">
        <path d={`M${x} ${y - 8}V${y - 48}M${x + rectWidth} ${y - 8}V${y - 48}`} opacity=".45" />
        <path d={`M${x} ${y - 32}H${x + rectWidth}`} markerStart={`url(#${instance}-arrow)`} markerEnd={`url(#${instance}-arrow)`} />
        <path d={`M${x + rectWidth + 8} ${y}H${x + rectWidth + 50}M${x + rectWidth + 8} ${y + rectHeight}H${x + rectWidth + 50}`} opacity=".45" />
        <path d={`M${x + rectWidth + 34} ${y}V${y + rectHeight}`} markerStart={`url(#${instance}-arrow)`} markerEnd={`url(#${instance}-arrow)`} />
      </g>
      <g className="planner-dimension-labels" fill="currentColor" textAnchor="middle">
        <text x="380" y={y - 42}>{fmt(length)} m</text>
        <text x={x + rectWidth + 52} y={y + rectHeight / 2} transform={`rotate(90, ${x + rectWidth + 52}, ${y + rectHeight / 2})`}>{fmt(width)} m</text>
      </g>
      {[ [x,y], [x+rectWidth,y], [x+rectWidth,y+rectHeight], [x,y+rectHeight] ].map((point, index) => <circle key={index} cx={point[0]} cy={point[1]} r="4.5" fill="#f8faf4" stroke="#29483d" strokeWidth="1.5" />)}
      <text x="380" y="480" textAnchor="middle" className="planner-svg-caption">PÔDORYS · OBDĹŽNIK · {fmt(area)} m²</text>
    </svg>;
  }

  function plan3D() {
    const scale = 490 / (length + width);
    const u: Point = [length * scale, length * scale * .42];
    const v: Point = [-width * scale, width * scale * .42];
    const origin: Point = [380 - (u[0] + v[0]) / 2, 125];
    const at = (x: number, y: number, depth = 0): Point => [origin[0] + u[0] * x + v[0] * y, origin[1] + u[1] * x + v[1] * y + depth];
    const corners = [at(0, 0), at(1, 0), at(1, 1), at(0, 1)];
    const slice = (start: number, end: number) => orientation === 'length'
      ? [at(0, start), at(1, start), at(1, end), at(0, end)]
      : [at(start, 0), at(end, 0), at(end, 1), at(start, 1)];
    return <svg className="planner-drawing" viewBox="0 0 760 510" role="img" aria-label={`Izometrická dizajnová ukážka terasy ${fmt(length)} krát ${fmt(width)} metrov, materiál ${appearance.label}. Počet zobrazených dosiek je ilustračný.`}>
      <defs>
        <radialGradient id={`${instance}-shadow`}><stop stopColor="#21372d" stopOpacity=".19" /><stop offset="1" stopColor="#21372d" stopOpacity="0" /></radialGradient>
        <linearGradient id={`${instance}-isowood`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={appearance.light} /><stop offset="1" stopColor={appearance.mid} /></linearGradient>
      </defs>
      <g stroke="currentColor" strokeWidth=".55" opacity=".055">{Array.from({ length: 15 }, (_, index) => <g key={index}><path d={`M${index * 65 - 100} 300l490 206`} /><path d={`M${index * 65 + 270} 150l-490 206`} /></g>)}</g>
      <ellipse cx="380" cy="378" rx="282" ry="80" fill={`url(#${instance}-shadow)`} />
      <polygon points={points(corners.map(point => shift(point, 0, 35)))} fill="#6c7d64" opacity=".07" />
      {joists && Array.from({ length: 7 }, (_, index) => {
        const fraction = (index + .5) / 7;
        const p = orientation === 'length' ? at(fraction, 0, 25) : at(0, fraction, 25);
        const q = orientation === 'length' ? at(fraction, 1, 25) : at(1, fraction, 25);
        return <g key={index}><polygon points={points([shift(p,-3,0), shift(q,-3,0), shift(q,3,0),shift(p,3,0)])} fill="#3c5148" /><polygon points={points([shift(q,-3,0), shift(q,3,0), shift(q,3,8),shift(q,-3,8)])} fill="#243a31" /></g>;
      })}
      <polygon points={points([at(0,1),at(1,1),at(1,1,19),at(0,1,19)])} fill={appearance.dark} />
      <polygon points={points([at(1,0),at(1,1),at(1,1,19),at(1,0,19)])} fill={appearance.mid} />
      <polygon points={points(corners)} fill={boards ? appearance.mid : '#d1dcd1'} stroke={appearance.dark} strokeWidth=".6" opacity={boards ? 1 : .55} />
      {boards && <g opacity={joists ? .58 : 1}>{Array.from({ length: 20 }, (_, index) => {
        const start = index / 20 + .0018;
        const end = (index + 1) / 20 - .0018;
        const grainStart = orientation === 'length' ? at(.06, (start + end) / 2) : at((start + end) / 2, .06);
        const grainEnd = orientation === 'length' ? at(.86, (start + end) / 2) : at((start + end) / 2, .86);
        return <g key={index}><polygon points={points(slice(start,end))} fill={index % 3 === 0 ? appearance.light : `url(#${instance}-isowood)`} stroke={appearance.dark} strokeWidth=".4" /><line x1={grainStart[0]} y1={grainStart[1]} x2={grainEnd[0]} y2={grainEnd[1]} stroke={appearance.dark} strokeWidth=".6" opacity={material === 'wpc' ? '.24' : '.28'} /></g>;
      })}</g>}
      {joists && <g stroke="#244e46" strokeWidth="4" opacity=".8" strokeDasharray="5 4">{Array.from({length:7},(_,index) => {
        const fraction = (index + .5) / 7;
        const p = orientation === 'length' ? at(fraction, 0) : at(0, fraction);
        const q = orientation === 'length' ? at(fraction, 1) : at(1, fraction);
        return <line key={index} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} />;
      })}</g>}
      <g className="planner-isometric-label" stroke="currentColor" strokeWidth=".8" fill="none" opacity=".5">
        <path d={`M${at(0,1,46).join(' ')}L${at(1,1,46).join(' ')}`} />
        <path d={`M${at(1,0)[0]+25} ${at(1,0)[1]+10}L${at(1,1)[0]+25} ${at(1,1)[1]+10}`} />
      </g>
      <text x={at(.5,1,66)[0]} y={at(.5,1,66)[1]} textAnchor="middle" className="planner-dimension-labels">{fmt(length)} m</text>
      <text x={at(1,.5)[0]+47} y={at(1,.5)[1]+16} textAnchor="middle" className="planner-dimension-labels">{fmt(width)} m</text>
      <text x="380" y="473" textAnchor="middle" className="planner-svg-caption">IZOMETRICKÝ NÁHĽAD · VIZUÁLNA UKÁŽKA</text>
    </svg>;
  }

  return <main className="planner-page section-inner">
    <div className="planner-page-heading">
      <div><p className="eyebrow">Navrhni → Nakúp → Zrealizuj</p><h1>{headings[concept]}</h1><p className="planner-intro">Vyskúšajte si priestor, smer dosiek a vzhľad materiálu. Všetko sa začína vašou predstavou.</p></div>
      <div className="planner-stage-pill"><span />Etapa 0 · dizajnový prototyp</div>
    </div>
    <div className="planner-workspace">
      <aside className="planner-controls" aria-label="Nastavenia návrhu terasy">
        <div className="planner-panel-title"><span className="planner-step-number">01</span><h2>Váš priestor</h2></div>
        <fieldset className="planner-shape-field"><legend>Tvar terasy</legend><div className="planner-shapes">
          <button type="button" className="planner-shape active" aria-pressed="true"><span className="planner-shape-icon rectangle" />Obdĺžnik</button>
          <button type="button" className="planner-shape" disabled title="Tvar L pripravíme po schválení dizajnu"><span className="planner-shape-icon l-shape" />Tvar L<small>Neskôr</small></button>
          <button type="button" className="planner-shape" disabled title="Tvar U pripravíme po schválení dizajnu"><span className="planner-shape-icon u-shape" />Tvar U<small>Neskôr</small></button>
          <button type="button" className="planner-shape" disabled title="Vlastný pôdorys pripravíme po schválení dizajnu"><span className="planner-shape-icon custom-shape" />Vlastný<small>Neskôr</small></button>
        </div><p className="planner-helper">V tejto ukážke pracujeme s obdĺžnikom. Ďalšie tvary sú pripravené na neskoršiu etapu.</p></fieldset>
        <div className="planner-dimension-fields">
          <label htmlFor={`${instance}-length`}>Dĺžka<div className="planner-number-wrap"><input id={`${instance}-length`} type="number" inputMode="decimal" min={LIMITS.min} max={LIMITS.max} step=".01" value={lengthDraft} onChange={event => changeDimension('length', event.target.value)} onBlur={() => commitDimension('length')} aria-invalid={lengthInvalid} aria-describedby={`${instance}-dimension-help`} /><span>m</span></div></label>
          <label htmlFor={`${instance}-width`}>Šírka<div className="planner-number-wrap"><input id={`${instance}-width`} type="number" inputMode="decimal" min={LIMITS.min} max={LIMITS.max} step=".01" value={widthDraft} onChange={event => changeDimension('width', event.target.value)} onBlur={() => commitDimension('width')} aria-invalid={widthInvalid} aria-describedby={`${instance}-dimension-help`} /><span>m</span></div></label>
        </div>
        <p id={`${instance}-dimension-help`} className={`planner-helper ${lengthInvalid || widthInvalid ? 'planner-validation' : ''}`}>{lengthInvalid || widthInvalid ? 'Zadajte rozmer od 1 do 12 m. Náhľad zatiaľ používa poslednú platnú hodnotu.' : 'Rozmery 1–12 m · presnosť zadania 0,01 m'}</p>
        <div className="planner-control-divider" />
        <div className="planner-panel-title"><span className="planner-step-number">02</span><h2>Váš materiál</h2></div>
        <div className="planner-materials" role="group" aria-label="Vzhľad materiálu">{(Object.keys(MATERIALS) as Material[]).map(id => <button type="button" key={id} className={`planner-material ${material === id ? 'active' : ''}`} aria-pressed={material === id} onClick={() => setMaterial(id)}><span className={`planner-swatch planner-swatch-${id}`} /><span><strong>{MATERIALS[id].label}</strong><small>{MATERIALS[id].note}</small></span><span className="planner-selection-dot" /></button>)}</div>
        <p className="planner-helper">Odtiene sú ilustračné. Konkrétny produkt a technické pravidlá doplníme z overených údajov.</p>
        <fieldset className="planner-direction-field"><legend>Smer dosiek</legend><div className="planner-direction-switch"><button type="button" className={orientation === 'length' ? 'active' : ''} aria-pressed={orientation === 'length'} onClick={() => setOrientation('length')}><span aria-hidden="true">↔</span>Po dĺžke</button><button type="button" className={orientation === 'width' ? 'active' : ''} aria-pressed={orientation === 'width'} onClick={() => setOrientation('width')}><span aria-hidden="true">↕</span>Po šírke</button></div></fieldset>
      </aside>
      <section className="planner-canvas-section" aria-label="Vizualizácia návrhu">
        <div className="planner-canvas-toolbar"><div className="planner-view-tabs" role="tablist" aria-label="Režim náhľadu" onKeyDown={event => {
          if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === 'Home' ? '2d' : event.key === 'End' ? '3d' : mode === '2d' ? '3d' : '2d';
          setMode(next);
          const target = event.currentTarget.querySelector<HTMLButtonElement>(`#${instance}-tab-${next}`);
          target?.focus();
        }}><button type="button" role="tab" tabIndex={mode === '2d' ? 0 : -1} aria-selected={mode === '2d'} aria-controls={`${instance}-viewport`} id={`${instance}-tab-2d`} className={mode === '2d' ? 'active' : ''} onClick={() => setMode('2d')}>2D pôdorys</button><button type="button" role="tab" tabIndex={mode === '3d' ? 0 : -1} aria-selected={mode === '3d'} aria-controls={`${instance}-viewport`} id={`${instance}-tab-3d`} className={mode === '3d' ? 'active' : ''} onClick={() => setMode('3d')}>3D náhľad</button></div><button type="button" className="planner-reset" onClick={reset}><span aria-hidden="true">↺</span>Obnoviť</button></div>
        <div id={`${instance}-viewport`} className="planner-viewport" role="tabpanel" aria-labelledby={`${instance}-tab-${mode}`}><div className="planner-canvas-badge"><span />{mode === '3d' ? '3D ukážka rozhrania' : 'Kótovaný pôdorys'}</div>{mode === '2d' ? plan2D() : plan3D()}<div className="planner-area-floating"><small>Čistá plocha</small><strong>{fmt(area)} <span>m²</span></strong></div></div>
        <div className="planner-layer-bar"><span className="planner-layer-label">Viditeľné vrstvy</span><button type="button" className={`planner-layer-toggle ${boards ? 'active' : ''}`} role="switch" aria-checked={boards} onClick={() => setBoards(!boards)}><span className="planner-toggle-dot" />Dosky</button><button type="button" className={`planner-layer-toggle ${joists ? 'active' : ''}`} role="switch" aria-checked={joists} onClick={() => setJoists(!joists)}><span className="planner-toggle-dot" />Nosníky</button></div>
        <p className="planner-canvas-note">{mode === '3d' ? 'Izometrická SVG ukážka predstavuje vzhľad budúceho 3D rozhrania; nejde o finálny výpočtový model.' : 'Obrys a plocha vychádzajú zo zadaných rozmerov.'} Rytmus dosiek a nosníkov je ilustračný, ich množstvá ani rozstupy sa teraz nepočítajú.</p>
      </section>
      <aside className="planner-summary" aria-label="Súhrn návrhu">
        <span className="planner-summary-kicker">Váš návrh</span><h2>Priestor pre dobré chvíle.</h2>
        <dl className="planner-summary-details"><div><dt>Tvar</dt><dd>Obdĺžnik</dd></div><div><dt>Rozmery</dt><dd>{fmt(length)} × {fmt(width)} m</dd></div><div><dt>Plocha</dt><dd>{fmt(area)} m²</dd></div><div><dt>Vzhľad</dt><dd>{appearance.label}</dd></div></dl>
        <div className="planner-material-list"><h3>Materiálový zoznam</h3><p>Ukážka rozhrania · množstvá po overení</p><ul><li><span>Terasové dosky</span><small>Po overení</small></li><li><span>Podkonštrukcia</span><small>Po overení</small></li><li><span>Montážne prvky</span><small>Po overení</small></li><li><span>Ukončenie a údržba</span><small>Po overení</small></li></ul></div>
        <div className="planner-price"><small>Materiál a realizácia</small><strong>Cena na vyžiadanie</strong><span>V prototype nemáme overené ceny.</span></div>
        <button type="button" className="button button-primary planner-summary-action" disabled>Materiálový balík <span aria-hidden="true">↗</span></button><p className="planner-future-note">Nákup, uloženie projektu a dopyt sprístupníme v schválenej implementačnej etape.</p>
      </aside>
    </div>
    <p className="planner-live-notice" role="status" aria-live="polite">{notice}</p>
    <div className="planner-next-note"><span className="planner-next-icon" aria-hidden="true">↗</span><div><strong>Od predstavy až po hotovú terasu.</strong><p>Finálny plánovač prepojí overené produkty, technické výpočty a realizáciu. Teraz vyberáme vzhľad a spôsob ovládania.</p></div><span className="planner-demo-label">Dizajn na schválenie</span></div>
  </main>;
}

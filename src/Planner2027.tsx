import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { calculatePlan, shapeOutline, DEMO_RULES } from './engine';
import type { DeckShape, EngineProduct, PlanInput, PlanResult, Point, MaterialItem } from './engine/types';
import { productCatalog, money, saleQuantity, type Product, type ProductVariant } from './commerce/catalog';
import { useCart } from './commerce/cart';
import PlannerScene2027 from './PlannerScene2027';
import './planner2027.css';

const storageKey = 'dt-project-v1';
const fmt = (n: number, digits = 2) => n.toLocaleString('sk-SK', { maximumFractionDigits: digits });
const pointsPath = (points: Point[]) => points.length ? `M${points.map(p => `${p.x},${p.y}`).join('L')}Z` : '';
const shapes: { id: DeckShape; title: string; path: string }[] = [
  { id: 'rectangle', title: 'Obdĺžnik', path: 'M5 5H45V30H5Z' },
  { id: 'square', title: 'Štvorec', path: 'M12 3H40V31H12Z' },
  { id: 'l', title: 'L-tvar', path: 'M5 3H21V18H45V31H5Z' },
  { id: 'u', title: 'U-tvar', path: 'M5 3H17V19H33V3H45V31H5Z' },
  { id: 'custom', title: 'Vlastný', path: 'M5 4H38L46 18L33 31H5L13 19Z' },
];
function toEngineProduct(product: Product, variant: ProductVariant, catalog: Product[]): EngineProduct {
  // A verified product is never completed with demonstration installation rules.
  const joistProduct = catalog.find(p => p.id === product.installationRules?.joistProductId);
  const joistVariant = joistProduct?.variants[0];
  const rules = product.engineRules ?? (product.status === 'demo' && product.installationRules?.status === 'demo'
    ? { ...DEMO_RULES,
      joistWidthMm: joistVariant?.widthMm ?? DEMO_RULES.joistWidthMm,
      joistHeightMm: joistVariant?.thicknessMm ?? DEMO_RULES.joistHeightMm,
      joistStockLengthsMm: joistProduct?.variants.map(v => v.lengthMm).filter((n): n is number => n !== null && n > 0) ?? [],
      minGapMm: product.installationRules.boardGapMm,
      maxGapMm: product.installationRules.boardGapMm,
      perimeterGapMm: product.installationRules.wallGapMm,
      jointGapMm: product.installationRules.endGapMm,
      maxJoistSpacingMm: product.installationRules.maxJoistSpacingMm,
      maxPedestalSpacingMm: product.installationRules.maxPedestalSpacingMm,
      sawKerfMm: product.installationRules.kerfMm,
      minReusableOffcutMm: product.installationRules.minReusableOffcutMm,
      allowButtJoints: product.installationRules.allowButtJoints,
      fixingsPerIntersection: product.installationRules.fixingsPerSupport,
      accessoryProductIds: { joist: product.installationRules.joistProductId, pedestal: product.installationRules.pedestalProductId, fixing: product.installationRules.fixingProductId, edge: product.installationRules.finishProductId ?? undefined } }
    : null);
  return { id: product.id, name: product.name, variantId: variant.id,
    widthMm: variant.widthMm, thicknessMm: variant.thicknessMm,
    availableLengthsMm: product.variants.filter(v => v.widthMm === variant.widthMm && v.thicknessMm === variant.thicknessMm && v.profile === variant.profile).map(v => v.lengthMm).filter((n): n is number => n !== null && n > 0),
    status: product.status, installationRules: rules };
}
export function parseProject(value: unknown, catalog: Product[] = productCatalog): PlanInput | null {
  if (!value || typeof value !== 'object') return null;
  const p = value as Partial<PlanInput>;
  const ring = (v: unknown): v is Point[] => Array.isArray(v) && v.length >= 3 && v.length <= 64 && v.every(q => q && typeof q.x === 'number' && typeof q.y === 'number' && Number.isFinite(q.x) && Number.isFinite(q.y) && Math.abs(q.x) <= 30000 && Math.abs(q.y) <= 30000);
  if (!ring(p.outline) || !Array.isArray(p.holes) || p.holes.length > 8 || !p.holes.every(ring) || !['x', 'y'].includes(p.orientation ?? '') || typeof p.productId !== 'string' || !catalog.some(x => x.id === p.productId)) return null;
  if (p.substrate !== undefined && !['concrete', 'paving', 'soil'].includes(p.substrate)) return null;
  if (![p.heightMm, p.gapMm, p.reservePercent].every(n => typeof n === 'number' && Number.isFinite(n)) || p.heightMm! < 0 || p.heightMm! > 3000 || p.gapMm! < 0 || p.gapMm! > 30 || p.reservePercent! < 0 || p.reservePercent! > 30) return null;
  const product = catalog.find(x => x.id === p.productId)!;
  if (p.variantId && !product.variants.some(v => v.id === p.variantId)) return null;
  return { outline: p.outline, holes: p.holes, orientation: p.orientation!, substrate: p.substrate ?? 'concrete', heightMm: p.heightMm!, gapMm: p.gapMm!, productId: p.productId, variantId: typeof p.variantId === 'string' ? p.variantId : undefined, reservePercent: p.reservePercent! };
}
export function downloadProject(input: PlanInput) {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, input }, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = 'moja-terasa.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PlanEditor({ input, result, onChange, dimensions, structure, boards, joints, units }: { input: PlanInput; result: PlanResult; onChange: (p: PlanInput) => void; dimensions: boolean; structure: boolean; boards: boolean; joints: boolean; units: 'mm' | 'm' }) {
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ kind: 'vertex'; index: number; hole: number; inverse: DOMMatrix } | { kind: 'pan'; start: Point; pan: Point; inverse: DOMMatrix } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const frozenOutline = useRef(input.outline);
  if (!drag.current) frozenOutline.current = input.outline;
  const all = frozenOutline.current;
  const minX = Math.min(...all.map(p => p.x)), maxX = Math.max(...all.map(p => p.x));
  const minY = Math.min(...all.map(p => p.y)), maxY = Math.max(...all.map(p => p.y));
  const span = Math.max(1000, maxX - minX, maxY - minY);
  const padding = span * .2;
  const width = (maxX - minX + padding * 2) / zoom;
  const height = (maxY - minY + padding * 2) / zoom;
  const vx = (minX + maxX) / 2 - width / 2 + pan.x;
  const vy = (minY + maxY) / 2 - height / 2 + pan.y;
  const coordinate = (event: React.PointerEvent) => {
    const inverse = drag.current?.inverse ?? svg.current?.getScreenCTM()?.inverse();
    if (!inverse) return { x: 0, y: 0 };
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse);
    return { x: Math.round(p.x / 5) * 5, y: Math.round(p.y / 5) * 5 };
  };
  const move = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!drag.current) return;
    if (drag.current.kind === 'pan') {
      const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(drag.current.inverse);
      setPan({ x: drag.current.pan.x - p.x + drag.current.start.x, y: drag.current.pan.y - p.y + drag.current.start.y });
      return;
    }
    const p = coordinate(event);
    const { hole, index } = drag.current;
    if (hole < 0) onChange({ ...input, outline: input.outline.map((q, i) => i === index ? p : q) });
    else onChange({ ...input, holes: input.holes.map((ring, h) => h === hole ? ring.map((q, i) => i === index ? p : q) : ring) });
  };
  const formatDimension = (n: number) => units === 'm' ? `${fmt(n / 1000, 3)} m` : `${fmt(n, 0)} mm`;
  const size = span * .022 / zoom;
  const hitRadius = Math.max(size, width / (svg.current?.clientWidth || 330) * 22);
  const beginVertex = (event: React.PointerEvent, i: number, hole: number) => {
    event.stopPropagation(); if (panMode) return;
    const inverse = svg.current?.getScreenCTM()?.inverse();
    if (!inverse) return;
    drag.current = { kind: 'vertex', index: i, hole, inverse }; svg.current?.setPointerCapture(event.pointerId);
  };
  const renderVertices = (ring: Point[], hole: number) => ring.map((p, i) => <g key={i}>
    <circle cx={p.x} cy={p.y} r={hitRadius} fill="transparent" aria-hidden="true" onPointerDown={event => beginVertex(event, i, hole)} />
    <circle data-testid={`plan-vertex-${hole}-${i}`} cx={p.x} cy={p.y} r={size} fill={hole < 0 ? '#c8ff32' : '#fff'} stroke="#101010" strokeWidth={size * .18} role="button" aria-label={`${hole < 0 ? 'Vrchol' : 'Vrchol výrezu'} ${i + 1}, ${formatDimension(p.x)}, ${formatDimension(p.y)}`} tabIndex={0}
      onPointerDown={event => beginVertex(event, i, hole)}
      onKeyDown={event => { const offsets: Record<string, Point> = { ArrowLeft: { x: -10, y: 0 }, ArrowRight: { x: 10, y: 0 }, ArrowUp: { x: 0, y: -10 }, ArrowDown: { x: 0, y: 10 } }; const d = offsets[event.key]; if (d) { event.preventDefault(); const point = { x: p.x + d.x, y: p.y + d.y }; if (hole < 0) onChange({ ...input, outline: ring.map((q, j) => i === j ? point : q) }); else onChange({ ...input, holes: input.holes.map((r, h) => h === hole ? r.map((q, j) => j === i ? point : q) : r) }); } }} />
    <text x={p.x + size * 1.5} y={p.y - size * 1.5} fontSize={size * 1.4} fill="#101010">{i + 1}</text>
  </g>);
  return <div className="planner-drawing" data-testid="plan-editor">
    <div className="planner-drawing-tools"><button aria-label="Priblížiť pôdorys" onClick={() => setZoom(Math.min(4, zoom * 1.2))}>＋</button><button aria-label="Oddialiť pôdorys" onClick={() => setZoom(Math.max(.5, zoom / 1.2))}>−</button><button aria-pressed={panMode} onClick={() => setPanMode(!panMode)}>Posun</button><button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>Celý návrh</button><span>{fmt(zoom * 100, 0)} %</span></div>
    <svg ref={svg} viewBox={`${vx} ${vy} ${width} ${height}`} preserveAspectRatio="xMidYMid meet" role="group" aria-label="Interaktívny pôdorys terasy; vrcholy možno posúvať alebo upraviť v súradniciach" onPointerDown={event => { if (panMode) { const inverse = svg.current?.getScreenCTM()?.inverse(); if (!inverse) return; const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(inverse); drag.current = { kind: 'pan', start: { x: p.x, y: p.y }, pan, inverse }; svg.current?.setPointerCapture(event.pointerId); } }} onPointerMove={move} onPointerUp={() => { drag.current = null; setPan(p => ({ ...p })); }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}>
      <defs><pattern id="planner-grid" width={250} height={250} patternUnits="userSpaceOnUse"><path d="M250 0H0V250" fill="none" stroke="#d6d6d0" strokeWidth={2} /></pattern></defs>
      <rect x={vx} y={vy} width={width} height={height} fill="url(#planner-grid)" />
      <path d={[pointsPath(input.outline), ...input.holes.map(pointsPath)].join(' ')} fill="#e1e2d9" fillRule="evenodd" stroke={result.valid ? '#101010' : '#b52d2d'} strokeWidth={span * .003} />
      {boards && result.boards.flatMap(b => b.footprintParts.map((part, i) => <path key={`${b.id}-${i}`} d={pointsPath(part)} fill={b.row % 2 ? '#ad8964' : '#bc9770'} stroke="#65563e" strokeWidth={1.5} />))}
      {structure && <g stroke="#333c40" strokeWidth={span * .008} opacity=".65">{result.joists.map(j => <path key={j.id} d={`M${j.start.x} ${j.start.y}L${j.end.x} ${j.end.y}`} />)}</g>}
      {structure && result.pedestals.map(p => <circle key={p.id} cx={p.x} cy={p.y} r={span * .012} fill="#101010" />)}
      {joints && result.boards.filter(b => b.jointAfter).map(b => <circle key={b.id} cx={b.end.x} cy={b.end.y} r={size * .5} fill="#c8ff32" stroke="#101010" strokeWidth={2} />)}
      {dimensions && input.outline.map((p, i) => { const q = input.outline[(i + 1) % input.outline.length]; const dx = q.x - p.x, dy = q.y - p.y; const n = Math.hypot(dx, dy); return <text key={i} x={(p.x + q.x) / 2} y={(p.y + q.y) / 2 - size * 2.5} textAnchor="middle" fontSize={size * 1.5} fill="#101010" paintOrder="stroke" stroke="#f7f7f4" strokeWidth={size * .35}>{formatDimension(n)}</text>; })}
      {renderVertices(input.outline, -1)}{input.holes.flatMap((ring, h) => renderVertices(ring, h))}
    </svg>
    <p className="planner-editor-hint">Ťahaj zelené body · súradnice zadaj presne v paneli · šípky posúvajú o 10 mm</p>
  </div>;
}

export default function Planner2027() {
  const [params] = useSearchParams();
  const cart = useCart();
  const boardProducts = cart.catalog.filter(p => ['massive', 'thermo', 'wpc'].includes(p.category));
  const firstProduct = boardProducts.find(p => p.id === params.get('product')) ?? boardProducts[0] ?? productCatalog[0];
  const [input, setInput] = useState<PlanInput>(() => ({ outline: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 2500 }, { x: 0, y: 2500 }], holes: [], substrate: 'concrete', orientation: 'x', heightMm: 180, gapMm: firstProduct.installationRules?.boardGapMm ?? 6, productId: firstProduct.id, variantId: firstProduct.variants.find(v => v.id === params.get('variant'))?.id ?? firstProduct.variants[0].id, reservePercent: 5 }));
  const [shape, setShape] = useState<DeckShape>('rectangle');
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<'2d' | '3d'>('2d');
  const [view, setView] = useState<'perspective' | 'top'>('perspective');
  const [units, setUnits] = useState<'mm' | 'm'>('mm');
  const [dimensions, setDimensions] = useState(true);
  const [structure, setStructure] = useState(true);
  const [boards, setBoards] = useState(true);
  const [joints, setJoints] = useState(true);
  const [exploded, setExploded] = useState(false);
  const [length, setLength] = useState(4000);
  const [width, setWidth] = useState(2500);
  const [inset, setInset] = useState(1200);
  const substrate = input.substrate ?? 'concrete';
  const [message, setMessage] = useState('');
  const [removed, setRemoved] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [modelReady, setModelReady] = useState(false);
  const product = boardProducts.find(p => p.id === input.productId) ?? firstProduct;
  const variant = product.variants.find(v => v.id === input.variantId) ?? product.variants[0];
  const engineProduct = useMemo(() => toEngineProduct(product, variant, cart.catalog), [product, variant, cart.catalog]);
  const result = useMemo(() => calculatePlan(input, engineProduct), [input, engineProduct]);
  const amount = (key: string, quantity: number) => quantities[key] ?? quantity;
  const chooseShape = (s: DeckShape, l = length, w = width, cut = inset) => { setShape(s); setInput({ ...input, outline: shapeOutline(s, l, w, cut), holes: [] }); setRemoved([]); setQuantities({}); };
  const update = (p: PlanInput) => { setInput(p); setRemoved([]); setQuantities({}); };
  const selectProduct = (id: string) => { const p = boardProducts.find(p => p.id === id)!; update({ ...input, productId: p.id, variantId: p.variants[0].id, gapMm: p.installationRules?.boardGapMm ?? input.gapMm }); };
  const setPoint = (h: number, i: number, axis: 'x' | 'y', n: number) => { const ring = h < 0 ? input.outline : input.holes[h]; const next = ring.map((p, j) => j === i ? { ...p, [axis]: n } : p); update({ ...input, ...(h < 0 ? { outline: next } : { holes: input.holes.map((r, j) => j === h ? next : r) }) }); setShape('custom'); };
  const save = () => { try { localStorage.setItem(storageKey, JSON.stringify({ version: 1, input })); setMessage('Návrh je uložený iba v tomto prehliadači.'); } catch { setMessage('Prehliadač nepovolil uloženie. Stiahni súbor návrhu.'); } };
  const load = () => { try { const raw = JSON.parse(localStorage.getItem(storageKey) ?? 'null'); const parsed = raw?.version === 1 ? parseProject(raw.input, cart.catalog) : null; if (!parsed) throw new Error(); update(parsed); setShape('custom'); setMessage('Uložený návrh bol načítaný.'); } catch { setMessage('V tomto prehliadači nie je platný uložený návrh.'); } };
  const resolveMaterial = (item: MaterialItem) => {
    const p = cart.catalog.find(p => p.id === item.productId);
    const v = p?.variants.find(v => item.stockLengthMm ? v.lengthMm === item.stockLengthMm && (item.key !== 'boards' || v.profile === variant.profile && v.widthMm === variant.widthMm && v.thicknessMm === variant.thicknessMm) : v.id === item.variantId) ?? (!item.stockLengthMm ? p?.variants[0] : undefined);
    return { p, v };
  };
  const itemPrice = (item: MaterialItem) => { const { v } = resolveMaterial(item); const quantity = amount(item.key + (item.stockLengthMm ?? ''), item.quantity); return v && v.priceGross !== null && item.unit === 'ks' && ['ks', 'bm', 'm²'].includes(v.unit) ? v.priceGross * saleQuantity(quantity, v) : null; };
  const knownTotal = result.materials.filter(item => !removed.includes(item.key + (item.stockLengthMm ?? ''))).reduce((s, item) => s + (itemPrice(item) ?? 0), 0);
  const unpricedTotal = result.materials.filter(item => !removed.includes(item.key + (item.stockLengthMm ?? '')) && itemPrice(item) === null).length;
  const addMaterials = () => {
    let added = 0, skipped = 0;
    for (const item of result.materials.filter(item => !removed.includes(item.key + (item.stockLengthMm ?? '')))) {
      const { p, v } = resolveMaterial(item);
      const quantity = amount(item.key + (item.stockLengthMm ?? ''), item.quantity);
      if (!p || !v || quantity <= 0 || item.unit !== 'ks' || !['ks', 'bm', 'm²'].includes(v.unit)) { skipped++; continue; }
      cart.addItem(p.id, v.id, quantity); added++;
    }
    setMessage(`${added} položiek bolo pridaných do košíka na cenovú ponuku.${skipped ? ` ${skipped} položiek nemá presný kompatibilný variant alebo predajnú jednotku a vyžaduje overenie.` : ''}`);
  };
  const planSteps = ['Tvar', 'Rozmery', 'Materiál', 'Konštrukcia', 'Výpočet', 'Výsledok'];
  if (!boardProducts.length) return <main className="planner2027" tabIndex={-1}><header className="planner-heading"><h1>NAJPRV.<br />MATERIÁL.</h1></header><p>V lokálnom katalógu nie sú terasové dosky. Obnov katalóg v lokálnom administračnom deme alebo importuj produkty.</p><Link to="/admin">Otvoriť lokálne demo →</Link></main>;
  return <main className="planner2027" tabIndex={-1} data-testid="planner-page">
    <header className="planner-heading"><div><p className="planner-kicker">02 / TVOJ PRIESTOR, PRESNÉ ROZMERY</p><h1>NAVRHNI.<br /><span>PO SVOJOM.</span></h1></div><p>Od prvého bodu po materiálový zoznam.<br />Jeden návrh. Dva pohľady.</p></header>
    <nav className="planner-step-nav" aria-label="Kroky plánovača">{planSteps.map((name, i) => <button key={name} onClick={() => setStep(i)} aria-current={step === i ? 'step' : undefined}><span>0{i + 1}</span>{name}</button>)}</nav>
    <div className="planner-workspace">
      <aside className="planner-settings">
        <p className="planner-kicker">0{step + 1} / {planSteps[step]}</p>
        {step === 0 && <><h2>Každý priestor<br />má svoj tvar.</h2><div className="planner-shapes">{shapes.map(s => <button key={s.id} data-testid={`planner-shape-${s.id}`} aria-pressed={shape === s.id} onClick={() => chooseShape(s.id)}><svg viewBox="0 0 50 36" aria-hidden="true"><path d={s.path} /></svg>{s.title}</button>)}</div><p className="planner-muted">Vlastný tvar upravíš posúvaním bodov alebo presnými súradnicami.</p></>}
        {step === 1 && <><h2>Rozmery bez<br />hádaniek.</h2><div className="planner-fields"><label>Dĺžka [mm]<input data-testid="planner-length" type="number" min="500" max="30000" value={length} onChange={e => { const n = Number(e.target.value); setLength(n); chooseShape(shape, n); }} /></label><label>Šírka [mm]<input data-testid="planner-width" type="number" min="500" max="30000" value={width} onChange={e => { const n = Number(e.target.value); setWidth(n); chooseShape(shape, length, n); }} /></label>{['l', 'u'].includes(shape) && <label>Rozmer výrezu [mm]<input type="number" value={inset} min="100" max={Math.min(length, width) - 100} onChange={e => { const n = Number(e.target.value); setInset(n); chooseShape(shape, length, width, n); }} /></label>}<label>Výška od podkladu [mm]<input data-testid="planner-height" type="number" min="0" max="3000" value={input.heightMm} onChange={e => update({ ...input, heightMm: Number(e.target.value) })} /></label><label>Podklad<select value={substrate} onChange={e => update({ ...input, substrate: e.target.value as 'concrete' | 'paving' | 'soil' })}><option value="concrete">Betónová doska</option><option value="paving">Dlažba</option><option value="soil">Zemina / štrk – technické posúdenie</option></select></label></div><details open={shape === 'custom'}><summary>Presné súradnice vrcholov</summary>{[input.outline, ...input.holes].map((ring, h) => <div key={h} className="planner-coordinates"><strong>{h === 0 ? 'Obvod' : `Výrez ${h}`}</strong>{ring.map((p, i) => <div key={i}><span>{i + 1}</span><label>X [mm]<input aria-label={`${h === 0 ? 'Obvod' : `Výrez ${h}`} bod ${i + 1} X`} type="number" value={p.x} onChange={e => setPoint(h - 1, i, 'x', Number(e.target.value))} /></label><label>Y [mm]<input aria-label={`${h === 0 ? 'Obvod' : `Výrez ${h}`} bod ${i + 1} Y`} type="number" value={p.y} onChange={e => setPoint(h - 1, i, 'y', Number(e.target.value))} /></label>{ring.length > 3 && <button aria-label={`Odstrániť bod ${i + 1} ${h}`} onClick={() => update(h === 0 ? { ...input, outline: ring.filter((_, j) => j !== i) } : { ...input, holes: input.holes.map((r, j) => j === h - 1 ? r.filter((_, k) => k !== i) : r) })}>×</button>}</div>)}<button onClick={() => { const a = ring[ring.length - 1], b = ring[0]; const next = [...ring, { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }]; if (ring.length >= 64) return; update(h === 0 ? { ...input, outline: next } : { ...input, holes: input.holes.map((r, j) => j === h - 1 ? next : r) }); setShape('custom'); }}>Pridať vrchol ＋</button>{h > 0 && <button onClick={() => update({ ...input, holes: input.holes.filter((_, j) => j !== h - 1) })}>Odstrániť výrez</button>}</div>)}</details><button data-testid="planner-cutout" className="planner-text-button" disabled={input.holes.length >= 8} onClick={() => { const xs = input.outline.map(p => p.x), ys = input.outline.map(p => p.y), x = Math.min(...xs) + 500, y = Math.min(...ys) + 500; update({ ...input, holes: [...input.holes, [{ x, y }, { x: x + 500, y }, { x: x + 500, y: y + 500 }, { x, y: y + 500 }]] }); }}>Pridať výrez 500 × 500 mm ＋</button></>}
        {step === 2 && <><h2>Materiál dáva<br />návrhu charakter.</h2><label className="planner-label">Terasové dosky<select data-testid="planner-product" value={product.id} onChange={e => selectProduct(e.target.value)}>{boardProducts.map(p => <option key={p.id} value={p.id}>{p.name}{p.status === 'demo' ? ' · DEMO' : ''}</option>)}</select></label><label className="planner-label">Profil a rozmery<select data-testid="planner-variant" value={variant.id} onChange={e => update({ ...input, variantId: e.target.value })}>{product.variants.map(v => <option key={v.id} value={v.id}>{v.profile} · {v.thicknessMm} × {v.widthMm} × {v.lengthMm} mm</option>)}</select></label><p className="planner-muted">Nárezy využívajú dostupné dĺžky rovnakého profilu. Vybraná dĺžka neobmedzuje optimalizáciu.</p><Link to={`/produkt/${product.id}`} className="planner-text-button">Technický detail ↗</Link></>}
        {step === 3 && <><h2>Jedna nosná<br />vrstva.</h2><label className="planner-label">Smer dosiek<select data-testid="planner-orientation" value={input.orientation} onChange={e => update({ ...input, orientation: e.target.value as 'x' | 'y' })}><option value="x">Pozdĺž osi X</option><option value="y">Pozdĺž osi Y</option></select></label><label className="planner-label">Škára medzi doskami [mm]<input type="number" min="0" max="30" value={input.gapMm} onChange={e => update({ ...input, gapMm: Number(e.target.value) })} /></label><ol className="planner-build-layers"><li>Terasové dosky</li><li>Jeden kolmý nosný rošt</li><li>Rektifikačné terče</li><li>Betónový podklad</li></ol><p className="planner-muted">{engineProduct.installationRules ? (engineProduct.installationRules.verification === 'verified' ? 'Produktové pravidlá s uvedeným zdrojom. Návrh treba technicky potvrdiť pre konkrétne podmienky.' : 'Ukážkové montážne pravidlá DEMO. Pred realizáciou treba overiť kompletný systém výrobcu.') : 'Montážne pravidlá produktu nie sú overené. Konštrukciu a objednávkové množstvá nevypočítavame.'}</p></>}
        {step >= 4 && <><h2>Návrh v číslach.</h2><label className="planner-label">Rezerva dosiek [%]<input type="number" min="0" max="30" value={input.reservePercent} onChange={e => update({ ...input, reservePercent: Number(e.target.value) })} /></label><div className="planner-stat"><span>Čistá plocha</span><strong data-testid="planner-area">{fmt(result.areaM2)} <small>m²</small></strong></div><div className="planner-stat"><span>Dosky v návrhu</span><strong>{result.boards.length} <small>ks</small></strong></div><div className="planner-stat"><span>Využitie dosiek bez rezervy</span><strong>{result.totals.utilizationPercent === null ? '—' : `${fmt(result.totals.utilizationPercent, 1)} %`}</strong></div><p className="planner-muted">Cena na vyžiadanie. Technické množstvá sa zobrazia iba pre podporovaný systém.</p></>}
        <div className="planner-step-actions">{step > 0 && <button onClick={() => setStep(step - 1)}>← Späť</button>}{step < 5 && <button className="planner-lime-button" data-testid="planner-next" onClick={() => setStep(step + 1)}>Ďalej →</button>}</div>
      </aside>
      <section className="planner-canvas-panel" aria-label="Náhľad návrhu"><div className="planner-canvas-bar"><div role="group" aria-label="Zobrazenie návrhu"><button data-testid="planner-2d" aria-pressed={mode === '2d'} onClick={() => setMode('2d')}>2D</button><button data-testid="planner-3d" aria-pressed={mode === '3d'} onClick={() => setMode('3d')}>3D</button></div><span data-testid="planner-sync" data-boards={result.boards.length} data-joists={result.joists.length} data-area={result.areaM2} data-model-ready={modelReady}>LIVE / {fmt(result.areaM2)} m²</span><label>Jednotky<select value={units} onChange={e => setUnits(e.target.value as 'mm' | 'm')}><option>mm</option><option>m</option></select></label></div>
        {mode === '2d' ? <PlanEditor input={input} result={result} onChange={p => { update(p); setShape('custom'); }} dimensions={dimensions} structure={structure} boards={boards} joints={joints} units={units} /> : <div className="planner-3d-stage"><PlannerScene2027 result={result} boardMaterial={product.category === 'wpc' ? 'wpc' : 'wood'} materialColor={product.category === 'wpc' ? '#4b5051' : product.category === 'thermo' ? '#796149' : '#b98956'} view={view} showStructure={structure} exploded={exploded} structureMaterial={cart.catalog.find(p => p.id === engineProduct.installationRules?.accessoryProductIds?.joist)?.category === 'aluminium' ? 'aluminium' : 'wood'} onReady={setModelReady} /></div>}
        <div className="planner-layer-tools"><label><input type="checkbox" checked={structure} onChange={e => setStructure(e.target.checked)} />Rošt a terče</label>{mode === '2d' ? <><label><input type="checkbox" checked={dimensions} onChange={e => setDimensions(e.target.checked)} />Kóty</label><label><input type="checkbox" checked={boards} onChange={e => setBoards(e.target.checked)} />Dosky</label><label><input type="checkbox" checked={joints} onChange={e => setJoints(e.target.checked)} />Napojenia</label></> : <><label><input type="checkbox" checked={exploded} onChange={e => setExploded(e.target.checked)} />Rozložená konštrukcia</label><button onClick={() => setView(view === 'top' ? 'perspective' : 'top')}>{view === 'top' ? 'Perspektíva' : 'Pohľad zhora'}</button></>}</div>
        <div className={`planner-status ${!result.valid ? 'is-error' : ''}`} role="status" data-testid="planner-status"><strong>{!result.valid ? 'Návrh treba opraviť' : result.technicalStatus === 'demo' ? 'DEMO · orientačný technický návrh' : result.technicalStatus === 'verified' ? 'Orientačný návrh podľa produktových pravidiel' : 'Pôdorys bez overenej skladby'}</strong>{result.warnings.map(w => <p key={w.code}>{w.message}</p>)}{substrate !== 'concrete' && <p>Výpočet teraz modeluje uloženie na rovnom pevnom betónovom podklade. Vybraný podklad vyžaduje individuálne posúdenie.</p>}</div>
      </section>
    </div>
    <section className="planner-report" id="planner-report"><header><p className="planner-kicker">05 / TECHNICKÝ VÝSTUP</p><h2>MATERIÁL.<br /><span>BEZ DOHADOV.</span></h2><p>{product.name} · {variant.profile}<br />{fmt(result.areaM2)} m² · výška {input.heightMm} mm · {result.technicalStatus === 'demo' ? 'DEMONŠTRAČNÝ SYSTÉM' : 'ORIENTAČNÝ NÁVRH'}</p></header>
      {result.materials.length ? <div className="planner-table-wrap"><table><caption>Materiálový zoznam – množstvá treba technicky potvrdiť</caption><thead><tr><th>Položka / výrobná dĺžka</th><th>Množstvo</th><th>Jednotka</th><th>Cena</th><th /></tr></thead><tbody>{result.materials.filter(item => !removed.includes(item.key + (item.stockLengthMm ?? ''))).map(item => { const key = item.key + (item.stockLengthMm ?? ''); return <tr key={key}><td>{item.name}{item.stockLengthMm ? <small>{item.stockLengthMm} mm</small> : null}</td><td><input aria-label={`Množstvo ${item.name} ${item.stockLengthMm ?? ''}`} type="number" min="0" step={item.unit === 'bm' ? '.01' : '1'} value={amount(key, item.quantity)} onChange={e => setQuantities({ ...quantities, [key]: item.unit === 'ks' ? Math.max(0, Math.floor(Number(e.target.value))) : Math.max(0, Number(e.target.value)) })} /></td><td>{item.unit}</td><td>{itemPrice(item) === null ? 'Na vyžiadanie' : money(itemPrice(item)!)}</td><td><button className="planner-remove" aria-label={`Odstrániť ${item.name}`} onClick={() => setRemoved([...removed, key])}>×</button></td></tr>; })}</tbody></table></div> : <p className="planner-empty">Pre tento návrh nie sú k dispozícii spoľahlivé montážne pravidlá. Pôdorys si môžeš uložiť a priložiť k dopytu.</p>}
      <p className="planner-material-total">{knownTotal > 0 ? `Známe ceny s DPH: ${money(knownTotal)}. ` : ''}{unpricedTotal ? `${unpricedTotal} položiek má cenu na vyžiadanie; celkovú cenu nemožno uzavrieť.` : result.materials.length ? `Spolu s DPH: ${money(knownTotal)}` : ''}</p>
      <div className="planner-report-actions"><button data-testid="planner-add-cart" className="planner-lime-button" disabled={!result.valid || !result.materials.length || substrate !== 'concrete'} onClick={addMaterials}>Pridať materiál do košíka →</button><button onClick={save}>Uložiť návrh</button><button onClick={load}>Načítať uložený</button><button onClick={() => downloadProject(input)}>Stiahnuť projekt JSON</button><label className="planner-file-button">Otvoriť projekt<input type="file" accept=".json,application/json" onChange={async e => { const file = e.target.files?.[0]; if (!file || file.size > 100000) { setMessage('Projekt musí byť JSON do 100 kB.'); return; } try { const raw = JSON.parse(await file.text()); const p = raw.version === 1 ? parseProject(raw.input, cart.catalog) : null; if (!p) throw new Error(); update(p); setShape('custom'); setMessage('Projekt je otvorený.'); } catch { setMessage('Súbor neobsahuje platný projekt.'); } e.target.value = ''; }} /></label><button onClick={() => window.print()}>Tlač / uložiť PDF</button><Link to="/realizacia-na-kluc" onClick={save}>Dopyt na realizáciu ↗</Link><Link to="/kosik">Otvoriť košík ↗</Link></div><p className="planner-message" aria-live="polite">{message}</p>
      {result.stock.length > 0 && <details className="planner-cuts" open={step >= 4}><summary>Nárezový plán · využitie {fmt(result.totals.utilizationPercent ?? 0, 1)} % · rezerva {result.totals.reserveBoards} ks</summary><p>Deterministické hľadanie kombinácií dĺžok a opätovné využitie odrezkov. Výsledok nie je zárukou globálneho minima. Odpad {fmt(result.totals.wasteMm / 1000, 3)} bm; opätovne použiteľné odrezky {fmt(result.totals.reusableOffcutMm / 1000, 3)} bm.</p><ol>{result.stock.map(stock => <li key={stock.id}><span>{stock.id} / {stock.lengthMm} mm{stock.reserve ? ' · REZERVA' : ''}</span><div className="planner-cut-bar">{stock.cuts.map((cut, i) => <span key={i} style={{ width: `${cut.lengthMm / stock.lengthMm * 100}%` }} title={`${cut.boardId}: ${cut.lengthMm} mm`}>{cut.lengthMm}</span>)}<i style={{ width: `${stock.offcutMm / stock.lengthMm * 100}%` }}>{stock.offcutMm}</i></div><small>{stock.cuts.map(c => `${c.boardId}: ${fmt(c.lengthMm, 1)} mm`).join(' + ')} · píla {fmt(stock.kerfMm, 1)} mm · odrezok {fmt(stock.offcutMm, 1)} mm</small></li>)}</ol></details>}

      {result.joistStock.length > 0 && <details className="planner-cuts" open={step >= 4}><summary>Nárezový plán nosného roštu · {result.joistStock.length} profilov</summary><p>Jedna nosná vrstva. Každý nosník sa reže z dostupnej výrobnej dĺžky; napájanie krátkych profilov bez montážneho pravidla nepovoľujeme.</p><ol>{result.joistStock.map(stock => <li key={stock.id}><span>{stock.id} / {stock.lengthMm} mm</span><div className="planner-cut-bar">{stock.cuts.map((cut, i) => <span key={i} style={{ width: cut.lengthMm / stock.lengthMm * 100 + '%' }} title={cut.boardId + ': ' + cut.lengthMm + ' mm'}>{fmt(cut.lengthMm, 1)}</span>)}<i style={{ width: stock.offcutMm / stock.lengthMm * 100 + '%' }}>{fmt(stock.offcutMm, 1)}</i></div><small>{stock.cuts.map(c => c.boardId + ': ' + fmt(c.lengthMm, 1) + ' mm').join(' + ')} · píla {fmt(stock.kerfMm, 1)} mm · odrezok {fmt(stock.offcutMm, 1)} mm</small></li>)}</ol></details>}
      <div className="planner-print-plan"><svg viewBox={`${Math.min(...input.outline.map(p => p.x)) - 200} ${Math.min(...input.outline.map(p => p.y)) - 200} ${Math.max(...input.outline.map(p => p.x)) - Math.min(...input.outline.map(p => p.x)) + 400} ${Math.max(...input.outline.map(p => p.y)) - Math.min(...input.outline.map(p => p.y)) + 400}`}><path d={[pointsPath(input.outline), ...input.holes.map(pointsPath)].join(' ')} fill="#eee" fillRule="evenodd" stroke="#111" strokeWidth="10" />{result.boards.flatMap(b => b.footprintParts.map((p, i) => <path key={`${b.id}${i}`} d={pointsPath(p)} fill="#b59b7d" stroke="#111" strokeWidth="2" />))}</svg><p>Orientačný návrh. Nejde o statický posudok ani montážny projekt. Neoverené ceny sú na vyžiadanie.</p><p>Podklad: {substrate}. Smer dosiek: {input.orientation.toUpperCase()}. Škára: {input.gapMm} mm. Rezerva dosiek: {input.reservePercent} %.</p><p>{input.outline.map((p, i) => { const q = input.outline[(i + 1) % input.outline.length]; return `Strana ${i + 1}: ${fmt(Math.hypot(q.x - p.x, q.y - p.y), 1)} mm`; }).join(' · ')}</p>{result.warnings.map(w => <p key={w.code}>{w.message}</p>)}</div>
    </section>
  </main>;
}

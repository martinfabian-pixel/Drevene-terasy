import type { DeckShape, Point } from './types';

export const EPSILON = 1e-6;
export const roundMm = (value: number) => Math.round(value * 1000) / 1000;
export function signedArea(ring: Point[]): number {
  return ring.reduce((sum, p, i) => {
    const q = ring[(i + 1) % ring.length];
    return sum + p.x * q.y - q.x * p.y;
  }, 0) / 2;
}
export function polygonArea(ring: Point[]): number { return Math.abs(signedArea(ring)); }
export function perimeter(ring: Point[]): number {
  return ring.reduce((sum, p, i) => {
    const q = ring[(i + 1) % ring.length];
    return sum + Math.hypot(p.x - q.x, p.y - q.y);
  }, 0);
}
export function bounds(ring: Point[]) {
  return { minX: Math.min(...ring.map(p => p.x)), maxX: Math.max(...ring.map(p => p.x)),
    minY: Math.min(...ring.map(p => p.y)), maxY: Math.max(...ring.map(p => p.y)) };
}
function cross(a: Point, b: Point, c: Point) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
function onSegment(a: Point, b: Point, p: Point): boolean {
  return Math.abs(cross(a, b, p)) < EPSILON && p.x >= Math.min(a.x, b.x) - EPSILON &&
    p.x <= Math.max(a.x, b.x) + EPSILON && p.y >= Math.min(a.y, b.y) - EPSILON &&
    p.y <= Math.max(a.y, b.y) + EPSILON;
}
export function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
  if (((abC > EPSILON && abD < -EPSILON) || (abC < -EPSILON && abD > EPSILON)) &&
    ((cdA > EPSILON && cdB < -EPSILON) || (cdA < -EPSILON && cdB > EPSILON))) return true;
  return onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
}
/** 1 inside, 0 on boundary, -1 outside. */
export function pointInPolygon(point: Point, ring: Point[]): -1 | 0 | 1 {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[j], b = ring[i];
    if (onSegment(a, b, point)) return 0;
    if ((a.y > point.y) !== (b.y > point.y) &&
      point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside ? 1 : -1;
}
function ringsIntersect(a: Point[], b: Point[]): boolean {
  return a.some((p, i) => b.some((q, j) => segmentsIntersect(p, a[(i + 1) % a.length], q, b[(j + 1) % b.length])));
}
function validateRing(ring: Point[], name: string): string[] {
  const errors: string[] = [];
  if (ring.length < 3 || ring.length > 100) return [`${name}: pôdorys musí mať 3 až 100 bodov.`];
  if (ring.some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y) || Math.abs(p.x) > 200000 || Math.abs(p.y) > 200000))
    return [`${name}: súradnice musia byť konečné hodnoty v milimetroch.`];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    if (Math.hypot(a.x - b.x, a.y - b.y) < 1) errors.push(`${name}: susedné vrcholy musia byť od seba aspoň 1 mm.`);
    for (let j = i + 1; j < ring.length; j++) {
      if (j === i + 1 || (i === 0 && j === ring.length - 1)) continue;
      if (segmentsIntersect(a, b, ring[j], ring[(j + 1) % ring.length])) {
        errors.push(`${name}: hrany ${i + 1} a ${j + 1} sa pretínajú alebo dotýkajú.`);
      }
    }
  }
  if (polygonArea(ring) < 10000) errors.push(`${name}: plocha musí byť aspoň 0,01 m².`);
  return errors;
}
export function validateGeometry(outline: Point[], holes: Point[][] = []): string[] {
  const errors = validateRing(outline, 'Obrys');
  if (holes.length > 20) errors.push('Najviac 20 výrezov v jednom projekte.');
  holes.forEach((hole, i) => errors.push(...validateRing(hole, `Výrez ${i + 1}`)));
  if (errors.length) return [...new Set(errors)];
  holes.forEach((hole, i) => {
    if (hole.some(p => pointInPolygon(p, outline) !== 1) || ringsIntersect(outline, hole))
      errors.push(`Výrez ${i + 1} musí byť celý vo vnútri obrysu bez dotyku jeho hrán.`);
    for (let j = i + 1; j < holes.length; j++) {
      if (ringsIntersect(hole, holes[j]) || pointInPolygon(hole[0], holes[j]) !== -1 || pointInPolygon(holes[j][0], hole) !== -1)
        errors.push(`Výrezy ${i + 1} a ${j + 1} sa nesmú prekrývať ani dotýkať.`);
    }
  });
  const b = bounds(outline);
  if(polygonArea(outline)-holes.reduce((sum,h)=>sum+polygonArea(h),0)<10000)
    errors.push('Čistá plocha po odpočítaní výrezov musí byť aspoň 0,01 m².');
  if (b.maxX - b.minX > 30000 || b.maxY - b.minY > 30000 || polygonArea(outline) > 400000000)
    errors.push('Táto verzia podporuje pôdorysy do 30 m na stranu a 400 m².');
  return [...new Set(errors)];
}
export function isOrthogonal(ring: Point[]): boolean {
  return ring.every((p, i) => { const q = ring[(i + 1) % ring.length]; return Math.abs(p.x - q.x) < EPSILON || Math.abs(p.y - q.y) < EPSILON; });
}
/** Orthogonal inward offset. Negative distance expands a hole. */
export function offsetOrthogonal(ring: Point[], distanceMm: number): Point[] {
  ring=ring.filter((p,i)=>Math.abs(cross(ring[(i+ring.length-1)%ring.length],p,ring[(i+1)%ring.length]))>EPSILON);
  if (!distanceMm) return ring.map(p=>({...p}));
  const direction = signedArea(ring) > 0 ? 1 : -1;
  const shifted = ring.map((a,i)=>{
    const b=ring[(i+1)%ring.length], length=Math.hypot(b.x-a.x,b.y-a.y);
    const dx=-(b.y-a.y)/length*distanceMm*direction, dy=(b.x-a.x)/length*distanceMm*direction;
    return {a:{x:a.x+dx,y:a.y+dy},b:{x:b.x+dx,y:b.y+dy}};
  });
  return shifted.map((line,i)=>{
    const previous=shifted[(i+shifted.length-1)%shifted.length];
    if (Math.abs(line.a.x-line.b.x)<EPSILON) return {x:line.a.x,y:previous.a.y};
    return {x:previous.a.x,y:line.a.y};
  });
}
export function shapeOutline(shape: DeckShape, widthMm = 4000, lengthMm = 2500, insetMm?: number): Point[] {
  const w = widthMm, h = shape === 'square' ? widthMm : lengthMm;
  const notchW = Math.min(w * 0.45, insetMm ?? w * 0.4), notchH = h * 0.45;
  if (shape === 'l') return [{x:0,y:0},{x:w,y:0},{x:w,y:h-notchH},{x:w-notchW,y:h-notchH},{x:w-notchW,y:h},{x:0,y:h}];
  if (shape === 'u') return [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:w*0.7,y:h},{x:w*0.7,y:h*0.45},{x:w*0.3,y:h*0.45},{x:w*0.3,y:h},{x:0,y:h}];
  return [{x:0,y:0},{x:w,y:0},{x:w,y:h},{x:0,y:h}];
}

interface Boundary { a: Point; b: Point; x: number }
interface Interval { left: Boundary; right: Boundary }
function atY(edge: Boundary, y: number): number {
  return edge.a.x + (y - edge.a.y) * (edge.b.x - edge.a.x) / (edge.b.y - edge.a.y);
}
function ringIntervals(ring: Point[], y: number): Interval[] {
  const hits: Boundary[] = [];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length];
    if ((a.y <= y && b.y > y) || (b.y <= y && a.y > y)) {
      const edge = { a, b, x: 0 }; edge.x = atY(edge, y); hits.push(edge);
    }
  });
  hits.sort((a, b) => a.x - b.x);
  const intervals: Interval[] = [];
  for (let i = 0; i + 1 < hits.length; i += 2) intervals.push({left:hits[i],right:hits[i+1]});
  return intervals;
}
function solidIntervals(outline: Point[], holes: Point[][], y: number): Interval[] {
  let solid = ringIntervals(outline, y);
  for (const hole of holes) for (const cut of ringIntervals(hole, y)) {
    const next: Interval[] = [];
    for (const part of solid) {
      if (cut.right.x <= part.left.x + EPSILON || cut.left.x >= part.right.x - EPSILON) { next.push(part); continue; }
      if (cut.left.x > part.left.x + EPSILON) next.push({left:part.left,right:cut.left});
      if (cut.right.x < part.right.x - EPSILON) next.push({left:cut.right,right:part.right});
    }
    solid = next;
  }
  return solid;
}
/** Exact intersection of a board ribbon and a simple polygon with disjoint holes. */
export function ribbonParts(outline: Point[], holes: Point[][], low: number, high: number): Point[][] {
  const ys = [...new Set([low, high, ...outline.map(p=>p.y), ...holes.flat().map(p=>p.y)]
    .filter(y=>y >= low && y <= high))].sort((a,b)=>a-b);
  const pieces: Point[][] = [];
  for (let i = 0; i + 1 < ys.length; i++) {
    const a = ys[i], b = ys[i+1];
    if (b - a < EPSILON) continue;
    for (const interval of solidIntervals(outline, holes, (a+b)/2)) {
      const polygon = [{x:atY(interval.left,a),y:a},{x:atY(interval.right,a),y:a},
        {x:atY(interval.right,b),y:b},{x:atY(interval.left,b),y:b}];
      if (polygonArea(polygon) > EPSILON) pieces.push(polygon);
    }
  }
  return pieces;
}
/** Half-open scanline. Used away from boundaries for joist centre lines. */
export function lineIntervals(outline: Point[], holes: Point[][], y: number): [number, number][] {
  return solidIntervals(outline, holes, y).map(i => [i.left.x, i.right.x]);
}
export function clipPolygonX(polygon: Point[], low: number, high: number): Point[] {
  let result = polygon;
  for (const [boundary, keepGreater] of [[low, true], [high, false]] as const) {
    const next: Point[] = [];
    for (let i = 0; i < result.length; i++) {
      const a = result[i], b = result[(i + 1) % result.length];
      const ain = keepGreater ? a.x >= boundary - EPSILON : a.x <= boundary + EPSILON;
      const bin = keepGreater ? b.x >= boundary - EPSILON : b.x <= boundary + EPSILON;
      if (ain) next.push(a);
      if (ain !== bin) next.push({x:boundary,y:a.y+(boundary-a.x)*(b.y-a.y)/(b.x-a.x)});
    }
    result = next;
  }
  return result;
}
/** Connected components of trapezoids; point-only contact does not join two boards. */
export function connectedRibbonParts(parts: Point[][]): Point[][][] {
  const groups: Point[][][] = [];
  const seen = new Set<number>();
  const bs = parts.map(bounds);
  function touch(a: number, b: number) {
    const aa=bs[a],bb=bs[b];
    if (Math.abs(aa.maxY-bb.minY)>EPSILON && Math.abs(bb.maxY-aa.minY)>EPSILON) return false;
    const y = Math.abs(aa.maxY-bb.minY)<EPSILON ? aa.maxY : aa.minY;
    const ax=parts[a].filter(p=>Math.abs(p.y-y)<EPSILON).map(p=>p.x);
    const bx=parts[b].filter(p=>Math.abs(p.y-y)<EPSILON).map(p=>p.x);
    return Math.min(Math.max(...ax),Math.max(...bx))-Math.max(Math.min(...ax),Math.min(...bx))>EPSILON;
  }
  parts.forEach((_,i)=>{
    if (seen.has(i)) return;
    const queue=[i], group:Point[][]=[]; seen.add(i);
    while (queue.length) {
      const p=queue.shift()!; group.push(parts[p]);
      parts.forEach((__,j)=>{if(!seen.has(j)&&touch(p,j)){seen.add(j);queue.push(j);}});
    }
    groups.push(group);
  });
  return groups;
}

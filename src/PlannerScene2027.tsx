import { useEffect, useMemo, useRef, useState } from 'react';
import type * as Three from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { PlanResult, Point } from './engine/types';

type ThreeModule = typeof import('three');
type OrbitModule = typeof import('three/addons/controls/OrbitControls.js');
type MergeModule = typeof import('three/addons/utils/BufferGeometryUtils.js');

export interface PlannerScene2027Props {
  /** Exactly the result consumed by the 2D editor and material schedule, in mm. */
  result: PlanResult;
  materialColor?: string;
  boardMaterial?: 'wood' | 'wpc';
  structureMaterial?: 'wood' | 'aluminium';
  view?: 'perspective' | 'top';
  showStructure?: boolean;
  exploded?: boolean;
  /** Increment to restore the selected view after manual orbit/pan/zoom. */
  cameraReset?: number;
  className?: string;
  onReady?: (ready: boolean) => void;
}

interface SceneOptions {
  view: 'perspective' | 'top';
  showStructure: boolean;
  exploded: boolean;
  cameraReset: number;
}
interface PlannerRig {
  updatePlan: (result: PlanResult, color: string, structureMaterial?: 'wood' | 'aluminium', boardMaterial?: 'wood' | 'wpc') => void;
  updateOptions: (options: SceneOptions) => void;
  dispose: () => void;
}

function boundsOf(points: Point[]) {
  const xs = points.map(point => point.x);
  const ys = points.map(point => point.y);
  const minX = points.length ? Math.min(...xs) : 0;
  const minY = points.length ? Math.min(...ys) : 0;
  const maxX = points.length ? Math.max(...xs) : 4000;
  const maxY = points.length ? Math.max(...ys) : 2500;
  return { minX, minY, maxX, maxY, width: Math.max(1, maxX - minX), height: Math.max(1, maxY - minY) };
}

/** A stable world-space wood texture, generated locally without supplier images. */
function grainTexture(three: ThreeModule) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  let seed = 29321;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  if (context) {
    context.fillStyle = '#d0bc9c';
    context.fillRect(0, 0, 1024, 128);
    for (let line = 0; line < 180; line++) {
      const y = random() * 128;
      const wave = random() * 8;
      context.strokeStyle = `rgba(48,27,13,${0.04 + random() * 0.16})`;
      context.lineWidth = 0.35 + random();
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(330, y - wave, 610, y + wave, 1024, y);
      context.stroke();
    }
  }
  const texture = new three.CanvasTexture(canvas);
  texture.colorSpace = three.SRGBColorSpace;
  texture.wrapS = texture.wrapT = three.RepeatWrapping;
  texture.anisotropy = 2;
  return texture;
}

/** Uniform brushed composite has straight manufacturing grooves and no knots. */
function compositeTexture(three: ThreeModule) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    context.fillStyle = '#b7babb';
    context.fillRect(0, 0, 1024, 128);
    for (let y = 2; y < 128; y += 6) {
      context.fillStyle = 'rgba(28,34,37,.20)';
      context.fillRect(0, y, 1024, 1);
      context.fillStyle = 'rgba(255,255,255,.10)';
      context.fillRect(0, y + 1, 1024, 0.6);
    }
    let seed = 8273;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    for (let index = 0; index < 3200; index++) {
      context.fillStyle = random() > 0.5 ? 'rgba(27,32,36,.04)' : 'rgba(255,255,255,.05)';
      context.fillRect(random() * 1024, random() * 128, 2 + random() * 5, 0.4);
    }
  }
  const texture = new three.CanvasTexture(canvas);
  texture.colorSpace = three.SRGBColorSpace;
  texture.wrapS = texture.wrapT = three.RepeatWrapping;
  texture.anisotropy = 2;
  texture.name = 'uniform-brushed-wpc-no-knots';
  return texture;
}

function buildPlannerScene(three: ThreeModule, orbit: OrbitModule, merge: MergeModule, host: HTMLDivElement, onReady: () => void, onLost: () => void): PlannerRig {
  const renderer = new three.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = three.SRGBColorSpace;
  renderer.toneMapping = three.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = three.PCFSoftShadowMap;
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.appendChild(renderer.domElement);

  const scene = new three.Scene();
  const camera = new three.OrthographicCamera(-3, 3, 3, -3, 0.01, 400);
  camera.position.set(-5.3, 4.2, 6.4);
  const controls: OrbitControls = new orbit.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.minZoom = 0.25;
  controls.maxZoom = 12;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.zoomSpeed = 0.75;
  controls.panSpeed = 0.75;

  scene.add(new three.HemisphereLight(0xfff7e7, 0x555d64, 2.35));
  const key = new three.DirectionalLight(0xfff3db, 3.1);
  key.position.set(-6, 12, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.normalBias = 0.008;
  key.shadow.bias = -0.00008;
  scene.add(key);
  const fill = new three.DirectionalLight(0xdde8ff, 1.3);
  fill.position.set(7, 4, -8);
  scene.add(fill);

  const map = grainTexture(three);
  const wpcMap = compositeTexture(three);
  const boardMaterials = Array.from({ length: 5 }, (_, index) => new three.MeshStandardMaterial({
    color: '#a7784e', map, bumpMap: map, bumpScale: 0.005, roughness: 0.83,
    name: `wood-tone-${index}`,
  }));
  const joistMaterial = new three.MeshStandardMaterial({ color: '#796446', roughness: 0.9 });
  const pedestalMaterial = new three.MeshStandardMaterial({ color: '#24282a', roughness: 0.76 });
  const threadMaterial = new three.MeshStandardMaterial({ color: '#141a1c', roughness: 0.55 });
  const concreteMaterial = new three.MeshStandardMaterial({ color: '#a6aaa6', roughness: 0.98 });
  const materials = [...boardMaterials, joistMaterial, pedestalMaterial, threadMaterial, concreteMaterial];
  let model = new three.Group();
  scene.add(model);
  let boards = new three.Group();
  let joists = new three.Group();
  let pedestals = new three.Group();
  let base = new three.Group();
  let current: PlanResult | null = null;
  let options: SceneOptions = { view: 'perspective', showStructure: true, exploded: false, cameraReset: 0 };
  let width = 1;
  let height = 1;
  let extent = 4;
  let disposed = false;
  let frame = 0;

  const render = () => {
    frame = 0;
    if (disposed || !host.isConnected) return;
    renderer.render(scene, camera);
    if (current?.valid && current.boards.length) onReady();
  };
  const schedule = () => { if (!disposed && !frame) frame = window.requestAnimationFrame(render); };
  controls.addEventListener('change', schedule);

  const fit = (resetPosition: boolean) => {
    const aspect = width / Math.max(1, height);
    const span = Math.max(extent * 1.23, extent * 1.45 / Math.max(0.2, aspect));
    camera.left = -span * aspect / 2;
    camera.right = span * aspect / 2;
    camera.top = span / 2;
    camera.bottom = -span / 2;
    if (resetPosition) {
      const targetY = (current?.heightMm || 180) / 2000 + (options.exploded ? 0.25 : 0);
      controls.target.set(0, targetY, 0);
      camera.zoom = 1;
      if (options.view === 'top') {
        camera.up.set(0, 0, -1);
        camera.position.set(0, extent * 2.5 + 2, 0.001);
      } else {
        camera.up.set(0, 1, 0);
        camera.position.set(-extent * 1.15, extent * 0.9 + 1, extent * 1.32);
      }
      camera.lookAt(controls.target);
    }
    camera.updateProjectionMatrix();
    controls.update();
    schedule();
  };
  const resize = () => {
    width = Math.max(1, host.clientWidth);
    height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    fit(false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);

  const keyboard = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const offset = camera.position.clone().sub(controls.target);
    const spherical = new three.Spherical().setFromVector3(offset);
    if (event.key === 'ArrowLeft') spherical.theta -= 0.085;
    else if (event.key === 'ArrowRight') spherical.theta += 0.085;
    else if (event.key === 'ArrowUp') spherical.phi = Math.max(0.04, spherical.phi - 0.085);
    else if (event.key === 'ArrowDown') spherical.phi = Math.min(Math.PI * 0.49, spherical.phi + 0.085);
    else if (event.key === '+' || event.key === '=') camera.zoom = Math.min(controls.maxZoom, camera.zoom * 1.16);
    else if (event.key === '-') camera.zoom = Math.max(controls.minZoom, camera.zoom / 1.16);
    else if (event.key === 'Home') { event.preventDefault(); fit(true); return; }
    else return;
    event.preventDefault();
    if (event.key.startsWith('Arrow')) {
      camera.up.set(0, 1, 0);
      camera.position.copy(controls.target).add(new three.Vector3().setFromSpherical(spherical));
    }
    camera.updateProjectionMatrix();
    controls.update();
    schedule();
  };
  const focusModel = () => host.focus({ preventScroll: true });
  host.addEventListener('keydown', keyboard);
  renderer.domElement.addEventListener('pointerdown', focusModel);

  const disposeModel = () => {
    const geometries = new Set<Three.BufferGeometry>();
    model.traverse(object => {
      if (object instanceof three.Mesh) geometries.add(object.geometry);
      if (object instanceof three.InstancedMesh) object.dispose();
    });
    for (const geometry of geometries) geometry.dispose();
    scene.remove(model);
    model.clear();
  };
  const applyLayers = () => {
    const separated = options.exploded ? Math.min(0.45, extent * 0.08) : 0;
    boards.position.y = separated * 2;
    joists.position.y = separated;
    pedestals.position.y = 0;
    joists.visible = options.showStructure;
    pedestals.visible = options.showStructure;
    base.visible = options.showStructure && current?.substrate === 'concrete';
    schedule();
  };

  const updatePlan = (result: PlanResult, color: string, structureMaterial: 'wood' | 'aluminium' = 'wood', boardMaterial: 'wood' | 'wpc' = 'wood') => {
    const previousExtent = extent;
    current = result;
    disposeModel();
    model = new three.Group();
    model.name = 'engine-plan-model';
    boards = new three.Group(); boards.name = 'boards';
    joists = new three.Group(); joists.name = 'single-perpendicular-joists';
    pedestals = new three.Group(); pedestals.name = 'pedestals';
    base = new three.Group(); base.name = 'illustrative-concrete-substrate';
    model.add(boards, joists, pedestals, base);
    scene.add(model);
    if (!result.valid || !result.outline.length) { schedule(); return; }
    const bounds = boundsOf(result.outline);
    const cx = (bounds.minX + bounds.maxX) / 2000;
    const cz = (bounds.minY + bounds.maxY) / 2000;
    extent = Math.max(bounds.width, bounds.height, 1000) / 1000;
    const world = (point: Point) => ({ x: point.x / 1000 - cx, z: point.y / 1000 - cz });
    const shapeOf = (points: Point[]) => {
      const shape = new three.Shape();
      points.forEach((point, index) => {
        const w = world(point);
        if (index) shape.lineTo(w.x, -w.z); else shape.moveTo(w.x, -w.z);
      });
      shape.closePath();
      return shape;
    };
    const colorValid = /^#[0-9a-f]{6}$/i.test(color) ? color : '#a7784e';
    boardMaterials.forEach((material, index) => {
      material.color.set(colorValid).multiplyScalar(boardMaterial === 'wpc' ? 0.96 + index * 0.015 : 0.88 + index * 0.055);
      material.map = material.bumpMap = boardMaterial === 'wpc' ? wpcMap : map;
      material.bumpScale = boardMaterial === 'wpc' ? 0.0015 : 0.005;
      material.roughness = boardMaterial === 'wpc' ? 0.78 : 0.83;
      material.needsUpdate = true;
    });
    joistMaterial.color.set(structureMaterial === 'aluminium' ? '#737e83' : '#796446');
    joistMaterial.metalness = structureMaterial === 'aluminium' ? 0.72 : 0;
    joistMaterial.roughness = structureMaterial === 'aluminium' ? 0.34 : 0.9;
    const grouped: Three.BufferGeometry[][] = boardMaterials.map(() => []);
    const thickness = Math.max(0.001, result.boardThicknessMm / 1000);
    for (const piece of result.boards) {
      for (const part of piece.footprintParts) {
        if (part.length < 3) continue;
        const geometry = new three.ExtrudeGeometry(shapeOf(part), { depth: thickness, bevelEnabled: false, curveSegments: 1, steps: 1 });
        // One world-space UV projection ensures touching clipped trapezoids
        // have continuous grain, rather than independent stretched textures.
        const position = geometry.getAttribute('position');
        const uv = geometry.getAttribute('uv');
        for (let index = 0; index < position.count; index++) {
          const along = result.orientation === 'x' ? position.getX(index) : -position.getY(index);
          const across = result.orientation === 'x' ? -position.getY(index) : position.getX(index);
          uv.setXY(index, along / 4, across / 0.14);
        }
        grouped[Math.abs(piece.row) % boardMaterials.length].push(geometry);
      }
    }
    grouped.forEach((geometries, index) => {
      if (!geometries.length) return;
      const merged = merge.mergeGeometries(geometries, false);
      if (!merged) { for (const geometry of geometries) geometry.dispose(); return; }
      const mesh = new three.Mesh(merged, boardMaterials[index]);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = (result.heightMm - result.boardThicknessMm) / 1000;
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.boardPieces = result.boards.length;
      boards.add(mesh);
      for (const geometry of geometries) geometry.dispose();
    });
    for (const segment of result.joists) {
      const start = world(segment.start);
      const end = world(segment.end);
      const length = Math.hypot(end.x - start.x, end.z - start.z);
      const geometry = new three.BoxGeometry(length, segment.heightMm / 1000, segment.widthMm / 1000);
      const mesh = new three.Mesh(geometry, joistMaterial);
      mesh.position.set((start.x + end.x) / 2, (result.heightMm - result.boardThicknessMm - (result.technicalReport?.options.fixing === 'visible' ? result.technicalReport.options.spacerMm : 0) - segment.heightMm / 2) / 1000, (start.z + end.z) / 2);
      mesh.rotation.y = -Math.atan2(end.z - start.z, end.x - start.x);
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.userData.joistId = segment.id;
      joists.add(mesh);
    }
    // Four instanced meshes keep hundreds of pedestals practical on phones.
    // Every instance uses the engine's exact pedestal location and height.
    if (result.pedestals.length) {
      const footGeometry = new three.CylinderGeometry(1, 1, 1, 16);
      const bodyGeometry = new three.CylinderGeometry(0.65, 1, 1, 12);
      const threadGeometry = new three.CylinderGeometry(1, 1, 1, 12);
      const headGeometry = new three.CylinderGeometry(1, 1, 1, 16);
      const parts = [
        new three.InstancedMesh(footGeometry, pedestalMaterial, result.pedestals.length),
        new three.InstancedMesh(bodyGeometry, pedestalMaterial, result.pedestals.length),
        new three.InstancedMesh(threadGeometry, threadMaterial, result.pedestals.length),
        new three.InstancedMesh(headGeometry, pedestalMaterial, result.pedestals.length),
      ];
      const matrix = new three.Matrix4();
      const quaternion = new three.Quaternion();
      result.pedestals.forEach((pedestal, index) => {
        const point = world(pedestal);
        const h = Math.max(0.004, pedestal.heightMm / 1000);
        const footH = Math.min(0.012, h * 0.16);
        const headH = Math.min(0.01, h * 0.12);
        const remaining = Math.max(0.001, h - footH - headH);
        const bodyH = remaining * 0.72;
        const threadH = remaining - bodyH;
        const dimensions = [
          { radius: Math.min(0.105, Math.max(0.04, h * 1.5)), height: footH, y: footH / 2 },
          { radius: 0.058, height: bodyH, y: footH + bodyH / 2 },
          { radius: 0.033, height: threadH, y: footH + bodyH + threadH / 2 },
          { radius: 0.077, height: headH, y: h - headH / 2 },
        ];
        dimensions.forEach((dimension, partIndex) => {
          matrix.compose(new three.Vector3(point.x, dimension.y, point.z), quaternion, new three.Vector3(dimension.radius, dimension.height, dimension.radius));
          parts[partIndex].setMatrixAt(index, matrix);
        });
      });
      parts.forEach(part => { part.instanceMatrix.needsUpdate = true; part.castShadow = part.receiveShadow = true; part.computeBoundingSphere(); pedestals.add(part); });
    }
    const slabShape = shapeOf(result.outline);
    for (const hole of result.holes) {
      const path = new three.Path();
      hole.forEach((point, index) => {
        const w = world(point);
        if (index) path.lineTo(w.x, -w.z); else path.moveTo(w.x, -w.z);
      });
      path.closePath();
      slabShape.holes.push(path);
    }
    const slab = new three.Mesh(new three.ExtrudeGeometry(slabShape, { depth: 0.12, bevelEnabled: false, steps: 1 }), concreteMaterial);
    slab.rotation.x = -Math.PI / 2;
    slab.position.y = -0.12;
    slab.receiveShadow = true;
    base.add(slab);
    const range = extent * 0.8;
    key.shadow.camera.left = key.shadow.camera.bottom = -range;
    key.shadow.camera.right = key.shadow.camera.top = range;
    key.shadow.camera.near = 0.1;
    key.shadow.camera.far = Math.max(30, extent * 7);
    key.shadow.camera.updateProjectionMatrix();
    key.position.set(-extent, extent * 2.5 + 2, extent * 1.5);
    applyLayers();
    fit(Math.abs(previousExtent - extent) > extent * 0.1 || model.children.length === 4 && !camera.userData.fitted);
    camera.userData.fitted = true;
  };
  const updateOptions = (next: SceneOptions) => {
    const resetPosition = next.view !== options.view || next.cameraReset !== options.cameraReset;
    options = next;
    applyLayers();
    fit(resetPosition);
  };
  const lost = (event: Event) => { event.preventDefault(); renderer.domElement.style.visibility = 'hidden'; onLost(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  resize();
  return {
    updatePlan, updateOptions,
    dispose() {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      controls.removeEventListener('change', schedule);
      controls.dispose();
      host.removeEventListener('keydown', keyboard);
      renderer.domElement.removeEventListener('pointerdown', focusModel);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      disposeModel();
      for (const material of materials) material.dispose();
      map.dispose();
      wpcMap.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

function PlanFallback({ result, showStructure, color }: { result: PlanResult; showStructure: boolean; color: string }) {
  const bounds = boundsOf(result.outline);
  const pad = Math.max(bounds.width, bounds.height) * 0.08;
  const path = (points: Point[]) => points.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' ') + ' Z';
  return <svg className="technical-svg" viewBox={`${bounds.minX - pad} ${bounds.minY - pad} ${bounds.width + pad * 2} ${bounds.height + pad * 2}`} width="100%" height="100%" role="img" aria-label="Presný 2D náhľad rovnakého návrhu terasy ako v 3D." style={{ display: 'block' }}>
    <path d={[path(result.outline), ...result.holes.map(path)].join(' ')} fill="#b1b5af" fillRule="evenodd" stroke="#777c78" strokeWidth={bounds.width * 0.002} />
    {showStructure && result.pedestals.map(point => <circle key={point.id} cx={point.x} cy={point.y} r={45} fill="#242424" />)}
    {showStructure && result.joists.map(segment => <line key={segment.id} x1={segment.start.x} y1={segment.start.y} x2={segment.end.x} y2={segment.end.y} stroke="#514d3e" strokeWidth={segment.widthMm} />)}
    {result.boards.flatMap(piece => piece.footprintParts.map((part, index) => <polygon key={`${piece.id}-${index}`} points={part.map(point => `${point.x},${point.y}`).join(' ')} fill={/^#[0-9a-f]{6}$/i.test(color) ? color : '#a7784e'} stroke="#4e3626" strokeWidth={1.8} />))}
  </svg>;
}

/** On-demand, touch-controlled Three model; geometry never comes from UI guesses. */
export default function PlannerScene2027({ result, materialColor = '#a7784e', boardMaterial = 'wood', structureMaterial = 'wood', view = 'perspective', showStructure = true, exploded = false, cameraReset = 0, className = '', onReady }: PlannerScene2027Props) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef<PlannerRig | null>(null);
  const latest = useRef({ result, materialColor, boardMaterial, structureMaterial, view, showStructure, exploded, cameraReset, onReady });
  latest.current = { result, materialColor, boardMaterial, structureMaterial, view, showStructure, exploded, cameraReset, onReady };
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const signature = useMemo(() => `${result.outline.map(p => `${p.x}:${p.y}`).join('|')}/${result.holes.map(h => h.map(p => `${p.x}:${p.y}`).join('|')).join(';')}/${result.orientation}/${result.boards.length}/${result.heightMm}/${result.boardThicknessMm}/${result.joists.length}/${result.technicalReport?.joistArticle??''}/${result.technicalReport?.options.jointGapMm??0}`, [result]);

  useEffect(() => {
    const container = host.current;
    setReady(false);
    setFailed(false);
    latest.current.onReady?.(false);
    if (!container || !result.valid || !result.boards.length) return;
    let cancelled = false;
    let initializing = false;
    const initialize = async () => {
      if (initializing || cancelled) return;
      initializing = true;
      try {
        const [three, orbit, merge] = await Promise.all([import('three'), import('three/addons/controls/OrbitControls.js'), import('three/addons/utils/BufferGeometryUtils.js')]);
        if (cancelled) return;
        const sceneRig = buildPlannerScene(three, orbit, merge, container, () => {
          if (!cancelled) { setReady(true); latest.current.onReady?.(true); }
        }, () => {
          if (!cancelled) { setReady(false); setFailed(true); latest.current.onReady?.(false); }
        });
        rig.current = sceneRig;
        sceneRig.updatePlan(latest.current.result, latest.current.materialColor, latest.current.structureMaterial, latest.current.boardMaterial);
        sceneRig.updateOptions(latest.current);
      } catch {
        if (!cancelled) {
          for (const canvas of container.querySelectorAll('canvas')) { canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); }
          setFailed(true);
          latest.current.onReady?.(false);
        }
      }
    };
    const visibility = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { void initialize(); visibility.disconnect(); }
    }, { rootMargin: '120px' });
    visibility.observe(container);
    return () => { cancelled = true; visibility.disconnect(); rig.current?.dispose(); rig.current = null; };
  }, [result.valid, Boolean(result.boards.length), retry]);

  useEffect(() => { rig.current?.updatePlan(result, materialColor, structureMaterial, boardMaterial); }, [result, materialColor, structureMaterial, boardMaterial]);
  useEffect(() => { rig.current?.updateOptions({ view, showStructure, exploded, cameraReset }); }, [view, showStructure, exploded, cameraReset]);

  const visible = ready && result.valid;
  return <div className={`planner-scene-2027 ${className}`} data-testid="planner-scene" data-board-material={boardMaterial} data-structure-material={structureMaterial} data-board-count={result.boards.length} data-joist-count={result.joists.length} data-pedestal-count={result.pedestals.length} data-geometry-signature={signature} data-three-ready={visible} style={{ width: '100%', height: '100%', minHeight: 320, position: 'relative', overflow: 'hidden' }}>
    {!visible && <div style={{ position: 'absolute', inset: '12px 12px 42px', pointerEvents: 'none' }}><PlanFallback result={result} showStructure={showStructure} color={materialColor} /></div>}
    <div ref={host} tabIndex={visible ? 0 : -1} aria-label="3D model terasy. Ťahaním otočíte pohľad, dvoma prstami priblížite alebo posuniete model. Klávesnicou: šípky otočia pohľad, plus a mínus priblížia, Home obnoví pohľad." role="img" style={{ position: 'absolute', inset: 0, visibility: visible ? 'visible' : 'hidden', pointerEvents: visible ? 'auto' : 'none' }} />
    <div role="status" style={{ position: 'absolute', bottom: 12, left: 16, right: 16, fontSize: 11, lineHeight: 1.5, color: 'inherit', pointerEvents: 'none' }}>
      {!result.valid ? 'Najprv opravte neplatný pôdorys.' : !result.boards.length ? 'Pre tento materiál nie sú dostupné rozmery na vytvorenie modelu.' : failed ? '3D sa na tomto zariadení nepodarilo spustiť. Zobrazený je presný 2D náhľad návrhu.' : !visible ? 'Pripravujem 3D model…' : `${result.substrate !== 'concrete' ? 'Vizualizácia pôdorysu bez návrhu podkladu. ' : ''}Ťahajte pre otočenie · koliesko / dva prsty pre zoom · pravé tlačidlo / dva prsty pre posun`}
      {failed && <button type="button" onClick={() => setRetry(value => value + 1)} style={{ pointerEvents: 'auto', marginLeft: 8, border: '1px solid currentColor', padding: '4px 8px', background: 'transparent', color: 'inherit', cursor: 'pointer' }}>Znovu spustiť 3D</button>}
    </div>
  </div>;
}

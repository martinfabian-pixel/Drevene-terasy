import { useEffect, useRef, useState } from 'react';
import type * as Three from 'three';
import { asset } from './data';

type ThreeModule = typeof import('three');
type SceneLayer = 1 | 2 | 3 | 4 | 5;

export interface DeckScene2027Props {
  /** Enable the real model after user interaction; keep the exact image beforehand. */
  active?: boolean;
  assembled?: boolean;
  /** 0 = whole construction; 1 boards, 2 joists, 3 profiles, 4 pedestals, 5 base. */
  layer?: number;
  className?: string;
}

interface SceneRig {
  update: (assembled: boolean, layer: number) => void;
  dispose: () => void;
}

/** Seeded textures make each plank different without downloads or frame-time work. */
function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function woodTexture(three: ThreeModule, seed: number) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  const random = seededRandom(seed);
  if (context) {
    const shade = seed % 5;
    const gradient = context.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, `rgb(${130 + shade * 4},${104 + shade * 3},${77 + shade * 2})`);
    gradient.addColorStop(0.45, `rgb(${153 + shade * 3},${124 + shade * 3},${92 + shade * 2})`);
    gradient.addColorStop(1, `rgb(${126 + shade * 4},${99 + shade * 3},${69 + shade * 2})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1024, 128);
    for (let i = 0; i < 260; i++) {
      const y = random() * 128;
      const sway = random() * 9 - 4.5;
      context.strokeStyle = i % 5 === 0 ? `rgba(239,197,145,${0.1 + random() * 0.17})` : `rgba(56,28,11,${0.08 + random() * 0.19})`;
      context.lineWidth = 0.35 + random() * 1.1;
      context.beginPath();
      context.moveTo(0, y);
      context.bezierCurveTo(280, y + sway, 680, y - sway * 1.7, 1024, y + sway * 0.6);
      context.stroke();
    }
    // A restrained growth-ring knot, varied between boards.
    if (seed % 3 !== 0) {
      const knotX = 160 + random() * 650;
      const knotY = 24 + random() * 75;
      for (let i = 1; i < 13; i++) {
        context.strokeStyle = `rgba(53,26,10,${0.14 - i * 0.006})`;
        context.lineWidth = 0.65;
        context.beginPath();
        context.ellipse(knotX, knotY, 5 + i * 5.6, 1.3 + i * 1.1, 0, 0, Math.PI * 2);
        context.stroke();
      }
    }
    // Fine pores give the material a tactile, non-glossy finish.
    for (let i = 0; i < 850; i++) {
      context.fillStyle = random() > 0.5 ? 'rgba(30,18,9,.10)' : 'rgba(255,224,185,.08)';
      context.fillRect(random() * 1024, random() * 128, 1 + random() * 5, 0.6);
    }
  }
  const texture = new three.CanvasTexture(canvas);
  texture.colorSpace = three.SRGBColorSpace;
  texture.anisotropy = 2;
  return texture;
}

function concreteTexture(three: ThreeModule) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 256;
  const context = canvas.getContext('2d');
  const random = seededRandom(4132);
  if (context) {
    context.fillStyle = '#a9aaa7';
    context.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 7500; i++) {
      const grey = 105 + Math.round(random() * 92);
      context.fillStyle = `rgba(${grey},${grey},${grey},.29)`;
      context.fillRect(random() * 256, random() * 256, 0.6 + random() * 2, 0.6 + random() * 2);
    }
  }
  const texture = new three.CanvasTexture(canvas);
  texture.colorSpace = three.SRGBColorSpace;
  texture.wrapS = texture.wrapT = three.RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

function buildScene(three: ThreeModule, host: HTMLDivElement, onReady: () => void, onLost: () => void): SceneRig {
  const renderer = new three.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = three.SRGBColorSpace;
  renderer.toneMapping = three.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = three.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;';
  host.appendChild(renderer.domElement);

  const scene = new three.Scene();
  const camera = new three.OrthographicCamera(-3.3, 3.3, 2.6, -2.6, 0.1, 40);
  camera.position.set(-5.6, 4.5, 7.2);
  camera.lookAt(0, 0.66, 0);

  scene.add(new three.HemisphereLight(0xfff4df, 0x656c72, 2.2));
  const key = new three.DirectionalLight(0xfff5e5, 3.1);
  key.position.set(-3, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -4.5;
  key.shadow.camera.right = key.shadow.camera.top = 4.5;
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 16;
  key.shadow.normalBias = 0.018;
  key.shadow.bias = -0.00015;
  key.shadow.radius = 3;
  scene.add(key);
  const fill = new three.DirectionalLight(0xeaf0fa, 1.5);
  fill.position.set(5, 2, -5);
  scene.add(fill);

  const groups = new Map<SceneLayer, Three.Group>();
  for (const index of [1, 2, 3, 4, 5] as SceneLayer[]) {
    const group = new three.Group();
    group.name = `construction-layer-${index}`;
    group.userData.layer = index;
    groups.set(index, group);
    scene.add(group);
  }
  const textured = new Set<Three.Texture>();
  const ownedMaterials = new Set<Three.Material>();
  const layerMaterials = new Map<string, Three.Material>();
  function material(parameters: Three.MeshStandardMaterialParameters) {
    const result = new three.MeshStandardMaterial(parameters);
    ownedMaterials.add(result);
    return result;
  }
  function layerFinish(group: Three.Group, finish: Three.Material) {
    const key = `${group.userData.layer}:${finish.uuid}`;
    let clone = layerMaterials.get(key);
    if (!clone) {
      clone = finish.clone();
      layerMaterials.set(key, clone);
      ownedMaterials.add(clone);
    }
    return clone;
  }
  function box(group: Three.Group, size: [number, number, number], position: [number, number, number], finish: Three.Material | Three.Material[]) {
    const coating = Array.isArray(finish) ? finish.map(item => layerFinish(group, item)) : layerFinish(group, finish);
    const mesh = new three.Mesh(new three.BoxGeometry(...size), coating);
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  function cylinder(group: Three.Group, radiusTop: number, radiusBottom: number, height: number, position: [number, number, number], finish: Three.Material, segments = 20) {
    const mesh = new three.Mesh(new three.CylinderGeometry(radiusTop, radiusBottom, height, segments), layerFinish(group, finish));
    mesh.position.set(...position);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  const silver = material({ color: '#a9afb0', roughness: 0.34, metalness: 0.72 });
  const silverEdge = material({ color: '#d1d4d0', roughness: 0.4, metalness: 0.55 });
  const blackMetal = material({ color: '#24292b', roughness: 0.39, metalness: 0.65 });
  const plastic = material({ color: '#202426', roughness: 0.78, metalness: 0.02 });
  const groove = material({ color: '#101516', roughness: 0.67, metalness: 0.18 });
  const bolt = material({ color: '#535b5e', roughness: 0.29, metalness: 0.8 });
  const concreteMap = concreteTexture(three);
  textured.add(concreteMap);
  const concrete = material({ color: '#c3c3be', map: concreteMap, bumpMap: concreteMap, bumpScale: 0.018, roughness: 0.99 });
  const concreteSide = material({ color: '#9b9d9a', map: concreteMap, bumpMap: concreteMap, bumpScale: 0.024, roughness: 0.99 });

  const base = groups.get(5)!;
  box(base, [4.22, 0.24, 2.72], [0, 0.02, 0], [concreteSide, concreteSide, concrete, concreteSide, concreteSide, concreteSide]);
  const shadow = new three.Mesh(new three.PlaneGeometry(6.5, 5.2), new three.ShadowMaterial({ color: 0x232522, opacity: 0.13 }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.105;
  shadow.receiveShadow = true;
  scene.add(shadow);
  ownedMaterials.add(shadow.material);

  // The pedestal caps, screw stems and wide feet are separate visible parts.
  const pedestals = groups.get(4)!;
  const xSupports = [-1.75, -0.875, 0, 0.875, 1.75];
  const zSupports = [-1.025, 0, 1.025];
  for (const x of xSupports) {
    for (const z of zSupports) {
      cylinder(pedestals, 0.125, 0.135, 0.043, [x, 0.164, z], plastic);
      cylinder(pedestals, 0.071, 0.099, 0.175, [x, 0.272, z], plastic);
      cylinder(pedestals, 0.05, 0.05, 0.095, [x, 0.384, z], groove);
      for (let ring = 0; ring < 5; ring++) cylinder(pedestals, 0.057, 0.057, 0.009, [x, 0.35 + ring * 0.017, z], plastic, 16);
      cylinder(pedestals, 0.117, 0.117, 0.029, [x, 0.444, z], plastic);
      box(pedestals, [0.022, 0.03, 0.14], [x, 0.469, z], groove);
    }
  }

  const profiles = groups.get(3)!;
  // Black longitudinal channels, including their open central groove.
  for (const z of zSupports) {
    box(profiles, [4.12, 0.028, 0.15], [0, 0.51, z], blackMetal);
    box(profiles, [4.12, 0.074, 0.021], [0, 0.559, z - 0.065], blackMetal);
    box(profiles, [4.12, 0.074, 0.021], [0, 0.559, z + 0.065], blackMetal);
    box(profiles, [4.12, 0.008, 0.107], [0, 0.531, z], groove);
  }
  // Cross profiles show the pale aluminium faces and dark inner channels.
  for (const x of xSupports) {
    box(profiles, [0.125, 0.08, 2.62], [x, 0.65, 0], silver);
    box(profiles, [0.165, 0.018, 2.62], [x, 0.698, 0], silverEdge);
    box(profiles, [0.044, 0.006, 2.62], [x, 0.71, 0], groove);
    for (const z of zSupports) cylinder(profiles, 0.021, 0.021, 0.013, [x + 0.045, 0.722, z], bolt, 8);
  }

  const woodMaps: Three.CanvasTexture[] = [];
  for (let i = 0; i < 8; i++) {
    const texture = woodTexture(three, 73 + i * 37);
    woodMaps.push(texture);
    textured.add(texture);
  }
  const joistWood = material({ color: '#a8784e', map: woodMaps[6], bumpMap: woodMaps[6], bumpScale: 0.014, roughness: 0.88 });
  const joistEnd = material({ color: '#967044', roughness: 0.97 });
  const joists = groups.get(2)!;
  for (let i = 0; i < 9; i++) {
    const x = -1.85 + i * (3.7 / 8);
    box(joists, [0.105, 0.125, 2.5], [x, 0.94, 0], [joistWood, joistWood, joistWood, joistWood, joistEnd, joistEnd]);
    box(joists, [0.1, 0.009, 2.5], [x, 1.007, 0], groove);
  }

  const boards = groups.get(1)!;
  const boardCount = 16;
  const gap = 0.009;
  const boardWidth = (2.5 - gap * (boardCount - 1)) / boardCount;
  for (let i = 0; i < boardCount; i++) {
    const map = woodMaps[i % woodMaps.length];
    const z = -1.25 + boardWidth / 2 + i * (boardWidth + gap);
    const plank = material({ color: i % 3 === 0 ? '#c5b8a4' : '#dfdacd', map, bumpMap: map, bumpScale: 0.009, roughness: 0.81 });
    const end = material({ color: i % 2 ? '#946840' : '#ad7d4f', roughness: 0.91 });
    box(boards, [4, 0.034, boardWidth], [0, 1.28, z], [end, end, plank, end, plank, plank]);
    // Narrow edge chamfers are suggested by a lighter top edge and soft shadows.
    box(boards, [4, 0.002, 0.002], [0, 1.298, z - boardWidth / 2 + 0.003], end);
    for (const x of [-1.78, -0.89, 0, 0.89, 1.78]) {
      cylinder(boards, 0.0045, 0.0045, 0.0015, [x, 1.298, z], bolt, 8);
    }
  }

  let disposed = false;
  let frame = 0;
  let readySent = false;
  let lastWidth = 0;
  let lastHeight = 0;
  const render = () => {
    frame = 0;
    if (disposed || !host.isConnected) return;
    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      onReady();
    }
  };
  const schedule = () => {
    if (!disposed && !frame) frame = window.requestAnimationFrame(render);
  };
  const resize = () => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    if (width === lastWidth && height === lastHeight) return;
    lastWidth = width;
    lastHeight = height;
    renderer.setSize(width, height, false);
    const aspect = width / height;
    const span = Math.max(3.65, 5.35 / aspect);
    camera.top = span / 2;
    camera.bottom = -span / 2;
    camera.left = -span * aspect / 2;
    camera.right = span * aspect / 2;
    camera.updateProjectionMatrix();
    schedule();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();

  const update = (assembled: boolean, layer: number) => {
    const offsets: Record<SceneLayer, number> = assembled ? { 1: -0.38, 2: -0.155, 3: 0, 4: 0, 5: 0 } : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const [index, group] of groups) {
      group.position.y = offsets[index];
      group.traverse(object => {
        if (!(object instanceof three.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        for (const finish of materials) {
          if (!(finish instanceof three.MeshStandardMaterial)) continue;
          finish.emissive.set(layer === index ? '#a6c83d' : '#000000');
          finish.emissiveIntensity = layer === index ? 0.16 : 0;
        }
      });
    }
    schedule();
  };
  const lost = (event: Event) => {
    event.preventDefault();
    renderer.domElement.style.visibility = 'hidden';
    onLost();
  };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  return {
    update,
    dispose() {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      scene.traverse(object => {
        if (object instanceof three.Mesh) object.geometry.dispose();
      });
      for (const finish of ownedMaterials) finish.dispose();
      for (const texture of textured) texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

/** A construction illustration, independent of the future engineering planner. */
export default function DeckScene2027({ active = true, assembled = false, layer = 0, className = '' }: DeckScene2027Props) {
  const host = useRef<HTMLDivElement>(null);
  const rig = useRef<SceneRig | null>(null);
  const options = useRef({ assembled, layer });
  options.current = { assembled, layer };
  const [ready, setReady] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setReducedMotion(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);

  useEffect(() => {
    const container = host.current;
    setReady(false);
    if (!container || !active || reducedMotion) return;
    let cancelled = false;
    let initializing = false;
    const initialize = async () => {
      if (initializing || cancelled) return;
      initializing = true;
      try {
        const three = await import('three');
        if (cancelled) return;
        const model = buildScene(three, container, () => !cancelled && setReady(true), () => !cancelled && setReady(false));
        rig.current = model;
        model.update(options.current.assembled, options.current.layer);
      } catch {
        // WebGL-disabled devices retain the labelled, responsive image.
        if (!cancelled) {
          for (const canvas of container.querySelectorAll('canvas')) {
            canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
            canvas.remove();
          }
          setReady(false);
        }
      }
    };
    const visibility = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        void initialize();
        visibility.disconnect();
      }
    }, { rootMargin: '160px' });
    visibility.observe(container);
    return () => {
      cancelled = true;
      visibility.disconnect();
      rig.current?.dispose();
      rig.current = null;
    };
  }, [active, reducedMotion]);

  useEffect(() => {
    rig.current?.update(assembled, layer);
  }, [assembled, layer]);

  const showModel = active && ready && !reducedMotion;
  return <div className={`deck-scene-2027 ${showModel ? 'deck-scene-2027--ready' : ''} ${className}`} style={{ position: 'relative', width: '100%', height: '100%' }} role="img" aria-label={assembled ? 'Ilustračná 3D zostavená terasa s drevenými doskami a nosnou konštrukciou.' : 'Ilustračná rozložená konštrukcia terasy: dosky, rošt, nosné profily, terče a betónový podklad.'}>
    <img src={asset(assembled ? 'deck-assembled-2027.webp' : 'deck-exploded-2027.webp')} alt="" width="1536" height="1024" decoding="async" fetchPriority={assembled ? 'auto' : 'high'} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', opacity: showModel ? 0 : 1 }} />
    <div ref={host} style={{ position: 'absolute', inset: 0, opacity: showModel ? 1 : 0, pointerEvents: 'none' }} aria-hidden="true" />
  </div>;
}

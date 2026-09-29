// Shared toon kit for Circuit Crew concept frames (mirrors Agent Office: 3-step ramp + OutlineEffect).
import * as THREE from 'three';
import { OutlineEffect } from 'three/addons/effects/OutlineEffect.js';
export { THREE };

export const W = 1600, H = 900;
export const INK = '#2b2d42';
export const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
/** Global glow strength: keep emissive effects restrained so frames stay easy on the eyes. */
export const GLOWK = { k: 0.55 };
export const effect = new OutlineEffect(renderer, { defaultThickness: 0.0034, defaultColor: [0.17, 0.18, 0.26] });
export const scene = new THREE.Scene();
scene.background = new THREE.Color('#1d1f2b');

const ramp = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 185, 185, 185, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter; ramp.needsUpdate = true;
const cache = new Map();
export function toon(color, opts = {}) {
  const key = `${new THREE.Color(color).getHexString()}|${opts.emissive ?? ''}|${opts.ei ?? ''}|${opts.map ? opts.map.uuid : ''}|${opts.opacity ?? 1}`;
  if (cache.has(key)) return cache.get(key);
  const m = new THREE.MeshToonMaterial({ color, gradientMap: ramp, map: opts.map ?? null });
  if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveIntensity = opts.ei ?? 1; }
  if (opts.opacity !== undefined && opts.opacity < 1) { m.transparent = true; m.opacity = opts.opacity; m.depthWrite = false; }
  cache.set(key, m); return m;
}
export const NIGHT = new THREE.Color('#27325e');
export const dim = (c, k = 0.5) => toon(new THREE.Color(c).multiplyScalar(k * 0.62).lerp(NIGHT, 0.35));
export const basic = (c, o = {}) => new THREE.MeshBasicMaterial({ color: c, ...o });

export function mesh(geo, mat, x = 0, y = 0, z = 0, parent = scene, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
export function group(x = 0, y = 0, z = 0, ry = 0, parent = scene) { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g); return g; }
export function rbox(w, h, d, r = 0.08) {
  const s = new THREE.Shape(); const x = -w / 2, y = -d / 2; r = Math.min(r, w / 2, d / 2);
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 5 });
  g.rotateX(-Math.PI / 2); g.translate(0, -h / 2, 0); g.computeVertexNormals(); return g;
}
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function glow(color, size, opacity = 0.9) {
  const tex = canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, color); g.addColorStop(0.25, color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opacity * GLOWK.k, toneMapped: false }));
  s.scale.set(size, size, 1); scene.add(s); return s;
}
export function lights({ hemi = 1.0, sunI = 1.7, amb = 0.25 } = {}) {
  scene.add(new THREE.HemisphereLight('#fff5e6', '#b89470', hemi), new THREE.AmbientLight('#ffffff', amb));
  const sun = new THREE.DirectionalLight('#fff1d6', sunI);
  sun.position.set(-9, 16, 9); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 14, bottom: -14, near: 1, far: 50 });
  sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.03; scene.add(sun); return sun;
}
export function planks(base = '#f2cf94', line = 'rgba(170,120,60,0.35)', rx = 3, rz = 3) {
  const t = canvasTex(1024, 1024, (ctx) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, 1024, 1024);
    const rows = 8, rh = 1024 / rows;
    for (let r = 0; r < rows; r++) {
      const off = (r * 389) % 1024; const shade = 0.93 + ((r * 7) % 5) * 0.025;
      ctx.fillStyle = `rgba(255,255,255,${(shade - 0.95) * 1.2})`; ctx.fillRect(0, r * rh, 1024, rh);
      ctx.fillStyle = line; ctx.fillRect(0, r * rh, 1024, 5);
      for (let x = off % 512; x < 1024; x += 512) ctx.fillRect(x, r * rh, 5, rh);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, rz); return t;
}
export function stripes(a = '#ffc94d', b = INK) {
  return canvasTex(256, 64, (ctx) => { ctx.fillStyle = a; ctx.fillRect(0, 0, 256, 64); ctx.fillStyle = b; for (let x = -64; x < 256; x += 48) { ctx.beginPath(); ctx.moveTo(x, 64); ctx.lineTo(x + 24, 64); ctx.lineTo(x + 64, 0); ctx.lineTo(x + 40, 0); ctx.fill(); } });
}
/** A glyph (icon) texture, drawn with a callback on a 256² canvas. */
export function glyph(draw, bg = null) { return canvasTex(256, 256, (ctx) => { if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, 256, 256); } ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 16; ctx.lineCap = ctx.lineJoin = 'round'; draw(ctx); }); }
export const boltGlyph = (ctx) => { ctx.beginPath(); ctx.moveTo(150, 20); ctx.lineTo(70, 140); ctx.lineTo(125, 140); ctx.lineTo(100, 236); ctx.lineTo(190, 104); ctx.lineTo(134, 104); ctx.closePath(); ctx.fill(); };
export function decal(tex, w, h, x, y, z, parent = scene, ry = 0, flat = false) {
  const g = new THREE.PlaneGeometry(w, h); if (flat) g.rotateX(-Math.PI / 2);
  const m = mesh(g, basic('#ffffff', { map: tex, transparent: true }), x, y, z, parent, false); m.rotation.y = ry; return m;
}

/** Cable tube along a path; optional travelling current pulses (only where current flows). */
export function cable(points, color, radius, pulses = 0, mat) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p))), false, 'centripetal');
  mesh(new THREE.TubeGeometry(curve, 240, radius, 10, false), mat ?? toon(color), 0, 0, 0);
  if (pulses) {
    const n = Math.round(curve.getLength() / pulses);
    for (let i = 0; i < n; i++) {
      const p = curve.getPointAt((i + 0.35) / n);
      mesh(new THREE.SphereGeometry(radius * 1.5, 12, 8), basic('#fff3a3'), p.x, p.y, p.z, scene, false);
      glow('rgba(255,215,90,1)', radius * 5.5, 0.5).position.copy(p);
    }
  }
  return curve;
}
export function plug(p, dir, color = INK, s = 1) {
  const g = new THREE.Group(); g.position.copy(p); g.lookAt(p.clone().add(dir)); scene.add(g);
  mesh(new THREE.CylinderGeometry(0.11 * s, 0.13 * s, 0.3 * s, 14).rotateX(Math.PI / 2), toon(color), 0, 0, 0, g);
  for (const dx of [-0.05, 0.05]) mesh(new THREE.CylinderGeometry(0.022 * s, 0.022 * s, 0.14 * s, 8).rotateX(Math.PI / 2), toon('#e0b25a'), dx * s, 0, 0.2 * s, g);
  return g;
}
export function reel(x, y, z, color = '#e07a2f', flange = '#f08a4b', s = 1, parent = scene, axisZ = true) {
  const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g);
  const rot = axisZ ? (geo) => geo.rotateX(Math.PI / 2) : (geo) => geo;
  mesh(rot(new THREE.CylinderGeometry(0.42 * s, 0.42 * s, 0.07 * s, 24)), toon(flange), 0, axisZ ? 0 : 0.24 * s, axisZ ? 0.24 * s : 0, g);
  mesh(rot(new THREE.CylinderGeometry(0.42 * s, 0.42 * s, 0.07 * s, 24)), toon(flange), 0, axisZ ? 0 : -0.24 * s, axisZ ? -0.24 * s : 0, g);
  mesh(rot(new THREE.CylinderGeometry(0.31 * s, 0.31 * s, 0.42 * s, 24)), toon(color), 0, 0, 0, g);
  mesh(rot(new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 0.56 * s, 12)), toon('#c7ccd6'), 0, 0, 0, g);
  return g;
}
export function plant(x, z, s = 1, m = toon) {
  mesh(new THREE.CylinderGeometry(0.32 * s, 0.24 * s, 0.5 * s, 16), m('#e07a4f'), x, 0.25 * s, z);
  for (const [dx, dy, dz, r] of [[0, 0.85, 0, 0.36], [0.2, 0.7, 0.1, 0.28], [-0.2, 0.72, -0.05, 0.3], [0.02, 1.08, 0.05, 0.24]])
    mesh(new THREE.IcosahedronGeometry(r * s, 1), m('#4caf50'), x + dx * s, dy * s, z + dz * s);
}
export function crate(x, y, z, w = 0.8, h = 0.6, d = 0.7, c = '#c98f5a', ry = 0, m = toon) {
  const b = mesh(rbox(w, h, d, 0.05), m(c), x, y + h / 2, z); b.rotation.y = ry;
  mesh(new THREE.BoxGeometry(w * 1.01, h * 0.12, d * 1.01), m(new THREE.Color(c).offsetHSL(0, 0, -0.1)), 0, h * 0.2, 0, b); return b;
}
export function cone(x, z) { mesh(new THREE.ConeGeometry(0.22, 0.6, 16), toon('#ff8a3d'), x, 0.34, z); mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), toon('#ff8a3d'), x, 0.025, z); mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.1, 16), toon('#fffaf0'), x, 0.4, z, scene, false); }
export function puff(x, y, z, s = 1, c = '#fffaf0', n = 4) {
  for (let i = 0; i < n; i++) { const a = i * 2.1; mesh(new THREE.IcosahedronGeometry((0.16 + 0.05 * (i % 3)) * s, 1), toon(c), x + Math.cos(a) * 0.18 * s, y + i * 0.13 * s, z + Math.sin(a) * 0.18 * s, scene, false); }
}
export function sparks(x, y, z, s = 1) {
  glow('rgba(255,240,150,1)', 1.4 * s, 0.9).position.set(x, y, z);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, e = 0.3 + (i % 3) * 0.25;
    const d = new THREE.Vector3(Math.cos(a), e, Math.sin(a)).normalize();
    const m = mesh(new THREE.CylinderGeometry(0.018 * s, 0.018 * s, 0.35 * s, 6), basic('#fff3a3'), x + d.x * 0.3 * s, y + d.y * 0.3 * s, z + d.z * 0.3 * s, scene, false);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d);
  }
}

/** Compact technician: hard hat, mitt gloves; arms/legs are pivots so poses can be set. */
export function tech({ body, hat, skin = '#f2c79a', legs = '#2b3a67', glove = '#ffffff' }) {
  const g = new THREE.Group();
  const legP = [];
  for (const lx of [-0.17, 0.17]) {
    const p = new THREE.Group(); p.position.set(lx, 0.62, 0); g.add(p);
    mesh(new THREE.CapsuleGeometry(0.14, 0.3, 4, 12), toon(legs), 0, -0.3, 0, p);
    mesh(new THREE.SphereGeometry(0.16, 14, 10).scale(1, 0.7, 1.35), toon(INK), 0, -0.52, 0.06, p);
    legP.push(p);
  }
  const torso = new THREE.Group(); torso.position.y = 0.62; g.add(torso);
  mesh(new THREE.CapsuleGeometry(0.4, 0.42, 6, 18), toon(body), 0, 0.4, 0, torso);
  mesh(new THREE.BoxGeometry(0.46, 0.3, 0.08), toon(new THREE.Color(body).offsetHSL(0, 0, 0.12)), 0, 0.33, 0.38, torso);
  mesh(new THREE.BoxGeometry(0.86, 0.08, 0.84), toon('#8a5a2b'), 0, 0.08, 0, torso); // tool belt
  mesh(rbox(0.16, 0.2, 0.1, 0.03), toon('#ffc94d'), 0.3, 0.02, 0.36, torso);
  const head = new THREE.Group(); head.position.y = 1.1; torso.add(head);
  mesh(new THREE.SphereGeometry(0.36, 22, 16), toon(skin), 0, 0, 0, head);
  mesh(new THREE.SphereGeometry(0.385, 22, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(hat), 0, 0.06, 0, head);
  mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.05, 24), toon(hat), 0, 0.06, 0.05, head);
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 12), toon('#fff3a3', { emissive: '#ffe27a', ei: 0.6 }), 0, 0.3, 0.3, head).rotation.x = 1.1; // hat lamp
  for (const ex of [-0.12, 0.12]) mesh(new THREE.SphereGeometry(0.055, 10, 8), toon(INK), ex, 0, 0.33, head, false);
  const arms = [];
  for (const s of [-1, 1]) {
    const pivot = new THREE.Group(); pivot.position.set(0.42 * s, 0.68, 0); torso.add(pivot);
    mesh(new THREE.CapsuleGeometry(0.12, 0.42, 4, 10), toon(body), 0, -0.3, 0, pivot);
    mesh(new THREE.SphereGeometry(0.17, 14, 10), toon(glove), 0, -0.62, 0, pivot);
    arms.push(pivot);
  }
  scene.add(g);
  return { g, arms, legs: legP, torso, head };
}
/** World position of a technician's mitt (0 = right side from their view -x, 1 = +x). */
export function mitt(t, i) { t.g.updateMatrixWorld(true); return t.arms[i].localToWorld(new THREE.Vector3(0, -0.62, 0)); }

export function done(camera) {
  scene.traverse((o) => { if (o.isMesh && (o.material.isMeshBasicMaterial || o.geometry.type === 'PlaneGeometry')) o.material.userData.outlineParameters = { visible: false }; });
  effect.render(scene, camera);
  window.__done = true;
}

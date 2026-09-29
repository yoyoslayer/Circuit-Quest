// Characters and the star cable: coworker blobs with personality, Pip posed from pip.glb,
// and the cable as a thick glossy hose with a strain gradient and glowing current slugs.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {toon, INK, bangTexture, glyph, glow} from '/src/render/kit.ts';

const RAMP = (() => { const t = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 185, 185, 185, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
export const noOutline = (m) => { m.userData.outlineParameters = {visible: false}; return m; };
export const unlitM = (color, o = {}) => noOutline(new THREE.MeshBasicMaterial({color, ...o}));
/** HDR emissive for bloom: colour * k, not tone-mapped away. */
export const hot = (color, k = 3, o = {}) => { const m = unlitM(color, o); m.color.multiplyScalar(k); return m; };

/** Toon + a hard, stepped specular (view-space) = "glossy plastic" that still reads as toon. */
export function glossyToon(color, {vertexColors = false, spec = .9, size = .965} = {}) {
  const m = new THREE.MeshToonMaterial({color, gradientMap: RAMP, vertexColors});
  m.onBeforeCompile = (s) => {
    s.uniforms.specK = {value: spec}; s.uniforms.specEdge = {value: size};
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nuniform float specK; uniform float specEdge;')
      .replace('#include <opaque_fragment>', `
        { vec3 L = normalize(vec3(-.35,.75,.55)); vec3 V = normalize(vViewPosition); vec3 H = normalize(L + V);
          float s = smoothstep(specEdge, specEdge + .012, dot(normalize(normal), H));
          outgoingLight = mix(outgoingLight, vec3(1.,.98,.93) * max(1., length(outgoingLight)), s * specK); }
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'glossyToon' + spec + size;
  return m;
}

// ---------------------------------------------------------------- coworker blobs
const shadeHex = (hex, l) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, l); return c; };
function mesh(parent, geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; }
const G = {
  body: new THREE.CapsuleGeometry(.33, .35, 8, 20), eye: new THREE.SphereGeometry(.088, 14, 10), eyeBig: new THREE.SphereGeometry(.105, 14, 10),
  pupil: new THREE.SphereGeometry(.045, 10, 8), pupilSmall: new THREE.SphereGeometry(.03, 10, 8), glint: new THREE.SphereGeometry(.015, 6, 4),
  lid: new THREE.SphereGeometry(.094, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), cheek: new THREE.SphereGeometry(.05, 10, 6),
  arm: new THREE.CapsuleGeometry(.07, .14, 4, 10), tuft: new THREE.ConeGeometry(.06, .2, 8), ring: new THREE.TorusGeometry(.1, .016, 6, 18),
  smile: new THREE.TorusGeometry(.055, .014, 6, 14, Math.PI), oh: new THREE.TorusGeometry(.035, .014, 6, 14),
  mug: new THREE.CylinderGeometry(.075, .065, .16, 12), handle: new THREE.TorusGeometry(.04, .012, 6, 10),
};
/** opts: color, seated, mood ('calm'|'alarm'|'sleepy'|'happy'|'blink'), acc: ['tuft','headphones','glasses','tie','mug','bun','cap','sprout'], look:[x,y] */
export function blob({color = '#b392f0', seated = false, mood = 'calm', acc = [], look = [0, 0], lean = 0, turn = 0} = {}) {
  const root = new THREE.Group(), b = new THREE.Group(); root.add(b); b.position.y = seated ? .35 : 0; b.rotation.y = turn;
  const tilt = new THREE.Group(); b.add(tilt); tilt.rotation.x = lean;
  const skin = toon(color), dark = toon('#' + shadeHex(color, -.12).getHexString()), white = toon('#ffffff'), ink = toon(INK);
  const body = mesh(tilt, G.body, skin, 0, .55, 0); body.scale.set(1, 1, .96);
  const alarm = mood === 'alarm';
  for (const s of [-1, 1]) {
    const eye = mesh(tilt, alarm ? G.eyeBig : G.eye, white, s * .105, .8, .285);
    const p = mesh(tilt, alarm ? G.pupilSmall : G.pupil, ink, s * .105 + look[0] * .03, .8 + look[1] * .03, .365); p.castShadow = false;
    mesh(tilt, G.glint, unlitM('#ffffff'), s * .105 + .02 + look[0] * .03, .82 + look[1] * .03, .405).castShadow = false;
    if (mood === 'sleepy' || mood === 'blink') { const lid = mesh(tilt, G.lid, skin, s * .105, .8, .29); lid.rotation.x = mood === 'blink' ? Math.PI * .5 : .35; lid.scale.setScalar(1.06); }
    const ch = mesh(tilt, G.cheek, toon('#ff9fb4'), s * .2, .68, .265); ch.scale.set(1, .6, .35); ch.castShadow = false;
    mesh(tilt, G.arm, skin, s * .35, .44, .02).rotation.z = s * (alarm ? -2.3 : .35);
  }
  if (mood === 'happy' || mood === 'calm') { const m = mesh(tilt, G.smile, ink, 0, .7, .318); m.rotation.z = Math.PI; m.scale.set(mood === 'happy' ? 1 : .7, mood === 'happy' ? 1 : .6, 1); }
  if (alarm) mesh(tilt, G.oh, ink, 0, .67, .325).scale.set(1, 1.3, 1);
  for (const a of acc) {
    if (a === 'tuft') for (const [x, z, r] of [[0, 0, 0], [-.07, .03, .5], [.07, .02, -.5]]) { const t = mesh(tilt, G.tuft, dark, x, 1.1, z); t.rotation.z = r; }
    if (a === 'bun') mesh(tilt, new THREE.SphereGeometry(.13, 12, 10), dark, 0, 1.1, -.08);
    if (a === 'sprout') { mesh(tilt, new THREE.CylinderGeometry(.012, .012, .16, 6), toon('#4caf50'), 0, 1.13, 0); const l = mesh(tilt, new THREE.SphereGeometry(.07, 10, 6), toon('#6cc58a'), .06, 1.22, 0); l.scale.set(1.3, .45, .8); l.rotation.z = -.4; }
    if (a === 'headphones') { const band = mesh(tilt, new THREE.TorusGeometry(.35, .035, 8, 24, Math.PI), toon('#3a3d55'), 0, .8, 0); band.rotation.y = 0; for (const s of [-1, 1]) { const cup = mesh(tilt, new THREE.CylinderGeometry(.1, .1, .08, 16), toon(s < 0 ? '#e5484d' : '#e5484d'), s * .35, .8, 0); cup.rotation.z = Math.PI / 2; } }
    if (a === 'glasses') { for (const s of [-1, 1]) mesh(tilt, G.ring, ink, s * .105, .8, .37); mesh(tilt, new THREE.BoxGeometry(.06, .016, .016), ink, 0, .81, .38); }
    if (a === 'tie') { const t = mesh(tilt, new THREE.BoxGeometry(.08, .22, .03), toon('#e5484d'), 0, .44, .325); t.rotation.x = -.15; mesh(tilt, new THREE.BoxGeometry(.1, .06, .04), toon('#c53a3f'), 0, .57, .318); }
    if (a === 'cap') { const c = mesh(tilt, new THREE.SphereGeometry(.34, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon('#3f7fd6'), 0, .93, 0); c.scale.y = .7; const brim = mesh(tilt, new THREE.CylinderGeometry(.2, .2, .03, 16), toon('#3f7fd6'), 0, .95, .28); brim.scale.z = .7; }
    if (a === 'mug') { const g = new THREE.Group(); g.position.set(.34, .55, .2); tilt.add(g); mesh(g, G.mug, toon('#fffaf0')); mesh(g, G.handle, toon('#fffaf0'), .08, 0, 0).rotation.y = Math.PI / 2; mesh(g, new THREE.CylinderGeometry(.062, .062, .01, 12), toon('#6b4a2e'), 0, .08, 0); }
  }
  root.userData.head = new THREE.Vector3(0, (seated ? .35 : 0) + 1.25, 0);
  return root;
}
export function bang(parent, y = 1.6, s = .62) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: bangTexture(), depthTest: true, toneMapped: false})); sp.scale.set(s, s, 1); sp.position.y = y; parent.add(sp); return sp; }
const sweatTex = () => glyph(c => { c.fillStyle = '#9fdcff'; c.beginPath(); c.moveTo(128, 20); c.bezierCurveTo(200, 120, 210, 170, 128, 230); c.bezierCurveTo(46, 170, 56, 120, 128, 20); c.fill(); c.lineWidth = 14; c.stroke(); });
let sweatT; export function sweat(parent, x, y) { sweatT ??= sweatTex(); const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: sweatT, toneMapped: false})); sp.scale.set(.22, .22, 1); sp.position.set(x, y, .1); parent.add(sp); return sp; }
const zzzTex = () => glyph(c => { c.font = 'bold 120px sans-serif'; c.fillStyle = '#fffaf0'; c.strokeStyle = INK; c.lineWidth = 12; c.strokeText('z', 60, 200); c.fillText('z', 60, 200); c.font = 'bold 80px sans-serif'; c.strokeText('z', 150, 110); c.fillText('z', 150, 110); });
let zzzT; export function zzz(parent, y) { zzzT ??= zzzTex(); const sp = new THREE.Sprite(new THREE.SpriteMaterial({map: zzzT, toneMapped: false})); sp.scale.set(.5, .5, 1); sp.position.set(.3, y, 0); parent.add(sp); return sp; }

// ---------------------------------------------------------------- Pip
let pipGltf;
export async function loadPip() { pipGltf ??= await new GLTFLoader().loadAsync('/models/pip.glb'); return pipGltf; }
/** pose: 'pull' (leaning into a taut cable, plug over the shoulder), 'carry', 'idle'. Returns {root, hand}. */
export async function pip(pose = 'pull') {
  const gltf = await loadPip(); const scene = gltf.scene.clone(true); const root = new THREE.Group(); root.add(scene);
  scene.traverse(o => { if (o.isMesh) { const c = '#' + o.material.color.getHexString(); o.material = /hat/i.test(o.material.name) ? glossyToon(c, {spec: .7, size: .978}) : toon(c); o.castShadow = true; o.receiveShadow = true; } });
  const pivot = (x, y, names) => { const g = new THREE.Group(); g.position.set(x, y, 0); scene.add(g); scene.updateMatrixWorld(true); for (const n of names) { const o = scene.getObjectByName(n); if (o) g.attach(o); } return g; };
  const legs = [pivot(-.17, .62, ['LegL', 'BootL']), pivot(.17, .62, ['LegR', 'BootR'])];
  const arms = [pivot(-.39, 1.12, ['ArmL', 'GloveL']), pivot(.39, 1.12, ['ArmR', 'GloveR'])];
  const hand = new THREE.Group(); arms[1].add(hand); hand.position.set(.03, -.5, .04);
  if (pose === 'pull') {
    scene.rotation.x = .3; scene.position.z = -.1;            // lean hard into the pull
    legs[0].rotation.x = -.8; legs[1].rotation.x = .6;           // big stride
    arms[1].rotation.x = 2.45; arms[1].rotation.z = -.35;        // right arm hauling the cable over the shoulder
    arms[0].rotation.x = -1.35; arms[0].rotation.z = -.3;        // left arm thrown forward for balance
  } else if (pose === 'carry') { legs[0].rotation.x = -.35; legs[1].rotation.x = .3; arms[0].rotation.x = -1.3; arms[1].rotation.x = -1.3; }
  return {root, hand, scene};
}

// ---------------------------------------------------------------- cable hose
export const STRAIN = [[0, '#f5f1dc'], [.55, '#f5f1dc'], [.72, '#ffd451'], [.86, '#ff922f'], [1, '#f34e56']];
function strainAt(t) { for (let i = 1; i < STRAIN.length; i++) if (t <= STRAIN[i][0]) { const [a, ca] = STRAIN[i - 1], [b, cb] = STRAIN[i]; return new THREE.Color(ca).lerp(new THREE.Color(cb), (t - a) / (b - a || 1)); } return new THREE.Color(STRAIN.at(-1)[1]); }
/** Rounds polyline corners with small arcs (wrap points around pillars) and samples it densely. */
export function roundedPath(pts, r = .35, step = .12) {
  const V = pts.map(p => p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2]));
  const out = [V[0]];
  for (let i = 1; i < V.length - 1; i++) {
    const a = V[i - 1], b = V[i], c = V[i + 1], d1 = b.clone().sub(a), d2 = c.clone().sub(b), rr = Math.min(r, d1.length() * .45, d2.length() * .45);
    const p0 = b.clone().addScaledVector(d1.normalize(), -rr), p1 = b.clone().addScaledVector(d2.normalize(), rr);
    for (let k = 0; k <= 6; k++) { const t = k / 6; out.push(p0.clone().multiplyScalar((1 - t) ** 2).addScaledVector(b, 2 * t * (1 - t)).addScaledVector(p1, t * t)); }
  }
  out.push(V.at(-1));
  const dense = [out[0]];
  for (let i = 1; i < out.length; i++) { const a = out[i - 1], b = out[i], n = Math.max(1, Math.ceil(a.distanceTo(b) / step)); for (let k = 1; k <= n; k++) dense.push(a.clone().lerp(b, k / n)); }
  return dense;
}
/** strain(u) in 0..1 along the cable, u=0 at the reel. pulses: array of u positions of current slugs. */
export function hose(points, {radius = .085, strain = (u) => u * .4, pulses = [], pulseColor = '#6fe9ff', bands = false, glowK = 2.5} = {}) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const segs = Math.max(40, Math.round(curve.getLength() * 14)), radial = 12;
  const geo = new THREE.TubeGeometry(curve, segs, radius, radial, false);
  const col = new Float32Array(geo.attributes.position.count * 3);
  const bandLen = curve.getLength();
  for (let i = 0; i <= segs; i++) { let c = strainAt(strain(i / segs)); if (bands && Math.floor(i / segs * bandLen / .32) % 2) c = new THREE.Color('#2f3147'); for (let j = 0; j <= radial; j++) { const k = (i * (radial + 1) + j) * 3; col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b; } }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const tube = new THREE.Mesh(geo, glossyToon('#ffffff', {vertexColors: true, spec: .75, size: .982})); tube.castShadow = true; tube.receiveShadow = true; g.add(tube);
  // End caps so the hose reads as solid rubber.
  for (const u of [0, 1]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 8), toon('#' + strainAt(strain(u)).getHexString())); cap.position.copy(curve.getPointAt(u)); g.add(cap); }
  const len = curve.getLength();
  for (const u0 of pulses) {
    const span = .55 / len, pts = []; for (let k = 0; k <= 10; k++) pts.push(curve.getPointAt(Math.min(1, u0 + span * k / 10)));
    const pc = new THREE.CatmullRomCurve3(pts), m = hot(pulseColor, glowK);
    const slug = new THREE.Mesh(new THREE.TubeGeometry(pc, 12, radius * 1.18, 10, false), m); slug.userData.noAO = true; g.add(slug);
    for (const e of [0, 1]) { const cap = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.18, 10, 8), m); cap.position.copy(pc.getPointAt(e)); cap.userData.noAO = true; g.add(cap); }
    const halo = glow(g, 'rgba(110,230,255,1)', radius * 9, .32); halo.position.copy(pc.getPointAt(.5));
  }
  g.userData.curve = curve; return g;
}
/** Comic "twang" strokes around a point where the cable bites a corner. */
export function twang(parent, at, dir = 0, n = 3, color = '#fffaf0') {
  const m = unlitM(color);
  for (let i = 0; i < n; i++) {
    const r = .35 + i * .18, a0 = dir - .55, a1 = dir + .55, pts = [];
    for (let k = 0; k <= 12; k++) { const a = a0 + (a1 - a0) * k / 12; pts.push(new THREE.Vector3(at.x + Math.cos(a) * r, at.y + .05 * i, at.z + Math.sin(a) * r)); }
    const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, .022, 5, false), m); t.userData.noAO = true; parent.add(t);
  }
}
export function dustPuff(parent, x, y, z, s = 1, seed = 1) {
  const m = toon('#efe7d8');
  for (let i = 0; i < 5; i++) { const a = seed * 3 + i * 1.3, r = (.12 + (i % 3) * .05) * s; const p = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m); p.position.set(x + Math.cos(a) * .16 * s, y - .04 + (i % 2) * .06 * s, z + Math.sin(a) * .16 * s); p.castShadow = false; parent.add(p); }
}

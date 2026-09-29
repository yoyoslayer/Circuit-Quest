// "Lunch Rush" — whole Kitchen Wing. window.WING = { state: 'start' | 'mid', view: 'plan' | 'play' }.
import { THREE, W, H, INK, scene, toon, dim, basic, mesh, group, rbox, canvasTex, glow, lights, planks, stripes, glyph, boltGlyph, decal, cable, plug, reel, crate, puff, tech, mitt, done } from './lib.js';

const { state = 'start', view = 'play' } = window.WING ?? {};
const MID = state === 'mid';
const LABELS = [];
const lab = (t, x, y, z) => LABELS.push([t, new THREE.Vector3(x, y, z)]);

lights({ hemi: 0.95, sunI: 1.5, amb: 0.22 });
const METAL = '#9aa3b2', DMETAL = '#6b7385', TRIM = '#a8734a';
// lighting state per room
const LIT = { power: true, store: MID, kitchen: true, lift: false, corr: true };
const M = (room) => (LIT[room] ? toon : (c) => dim(c, 1.0));

// ---- floors: each room has its own identity ---------------------------------------------------------
function floor(x0, x1, z0, z1, tex, room, color = '#ffffff') {
  const m = mesh(new THREE.BoxGeometry(x1 - x0, 0.3, z1 - z0), LIT[room] ? toon(color, { map: tex }) : toon(new THREE.Color(color).multiplyScalar(0.35).lerp(new THREE.Color('#27325e'), 0.35), { map: tex }), (x0 + x1) / 2, -0.15, (z0 + z1) / 2);
  m.castShadow = false;
}
const concrete = (c) => canvasTex(512, 512, (x) => { x.fillStyle = c; x.fillRect(0, 0, 512, 512); x.fillStyle = 'rgba(0,0,0,0.06)'; for (let i = 0; i < 90; i++) x.fillRect((i * 173) % 512, (i * 97) % 512, 6, 6); x.fillStyle = 'rgba(0,0,0,0.12)'; x.fillRect(0, 254, 512, 4); x.fillRect(254, 0, 4, 512); });
const checker = canvasTex(512, 512, (x) => { for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { x.fillStyle = (i + j) % 2 ? '#e9e3d3' : '#8cc7bd'; x.fillRect(i * 64, j * 64, 64, 64); } });
checker.wrapS = checker.wrapT = THREE.RepeatWrapping; checker.repeat.set(3, 2.5);
const plate = canvasTex(256, 256, (x) => { x.fillStyle = '#9aa3b2'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(0,0,0,0.18)'; x.lineWidth = 4; for (let i = 0; i < 256; i += 32) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 16, 16); x.stroke(); } });
plate.wrapS = plate.wrapT = THREE.RepeatWrapping; plate.repeat.set(3, 3);
floor(-14, -6, -1, 7, concrete('#bdb6a8'), 'power');
floor(-14, -6, -9, -1, concrete('#a9a296'), 'store');
floor(-6, 6, -9, 1, checker, 'kitchen');
floor(6, 14, -9, 1, plate, 'lift');
floor(-6, 14, 1, 7, planks('#d4ab74', 'rgba(110,70,35,0.35)', 5, 1.6), 'corr');

// ---- walls: full height at back/left, low cutaway inside ------------------------------------------
const WALLC = { power: '#d7ccb8', store: '#c9bfae', kitchen: '#e8dcc6', lift: '#b9c0cc', corr: '#dccfb6' };
function wall(x0, z0, x1, z1, h, room, gaps = []) {
  // gaps: [[a, b]] along the wall's length, measured from (x0,z0)
  const len = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / len, dz = (z1 - z0) / len;
  let segs = [[0, len]];
  for (const [a, b] of gaps) segs = segs.flatMap(([s, e]) => (b <= s || a >= e ? [[s, e]] : [[s, a], [b, e]].filter(([p, q]) => q - p > 0.05)));
  for (const [s, e] of segs) {
    const cx = x0 + dx * (s + e) / 2, cz = z0 + dz * (s + e) / 2;
    const m = mesh(new THREE.BoxGeometry(e - s, h, 0.25), M(room)(WALLC[room]), cx, h / 2, cz);
    m.rotation.y = Math.atan2(-dz, dx);
    const cap = mesh(new THREE.BoxGeometry(e - s + 0.02, 0.08, 0.3), M(room)(TRIM), cx, h, cz); cap.rotation.y = m.rotation.y;
  }
}
wall(-14, -9, -6, -9, 3.0, 'store'); wall(-6, -9, 6, -9, 3.0, 'kitchen'); wall(6, -9, 14, -9, 3.0, 'lift');
wall(-14, -9, -14, 7, 3.0, 'power');
wall(-14, -1, -6, -1, 1.3, 'store');                                   // power | store
wall(-6, -9, -6, 7, 1.3, 'kitchen', [[3.0, 4.6], [9.2, 12.2]]);      // store→kitchen door, power→corridor arch
wall(-6, 1, 14, 1, 1.3, 'kitchen', [[4.8, 7.2], [15.0, 17.0]]);      // kitchen door, lift-room door
wall(6, -9, 6, 1, 1.3, 'lift', [[1.2, 2.2]]);                         // conveyor hatch
wall(14, -9, 14, 7, 1.0, 'lift');

// ---- common part builders ---------------------------------------------------------------------------
function gaugeTex(v, zones = [[0, 0.6, '#3bb273'], [0.6, 0.82, '#ffc94d'], [0.82, 1, '#e5484d']]) {
  return canvasTex(256, 160, (c) => {
    c.fillStyle = '#fffaf0'; c.beginPath(); c.roundRect(4, 4, 248, 152, 22); c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
    for (const [a, b, col] of zones) { c.strokeStyle = col; c.lineWidth = 24; c.beginPath(); c.arc(128, 140, 96, Math.PI * (1 + a), Math.PI * (1 + b)); c.stroke(); }
    const a = Math.PI * (1 + v); c.strokeStyle = INK; c.lineWidth = 9; c.beginPath(); c.moveTo(128, 140); c.lineTo(128 + Math.cos(a) * 88, 140 + Math.sin(a) * 88); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(128, 140, 13, 0, 7); c.fill();
  });
}
function dialOn(parent, v, x, y, z, s = 1, ry = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  mesh(new THREE.BoxGeometry(0.7 * s, 0.46 * s, 0.06), toon(INK), 0, 0, -0.02, g);
  decal(gaugeTex(v), 0.64 * s, 0.4 * s, 0, 0, 0.02, g);
  return g;
}
function socketPlate(parent, x, y, z, ry = 0, m = toon) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  mesh(rbox(0.38, 0.1, 0.38, 0.06).rotateX(Math.PI / 2), m('#f0ece2'), 0, 0, 0, g);
  mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.06, 14).rotateX(Math.PI / 2), toon(INK), 0, 0, 0.05, g);
  return g;
}
function wheels(parent, w, d, r = 0.15) { for (const [x, z] of [[-w, -d], [w, -d], [-w, d], [w, d]]) mesh(new THREE.CylinderGeometry(r, r, 0.1, 14).rotateX(Math.PI / 2), toon(INK), x, r, z, parent); }
function handle(parent, x, y0, y1, d) { const c = new THREE.CatmullRomCurve3([[x, y0, -d], [x - 0.1, y1, -d], [x - 0.1, y1, d], [x, y0, d]].map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.1); mesh(new THREE.TubeGeometry(c, 30, 0.04, 8, false), toon(INK), 0, 0, 0, parent); }
function thinReel(x, y, z, parent = scene, s = 0.75) { return reel(x, y, z, '#ecE8dc', '#c9c3b4', s, parent); }
function splitter(x, z, m = toon, ry = 0) {
  const g = group(x, 0, z, ry);
  mesh(rbox(0.7, 0.3, 0.5, 0.08), m('#ffc94d'), 0, 0.15, 0, g);
  mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.1, 10).rotateZ(Math.PI / 2), toon(INK), -0.38, 0.15, 0, g);
  for (const dz of [-0.15, 0, 0.15]) mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 10).rotateZ(Math.PI / 2), toon(INK), 0.38, 0.15, dz, g);
  return g;
}
function bridge(x, z, ry, m = toon) {
  const g = group(x, 0, z, ry);
  const s = new THREE.Shape(); s.moveTo(-0.6, 0); s.lineTo(-0.2, 0.2); s.lineTo(0.2, 0.2); s.lineTo(0.6, 0); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false }); geo.translate(0, 0, -0.4);
  mesh(geo, m('#ffc94d'), 0, 0, 0, g); mesh(new THREE.BoxGeometry(0.42, 0.02, 0.8), toon(INK), 0, 0.21, 0, g);
  return g;
}
function lamp(x, z, lit, m) {
  const g = group(x, 0, z);
  mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.1, 18), toon(INK), 0, 0.05, 0, g);
  mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.8, 8), m(TRIM), 0, 1.0, 0, g);
  const sh = mesh(new THREE.CylinderGeometry(0.24, 0.42, 0.45, 20, 1, true), lit ? toon('#f7ecd0', { emissive: '#ffcf7a', ei: 0.4 }) : m('#f7ecd0'), 0, 2.0, 0, g); sh.material.side = THREE.DoubleSide;
  mesh(new THREE.SphereGeometry(0.13, 12, 10), lit ? toon('#fff3c8', { emissive: '#ffe7a8', ei: 1 }) : m('#bbb6a8'), 0, 1.9, 0, g, false);
  if (lit) { glow('rgba(255,210,120,1)', 2.2, 0.6).position.set(x, 1.95, z); const l = new THREE.PointLight('#ffcf7a', 16, 9, 1.5); l.position.set(x, 2.0, z + 0.3); scene.add(l); }
  return g;
}
function bot(x, z, ry, m = toon) {
  const g = group(x, 0, z, ry);
  mesh(new THREE.CylinderGeometry(0.42, 0.45, 0.2, 28), m('#f4efe6'), 0, 0.14, 0, g);
  mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.06, 24), m('#3f7fd6'), 0, 0.26, 0, g);
  for (const ex of [-0.1, 0.1]) mesh(new THREE.SphereGeometry(0.05, 10, 8), toon('#57e38f', { emissive: '#3fdc7f', ei: 0.5 }), ex, 0.2, 0.4, g);
  mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 6), toon('#ffc94d'), 0.3, 0.05, 0.3, g);
}

// ---- POWER ROOM: two supply carts, reel rack, splitter bin ------------------------------------------
function supply(x, z, color, needle) {
  const g = group(x, 0, z, 0);
  mesh(rbox(1.9, 0.14, 1.2, 0.08), toon(METAL), 0, 0.36, 0, g); wheels(g, 0.72, 0.46);
  mesh(rbox(1.4, 0.9, 1.0, 0.14), toon(color), 0.1, 0.88, 0, g);
  decal(glyph(boltGlyph), 0.4, 0.4, -0.2, 0.9, 0.51, g);
  handle(g, -0.95, 0.42, 1.2, 0.45);
  dialOn(g, needle, 0.25, 1.62, 0.1, 1, 0).rotation.x = -0.5;
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), toon(needle > 0.95 ? '#e5484d' : '#d63a3f'), 0.65, 1.38, -0.25, g); // breaker reset
  const outs = [-0.2, 0.2].map((dz) => { mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.12, 12).rotateZ(Math.PI / 2), toon(INK), 0.86, 0.95, dz, g); return new THREE.Vector3(x + 0.95, 0.95, z + dz); });
  return outs;
}
const outA = supply(-12, 1.4, '#f2b93b', MID ? 0.05 : 0.0);
const outB = supply(-12, 4.6, '#f08a4b', MID ? 0.78 : 0.0);
lab('Supply A (5 bars)', -12, 2.2, 1.4); lab('Supply B (5 bars)', -12, 2.2, 4.6);
// reel rack on the left wall
const rack = group(-13.6, 0, 1.8, Math.PI / 2);
mesh(new THREE.BoxGeometry(3.4, 0.08, 0.5), toon(TRIM), 0, 1.0, 0.1, rack); mesh(new THREE.BoxGeometry(3.4, 0.08, 0.5), toon(TRIM), 0, 2.1, 0.1, rack);
for (const sx of [-1.6, 1.6]) mesh(new THREE.BoxGeometry(0.08, 2.2, 0.08), toon(DMETAL), sx, 1.1, 0.3, rack);
const thinOnRack = MID ? 1 : 3;
for (let i = 0; i < 3; i++) { if (i < thinOnRack) thinReel(-1.0 + i * 1.0, 1.42, 0.1, rack, 0.72); }
mesh(rbox(0.9, 0.9, 0.5, 0.06), toon('#6cc58a'), 0, 2.55, 0.1, rack);
lab('Thin cable reels ×3 (safe ≤3)', -13.3, 2.6, 1.8);
// splitter bin
const bin = group(-8.3, 0, 6.2); mesh(rbox(1.1, 0.5, 0.7, 0.08), toon('#5f8fa8'), 0, 0.25, 0, bin);
for (let i = 0; i < (MID ? 1 : 3); i++) { const s = splitter(0, 0, toon); s.position.set(-8.6 + i * 0.3, 0.42, 6.1 + (i % 2) * 0.12); s.scale.setScalar(0.6); s.rotation.y = i * 0.6; }
lab('Splitters', -8.3, 1.1, 6.2);

// ---- STOREROOM (dark at start): capacitor cart, thick reel on dolly, cooler box, lamp, shelf ------------
const ms = M('store');
lamp(-9.4, -2.3, LIT.store, ms); socketPlate(scene, -9.4, 0.35, -1.95, 0, ms);
lab('Storeroom lamp', -9.4, 2.6, -2.3);
function capCart(x, z, ry) {
  const g = group(x, 0, z, ry);
  mesh(rbox(1.8, 0.14, 1.1, 0.08), ms(METAL), 0, 0.36, 0, g); wheels(g, 0.7, 0.44);
  for (const [cx, cz] of [[-0.45, -0.22], [0.1, -0.22], [0.1, 0.25], [-0.45, 0.25]]) {
    mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.95, 20), ms('#3f7fd6'), cx, 0.92, cz, g);
    mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.08, 20), ms('#c7ccd6'), cx, 1.42, cz, g);
  }
  mesh(rbox(0.4, 0.55, 0.9, 0.06), ms(INK), 0.62, 0.72, 0, g);
  dialOn(g, 0.25, 0.83, 0.9, 0, 0.7, Math.PI / 2);
  handle(g, -0.95, 0.42, 1.25, 0.45);
  return g;
}
if (!MID) { capCart(-11.2, -6.6, 0); lab('Capacitor cart (surge helper)', -11.2, 2.2, -6.6); }
function dolly(x, z, ry, full) {
  const g = group(x, 0, z, ry);
  mesh(rbox(1.2, 0.1, 0.9, 0.06), ms(DMETAL), 0, 0.28, 0, g); wheels(g, 0.45, 0.35, 0.12);
  handle(g, -0.62, 0.3, 1.3, 0.3);
  const r = reel(0.05, 0.95, 0, INK, '#ffc94d', full ? 1.3 : 1.0, g);
  if (!full) r.children.forEach((c, i) => i === 2 && c.scale.set(0.6, 1, 0.6));
  return g;
}
if (!MID) { dolly(-12.4, -3.2, 0.2, true); lab('Thick cable (safe ≤10, heavy)', -12.4, 2.4, -3.2); }
const cool = group(-8.8, 0, -8.1, 0.2); mesh(rbox(1.1, 0.6, 0.7, 0.1), ms('#e9f0f2'), 0, 0.3, 0, cool); mesh(rbox(1.15, 0.12, 0.75, 0.1), ms('#3bb2c9'), 0, 0.64, 0, cool);
lab('Cooler box (alt. route)', -8.8, 1.3, -8.1);
for (const [x, z] of [[-13.2, -8.2], [-12.2, -8.3]]) crate(x, 0, z, 0.9, 0.8, 0.8, '#c98f5a', 0.1, ms);
// the shelf that blocks the storeroom→kitchen door
const shelf = MID ? group(-7.4, 0, -7.4, 0.5) : group(-6.65, 0, -5.2, Math.PI / 2);
for (const [px, pz] of [[-0.95, -0.25], [0.95, -0.25], [-0.95, 0.25], [0.95, 0.25]]) mesh(new THREE.BoxGeometry(0.07, 1.9, 0.07), ms(METAL), px, 0.95, pz, shelf);
for (const y of [0.3, 1.0, 1.7]) mesh(new THREE.BoxGeometry(2.0, 0.06, 0.6), ms('#c7ccd6'), 0, y, 0, shelf);
[[-0.5, 0.3, '#e5484d'], [0.4, 1.0, '#6cc58a'], [-0.3, 1.7, '#ffc94d']].forEach(([x, y, c]) => mesh(rbox(0.6, 0.4, 0.45, 0.05), ms(c), x, y + 0.23, 0, shelf));
lab('Pushable shelf (blocks door)', MID ? -7.4 : -6.65, 2.3, MID ? -7.4 : -5.2);

// ---- KITCHEN: oven, fridge (+leak), prep table, conveyor, lamp, swinging door ---------------------------
const mk = M('kitchen');
// oven
const oven = group(-2.0, 0, -8.2);
mesh(rbox(2.6, 1.7, 1.3, 0.12), mk('#c7ccd6'), 0, 0.85, 0, oven);
mesh(new THREE.BoxGeometry(1.6, 0.8, 0.06), MID ? toon('#ffb35a', { emissive: '#ff8a2a', ei: 0.6 }) : mk('#3a3d55'), -0.2, 0.85, 0.66, oven);
mesh(new THREE.BoxGeometry(2.8, 0.35, 1.5), mk(DMETAL), 0, 1.9, -0.05, oven);
mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.1, 14), mk(METAL), 0.6, 2.6, -0.3, oven);
dialOn(oven, MID ? 0.6 : 0, 0.95, 1.35, 0.67, 0.75);
socketPlate(oven, 1.05, 0.4, 0.66);
if (MID) { glow('rgba(255,150,60,1)', 2.2, 0.5).position.set(-2.2, 0.9, -7.4); for (const dx of [-0.5, 0, 0.5]) mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 12, Math.PI), basic('#ff9e57'), -2.0 + dx, 2.3 + Math.abs(dx) * 0.2, -7.6, scene, false); }
lab('Oven 3 bars · bake 20 s', -2.0, 3.3, -8.2);
// fridge against the west wall, facing into the kitchen
const fr = group(-5.3, 0, -1.6, Math.PI / 2);
mesh(rbox(1.3, 2.3, 1.0, 0.12), mk('#e9f0f2'), 0, 1.15, 0, fr);
mesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), mk(DMETAL), 0.5, 1.4, 0.52, fr);
mesh(new THREE.BoxGeometry(1.25, 0.04, 0.02), mk(DMETAL), 0, 1.6, 0.51, fr);
// thermometer (fill level = warmth)
const warm = MID ? 0.62 : 0.35;
mesh(rbox(0.22, 1.1, 0.08, 0.1).rotateX(Math.PI / 2), toon('#fffaf0'), -0.4, 1.2, 0.54, fr);
mesh(new THREE.BoxGeometry(0.1, 0.95 * warm, 0.04), toon(warm > 0.6 ? '#ff8a3d' : '#ffc94d'), -0.4, 0.75 + 0.95 * warm / 2 - 0.02, 0.59, fr);
mesh(new THREE.SphereGeometry(0.1, 12, 10), toon(warm > 0.6 ? '#ff8a3d' : '#ffc94d'), -0.4, 0.68, 0.59, fr);
socketPlate(fr, 0.3, 0.35, 0.52, 0, mk);
if (!MID) cable([[-4.75, 0.4, -1.3], [-4.3, 0.06, -1.0], [-3.8, 0.06, -0.3]], '#ecE8dc', 0.04); // fridge's own lead, unplugged (nothing live yet)
else cable([[-4.75, 0.4, -1.3], [-4.2, 0.06, -1.1], [-3.7, 0.06, -1.6], [-3.3, 0.12, -1.3]], '#ecE8dc', 0.04);
lab('Fridge 2 bars · warming', -5.3, 2.9, -1.6);
// leak: a trail of water from the fridge out through the kitchen door into the corridor
const water = basic('#7cc4ea', { transparent: true, opacity: 0.75 });
const trail = [[-4.6, -1.2, 0.5], [-3.6, -0.5, 0.6], [-2.5, 0.0, 0.55], [-1.3, 0.4, 0.6], [-0.3, 0.8, 0.65], [0.3, 1.4, 0.7], [0.6, 2.2, 0.6], [0.4, 2.8, 0.5]];
const trailN = MID ? 5 : trail.length;
trail.slice(0, trailN).forEach(([x, z, r], i) => mesh(new THREE.CircleGeometry(r, 24).rotateX(-Math.PI / 2).scale(1.4, 1, 1), water, x, 0.015 + i * 0.0005, z, scene, false).rotation.y = i * 0.4);
if (MID) { const mop = group(0.6, 0, 2.6, 0.4); mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.5, 18), toon('#3f7fd6'), 0, 0.25, 0, mop); mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 8), toon(TRIM), 0.25, 1.0, 0, mop).rotation.z = -0.3; }
lab('Leak (cable in water = short)', -1.5, 0.8, 0.2);
// prep table with lunch trays
const pt = group(-4.3, 0, -5.6, Math.PI / 2);
mesh(rbox(2.2, 0.1, 0.9, 0.06), mk('#e9f0f2'), 0, 0.95, 0, pt);
for (const [lx, lz] of [[-1, -0.38], [1, -0.38], [-1, 0.38], [1, 0.38]]) mesh(new THREE.BoxGeometry(0.07, 0.95, 0.07), mk(METAL), lx, 0.48, lz, pt);
for (const tx of (MID ? [-0.6] : [-0.6, 0.1, 0.8])) { mesh(rbox(0.55, 0.05, 0.4, 0.05), mk('#e5484d'), tx, 1.03, 0, pt); mesh(new THREE.SphereGeometry(0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mk('#f2d08a'), tx, 1.05, 0, pt); }
lab('Lunch trays', -4.3, 1.8, -5.6);
// conveyor: oven side → through the hatch → lift car
const CZ = -7.0;
const cv = group(2.9, 0, CZ);
mesh(rbox(7.6, 0.25, 0.9, 0.1), mk(DMETAL), 0, 0.85, 0, cv);
const beltT = canvasTex(256, 64, (c) => { c.fillStyle = '#3a3d55'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#4a4d6a'; for (let x = 0; x < 256; x += 24) c.fillRect(x, 0, 8, 64); });
beltT.wrapS = THREE.RepeatWrapping; beltT.repeat.set(6, 1);
mesh(new THREE.BoxGeometry(7.6, 0.03, 0.75), toon('#ffffff', { map: beltT }), 0, 0.99, 0, cv);
for (let x = -3.4; x <= 3.4; x += 1.7) for (const dz of [-0.35, 0.35]) mesh(new THREE.BoxGeometry(0.08, 0.75, 0.08), mk(METAL), x, 0.38, dz, cv);
mesh(rbox(0.7, 0.6, 0.6, 0.08), mk('#3f7fd6'), -0.6, 0.42, 0.72, cv); // motor
socketPlate(cv, -0.6, 0.45, 1.03, 0, mk);
if (MID) { mesh(rbox(0.55, 0.05, 0.4, 0.05), mk('#e5484d'), -3.3, 1.03, 0, cv); }
lab('Conveyor 1.5 · kick 3', 1.6, 1.9, CZ + 0.9);
// hatch flaps in the kitchen|lift wall
for (const dz of [-0.35, 0.35]) mesh(new THREE.BoxGeometry(0.06, 0.8, 0.4), mk('#5f8fa8'), 6.0, 1.3, CZ + dz);
// kitchen lamp
lamp(3.4, -2.2, MID, mk); socketPlate(scene, 3.4, 0.35, -1.85, 0, mk);
lab('Kitchen lamp', 3.4, 2.6, -2.2);
// swinging door (auto-closing) — wedged open mid-solve
const DX = 0, DZ = 1;
for (const s of [-1, 1]) {
  const hinge = group(DX + s * 1.2, 0, DZ, 0);
  hinge.rotation.y = MID ? s * 1.35 : 0;
  mesh(rbox(1.15, 2.0, 0.08, 0.06).rotateX(Math.PI / 2), toon('#5f8fa8'), -s * 0.58, 1.05, 0, hinge);
  mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.04, 16).rotateX(Math.PI / 2), toon('#bfeaf5'), -s * 0.58, 1.55, 0.05, hinge);
}
if (MID) mesh(new THREE.BoxGeometry(0.3, 0.14, 0.5), toon('#ffc94d'), -1.05, 0.07, 1.6).rotation.z = 0.25;
lab('Swinging door (pinches cables)', 0, 2.5, 1);

// ---- LIFT ROOM (dark until the winch runs) ---------------------------------------------------------
const ml = M('lift');
const shaft = group(9.9, 0, -8.2);
for (const sx of [-1.1, 1.1]) mesh(new THREE.BoxGeometry(0.2, 3.2, 0.2), ml(DMETAL), sx, 1.6, -0.4, shaft);
mesh(new THREE.BoxGeometry(2.4, 0.2, 1.4), ml(DMETAL), 0, 3.1, 0, shaft);
const car = group(0, 0.0, 0, 0, shaft);
mesh(rbox(1.9, 0.12, 1.2, 0.08), ml(METAL), 0, 0.9, 0, car);
mesh(new THREE.BoxGeometry(1.9, 1.3, 0.08), ml('#c7ccd6'), 0, 1.55, -0.6, car);
mesh(new THREE.BoxGeometry(0.08, 1.3, 1.2), ml('#c7ccd6'), 0.95, 1.55, 0, car);
mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.9, 6), ml(INK), 0, 2.65, 0, car);
lab('Lift car', 9.9, 3.6, -8.2);
const winch = group(12.6, 0, -6.4, -Math.PI / 2);
mesh(rbox(1.6, 0.3, 1.2, 0.08), ml(DMETAL), 0, 0.15, 0, winch);
mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.0, 22).rotateZ(Math.PI / 2), ml('#e0b25a'), 0, 0.9, 0, winch);
for (const sx of [-0.6, 0.6]) mesh(new THREE.BoxGeometry(0.12, 1.2, 0.9), ml(DMETAL), sx, 0.7, 0, winch);
mesh(rbox(0.7, 0.6, 0.5, 0.08), ml('#3f7fd6'), 0, 0.55, 0.75, winch);
socketPlate(winch, 0, 0.55, 1.02, 0, ml);
cable([[12.6, 1.3, -6.4], [11.5, 2.6, -7.4], [10.1, 3.05, -8.2]], INK, 0.025, 0, ml(INK));
lab('Lift winch 3 · kick 9!', 12.6, 2.3, -6.4);
if (!MID) { const blob = group(8.2, 0, -2.8, 0.3); mesh(new THREE.CapsuleGeometry(0.4, 0.45, 6, 18), ml('#b392f0'), 0, 0.66, 0, blob); for (const ex of [-0.12, 0.12]) { mesh(new THREE.SphereGeometry(0.1, 12, 10), toon('#ffffff'), ex, 0.95, 0.36, blob); mesh(new THREE.SphereGeometry(0.05, 10, 8), toon(INK), ex, 0.95, 0.45, blob); } }
const moon = new THREE.PointLight('#8fa6ff', 5, 12, 1.3); moon.position.set(10, 3.2, -4); scene.add(moon);
if (!MID) { const sm = new THREE.PointLight('#8fa6ff', 3, 9, 1.3); sm.position.set(-10, 3.2, -5); scene.add(sm); }

// ---- CORRIDOR: cleaner bots' loop, cable bridges, doorstops, mop -----------------------------------
const lane = [[-4, 3.0], [12, 3.0], [12, 5.5], [-4, 5.5], [-4, 3.0]];
for (let i = 0; i < 4; i++) { const [x0, z0] = lane[i], [x1, z1] = lane[i + 1]; const len = Math.hypot(x1 - x0, z1 - z0); for (let t = 0; t < len; t += 0.5) mesh(new THREE.BoxGeometry(0.25, 0.01, 0.08), basic('#6aa7e8'), x0 + ((x1 - x0) * t) / len, 0.008, z0 + ((z1 - z0) * t) / len, scene, false).rotation.y = Math.atan2(-(z1 - z0), x1 - x0); }
bot(MID ? 6.2 : 2.0, 5.5, 0); bot(MID ? -1.0 : 9.0, 3.0, Math.PI);
lab('Cleaner bots (snag floor cables)', 4, 1.2, 4.25);
const dstop = group(-3.3, 0, 6.3); mesh(rbox(0.8, 0.35, 0.5, 0.06), toon(TRIM), 0, 0.17, 0, dstop);
for (let i = 0; i < (MID ? 1 : 2); i++) mesh(new THREE.BoxGeometry(0.28, 0.12, 0.4), toon('#ffc94d'), -0.15 + i * 0.3, 0.42, 0, dstop).rotation.z = 0.25;
lab('Doorstops', -3.3, 1.0, 6.3);
for (let i = 0; i < (MID ? 0 : 3); i++) bridge(6.8 + i * 0.1, 6.3, 0).position.y = i * 0.21;
if (!MID) lab('Cable bridges ×3', 6.8, 1.2, 6.3);
if (!MID) { const mop = group(2.6, 0, 6.3); mesh(new THREE.CylinderGeometry(0.32, 0.26, 0.5, 18), toon('#3f7fd6'), 0, 0.25, 0, mop); mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 8), toon(TRIM), 0.25, 1.0, 0, mop).rotation.z = -0.3; lab('Mop', 2.6, 1.5, 6.3); }

// ---- MID-SOLVE: cables laid, a scorched mistake, Pip hauling the capacitor cart ---------------------------
if (MID) {
  // thick cable: Supply B → arch → corridor (outside the bots' loop) → wedged door → over puddle bridge → kitchen splitter
  bridge(-0.5, 0.35, 0.4);
  const S2 = splitter(-1.2, -2.6, toon, 0);
  dolly(-7.4, 2.4, 0.9, false);
  cable([outB[0], [-10.6, 0.07, 4.4], [-8.2, 0.07, 3.3], [-6.0, 0.07, 2.4], [-4.5, 0.07, 2.1], [-2.0, 0.07, 1.9], [-0.8, 0.07, 1.4], [-0.6, 0.26, 0.35], [-0.9, 0.07, -0.7], [-1.6, 0.07, -1.8], [-1.6, 0.15, -2.6]], INK, 0.085, 0.8);
  // splitter outputs (thin): oven, kitchen lamp, storeroom lamp (through the now-open storeroom door)
  cable([[-0.82, 0.15, -2.75], [-0.4, 0.07, -4.5], [-0.8, 0.07, -6.8], [-0.95, 0.4, -7.53]], '#ecE8dc', 0.045, 0.6);
  cable([[-0.82, 0.15, -2.6], [1.2, 0.07, -2.4], [3.0, 0.07, -1.9], [3.4, 0.35, -1.8]], '#ecE8dc', 0.045, 0.6);
  cable([[-0.82, 0.15, -2.45], [-2.4, 0.07, -3.6], [-5.0, 0.07, -4.6], [-6.0, 0.07, -4.8], [-7.6, 0.07, -3.6], [-9.4, 0.07, -2.4], [-9.4, 0.35, -2.0]], '#ecE8dc', 0.045, 0.6);
  // the earlier mistake: a thin cable that fed the whole splitter, scorched black, tossed aside
  cable([[-3.3, 0.06, 0.2], [-2.7, 0.06, -0.4], [-2.3, 0.06, 0.3], [-1.9, 0.06, -0.2], [-1.6, 0.06, 0.4]], '#262833', 0.045);
  puff(-2.4, 0.3, 0.0, 0.5, '#8d8a96', 3);
  lab('Scorched thin cable (1st try: too much on thin)', -2.4, 0.9, 0.0);
  // Supply A → thin cable → around the loop → two bridges on the bots' line → lift room → winch (not plugged yet)
  bridge(9.0, 5.5, Math.PI / 2); bridge(9.2, 3.0, Math.PI / 2);
  cable([outA[0], [-10.2, 0.07, 1.6], [-8.0, 0.07, 3.9], [-6.0, 0.07, 4.7], [-4.6, 0.07, 6.3], [2, 0.07, 6.4], [8.4, 0.07, 6.3], [8.9, 0.07, 6.1], [9.0, 0.23, 5.5], [9.05, 0.07, 4.8], [9.1, 0.07, 3.7], [9.2, 0.23, 3.0], [9.4, 0.07, 2.2], [9.9, 0.07, 1.0], [10.6, 0.07, -1.5], [11.6, 0.07, -4.0], [12.3, 0.1, -5.0]], '#ecE8dc', 0.045);
  plug(new THREE.Vector3(12.35, 0.12, -5.1), new THREE.Vector3(0.1, 0, -1), '#ecE8dc', 1.1);
  lab('Thin feed for lift (waits for capacitor at winch)', 9.3, 1.0, 4.3);
  // Pip, walking backwards, hauling the capacitor cart toward the lift-room door
  const cc = capCart(4.6, 2.2, Math.PI);
  const pip = tech({ body: '#3f7fd6', hat: '#ffc94d' });
  pip.g.position.set(6.25, 0, 2.2); pip.g.rotation.y = -Math.PI / 2;
  pip.torso.rotation.x = -0.28; pip.legs[0].rotation.x = 0.45; pip.legs[1].rotation.x = -0.4;
  for (const a of pip.arms) a.rotation.x = -1.3;
  pip.arms[0].rotation.z = 0.25; pip.arms[1].rotation.z = -0.25;
  for (let i = 0; i < 3; i++) mesh(new THREE.SphereGeometry(0.09 + i * 0.03, 10, 8), toon('#fffaf0'), 3.5 - i * 0.3, 0.12 + i * 0.04, 2.2 + (i - 1) * 0.35, scene, false);
  lab('Pip hauling capacitor cart', 5.4, 2.8, 2.2);
  glow('rgba(80,230,255,1)', 1.6, 0.6).position.set(12.6, 0.55, -5.4);
}
if (!MID) {
  const pip = tech({ body: '#3f7fd6', hat: '#ffc94d' });
  pip.g.position.set(-8.8, 0, 3.0); pip.g.rotation.y = 1.2;
  pip.arms[0].rotation.x = -0.4; pip.arms[1].rotation.x = -2.6; pip.arms[1].rotation.z = -0.3;  // waving: shift starts
  lab('Pip (start)', -8.8, 2.6, 3.0);
}

// ---- cameras -----------------------------------------------------------------------------------------
let camera;
if (view === 'plan') {
  const a = W / H, hh = 9.6;
  camera = new THREE.OrthographicCamera(-hh * a, hh * a, hh, -hh, 0.1, 100);
  camera.position.set(0, 40, -1.0); camera.up.set(0, 0, -1); camera.lookAt(0, 0, -1.0);
} else {
  camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 200);
  camera.position.set(0.5, 21, 17.5);
  camera.lookAt(0.2, 0, -1.4);
}
done(camera);
if (view === 'plan') {
  camera.updateMatrixWorld();
  for (const [t, p] of LABELS) {
    const v = p.clone().project(camera);
    const d = document.createElement('div'); d.className = 'lbl'; d.textContent = t;
    d.style.left = `${(v.x * 0.5 + 0.5) * W}px`; d.style.top = `${(-v.y * 0.5 + 0.5) * H}px`;
    document.body.appendChild(d);
  }
  for (const [t, x, z] of [['POWER ROOM', -10, 6.6], ['STOREROOM (dark)', -10, -0.6], ['KITCHEN', 0, -0.3], ['LIFT ROOM (dark)', 10, 0.6], ['CORRIDOR', 2.5, 6.8]]) {
    const v = new THREE.Vector3(x, 0, z).project(camera);
    const d = document.createElement('div'); d.className = 'room'; d.textContent = t;
    d.style.left = `${(v.x * 0.5 + 0.5) * W}px`; d.style.top = `${(-v.y * 0.5 + 0.5) * H}px`;
    document.body.appendChild(d);
  }
}

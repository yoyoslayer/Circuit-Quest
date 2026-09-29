// "Big Meeting" — open-plan office floor, Good Job-scale density. Pip drags a springy extension cable from
// the server closet's live outlet, wrapped round pillars, to the dark boardroom projector. Taut cable flings a chair.
import { THREE, W, H, INK, scene, toon, dim, basic, mesh, group, rbox, canvasTex, glow, lights, planks, stripes, glyph, decal, cable, plug, reel, plant, crate, puff, tech, mitt, done } from './lib.js';

let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const camera = new THREE.PerspectiveCamera(38, W / H, 0.1, 300);
camera.position.set(0.5, 25, 20.5);
camera.lookAt(0.3, 0, -1.6);
lights({ hemi: 0.95, sunI: 1.5, amb: 0.22 });

const METAL = '#9aa3b2', DMETAL = '#6b7385', WOOD = '#b98552';
const CHAIRC = ['#e5484d', '#3f7fd6', '#6cc58a', '#ffc94d', '#b392f0', '#f08a4b'];
const BLOBC = ['#b392f0', '#6cc58a', '#5b9cf0', '#f08a4b', '#f78fd0', '#ffc94d', '#8fd3c8'];

// ---- shell -------------------------------------------------------------------------------------------
const carpet = canvasTex(512, 512, (c) => { c.fillStyle = '#8fa3b8'; c.fillRect(0, 0, 512, 512); c.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 0; y < 512; y += 64) for (let x = 0; x < 512; x += 64) if ((x + y) % 128 === 0) c.fillRect(x, y, 64, 64); });
carpet.wrapS = carpet.wrapT = THREE.RepeatWrapping; carpet.repeat.set(6, 4);
mesh(new THREE.BoxGeometry(25, 0.3, 20), toon('#ffffff', { map: carpet }), -3.5, -0.15, -1).castShadow = false;
mesh(new THREE.BoxGeometry(9, 0.3, 20), toon('#ffffff', { map: planks('#c99a64', 'rgba(110,70,35,0.35)', 2, 4) }), 12.5, -0.15, -1).castShadow = false;
const WALL = '#e3d6c0';
mesh(new THREE.BoxGeometry(34, 3.4, 0.3), toon(WALL), 0, 1.7, -11);
mesh(new THREE.BoxGeometry(0.3, 3.4, 20), toon(WALL), -16, 1.7, -1);
mesh(new THREE.BoxGeometry(0.3, 1.0, 20), toon(WALL), 17, 0.5, -1);
for (let x = -13; x <= 15; x += 3.2) { if (x > -10 && x < 16) { mesh(new THREE.BoxGeometry(2.4, 1.6, 0.08), toon('#8fc3e0'), x, 2.1, -10.84); mesh(new THREE.BoxGeometry(0.08, 1.6, 0.12), toon('#f4efe6'), x, 2.1, -10.8); } }
// city skyline peeking through windows
for (let i = 0; i < 18; i++) mesh(new THREE.BoxGeometry(0.4 + rnd() * 0.5, 0.4 + rnd() * 1.0, 0.05), toon(pick(['#6f8fb0', '#7fa0bf', '#5f7f9f'])), -9 + i * 1.4, 1.5 + rnd() * 0.3, -10.9, scene, false);

// ---- props ---------------------------------------------------------------------------------------------
function chair(x, z, ry, c = pick(CHAIRC), parent = scene) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parent.add(g);
  mesh(rbox(0.55, 0.1, 0.55, 0.1), toon(c), 0, 0.48, 0, g);
  mesh(rbox(0.55, 0.55, 0.1, 0.08), toon(c), 0, 0.8, -0.26, g);
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 8), toon(INK), 0, 0.26, 0, g);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; mesh(new THREE.BoxGeometry(0.32, 0.04, 0.05), toon(INK), Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15, g).rotation.y = -a; }
  return g;
}
function blob(x, z, ry, c = pick(BLOBC), y = 0, parent = scene) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  mesh(new THREE.CapsuleGeometry(0.33, 0.35, 6, 16), toon(c), 0, 0.55, 0, g);
  for (const ex of [-0.1, 0.1]) { mesh(new THREE.SphereGeometry(0.085, 12, 10), toon('#ffffff'), ex, 0.78, 0.29, g); mesh(new THREE.SphereGeometry(0.042, 10, 8), toon(INK), ex, 0.78, 0.36, g); }
  return g;
}
function desk(x, z, ry, occupied) {
  const g = group(x, 0, z, ry);
  mesh(rbox(1.5, 0.07, 0.8, 0.05), toon('#f1ebe0'), 0, 0.74, 0, g);
  for (const s of [-0.7, 0.7]) mesh(new THREE.BoxGeometry(0.06, 0.72, 0.7), toon(METAL), s, 0.37, 0, g);
  mesh(rbox(0.3, 0.45, 0.6, 0.05), toon('#d9d2c3'), 0.45, 0.25, 0, g); // drawer unit
  // monitor
  mesh(new THREE.BoxGeometry(0.7, 0.42, 0.05), toon(INK), 0, 1.08, -0.25, g);
  mesh(new THREE.BoxGeometry(0.62, 0.34, 0.01), toon(pick(['#5b9cf0', '#6cc58a', '#8fd3c8', '#3a3d55'])), 0, 1.08, -0.22, g, false);
  mesh(new THREE.BoxGeometry(0.06, 0.26, 0.06), toon(INK), 0, 0.88, -0.28, g);
  mesh(new THREE.BoxGeometry(0.5, 0.03, 0.16), toon('#dcdfe6'), 0, 0.79, 0.08, g);
  if (rnd() < 0.8) mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 10), toon(pick(CHAIRC)), -0.5, 0.83, 0.1, g);
  if (rnd() < 0.6) for (let i = 0; i < 3; i++) mesh(new THREE.BoxGeometry(0.28, 0.02, 0.38), toon('#fffaf0'), 0.45 + i * 0.01, 0.79 + i * 0.02, 0.1, g).rotation.y = rnd() * 0.4;
  if (rnd() < 0.45) { mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 10), toon('#e07a4f'), -0.55, 0.84, -0.2, g); mesh(new THREE.IcosahedronGeometry(0.11, 1), toon('#4caf50'), -0.55, 0.98, -0.2, g); }
  if (rnd() < 0.3) mesh(rbox(0.3, 0.2, 0.25, 0.04), toon(pick(['#ffc94d', '#f78fd0', '#8fd3c8'])), -0.2, 0.86, 0.15, g); // box / snack
  const ch = chair(0, 0.65, Math.PI + (rnd() - 0.5) * 0.6, undefined, g);
  if (occupied) blob(0, 0.7, Math.PI, undefined, 0.35, g);
  return g;
}
function pod(x, z, occ = [1, 0, 1, 1]) {
  mesh(new THREE.BoxGeometry(3.1, 0.6, 0.06), toon('#7a8fa6'), x, 1.05, z);
  [[-0.78, 0.45, 0], [0.78, 0.45, 0], [-0.78, -0.45, Math.PI], [0.78, -0.45, Math.PI]].forEach(([dx, dz, r], i) => desk(x + dx, z + dz, r, occ[i]));
}
function pillar(x, z) { mesh(new THREE.BoxGeometry(0.7, 3.4, 0.7), toon('#d9ccb6'), x, 1.7, z); mesh(new THREE.BoxGeometry(0.8, 0.2, 0.8), toon('#a8734a'), x, 0.1, z); }
function tallPlant(x, z, s = 1) { mesh(new THREE.CylinderGeometry(0.3 * s, 0.22 * s, 0.5 * s, 14), toon(pick(['#e07a4f', '#f4efe6', '#3a3d55'])), x, 0.25 * s, z); for (let i = 0; i < 5; i++) mesh(new THREE.IcosahedronGeometry((0.28 - i * 0.02) * s, 1), toon(pick(['#4caf50', '#3f9a4a', '#5bbd5f'])), x + (rnd() - 0.5) * 0.35 * s, (0.7 + i * 0.25) * s, z + (rnd() - 0.5) * 0.35 * s); }
function cabinet(x, z, ry, c = '#aab3c2') { const g = group(x, 0, z, ry); mesh(rbox(0.6, 1.3, 0.65, 0.05), toon(c), 0, 0.65, 0, g); for (const y of [0.35, 0.75, 1.1]) mesh(new THREE.BoxGeometry(0.2, 0.04, 0.02), toon(INK), 0, y, 0.33, g); if (rnd() < 0.5) mesh(rbox(0.4, 0.25, 0.4, 0.04), toon('#c98f5a'), 0, 1.43, 0, g); }
function boxes(x, z, n = 3) { for (let i = 0; i < n; i++) crate(x + (rnd() - 0.5) * 0.3, i * 0.5, z + (rnd() - 0.5) * 0.3, 0.7, 0.5, 0.6, pick(['#c98f5a', '#d7a56d', '#b98552']), rnd() * 0.6); }
function whiteboard(x, z, ry) {
  const g = group(x, 0, z, ry);
  mesh(new THREE.BoxGeometry(1.6, 1.0, 0.06), toon('#fbfbf6'), 0, 1.5, 0, g);
  mesh(new THREE.BoxGeometry(1.7, 0.06, 0.1), toon(METAL), 0, 0.98, 0, g);
  for (const s of [-0.8, 0.8]) { mesh(new THREE.BoxGeometry(0.05, 1.9, 0.05), toon(METAL), s, 0.95, 0, g); mesh(new THREE.BoxGeometry(0.05, 0.05, 0.6), toon(METAL), s, 0.05, 0, g); }
  decal(glyph((c) => { c.strokeStyle = '#3f7fd6'; c.lineWidth = 10; c.beginPath(); c.moveTo(20, 200); c.lineTo(80, 120); c.lineTo(140, 160); c.lineTo(230, 40); c.stroke(); c.strokeStyle = '#e5484d'; c.beginPath(); c.arc(70, 60, 30, 0, 7); c.stroke(); }), 1.4, 0.9, 0, 1.5, 0.04, g);
}

// ---- open-plan: desk pods, pillars ----------------------------------------------------------------------
pod(-7.2, -6.3, [1, 1, 0, 1]); pod(-2.3, -6.3, [0, 1, 1, 1]); pod(2.6, -6.3, [1, 0, 1, 0]);
pod(-7.2, 0.6, [1, 1, 1, 0]); pod(-2.3, 0.6, [1, 0, 0, 1]); pod(2.6, 0.6, [0, 1, 1, 1]);
const PILLARS = [[-4.75, -2.9], [0.15, -2.9], [5.1, -2.9], [-4.75, 4.2], [0.15, 4.2]];
PILLARS.forEach(([x, z]) => pillar(x, z));
// back-wall filing cabinets, plants, whiteboards
for (let x = -9; x < 6; x += 0.7) if (rnd() < 0.8) cabinet(x, -10.5, 0, pick(['#aab3c2', '#9aa3b2', '#c7ccd6']));
tallPlant(-9.8, -9.8, 1.3); tallPlant(5.8, -9.8, 1.2); tallPlant(-4.7, -1.6, 0.9); tallPlant(5.4, 4.5, 1.1);
whiteboard(-10.5, 3.5, 0.9); whiteboard(5.6, -4.8, -0.3);
// printer station + paper boxes
const pr = group(-10.2, 0, -2.2, Math.PI / 2);
mesh(rbox(1.2, 1.0, 0.9, 0.08), toon('#dcdfe6'), 0, 0.5, 0, pr); mesh(new THREE.BoxGeometry(0.9, 0.08, 0.5), toon(INK), 0, 1.02, 0.1, pr);
mesh(new THREE.BoxGeometry(0.7, 0.04, 0.4), toon('#fffaf0'), 0, 0.75, 0.55, pr);
boxes(-11.0, -0.6, 3); boxes(-10.2, -0.3, 2);
for (let i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(0.28, 0.01, 0.38), toon('#fffaf0'), -9.2 + rnd() * 1.4, 0.01, -1.6 + rnd() * 1.6, scene, false).rotation.y = rnd() * 3;

// ---- server closet (the one live outlet) ----------------------------------------------------------------
mesh(new THREE.BoxGeometry(0.25, 1.3, 5.5), toon('#bfb4a2'), -11.2, 0.65, -8.25);
mesh(new THREE.BoxGeometry(4.8, 1.3, 0.25), toon('#bfb4a2'), -13.6, 0.65, -5.5);
for (let i = 0; i < 4; i++) {
  const x = -15.3 + i * 1.0; mesh(rbox(0.8, 2.3, 0.9, 0.05), toon('#3a3d55'), x, 1.15, -10.2);
  for (let k = 0; k < 7; k++) mesh(new THREE.BoxGeometry(0.06, 0.04, 0.02), toon(pick(['#57e38f', '#ffc94d', '#5b9cf0']), { emissive: pick(['#3fdc7f', '#ffb020', '#4a8cff']), ei: 0.9 }), x - 0.2 + (k % 3) * 0.2, 0.4 + k * 0.28, -9.74, scene, false);
}
mesh(rbox(0.8, 0.5, 0.6, 0.06), toon('#6b7385'), -14.4, 0.25, -7.2); // UPS
const OUTLET = new THREE.Vector3(-11.4, 0.55, -7.8);
mesh(rbox(0.4, 0.4, 0.12, 0.06).rotateY(Math.PI / 2), toon('#f0ece2'), OUTLET.x - 0.08, OUTLET.y, OUTLET.z);
glow('rgba(120,255,160,1)', 0.7, 0.6).position.copy(OUTLET);

// ---- coffee corner + lounge (front) ---------------------------------------------------------------------
const cc = group(-13.4, 0, 4.6, Math.PI / 2);
mesh(rbox(3.6, 0.95, 0.8, 0.06), toon(WOOD), 0, 0.47, 0, cc); mesh(new THREE.BoxGeometry(3.7, 0.06, 0.85), toon('#f1ebe0'), 0, 0.97, 0, cc);
mesh(rbox(0.5, 0.6, 0.45, 0.06), toon(INK), -1.1, 1.3, 0, cc); mesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), toon('#e5484d'), -1.1, 1.15, 0.25, cc);
for (let i = 0; i < 5; i++) mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.11, 10), toon(pick(CHAIRC)), -0.3 + i * 0.18, 1.06, 0.1, cc);
mesh(rbox(0.5, 0.35, 0.4, 0.05), toon('#ffc94d'), 0.9, 1.17, 0, cc);
const wc = group(-11.6, 0, 7.4); mesh(rbox(0.5, 1.0, 0.5, 0.06), toon('#f4efe6'), 0, 0.5, 0, wc); mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.55, 16), toon('#8fd0f0', { opacity: 0.8 }), 0, 1.3, 0, wc);
const vm = group(-15.2, 0, 1.2, Math.PI / 2); mesh(rbox(1.2, 2.1, 0.9, 0.08), toon('#e5484d'), 0, 1.05, 0, vm); mesh(new THREE.BoxGeometry(0.8, 1.3, 0.05), toon('#bfeaf5'), -0.1, 1.3, 0.46, vm);
for (let i = 0; i < 9; i++) mesh(new THREE.BoxGeometry(0.14, 0.14, 0.02), toon(pick(CHAIRC)), -0.35 + (i % 3) * 0.25, 1.0 + Math.floor(i / 3) * 0.35, 0.49, vm, false);
blob(-12.4, 5.9, 2.4, '#8fd3c8'); blob(-12.6, 2.9, 0.9, '#f78fd0');
// lounge
const sofa = group(10.5, 0, 6.2, Math.PI); mesh(rbox(3.0, 0.45, 0.9, 0.15), toon('#e5484d'), 0, 0.35, 0, sofa); mesh(rbox(3.0, 0.6, 0.25, 0.1), toon('#d63a3f'), 0, 0.75, -0.35, sofa);
for (const s of [-1.35, 1.35]) mesh(rbox(0.3, 0.55, 0.9, 0.1), toon('#d63a3f'), s, 0.55, 0, sofa);
mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 20), toon(WOOD), 10.5, 0.45, 4.9); mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), toon(INK), 10.5, 0.22, 4.9);
for (const [x, z, c] of [[8.3, 4.6, '#ffc94d'], [12.9, 4.4, '#5b9cf0']]) mesh(new THREE.SphereGeometry(0.5, 16, 12).scale(1, 0.7, 1), toon(c), x, 0.35, z);
blob(10.0, 6.3, Math.PI, '#ffc94d', 0.3); tallPlant(15.6, 7.6, 1.2); tallPlant(7.6, 7.8, 1.0);
// arcade-style ping pong table for flavour and physics
const pp = group(3.6, 0, 6.9, 0.1); mesh(rbox(2.4, 0.06, 1.3, 0.04), toon('#3f9a6a'), 0, 0.76, 0, pp); mesh(new THREE.BoxGeometry(0.04, 0.16, 1.3), toon('#f4efe6'), 0, 0.86, 0, pp);
for (const [lx, lz] of [[-1, -0.5], [1, -0.5], [-1, 0.5], [1, 0.5]]) mesh(new THREE.BoxGeometry(0.06, 0.74, 0.06), toon(INK), lx, 0.37, lz, pp);
mesh(new THREE.SphereGeometry(0.05, 10, 8), toon('#ff9a3d'), 3.2, 0.82, 6.8);

// ---- boardroom (glass walls, dark, waiting for the projector) -------------------------------------------
const glass = toon('#bfe6f5', { opacity: 0.28 });
const gw = (w, x, z, ry) => { const m = mesh(new THREE.BoxGeometry(w, 2.6, 0.06), glass, x, 1.3, z, scene, false); m.rotation.y = ry; const f = mesh(new THREE.BoxGeometry(w, 0.08, 0.1), toon(DMETAL), x, 2.6, z); f.rotation.y = ry; const b = mesh(new THREE.BoxGeometry(w, 0.1, 0.1), toon(DMETAL), x, 0.05, z); b.rotation.y = ry; };
gw(4.0, 9.0, -2.0, 0); gw(3.2, 15.4, -2.0, 0); gw(8.9, 7.0, -6.45, Math.PI / 2);  // door gap x 11..13.8
mesh(new THREE.BoxGeometry(0.1, 2.6, 0.1), toon(DMETAL), 11.0, 1.3, -2.0); mesh(new THREE.BoxGeometry(0.1, 2.6, 0.1), toon(DMETAL), 13.8, 1.3, -2.0);
const tbl = group(12.0, 0, -6.4, Math.PI / 2);
mesh(rbox(4.6, 0.1, 1.6, 0.4), toon('#8a5a2b'), 0, 0.78, 0, tbl);
for (const s of [-1.6, 1.6]) mesh(new THREE.CylinderGeometry(0.1, 0.25, 0.75, 12), toon(INK), s, 0.38, 0, tbl);
for (let i = 0; i < 4; i++) for (const s of [-1, 1]) { const c = chair(-1.6 + i * 1.05, s * 1.1, s > 0 ? Math.PI : 0, '#3a3d55', tbl); if ((i + (s > 0 ? 1 : 0)) % 2 === 0) blob(-1.6 + i * 1.05, s * 1.12, s > 0 ? Math.PI : 0, undefined, 0.35, tbl); }
// dark projector + screen, and the projector's lead waiting by the door (the snap target)
mesh(rbox(0.6, 0.25, 0.5, 0.06), toon('#dcdfe6'), 12.0, 0.96, -4.8); mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 14).rotateX(Math.PI / 2), toon(INK), 12.0, 0.96, -5.08);
mesh(new THREE.BoxGeometry(4.2, 2.3, 0.05), toon('#2a2c42'), 12.0, 1.9, -10.8);
cable([[12.1, 0.9, -4.55], [12.2, 0.3, -4.1], [12.4, 0.05, -3.2], [12.3, 0.05, -2.4]], INK, 0.035);
const tgt = new THREE.Vector3(12.3, 0.12, -2.25); plug(tgt, new THREE.Vector3(0, 0, 1), INK, 1.1);
mesh(new THREE.TorusGeometry(0.4, 0.04, 8, 30).rotateX(Math.PI / 2), basic('#6ff0ff'), tgt.x, 0.05, tgt.z, scene, false);
glow('rgba(80,230,255,1)', 1.4, 0.7).position.copy(tgt);
cabinet(15.8, -9.5, -Math.PI / 2, '#3a3d55'); tallPlant(15.5, -3.2, 1.0);

// ---- THE STAR: a springy extension cable, taut, wrapped round two pillars --------------------------------
const pip = tech({ body: '#3f7fd6', hat: '#ffc94d' });
pip.g.position.set(6.7, 0, 1.6); pip.g.rotation.y = 0.5;
pip.torso.rotation.x = 0.45;                          // leaning into the pull
pip.legs[0].rotation.x = 0.8; pip.legs[1].rotation.x = -0.7;
for (const a of pip.arms) { a.rotation.x = 1.0; }     // both mitts back over the shoulder, gripping the cable
pip.arms[0].rotation.z = 0.35; pip.arms[1].rotation.z = -0.1;
const hand = mitt(pip, 0).lerp(mitt(pip, 1), 0.5);
// path: outlet → round pillar (-4.75,-2.9) → round pillar (0.15,-2.9) → Pip
const wrapA = new THREE.Vector3(-4.75 + 0.42, 0.35, -2.9 + 0.42), wrapB = new THREE.Vector3(0.15 - 0.2, 0.55, -2.9 + 0.45);
const pts = [OUTLET, new THREE.Vector3(-10.9, 0.12, -7.3), wrapA, wrapB, hand];
const COLS = ['#f4efe6', '#ffd27a', '#ff9a3d', '#e5484d'];
for (let i = 0; i < pts.length - 1; i++) {
  const a = pts[i], b = pts[i + 1], len = a.distanceTo(b);
  const m = mesh(new THREE.CylinderGeometry(0.07, 0.07, len, 10), toon(COLS[Math.min(i, 3)]), 0, 0, 0);
  m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
}
for (const w of [wrapA, wrapB]) mesh(new THREE.TorusGeometry(0.46, 0.07, 8, 20, Math.PI).rotateX(Math.PI / 2), toon('#ffd27a'), w.x - 0.42, w.y, w.z - 0.42, scene).rotation.y = -0.6;
// strain at the hand: vibration lines + hot glow; spare cable still on the reel at Pip's belt? no — reel is nearly empty in the closet
glow('rgba(255,110,60,1)', 1.2, 0.8).position.copy(hand);
for (let k = 0; k < 4; k++) { const off = new THREE.Vector3(-0.9 - k * 0.5, 0.12 * (k % 2 ? 1 : -1), -0.35 - k * 0.2); const p = hand.clone().add(off); mesh(new THREE.BoxGeometry(0.28, 0.03, 0.03), basic('#ff9a3d'), p.x, p.y + 0.18, p.z, scene, false).rotation.y = -0.4; }
const rl = reel(-11.0, 0.42, -6.6, '#f4efe6', '#ffc94d', 0.8); rl.rotation.y = 0.6; rl.children[2].scale.set(0.45, 1, 0.45);
// clean route (ghost): around the boardroom door the long way — the taut cable can't reach yet
for (let i = 0; i < 14; i++) { const t = i / 13; const p = new THREE.Vector3().lerpVectors(hand, new THREE.Vector3(12.3, 0.1, -1.6), t); p.y = 0.1 + Math.sin(t * Math.PI) * 0.6; mesh(new THREE.SphereGeometry(0.06, 8, 6), basic('#6ff0ff'), p.x, p.y, p.z, scene, false); }

// ---- consequence: the snap flung a chair; people react ---------------------------------------------------
const fly = chair(2.4, -1.2, 0, '#ffc94d'); fly.scale.setScalar(1.4); fly.position.y = 2.6; fly.rotation.set(0.9, 0.6, 1.4);
for (let k = 0; k < 3; k++) { const c = new THREE.EllipseCurve(0, 0, 1.2 + k * 0.3, 0.8 + k * 0.2, Math.PI * 0.6, Math.PI * 1.1); const pp2 = c.getPoints(12).map((p) => new THREE.Vector3(1.4 + p.x, 1.4 + p.y * 0.8, -1.2 - k * 0.15)); cable(pp2, '#ffffff', 0.025, 0, basic('#ffffff')); }
for (let i = 0; i < 7; i++) { const p = mesh(new THREE.BoxGeometry(0.28, 0.01, 0.38), toon('#fffaf0'), 1.0 + rnd() * 2.5, 1.2 + rnd() * 1.8, -2 + rnd() * 2.0, scene, false); p.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); }
// a toppled potted plant and a spilled mug where the cable swept
const tp = group(-2.0, 0.28, -2.4, 0.3); tp.rotation.z = Math.PI / 2; mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.45, 14), toon('#e07a4f'), 0, 0, 0, tp); mesh(new THREE.IcosahedronGeometry(0.35, 1), toon('#4caf50'), 0, 0.45, 0, tp);
mesh(new THREE.CircleGeometry(0.5, 20).rotateX(-Math.PI / 2), toon('#6b4a2e'), -1.4, 0.012, -2.2, scene, false);
// startled coworkers: "!" bubbles (symbols only)
const bang = glyph((c) => { c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(128, 128, 110, 0, 7); c.fill(); c.lineWidth = 14; c.stroke(); c.fillStyle = '#e5484d'; c.fillRect(112, 50, 32, 100); c.beginPath(); c.arc(128, 190, 18, 0, 7); c.fill(); });
for (const [x, y, z] of [[1.8, 2.2, 0.2], [-1.5, 2.2, -6.0], [3.4, 2.2, -5.9]]) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: bang, depthTest: false })); s.scale.set(0.7, 0.7, 1); s.position.set(x, y, z); s.renderOrder = 9; scene.add(s); }
blob(1.8, 0.9, 2.6, '#f08a4b').rotation.z = 0.35; // ducking
// cleaning bot doing rounds (future hazard)
{ const g = group(-6.0, 0, 3.6, 0.3); mesh(new THREE.CylinderGeometry(0.4, 0.43, 0.2, 24), toon('#f4efe6'), 0, 0.13, 0, g); mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 20), toon('#3f7fd6'), 0, 0.25, 0, g); }


// ---- front half: more desks, storage, mail cart, low bookshelves, bins -------------------------------------
pod(-7.2, 6.9, [0, 1, 1, 0]); pod(-2.3, 6.9, [1, 1, 0, 1]);
for (let i = 0; i < 4; i++) { const g = group(6.9, 0, 1.2 + i * 1.5, Math.PI / 2); mesh(rbox(1.4, 1.1, 0.45, 0.05), toon(WOOD), 0, 0.55, 0, g); for (let k = 0; k < 6; k++) mesh(new THREE.BoxGeometry(0.14, 0.32, 0.3), toon(pick(CHAIRC)), -0.5 + k * 0.2, 0.8, 0, g); for (let k = 0; k < 5; k++) mesh(new THREE.BoxGeometry(0.14, 0.3, 0.3), toon(pick(['#8fd3c8', '#b392f0', '#ffc94d'])), -0.45 + k * 0.22, 0.3, 0, g); }
const mc = group(-4.6, 0, 2.6, 0.4); mesh(rbox(1.0, 0.1, 0.6, 0.05), toon(METAL), 0, 0.45, 0, mc); mesh(rbox(1.0, 0.5, 0.6, 0.05), toon('#5f8fa8'), 0, 0.75, 0, mc); for (const [x, zz] of [[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]]) mesh(new THREE.SphereGeometry(0.07, 8, 6), toon(INK), x, 0.07, zz, mc); for (let k = 0; k < 5; k++) mesh(new THREE.BoxGeometry(0.3, 0.2, 0.25), toon(pick(['#c98f5a', '#fffaf0', '#d7a56d'])), -0.3 + k * 0.15, 1.1, 0, mc);
for (const [x, z] of [[-4.2, 5.0], [0.8, 5.0], [-9.4, -4.1], [4.4, -3.4], [-0.5, -3.6]]) { mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.45, 12), toon(pick(['#3a3d55', '#6cc58a', '#5f8fa8'])), x, 0.23, z); }
boxes(-14.8, 7.4, 3); boxes(-13.9, 7.8, 2); tallPlant(0.2, 8.4, 1.1); tallPlant(-9.8, 8.2, 1.0); whiteboard(1.9, 8.1, Math.PI);
cabinet(-15.5, -3.6, Math.PI / 2); cabinet(-15.5, -2.9, Math.PI / 2); cabinet(-15.5, -2.2, Math.PI / 2);

done(camera);

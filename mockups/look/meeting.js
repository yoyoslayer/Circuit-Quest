// Big Meeting look-dev scene, built from the real level data (src/levels/meeting.ts) and prefabs.
import * as THREE from 'three';
import {makeProp, prefabs} from '/src/props/prefabs.ts';
import {meeting} from '/src/levels/meeting.ts';
import {toon, rbox, box, cyl, sphere, part, group, glow, freeze, INK, METAL, DMETAL, TRIM, WOOD, BLOBC, lit} from '/src/render/kit.ts';
import * as TX from './textures.js';
import {slab, dressedWall, floorZone, windowShaft, wallArt, pendant, deskLamp, deskClutter, lampPool, pointLamp, lightDecal, plane, shadowDecal} from './room.js';
import {blob, bang, sweat, zzz, pip, hose, roundedPath, twang, dustPuff, hot, unlitM, glossyToon} from './actors.js';

const L = meeting, W = L.width, D = L.depth;
const inside = (x, z, o, pad = 0) => x > o.minX - pad && x < o.maxX + pad && z > o.minZ - pad && z < o.maxZ + pad;
const pillars = L.obstacles.filter(o => o.id.startsWith('pillar'));

export async function buildMeeting(scene, shot) {
  const r = TX.rng(42);
  const statics = new THREE.Group(); scene.add(statics);   // frozen into merged meshes at the end (like the game)
  const live = new THREE.Group(); scene.add(live);         // lights, sprites, characters, cable

  // ---------- floors ----------
  slab(live, W, D);
  floorZone(statics, -W / 2, 9.1, -D / 2, D / 2, TX.carpetTiles('#8395ab'), 2.4);
  floorZone(statics, 9.1, W / 2, -D / 2, D / 2, TX.woodPlanks('#c99a64'), 3.2);
  // walkway runner through the aisle and desk-island rugs
  floorZone(statics, -9.5, 8.6, -2.1, -.4, TX.carpetTiles('#a7a2a0', 'runner'), 2.4, .004);
  for (const [px, pz] of [[-6, -4.5], [-1, -4.5], [4, -4.5], [-6, 1.5], [-1, 1.5], [4, 1.5], [-6, 7.6], [-.8, 7.6]])
    floorZone(statics, px - 2.05, px + 2.05, pz - 1.75, pz + 1.75, TX.carpetTiles('#6c7f99', 'island'), 2.4, .006);
  // closet: concrete; lounge rug; boardroom rug
  floorZone(statics, -W / 2, -11.9, -D / 2, -5.5, TX.concrete('#9aa3b2'), 3, .008);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(2.1, 40).rotateX(-Math.PI / 2), toon('#ffffff', {map: TX.rugTex('#d98c5f', '#f6d49b')})); rug.position.set(12.4, .014, 5.4); rug.receiveShadow = true; statics.add(rug);
  floorZone(statics, 10.4, 13.9, -9.2, -3.6, TX.rugTex('#5f7fa8', '#bcd3ee'), 3.5, .01);

  // ---------- shell ----------
  const winX = []; for (let x = -W / 2 + 2.2; x < W / 2 - 1.5; x += 3.2) winX.push(x);
  dressedWall(statics, {axis: 'x', len: W, at: -D / 2, from: 0, windows: winX});
  dressedWall(statics, {axis: 'z', len: D, at: -W / 2, from: 0});
  // low front + right lips with trim
  part(statics, box(W, .32, .22), toon('#e3d6c0'), 0, .12, D / 2); part(statics, box(W + .02, .06, .28), toon('#c98a55'), 0, .31, D / 2);
  part(statics, box(.22, .32, D), toon('#e3d6c0'), W / 2, .12, 0); part(statics, box(.28, .06, D + .02), toon('#c98a55'), W / 2, .31, 0);
  for (const x of winX) windowShaft(live, x, -D / 2 + .2, {opacity: .2});
  // wall art: posters, clocks, corkboard
  const backZ = -D / 2 + .16;
  wallArt(statics, 'clock', -3.1, 2.55, backZ + .02, 0, .9);
  wallArt(statics, 'clock', 7.1, 2.5, backZ + .02, 0, .8);
  const leftX = -W / 2 + .16;
  wallArt(statics, 'cork', leftX + .02, 1.85, 0.2, Math.PI / 2, 1.2);
  wallArt(statics, 'bolt', leftX + .02, 1.95, -3.2, Math.PI / 2);
  wallArt(statics, 'plant', leftX + .02, 1.95, 7.6, Math.PI / 2);
  wallArt(statics, 'mountain', leftX + .02, 1.9, 2.7, Math.PI / 2, .9);
  wallArt(statics, 'graph', 15.2, 1.9, backZ + .02, 0, .9);

  // ---------- pillars (with caps, a poster, an outlet and an extinguisher) ----------
  pillars.forEach((o, i) => {
    const w = o.maxX - o.minX, x = (o.minX + o.maxX) / 2, z = (o.minZ + o.maxZ) / 2;
    part(statics, box(w, 3, w), toon('#e6dac4'), x, 1.5, z);
    part(statics, box(w + .1, .16, w + .1), toon(BASE_C), x, .08, z);
    part(statics, box(w + .12, .12, w + .12), toon('#c98a55'), x, 3.02, z);
    part(statics, box(w + .03, .06, w + .03), toon('#a8734a'), x, 1.06, z);
    const face = z + w / 2 + .01;
    if (i % 2 === 0) wallArt(statics, ['sun', 'cat', 'mountain'][i % 3], x, 1.9, face + .02, 0, .7);
    else { part(statics, cyl(.1, .1, .45, 12), toon('#e5484d'), x + .25, .45, face + .1); part(statics, cyl(.04, .04, .08, 8), toon(INK), x + .25, .72, face + .1); }
    part(statics, rbox(.18, .22, .03, .03).clone().rotateX(Math.PI / 2), toon('#f0ece2'), x - .22, .35, face + .01, false);
  });

  // ---------- server closet ----------
  for (const o of L.obstacles.filter(o => o.id.startsWith('closet'))) {
    const w = o.maxX - o.minX, d = o.maxZ - o.minZ, x = (o.minX + o.maxX) / 2, z = (o.minZ + o.maxZ) / 2;
    part(statics, box(w, 1.35, d), toon('#bfb4a2'), x, .675, z); part(statics, box(w + .05, .08, d + .05), toon('#c98a55'), x, 1.39, z);
    part(statics, box(w + .02, .12, d + .02), toon(BASE_C), x, .06, z);
  }
  for (let i = 0; i < 4; i++) {
    const x = -15.9 + i * 1.0; part(statics, rbox(.8, 2.3, .9, .05), toon('#3a3d55'), x, 1.15, -9.4);
    part(statics, box(.66, 2.0, .02), toon('#2a2c40'), x, 1.2, -8.945, false);
    for (let k = 0; k < 9; k++) { const c = ['#57e38f', '#ffc94d', '#5b9cf0'][(i + k) % 3]; const m = part(live, box(.07, .04, .02), hot(c, 2.2), x - .22 + (k % 3) * .2, .45 + k * .2, -8.93, false); m.userData.noAO = true; }
  }
  glow(live, 'rgba(90,255,150,1)', 3.2, .12).position.set(-14.4, 1.4, -8.4);
  pointLamp(live, -14.3, 1.8, -7.6, {color: '#7dffb5', intensity: 3.5, distance: 5});
  part(statics, rbox(.8, .5, .6, .06), toon(DMETAL), -14.6, .25, -6.6);
  // closet cable spaghetti
  for (let k = 0; k < 4; k++) { const c = new THREE.CatmullRomCurve3([[-16 + k, 1.9, -8.95], [-15.7 + k, .6, -8.6], [-15.2 + k * .9, .04, -7.9 + k * .2], [-14.6, .04, -6.9]].map(p => new THREE.Vector3(...p))); part(statics, new THREE.TubeGeometry(c, 30, .03, 5), toon(['#3f7fd6', '#e5484d', '#ffc94d', INK][k]), 0, 0, 0, false); }
  // live outlet on the closet's east wall
  part(statics, rbox(.4, .4, .12, .06).clone().rotateY(Math.PI / 2), toon('#f0ece2'), -11.72, .55, -7.8);
  const og = glow(live, 'rgba(120,255,160,1)', .9, .5); og.position.set(-11.55, .55, -7.8);

  // ---------- boardroom ----------
  for (const [x0, x1] of [[9.3, 11], [13.8, W / 2]]) { const w = x1 - x0, x = (x0 + x1) / 2; const gl = part(live, box(w, 2.5, .06), toon('#bfe6f5', {opacity: .24}), x, 1.3, -2, false); gl.userData.noAO = true; part(statics, box(w, .08, .1), toon(DMETAL), x, 2.6, -2); part(statics, box(w, .1, .1), toon(DMETAL), x, .05, -2); }
  for (const x of [11, 13.8]) part(statics, box(.1, 2.6, .1), toon(DMETAL), x, 1.3, -2);
  for (let i = 0; i < 3; i++) { const z = -8 + i * 2.5; const gl = part(live, box(.06, 2.5, 2.4), toon('#bfe6f5', {opacity: .24}), 9.3, 1.3, z, false); gl.userData.noAO = true; part(statics, box(.1, .08, 2.5), toon(DMETAL), 9.3, 2.6, z); part(statics, box(.1, .1, 2.5), toon(DMETAL), 9.3, .05, z); }
  // frosted band decals on the glass
  for (const [x, w] of [[10.15, 1.7], [15.1, 2.6]]) part(live, box(w, .18, .07), toon('#ffffff', {opacity: .55}), x, 1.25, -2, false).userData.noAO = true;
  part(statics, rbox(1.6, .1, 4.6, .4), toon('#8a5a2b'), 12, .78, -6.4); for (const z of [-8, -4.8]) part(statics, cyl(.1, .25, .75, 12), toon(INK), 12, .38, z);
  for (let k = 0; k < 6; k++) { const n = part(statics, box(.28, .02, .2), toon('#fffaf0'), 11.6 + (k % 2) * .8, .84, -7.8 + Math.floor(k / 2) * 1.3, false); n.rotation.y = (r() - .5); }
  const projector = group(statics, 12, 0, -4.5); part(projector, rbox(.6, .25, .5, .06), toon('#dcdfe6'), 0, .96, 0); part(projector, cyl(.1, .1, .1, 14, 'z'), toon(INK), 0, .96, -.28);
  const lead = new THREE.CatmullRomCurve3([[12.1, .9, -4.3], [12.2, .3, -3.9], [12.4, .05, -3.2], [12.3, .05, -2.4]].map(p => new THREE.Vector3(...p))); part(statics, new THREE.TubeGeometry(lead, 40, .035, 6), toon(INK));
  part(statics, box(4.4, 2.5, .08), toon(INK), 12.2, 1.9, -9.82); part(statics, box(4.2, 2.3, .05), toon('#34364f'), 12.2, 1.9, -9.78);
  for (const z of [-7.6, -5.2]) pendant(live, 12, z, {y: 2.35, color: '#3f7fd6', light: z < -6});
  // target socket at the boardroom door
  part(statics, rbox(.48, .38, .3, .06), toon('#384454'), L.target.x, .2, L.target.z);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.42, .06, 8, 32), hot('#64ddd4', 1.4)); ring.rotation.x = -Math.PI / 2; ring.position.set(L.target.x, .06, L.target.z); ring.userData.noAO = true; live.add(ring);

  // ---------- lounge / coffee ----------
  part(statics, rbox(.8, .95, 3.4, .06), toon(WOOD), -15.9, .47, 4.6); part(statics, box(.85, .06, 3.5), toon('#f1ebe0'), -15.9, .97, 4.6);
  for (let k = 0; k < 5; k++) part(statics, cyl(.07, .06, .15, 10), toon(['#fffaf0', '#e5484d', '#3f7fd6', '#ffc94d', '#6cc58a'][k]), -15.8, 1.08, 3.3 + k * .2);
  part(statics, cyl(.2, .14, .1, 16), toon('#f4efe6'), -15.8, 1.05, 6); for (let k = 0; k < 4; k++) part(statics, sphere(.08, 10, 8), toon(['#e5484d', '#ffc94d', '#6cc58a', '#f08a4b'][k]), -15.8 + (k % 2) * .08 - .04, 1.12 + (k > 1 ? .06 : 0), 6 + (k % 3 - 1) * .07);
  wallArt(statics, 'sun', leftX + .02, 2.0, 4.6, Math.PI / 2, .9);
  pendant(live, 12.4, 5.4, {y: 2.3, color: '#ffc94d'});
  const fl = group(statics, 15.4, 0, 7.6); part(fl, cyl(.22, .26, .05, 16), toon(INK), 0, .03, 0); part(fl, cyl(.025, .025, 1.7, 6), toon(TRIM), 0, .9, 0); const fs = part(fl, new THREE.CylinderGeometry(.22, .34, .38, 18, 1, true), glossyToon('#f7ecd0'), 0, 1.8, 0); fs.material.side = THREE.DoubleSide;
  glow(live, 'rgba(255,210,140,1)', 1.3, .35).position.set(15.4, 1.72, 7.6); lampPool(live, 15.2, 7.4, 1.6, .22);

  // ---------- ceiling fixtures over the back desk row (read as "there's a ceiling up there") ----------
  if (false) for (const px of [-6, -1, 4]) {
    const g = group(live, px, 0, -6.4);
    for (const s of [-1, 1]) part(g, cyl(.01, .01, 3, 4), toon(INK), s * 1.1, 4.4, 0, false);
    part(g, rbox(2.8, .1, .42, .08), toon('#f4efe6'), 0, 2.9, 0); const tube = part(g, box(2.6, .04, .28), hot('#fff4dc', 1.6), 0, 2.84, 0, false); tube.userData.noAO = true;
  }

  // ---------- props from the real level ----------
  const skip = (s) => pillars.some(o => inside(s.x, s.z, o, s.kind === 'chair' ? .35 : .1));
  const deskSpots = [];
  for (const s of L.props) {
    if (skip(s)) continue;
    const m = makeProp(s.kind, s.color), p = prefabs[s.kind];
    m.position.set(s.x, s.y ?? p.size[1] / 2 + .025, s.z); m.rotation.y = s.rotation ?? 0;
    if (s.kind === 'chair') m.rotation.y += (r() - .5) * .5;
    if (s.kind === 'paper' || s.kind === 'mug') m.rotation.y = r() * 6;
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    statics.add(m);
    if (s.kind === 'desk' && s.x < 8 && s.z > -8 && (s.x !== -14)) deskSpots.push(s);
  }
  // clutter per desk (chair side from the level's layout rule)
  deskSpots.forEach((s, i) => {
    const pz = [-4.5, 1.5, 7.6].reduce((a, b) => Math.abs(b - s.z) < Math.abs(a - s.z) ? b : a), side = s.z < pz ? -1 : 1;
    deskClutter(statics, s.x, s.z, side, r, {lamp: i % 5 === 2});
  });
  // extra floor clutter: boxes, a toppled bin, paper drift, power strips
  for (const [x, z, ry] of [[-8.6, -1.2, .3], [7.2, 3.6, -.4], [-2.6, 5.1, .8], [2.2, -.8, .2], [-7.8, 4.6, 1.2], [6.8, -6.9, .5]]) { const p = makeProp('paper'); p.position.set(x, .02, z); p.rotation.y = ry; statics.add(p); }
  for (const [x, z] of [[-8.9, 9.1], [7.8, 9.2], [-9.2, -7.9]]) { const b = makeProp('box'); b.position.set(x, .325, z); b.rotation.y = r(); statics.add(b); const b2 = makeProp('box', '#d7a56d'); b2.position.set(x + .1, .95, z - .05); b2.rotation.y = r(); statics.add(b2); }
  for (const [x, z] of [[2.1, 6.5], [-4.1, -.6]]) { const b = makeProp('bin'); b.position.set(x, .2, z); b.rotation.set(Math.PI / 2, r() * 6, 0); statics.add(b); }
  const plantXZ = [[-15.6, -4.6], [8.5, -7.6], [-6.8, -8.9], [15.6, 3], [15.9, -1.2], [2.2, -8.9], [-15.6, 9]];
  for (const [x, z] of plantXZ) { const p = makeProp('plant', r() < .5 ? '#4caf50' : '#5cbf6a'); p.position.set(x, .65, z); p.scale.setScalar(1.1 + r() * .3); statics.add(p); }

  // ---------- coworkers ----------
  const ACC = [['tuft'], ['headphones'], ['glasses', 'tie'], ['mug'], ['bun'], ['cap'], ['sprout'], ['glasses'], ['headphones', 'tuft'], [], ['tie'], ['bun', 'glasses']];
  const MOOD = ['calm', 'calm', 'blink', 'calm', 'sleepy', 'calm', 'happy', 'calm'];
  const scen = SCENARIO[shot] ?? SCENARIO['meeting-overview'];
  const npcs = [];
  L.npcs.forEach((n, i) => {
    if (pillars.some(o => inside(n.x, n.z, o, .35))) return;
    const seated = !n.standing, near = scen.pip && Math.hypot(n.x - scen.pip[0], n.z - scen.pip[1]) < 4.2 || scen.alarmAt?.some(([ax, az, rr]) => Math.hypot(n.x - ax, n.z - az) < rr);
    const mood = near ? 'alarm' : MOOD[i % MOOD.length];
    const facing = seated ? (n.z < [-4.5, 1.5, 7.6].reduce((a, b) => Math.abs(b - n.z) < Math.abs(a - n.z) ? b : a) ? 0 : Math.PI) : (i % 2 ? Math.PI / 2 : -.6);
    const b = blob({color: BLOBC[i % BLOBC.length], seated, mood, acc: ACC[i % ACC.length], look: near ? [0, .1] : [(r() - .5), (r() - .5) * .6], lean: near ? -.18 : 0});
    b.position.set(n.x, 0, n.z); b.rotation.y = near && scen.pip ? Math.atan2(scen.pip[0] - n.x, scen.pip[1] - n.z) : facing + (r() - .5) * .4; live.add(b); npcs.push(b);
    if (near) { bang(b, (seated ? .35 : 0) + 1.55); sweat(b, .32, (seated ? .35 : 0) + 1.02); }
    else if (mood === 'sleepy' && i % 3 === 1) zzz(b, (seated ? .35 : 0) + 1.35);
  });
  // extra standing coworkers chatting in the lounge + by the printer
  for (const [x, z, c, ry, acc, mood] of [[11.2, 4.1, '#f78fd0', .9, ['mug', 'bun'], 'happy'], [13.1, 3.9, '#8fd3c8', -1.1, ['glasses', 'mug'], 'happy'], [-9.3, -1.4, '#ffc94d', .2, ['tuft'], 'calm'], [-12.8, 5.9, '#5b9cf0', 1.5, ['mug', 'headphones'], 'calm']]) {
    const b = blob({color: c, mood, acc}); b.position.set(x, 0, z); b.rotation.y = ry; live.add(b);
  }
  for (const [x, z, c, acc, seated] of scen.extras ?? []) {
    const b = blob({color: c, seated, mood: 'alarm', acc, lean: -.2}); b.position.set(x, 0, z); b.rotation.y = Math.atan2(scen.pip[0] - x, scen.pip[1] - z); live.add(b);
    bang(b, (seated ? .35 : 0) + 1.55); sweat(b, -.3, (seated ? .35 : 0) + 1.05);
    if (seated) { const ch = makeProp('chair', '#e5484d'); ch.position.set(x, .5, z); ch.rotation.y = b.rotation.y + Math.PI; live.add(ch); }
  }

  // ---------- the cable + Pip ----------
  const a = L.anchor, reelM = makeProp('reel'); reelM.position.set(a.x + .15, .35, a.z + .05); reelM.rotation.y = .4; live.add(reelM);
  if (scen.path) {
    const path = roundedPath(scen.path.map(([x, z, y = .09]) => [x, y, z]), .3);
    const n = path.length, slack = scen.slack ?? 0;
    for (let i = 1; i < n - 1; i++) { const t = i / (n - 1); path[i].x += Math.sin(t * 40) * slack * .05; path[i].z += Math.sin(t * 23 + 1) * slack * .12; }
    const P = await pip('pull'); P.root.position.set(scen.pip[0], 0, scen.pip[1]); P.root.rotation.y = scen.pipYaw; live.add(P.root);
    const plug = makeProp('coupler', '#ffcc52'); plug.scale.setScalar(.95); plug.rotation.set(0, Math.PI / 2, -.6); P.hand.add(plug);
    live.updateMatrixWorld(true); const hand = P.hand.getWorldPosition(new THREE.Vector3());
    path.push(new THREE.Vector3(hand.x, hand.y - .05, hand.z));
    const cable = hose(path, {radius: .1, strain: scen.strain, pulses: scen.pulses}); live.add(cable);
    for (const t of scen.twangs ?? []) twang(live, new THREE.Vector3(t[0], .25, t[1]), t[2], 3);
    for (const d of scen.dust ?? []) dustPuff(live, d[0], .12, d[1], .9, d[2]);
    // hint dots toward the target
    for (let k = 1; k < 9; k++) { const t = k / 9, x = scen.pip[0] + (L.target.x - scen.pip[0]) * t, z = scen.pip[1] + (L.target.z - scen.pip[1]) * t + Math.sin(t * Math.PI) * .6; const d = part(live, sphere(.055, 8, 6), hot('#9ff3ea', 1.2), x, .06, z, false); d.userData.noAO = true; }
  }
  // lamp pools on the floor from desk lamps + pendant
  lampPool(live, 12.4, 5.4, 2.2, .18); lampPool(live, 12, -6.4, 2.4, .14);

  freeze(statics);
  return {live, statics, npcs};
}
const BASE_C = '#7a4f33';

/** Per-shot story state: cable path (x,z[,y]), strain along it, Pip pose/place, reactions. */
const SCENARIO = {
  'meeting-overview': {
    path: [[-11.4, -7.8, .3], [-10.6, -7.1], [-9.6, -5.6], [-5.28, -2.37], [1.2, -.95, .3]],
    strain: (u) => .25 + u * .55, pulses: [.08, .2, .34], pip: [1.9, -.8], pipYaw: Math.PI / 2 + .2,
    twangs: [[-5.3, -2.3, 2.3]], alarmAt: [[-5, -2, 3.2]],
  },
  'meeting-closeup': {
    path: [[-11.4, -7.8, .3], [-10.6, -7.1], [-9.6, -5.6], [-5.28, -2.37], [4.57, -2.37], [5.63, -2.37], [6.75, -3.55, .3]],
    strain: (u) => Math.min(1, .3 + Math.pow(u, 1.8) * .8), pulses: [.5, .62, .72, .82], pip: [7.3, -4.15], pipYaw: Math.PI * .75,
    twangs: [[5.65, -2.3, .75], [4.55, -2.3, 2.3]], alarmAt: [[4.4, -3.2, 2.4]], extras: [[6.35, -5.75, '#8fd3c8', ['mug', 'glasses']]],
  },


};

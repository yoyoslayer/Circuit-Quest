// Lunch Rush look-dev scene: real prop list + obstacles from src/levels/lunch.ts,
// machines approximated from src/lunch-runtime.ts (buildKitchen/buildLift/buildLamps/buildDoor/buildCorridor).
import * as THREE from 'three';
import {makeProp, prefabs} from '/src/props/prefabs.ts';
import {lunch} from '/src/levels/lunch.ts';
import {toon, rbox, box, cyl, sphere, part, group, glow, freeze, glyph, decal, cachedTexture, boltGlyph, Gauge, INK, METAL, DMETAL, TRIM} from '/src/render/kit.ts';
import * as TX from './textures.js';
import {slab, dressedWall, floorZone, windowShaft, wallArt, pendant, lampPool, pointLamp, lightDecal, plane, shadowDecal} from './room.js';
import {blob, bang, sweat, pip, hose, roundedPath, twang, hot, unlitM, glossyToon, noOutline} from './actors.js';

const L = lunch, W = L.width, D = L.depth;
const PUDDLES = [[-4.6, -1.2, .45], [-3.6, -.5, .55], [-2.4, 0, .55], [-1.2, .4, .6], [-.2, .8, .7], [.4, 1.4, .75], [.6, 2.2, .6], [.3, 2.8, .45]];
const LANE = {x0: -1, x1: 14, z0: 1.2, z1: 5.4};

export async function buildLunch(scene, shot, rig) {
  const r = TX.rng(7), statics = new THREE.Group(), live = new THREE.Group(); scene.add(statics, live);
  // ---------- floors ----------
  slab(live, W, D);
  floorZone(statics, -W / 2, -7.8, 0, D / 2, TX.concrete('#c4bba9'), 4);
  floorZone(statics, -W / 2, -7.8, -D / 2, 0, TX.concrete('#a9a296'), 4);
  floorZone(statics, -7.8, 8, -D / 2, 0, TX.tiles('#efe8d8', '#8fcac0'), 3.2);
  floorZone(statics, 8, W / 2, -D / 2, 0, TX.concrete('#9aa3b2'), 3);
  floorZone(statics, -7.8, W / 2, 0, D / 2, TX.woodPlanks('#d4ab74'), 3.2);
  // hazard mats + dining rug
  floorZone(statics, 9.2, 14.8, -2.1, -.3, TX.hazardStripe(), 1.2, .006);
  floorZone(statics, -15.8, -10.2, 1.2, 9.2, TX.concrete('#b4ab98'), 4, .005);
  // ---------- shell ----------
  const winX = []; for (let x = -W / 2 + 2.2; x < W / 2 - 1.5; x += 3.2) winX.push(x);
  dressedWall(statics, {axis: 'x', len: W, at: -D / 2, from: 0, windows: winX});
  dressedWall(statics, {axis: 'z', len: D, at: -W / 2, from: 0});
  part(statics, box(W, .32, .22), toon('#e3d6c0'), 0, .12, D / 2); part(statics, box(W + .02, .06, .28), toon('#c98a55'), 0, .31, D / 2);
  part(statics, box(.22, .32, D), toon('#e3d6c0'), W / 2, .12, 0); part(statics, box(.28, .06, D + .02), toon('#c98a55'), W / 2, .31, 0);
  for (const x of winX) if (x > -7) windowShaft(live, x, -D / 2 + .2, {opacity: .17, len: 4.6});
  const colors = {store: '#c9bfae', kitchen: '#e8dcc6', lift: '#b9c0cc'};
  for (const o of L.obstacles) {
    const w = o.maxX - o.minX, d = o.maxZ - o.minZ, x = (o.minX + o.maxX) / 2, z = (o.minZ + o.maxZ) / 2, h = 1.35, c = colors[o.id.split('-')[0]] ?? '#e3d6c0';
    part(statics, box(w, h, d), toon(c), x, h / 2, z); part(statics, box(w + .06, .09, d + .06), toon('#c98a55'), x, h + .04, z);
    part(statics, box(w + .03, .14, d + .03), toon('#7a4f33'), x, .07, z);
    if (o.id.startsWith('kitchen')) part(statics, box(w, .45, d + .02), toon('#8fcac0'), x, .5, z); // tiled splash band
  }
  // wall art
  const backZ = -D / 2 + .18, leftX = -W / 2 + .18;
  wallArt(statics, 'clock', 3.2, 2.55, backZ, 0, .85); wallArt(statics, 'sun', -6.3, 2.0, backZ, 0, .8);
  wallArt(statics, 'bolt', leftX, 1.95, 3.6, Math.PI / 2); wallArt(statics, 'cork', leftX, 1.8, 7.8, Math.PI / 2, 1.1);
  wallArt(statics, 'graph', 15.2, 1.95, backZ, 0, .8);

  // ---------- kitchen machines ----------
  const oven = group(statics, -2.5, 0, -8.1); part(oven, rbox(2.6, 1.7, 1.3, .12), toon('#c7ccd6'), 0, .85); part(oven, box(2.8, .35, 1.5), toon(DMETAL), 0, 1.88, -.05); part(oven, cyl(.25, .25, 1.1, 14), toon(METAL), .6, 2.6, -.3);
  for (let k = 0; k < 3; k++) part(oven, cyl(.07, .07, .06, 12, 'z'), toon(INK), -.9 + k * .3, 1.45, .66);
  const win = part(live, box(1.5, .75, .04), hot('#ff9a3c', 1.6), -2.75, .85, -7.44, false); win.userData.noAO = true;
  part(live, box(1.5, .1, .05), hot('#ffd08a', 2.2), -2.75, 1.1, -7.43, false).userData.noAO = true;
  const og = glow(live, 'rgba(255,150,60,1)', 3.2, .4); og.position.set(-2.75, .9, -7.1); pointLamp(live, -2.7, .9, -6.6, {color: '#ff9c4a', intensity: 5, distance: 5});
  lampPool(live, -2.7, -6.6, 2.1, .16, '#ffb070');
  const bake = new Gauge([[0, .95, '#ffc94d'], [.95, 1, '#3bb273']]); bake.set(.62); bake.mount(oven, .9, 1.35, .68, .7);
  // fridge + thermometer + sad-food
  const fridge = group(statics, -5.6, 0, -2.3, Math.PI / 2); part(fridge, rbox(1.3, 2.3, 1.0, .12), glossyToon('#e9f0f2', {spec: .5, size: .985}), 0, 1.15); part(fridge, box(.06, .9, .06), toon(DMETAL), .5, 1.4, .52); part(fridge, box(1.25, .04, .02), toon(DMETAL), 0, 1.6, .51);
  for (const [x, y, c] of [[-.3, 1.9, '#e5484d'], [.1, 1.8, '#ffc94d'], [-.1, 2.0, '#3f7fd6']]) part(fridge, box(.14, .14, .02), toon(c), x, y, .52, false);
  part(fridge, rbox(.22, 1.1, .08, .1).clone().rotateX(Math.PI / 2), toon('#fffaf0'), -.4, 1.2, .54); part(fridge, box(.1, .7, .04), toon('#ff922f'), -.4, 1.05, .59, false); part(fridge, sphere(.1, 12, 10), toon('#ff922f'), -.4, .68, .59);
  // feed post
  const post = group(statics, -4, 0, -3.35); part(post, rbox(.6, 1.1, .4, .08), glossyToon('#ffc94d', {spec: .6, size: .98}), 0, .55);
  part(post, rbox(.38, .1, .38, .06).clone().rotateX(Math.PI / 2), toon('#f0ece2'), 0, .35, .21); part(post, cyl(.11, .11, .06, 14, 'z'), toon(INK), 0, .35, .26);
  const bolt = new THREE.Mesh(new THREE.PlaneGeometry(.3, .3), noOutline(new THREE.MeshBasicMaterial({map: glyph(boltGlyph), transparent: true}))); bolt.position.set(-4, .85, -3.14); statics.add(bolt);
  const conduit = (pts) => part(statics, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0), 60, .045, 6), toon('#7d8697'));
  conduit([[-4, .2, -3.56], [-4, .03, -3.7], [-3.8, .03, -7], [-1.55, .03, -7.3], [-1.55, .4, -7.44]]); conduit([[-4, .2, -3.56], [-4.3, .03, -3.8], [-7.75, .03, -3.3], [-9.7, .03, -3.1], [-10, .1, -3]]);
  // conveyor
  const conv = group(statics, 3.5, 0, -7); part(conv, rbox(8.5, .25, .9, .1), toon(DMETAL), 0, .95);
  const belt = TX.tex('belt', 256, 64, (c) => { c.fillStyle = '#3a3d55'; c.fillRect(0, 0, 256, 64); c.fillStyle = '#4a4d6a'; for (let x = 0; x < 256; x += 24) c.fillRect(x, 0, 8, 64); }, {repeat: [7, 1]});
  part(conv, box(8.5, .03, .75), toon('#ffffff', {map: belt}), 0, 1.09, 0, false);
  for (let x = -3.9; x <= 4; x += 1.95) for (const dz of [-.35, .35]) part(conv, box(.08, .85, .08), toon(METAL), x, .42, dz);
  for (let k = 0; k < 4; k++) { const t = makeProp('tray'); t.position.set(-.3 + k * 1.9, 1.17, -7); statics.add(t); }
  part(statics, rbox(.7, .6, .6, .08), glossyToon('#3f7fd6', {spec: .5, size: .98}), 5, .3, -6.1); part(statics, rbox(.38, .38, .1, .06).clone().rotateX(Math.PI / 2), toon('#f0ece2'), 5, .38, -5.78);
  for (const dz of [-.35, .35]) part(statics, box(.06, .8, .4), toon('#5f8fa8'), 8.15, 1.4, -7 + dz);
  const table = group(statics, -5.9, 0, -8.55); part(table, rbox(2.2, .1, .9, .06), toon('#e9f0f2'), 0, .95); for (const [lx, lz] of [[-1, -.38], [1, -.38], [-1, .38], [1, .38]]) part(table, box(.07, .95, .07), toon(METAL), lx, .48, lz);
  for (let k = 0; k < 4; k++) part(statics, cyl(.16, .14, .22, 14), toon(k % 2 ? '#c7ccd6' : '#e5484d'), -6.7 + k * .5, 1.12, -8.5);
  // hood lamps over the prep line
  for (const x of [-5.5, -1, 3.5]) pendant(live, x, -5.2, {y: 2.3, color: '#e9f0f2', light: x !== 3.5});
  // ---------- lift ----------
  for (const x of [10.6, 13.4]) part(statics, box(.2, 3.7, .2), toon(DMETAL), x, 1.85, -8.3); part(statics, box(3.2, .25, .5), toon(DMETAL), 12, 3.6, -8.3);
  const car = group(statics, 12, 0, -7); part(car, rbox(2.6, .12, 2.2, .08), toon(METAL), 0, .06); part(car, box(2.6, 1.1, .08), toon('#c7ccd6'), 0, .6, -1.1); part(car, box(.08, 1.1, 2.2), toon('#c7ccd6'), 1.3, .6, 0);
  for (let k = 0; k < 3; k++) { const t = makeProp('coolbox'); t.position.set(11.3 + k * .75, .42, -7.2); statics.add(t); }
  part(statics, cyl(.02, .02, 4, 6), toon(INK), 12, 2.6, -7.4);
  const winch = group(statics, 13.3, 0, -4.8, -Math.PI / 2); part(winch, rbox(1.4, .3, 1.1, .08), toon(DMETAL), 0, .15); part(winch, cyl(.4, .4, .9, 22, 'x'), glossyToon('#e0b25a', {spec: .6, size: .98}), 0, .85); for (const sx of [-.55, .55]) part(winch, box(.12, 1.1, .8), toon(DMETAL), sx, .65);
  const beacon = part(live, sphere(.12, 12, 8), hot('#ff6a3c', 2.2), 13.3, 1.45, -4.8, false); beacon.userData.noAO = true; glow(live, 'rgba(255,90,60,1)', 1.1, .35).position.set(13.3, 1.45, -4.8);
  // ---------- storeroom lamp stand (lit: mid-solve) ----------
  const stand = group(statics, -10, 0, -3); part(stand, cyl(.3, .36, .1, 18), toon(INK), 0, .05); part(stand, cyl(.035, .035, 1.8, 8), toon(TRIM), 0, 1);
  const shade = part(stand, new THREE.CylinderGeometry(.24, .42, .45, 20, 1, true), glossyToon('#f7ecd0'), 0, 2); shade.material.side = THREE.DoubleSide;
  const bulb = part(live, sphere(.14, 12, 10), hot('#ffe6b0', 3), -10, 1.82, -3, false); bulb.userData.noAO = true; glow(live, 'rgba(255,210,120,1)', 2.2, .45).position.set(-10, 1.85, -3);
  pointLamp(live, -10, 1.7, -3, {intensity: 12, distance: 8.5});
  // dark storeroom overlay with a soft hole where the lamp lights the floor
  const darkTex = TX.tex('dark', 512, 512, (c) => { c.fillStyle = 'rgba(16,18,34,1)'; c.fillRect(0, 0, 512, 512); c.globalCompositeOperation = 'destination-out';
    const hx = (-10 + 16.5) / 8.7 * 512, hy = (-3 + 10) / 10 * 512, g = c.createRadialGradient(hx, hy, 0, hx, hy, 190); g.addColorStop(0, 'rgba(0,0,0,.95)'); g.addColorStop(.3, 'rgba(0,0,0,.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 512, 512); }, {aniso: 1});
  const dark = plane(live, 8.7, 10, noOutline(new THREE.MeshBasicMaterial({map: darkTex, transparent: true, opacity: .8, depthWrite: false})), -12.15, 2.72, -5); dark.userData.noAO = true; dark.renderOrder = 5; dark.receiveShadow = false;
  lampPool(live, -10, -3, 3.2, .3);
  // ---------- door + puddles ----------
  for (const [hinge, rot] of [[-1.5, -.9], [1.5, Math.PI + .5]]) { const pv = group(statics, hinge, 0, .15, rot); part(pv, rbox(1.45, 2, .08, .06), toon('#5f8fa8'), .73, 1.05, 0); part(pv, box(1.5, .1, .1), toon('#3f6f88'), .73, .08, 0); part(pv, cyl(.18, .18, .04, 16, 'z'), toon('#bfeaf5'), .73, 1.55, .05); }
  const water = noOutline(new THREE.MeshBasicMaterial({color: '#7cc4ea', transparent: true, opacity: .72, depthWrite: false}));
  const shine = noOutline(new THREE.MeshBasicMaterial({color: '#e6f7ff', transparent: true, opacity: .55, depthWrite: false}));
  for (const [x, z, rr] of PUDDLES) { const m = plane(live, rr * 2, rr * 2, water, x, .02, z); m.geometry = new THREE.CircleGeometry(rr, 24).rotateX(-Math.PI / 2); m.scale.x = 1.4; m.userData.noAO = true;
    const s = plane(live, 1, 1, shine, x - rr * .3, .025, z - rr * .25); s.geometry = new THREE.CircleGeometry(rr * .22, 12).rotateX(-Math.PI / 2); s.scale.x = 2; s.userData.noAO = true; }
  // ---------- corridor: bot lane, bots, rack ----------
  const lane = [[LANE.x0, LANE.z0], [LANE.x1, LANE.z0], [LANE.x1, LANE.z1], [LANE.x0, LANE.z1], [LANE.x0, LANE.z0]];
  for (let i = 0; i < 4; i++) { const [x0, z0] = lane[i], [x1, z1] = lane[i + 1], len = Math.hypot(x1 - x0, z1 - z0); for (let t = 0; t < len; t += .5) part(statics, box(.25, .01, .08), toon('#6aa7e8'), x0 + (x1 - x0) * t / len, .012, z0 + (z1 - z0) * t / len, false).rotation.y = Math.atan2(-(z1 - z0), x1 - x0); }
  for (const [x, z, ry] of [[5.2, 1.2, 0], [14, 3.4, Math.PI / 2]]) { const bot = group(live, x, 0, z, ry); part(bot, cyl(.42, .45, .2, 28), glossyToon('#f4efe6', {spec: .6, size: .975}), 0, .14); part(bot, cyl(.3, .3, .06, 24), toon('#3f7fd6'), 0, .26); for (const ex of [-.1, .1]) part(bot, sphere(.05, 10, 8), hot('#57e38f', 1.6), ex, .2, .4); part(bot, cyl(.12, .12, .04, 6), toon('#ffc94d'), .3, .05, .3); }
  const rack = group(statics, -16.1, 0, 5, Math.PI / 2); part(rack, box(3.4, .08, .5), toon(TRIM), 0, 1, .1); part(rack, box(3.4, .08, .5), toon(TRIM), 0, 2.1, .1); for (const sx of [-1.6, 1.6]) part(rack, box(.08, 2.2, .08), toon(DMETAL), sx, 1.1, .3);
  for (let k = 0; k < 6; k++) { const b = makeProp('box', k % 2 ? '#d7a56d' : '#c98f5a'); b.position.set(-15.8, k < 3 ? 1.35 : 2.45, 3.6 + (k % 3) * 1.1); b.rotation.y = r() * .4; statics.add(b); }
  // dining corner: tables, blobs waiting for lunch
  for (const [x, z] of [[4, 7.6], [10.5, 7.8]]) { part(statics, cyl(.7, .7, .06, 24), toon('#f4efe6'), x, .76, z); part(statics, cyl(.08, .3, .74, 12), toon(INK), x, .38, z); for (let k = 0; k < 3; k++) { const c = makeProp('chair', ['#e5484d', '#3f7fd6', '#ffc94d'][k]); const a = k * 2.1 + .4; c.position.set(x + Math.cos(a) * 1.1, .5, z + Math.sin(a) * 1.1); c.rotation.y = -a - Math.PI / 2; statics.add(c); } }
  // corridor dressing: vending + cooler + benches + rug + tray trolley
  { const v = makeProp('vending'); v.position.set(-6.9, 1.02, 9.3); statics.add(v); const c = makeProp('cooler'); c.position.set(-5.6, .65, 9.4); statics.add(c);
    const t = makeProp('cart', '#e5484d'); t.position.set(6.4, .35, 5.9); t.rotation.y = .3; statics.add(t);
    floorZone(statics, 2.3, 5.7, 5.9, 9.3, TX.rugTex('#5f8fa8', '#bcd3ee'), 3.4, .01); floorZone(statics, 8.8, 12.2, 6.1, 9.5, TX.rugTex('#d98c5f', '#f6d49b'), 3.4, .01);
    for (const [x, z] of [[15.6, 5.2], [-7.2, 1.2]]) { const p = makeProp('plant', '#5cbf6a'); p.position.set(x, .65, z); p.scale.setScalar(1.25); statics.add(p); }
    for (const x of [-4.2, -2.6]) { part(statics, rbox(1.3, .1, .45, .06), toon('#c98a55'), x, .46, 9.35); for (const s of [-.5, .5]) part(statics, box(.08, .44, .36), toon(INK), x + s, .22, 9.35); }
  }
  // ---------- level props ----------
  for (const s of L.props) {
    if (s.id?.startsWith('bridge')) continue;
    const m = makeProp(s.kind, s.color), p = prefabs[s.kind];
    m.position.set(s.x, s.y ?? p.size[1] / 2 + .025, s.z); m.rotation.y = (s.rotation ?? 0) + (s.kind === 'box' ? (r() - .5) * .4 : 0);
    m.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); statics.add(m);
  }
  // cable bridges laid across the lane (yellow ramps with stripes)
  for (const x of [7, 9, 11]) { const b = makeProp('bridge'); b.position.set(x, .1, 1.2); b.rotation.y = Math.PI / 2; statics.add(b); }
  // supply gauges
  for (const [x, z, v] of [[-13, 3, .78], [-13, 7, .35]]) { const g = new Gauge(); g.set(v); const m = g.mount(live, x + .1, 1.55, z + .2, .9); m.rotation.x = -.5; }
  for (const [x, z] of [[-9.4, 9.2], [15.8, 9.1], [-7.2, -9.2]]) { const p = makeProp('plant'); p.position.set(x, .65, z); p.scale.setScalar(1.2); statics.add(p); }

  // ---------- cables (mid-solve) ----------
  // thin #1: supply A -> storeroom lamp (lit)
  live.add(hose(roundedPath([[-12.55, .38, 3], [-12.1, .07, 2.4], [-10.6, .07, .9], [-9.4, .07, -.8], [-9.3, .07, -2.2], [-9.8, .12, -2.9]], .5), {radius: .05, strain: () => .2, pulses: [.35, .7], pulseColor: '#ffe7a8'}));
  // thin #2: supply A -> splitter -> kitchen post through the store door
  live.add(hose(roundedPath([[-12.55, .38, 3.2], [-12.9, .07, 1.2], [-13.2, .07, .35], [-13.3, .12, 0]], .4), {radius: .05, strain: () => .15}));
  live.add(hose(roundedPath([[-13.05, .12, 0], [-11.8, .07, -1.3], [-8.4, .07, -4.8], [-7.2, .07, -5.2], [-4.6, .07, -3.3], [-4.05, .35, -3.1]], .5), {radius: .05, strain: (u) => .3 + u * .4, pulses: [.2, .5, .8], pulseColor: '#ffe7a8'}));
  // thick: supply B -> Pip (carrying it toward the corridor / lift)
  const P = await pip('pull'); P.root.position.set(4.4, 0, 3.6); P.root.rotation.y = Math.PI / 2 + .25; live.add(P.root);
  const plug = makeProp('coupler', '#ffcc52'); plug.rotation.set(0, Math.PI / 2, -.6); P.hand.add(plug); live.updateMatrixWorld(true);
  const hand = P.hand.getWorldPosition(new THREE.Vector3());
  const thickPath = roundedPath([[-12.55, .38, 7.2], [-11.6, .1, 7.5], [-8.8, .1, 6.2], [-6.2, .1, 5.3], [-2.6, .1, 3.9], [-.6, .1, 4.3], [1.6, .1, 3.4], [3.2, .1, 3.3], [hand.x - .2, hand.y - .4, hand.z], [hand.x, hand.y - .05, hand.z]], .9);
  live.add(hose(thickPath, {radius: .1, strain: (u) => .35 + u * .45, bands: true, pulses: [.15, .35, .55, .72]}));
  // coworkers: chef by the oven, hungry diners, liftman
  const cast = [[-1.2, -6.3, '#fffaf0', 2.8, ['tuft'], 'alarm', true], [-3.8, 9.0, '#5b9cf0', 3.0, ['mug', 'tuft'], 'happy'], [-2.4, 8.9, '#f08a4b', 3.4, ['glasses'], 'calm'], [8.6, 6.9, '#b392f0', 2.5, ['bun', 'mug'], 'blink'], [1.6, 2.6, '#6cc58a', 1.9, ['sprout'], 'alarm', true], [3.8, 8.7, '#f78fd0', 3.3, ['bun'], 'sleepy'], [5.1, 7.1, '#8fd3c8', 2.2, ['glasses'], 'calm'], [10.9, 8.9, '#ffc94d', 2.8, ['cap'], 'happy'], [13, 0, '#b392f0', 0, ['headphones'], 'calm'], [-11.2, 5.2, '#6cc58a', .9, ['tuft', 'glasses'], 'alarm', true]];
  for (const [x, z, c, ry, acc, mood, bubble] of cast) { const b = blob({color: c, mood, acc}); b.position.set(x, 0, z); b.rotation.y = ry; live.add(b); if (bubble) { bang(b, 1.55); sweat(b, .32, 1.02); } }
  // chef hat
  const chef = live.children.at(-cast.length); const hat = group(chef, 0, 1.05, 0); part(hat, cyl(.2, .18, .22, 16), toon('#ffffff'), 0, .1, 0); part(hat, sphere(.24, 14, 10), toon('#ffffff'), 0, .28, 0).scale.y = .6;
  freeze(statics);
  return {live, statics};
}

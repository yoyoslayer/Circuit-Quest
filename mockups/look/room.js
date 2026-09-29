// Shared set dressing: diorama slab, dressed walls, windows + light shafts, lamp pools,
// desk clutter and the lighting rig. Everything uses kit.ts toon() so it batches like the game.
import * as THREE from 'three';
import {toon, rbox, box, cyl, sphere, part, group, glow, INK, METAL, DMETAL, TRIM, WOOD} from '/src/render/kit.ts';
import * as TX from './textures.js';
import {unlitM, hot, noOutline, glossyToon} from './actors.js';

export const WALL_UP = '#efe2c8', WALL_LOW = '#c7b08e', RAIL = '#a8734a', BASE = '#7a4f33';
const noOut = (m) => { m.userData.outline = false; return m; };
export function plane(parent, w, d, mat, x, y, z, {floor = true, ry = 0} = {}) {
  const g = new THREE.PlaneGeometry(w, d); if (floor) g.rotateX(-Math.PI / 2);
  const m = new THREE.Mesh(g, mat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; parent.add(m); return m;
}
export function floorZone(parent, x0, x1, z0, z1, map, tile, y = 0) {
  const w = x1 - x0, d = z1 - z0, t = map.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / tile, d / tile); t.needsUpdate = true;
  const m = plane(parent, w, d, toon('#ffffff', {map: t}), (x0 + x1) / 2, y + .002, (z0 + z1) / 2); return m;
}
/** Additive, unlit floor decal (light pools, window patches). Never outlined, never in AO. */
export function lightDecal(parent, map, w, d, x, y, z, opacity = .25, color = '#ffffff', ry = 0) {
  const m = plane(parent, w, d, noOutline(new THREE.MeshBasicMaterial({map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending})), x, y, z, {ry});
  m.receiveShadow = false; m.userData.noAO = true; m.renderOrder = 2; return m;
}
export function shadowDecal(parent, w, d, x, y, z, opacity = .35) {
  const m = plane(parent, w, d, noOutline(new THREE.MeshBasicMaterial({map: TX.radial('shadow', 'rgba(20,18,40,1)', 'rgba(20,18,40,0)', .25), transparent: true, opacity, depthWrite: false})), x, y, z);
  m.userData.noAO = true; m.receiveShadow = false; return m;
}

/** The floor sits on a thick "diorama" slab with a soft drop shadow into the backdrop. */
export function slab(parent, W, D) {
  part(parent, box(W + .5, .5, D + .5), toon('#3b3852'), 0, -.27, 0, false);
  shadowDecal(parent, W * 1.5, D * 1.7, .8, -.6, 1.2, .7);
}

/** A dressed full-height wall along X (back wall) or Z (side wall). */
export function dressedWall(parent, {axis = 'x', len, at, from = 0, h = 3, thick = .25, windows = [], inward = 1}) {
  const g = group(parent);
  const put = (w, hh, d, u, y, off, mat, shadow = true) => {
    const [bw, bd] = axis === 'x' ? [w, d] : [d, w];
    const [x, z] = axis === 'x' ? [from + u, at + off * inward] : [at + off * inward, from + u];
    return part(g, box(bw, hh, bd), mat, x, y, z, shadow);
  };
  const up = toon('#ffffff', {map: TX.wallpaper(WALL_UP)});
  put(len, h, thick, 0, h / 2, 0, toon(WALL_UP));
  // wallpaper skin, wainscot, rail, baseboard, thick cap
  const skin = put(len, h - 1.05, .02, 0, 1.05 + (h - 1.05) / 2, thick / 2 + .011, up, false);
  put(len, 1.0, .05, 0, .55, thick / 2 + .025, toon(WALL_LOW));
  put(len, .07, .09, 0, 1.06, thick / 2 + .04, toon(RAIL));
  put(len, .16, .07, 0, .08, thick / 2 + .035, toon(BASE));
  put(len + .04, .14, thick + .22, 0, h + .07, .02, toon('#c98a55'));
  put(len + .06, .04, thick + .26, 0, h + .16, .02, toon('#8e5a36'));
  for (const u of windows) windowUnit(g, axis, at, from + u, thick, inward);
  return g;
}
function windowUnit(g, axis, at, u, thick, inward) {
  const w = 2.4, h = 1.45, y = 1.95, f = thick / 2 + .06;
  const P = (du, y0, off) => axis === 'x' ? [u + du, y0, at + off * inward] : [at + off * inward, y0, u + du];
  const ry = axis === 'x' ? (inward > 0 ? 0 : Math.PI) : (inward > 0 ? Math.PI / 2 : -Math.PI / 2);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(w, h), unlitM('#ffffff', {map: TX.skyWindow()})); sky.material.color.setScalar(1.12);
  sky.position.set(...P(0, y, thick / 2 + .03)); sky.rotation.y = ry; sky.userData.noAO = false; g.add(sky);
  const frame = toon('#f7f1e4');
  const bar = (bw, bh, du, dy) => { const [x, yy, z] = P(du, y + dy, f); const m = part(g, axis === 'x' ? box(bw, bh, .08) : box(.08, bh, bw), frame, x, yy, z); return m; };
  bar(w + .16, .09, 0, h / 2); bar(w + .16, .09, 0, -h / 2); bar(.09, h, -w / 2, 0); bar(.09, h, w / 2, 0); bar(.06, h, 0, 0);
  const [sx, sy, sz] = P(0, y - h / 2 - .06, f + .04); part(g, axis === 'x' ? box(w + .4, .06, .22) : box(.22, .06, w + .4), toon('#e9dcc2'), sx, sy, sz);
  // half-lowered blinds
  for (let k = 0; k < 6; k++) { const [x, yy, z] = P(0, y + h / 2 - .1 - k * .075, f + .02); const s = part(g, axis === 'x' ? box(w, .05, .03) : box(.03, .05, w), toon('#f4efe4'), x, yy, z, false); s.rotation[axis === 'x' ? 'x' : 'z'] = .5; }
}
/** Warm light shaft from a window at (x, y, z) falling along +z (into the room). */
export function windowShaft(parent, x, z, {len = 5.2, width = 2.2, opacity = .16, drop = 1.7, skew = .9} = {}) {
  const m = noOutline(new THREE.MeshBasicMaterial({map: TX.shaft(), transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, color: '#ffd9a0'}));
  const geo = new THREE.BufferGeometry();
  const top = 2.55, bot = .02, x0 = x - width / 2, x1 = x + width / 2;
  // quad from window (top) sloping to the floor patch (bottom)
  const v = [x0, top, z, x1, top, z, x0 + skew, bot, z + len, x1 + skew, bot, z + len];
  geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 0, 0, 1, 0], 2)); geo.setIndex([0, 2, 1, 1, 2, 3]);
  const s = new THREE.Mesh(geo, m); s.userData.noAO = true; s.renderOrder = 3; parent.add(s);
  // lower window edge -> floor patch
  const patch = lightDecal(parent, TX.radial('patch', 'rgba(255,228,180,1)', 'rgba(255,228,180,0)', .45), width * 1.25, drop * 1.6, x + skew * .75, .015, z + len * .72, .2, '#ffe2b0');
  return s;
}

// ---------------------------------------------------------------- wall decor
export function wallArt(parent, kind, x, y, z, ry = 0, s = 1) {
  const g = group(parent, x, y, z, ry);
  if (kind === 'clock') { part(g, cyl(.32 * s, .32 * s, .06, 28, 'z'), toon(INK), 0, 0, 0); const f = new THREE.Mesh(new THREE.CircleGeometry(.27 * s, 28), noOutline(new THREE.MeshToonMaterial({map: TX.clockFace(), gradientMap: null}))); f.material = toon('#ffffff', {map: TX.clockFace()}); f.position.z = .035; g.add(f); return g; }
  if (kind === 'cork') { part(g, box(1.5 * s, 1.0 * s, .05), toon('#8a5a2b'), 0, 0, 0); const f = new THREE.Mesh(new THREE.PlaneGeometry(1.44 * s, .94 * s), toon('#ffffff', {map: TX.corkboard()})); f.position.z = .03; g.add(f); return g; }
  part(g, box(.72 * s, .95 * s, .04), toon(INK), 0, 0, 0);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(.64 * s, .86 * s), toon('#ffffff', {map: TX.poster(kind)})); f.position.z = .025; g.add(f); return g;
}

// ---------------------------------------------------------------- lamps & fixtures
export const lampPool = (parent, x, z, r = 1.6, op = .2, col = '#ffcf8a') => lightDecal(parent, TX.radial('pool', 'rgba(255,214,150,1)', 'rgba(255,200,130,0)', .2), r * 2, r * 2, x, .02, z, op, col);
export function pointLamp(parent, x, y, z, {color = '#ffcf7a', intensity = 6, distance = 5.5} = {}) { const l = new THREE.PointLight(color, intensity, distance, 1.6); l.position.set(x, y, z); parent.add(l); return l; }
/** Pendant lamp hanging from off-screen ceiling. */
export function pendant(parent, x, z, {y = 2.55, color = '#ffc94d', light = true, cord = .9} = {}) {
  const g = group(parent, x, 0, z);
  part(g, cyl(.012, .012, cord, 5), toon(INK), 0, y + .25 + cord / 2, 0, false);
  const shade = part(g, new THREE.CylinderGeometry(.14, .38, .32, 20, 1, true), glossyToon(color, {spec: .8, size: .95}), 0, y + .16, 0); shade.material.side = THREE.DoubleSide;
  part(g, cyl(.05, .06, .08, 10), toon(INK), 0, y + .35, 0, false);
  const bulb = part(g, sphere(.1, 12, 8), hot('#ffe6b0', 2.2), 0, y + .02, 0, false); bulb.userData.noAO = true;
  const gl = glow(g, 'rgba(255,200,120,1)', 1.0, .22); gl.position.y = y - .05;
  if (light) pointLamp(g, 0, y - .25, 0, {intensity: 4.5, distance: 6});
  return g;
}
export function deskLamp(parent, x, y, z, ry = 0, color = '#e5484d', light = false) {
  const g = group(parent, x, y, z, ry);
  part(g, cyl(.1, .12, .03, 14), toon(INK), 0, .015, 0);
  const a = part(g, cyl(.018, .018, .38, 6), toon(color), 0, .2, 0); a.rotation.z = .35;
  const b = part(g, cyl(.018, .018, .3, 6), toon(color), .12, .42, 0); b.rotation.z = -1.0;
  const sh = part(g, new THREE.ConeGeometry(.1, .16, 14, 1, true), glossyToon(color), .26, .46, 0); sh.rotation.z = 2.3; sh.material.side = THREE.DoubleSide;
  const bulb = part(g, sphere(.045, 8, 6), hot('#fff0c8', 3), .29, .42, 0, false); bulb.userData.noAO = true;
  const gl = glow(g, 'rgba(255,210,140,1)', .5, .45); gl.position.set(.3, .4, 0);
  if (light) pointLamp(g, .32, .3, 0, {intensity: 2.2, distance: 2.4});
  return g;
}

// ---------------------------------------------------------------- desk clutter
const SCREENS = ['sheet', 'code', 'chart', 'chat', 'video', 'mail', 'game'];
/** Keyboard, mouse, screen content, sticky notes, cable tails, cacti, frames, pen cups. side=+1 when the chair is +z. */
export function deskClutter(parent, x, z, side, r, {screenY = 1.2, monZ = null, lamp = false} = {}) {
  const top = .975, g = group(parent, x, 0, z, side > 0 ? 0 : Math.PI);
  part(g, box(.46, .025, .15), toon('#ffffff', {map: TX.keyboardTex()}), -.05, top + .013, .2, false);
  part(g, rbox(.07, .03, .11, .03), toon('#e9e6dd'), .3, top + .015, .2, false);
  // Screen content on the monitor face (monitor sits at z-.17 relative to desk in chair direction)
  const mz = -.17 - .005 + .012, scr = SCREENS[Math.floor(r() * SCREENS.length)];
  const sm = new THREE.Mesh(new THREE.PlaneGeometry(.53, .3), unlitM('#ffffff', {map: TX.screen(scr)})); sm.material.color.setScalar(1.05); sm.position.set(0, screenY + .05, mz); g.add(sm);
  if (r() < .6) for (let k = 0; k < 1 + Math.floor(r() * 3); k++) { const n = part(g, box(.07, .07, .005), toon(['#ffe36e', '#f7a8c4', '#9fe0f0'][k % 3]), .27 - k * .09 * (r() < .5 ? 1 : -1) * 0 - (k * .08), screenY + .24 - (k % 2) * .06, mz + .004, false); n.rotation.z = (r() - .5) * .3; }
  const pick = r();
  if (pick < .25) { part(g, cyl(.05, .045, .1, 8), toon('#e07a4f'), -.55, top + .05, -.05); for (const [dx, dy] of [[0, .07], [.02, .12]]) part(g, cyl(.018, .022, .1, 6), toon('#6cc58a'), -.55 + dx, top + dy + .02, -.05); }
  else if (pick < .45) { const f = part(g, box(.14, .18, .02), toon(['#3f7fd6', '#e5484d', '#b392f0'][Math.floor(r() * 3)]), -.6, top + .09, -.1); f.rotation.x = -.2; f.rotation.y = .4; }
  else if (pick < .65) { part(g, cyl(.04, .04, .1, 10), toon('#3a3d55'), -.62, top + .05, 0); for (let k = 0; k < 3; k++) { const p = part(g, cyl(.006, .006, .14, 4), toon(['#e5484d', '#3f7fd6', '#ffc94d'][k]), -.62 + (k - 1) * .015, top + .12, 0, false); p.rotation.z = (k - 1) * .2; } }
  else if (pick < .8) { for (let k = 0; k < 3; k++) { const b = part(g, box(.24, .03, .17), toon(['#fffaf0', '#e9f0f2', '#ffe36e'][k]), -.5, top + .016 + k * .03, .05, false); b.rotation.y = (r() - .5) * .5; } }
  if (lamp) deskLamp(g, .62, top, -.18, -Math.PI / 2 - .5, ['#e5484d', '#3f7fd6', '#ffc94d', '#6cc58a'][Math.floor(r() * 4)]);
  // cable tail from monitor to the floor + power brick
  const c = new THREE.CatmullRomCurve3([[0, top + .02, -.25], [.1, top - .05, -.36], [.18, .5, -.4], [.3, .03, -.3], [.55, .03, -.15]].map(p => new THREE.Vector3(...p)));
  part(g, new THREE.TubeGeometry(c, 20, .014, 5), toon(INK), 0, 0, 0, false);
  return g;
}

// ---------------------------------------------------------------- lighting rig
export function lightRig(scene, {W = 33, D = 20, key = '#ffe2b8', keyI = 1.75, fill = '#9db8ff', fillI = .45, rimI = .35, hemiI = .85, bg = null} = {}) {
  scene.background = bg ?? TX.backdrop();
  const hemi = new THREE.HemisphereLight('#e4ebff', '#9c7f66', hemiI); scene.add(hemi);
  const amb = new THREE.AmbientLight('#fff4e6', .18); scene.add(amb);
  const sun = new THREE.DirectionalLight(key, keyI); sun.position.set(-11, 21, 13); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, {left: -W * .62, right: W * .62, top: D * .95, bottom: -D * .95, near: 1, far: 70});
  sun.shadow.bias = -.0006; sun.shadow.normalBias = .035; sun.shadow.radius = 2.5; scene.add(sun);
  const fillL = new THREE.DirectionalLight(fill, fillI); fillL.position.set(16, 9, 8); scene.add(fillL);
  const rim = new THREE.DirectionalLight('#ffd6f0', rimI); rim.position.set(6, 12, -18); scene.add(rim);
  return {hemi, amb, sun, fill: fillL, rim};
}

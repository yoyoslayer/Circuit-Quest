// Procedural canvas textures for the look-dev frames. All tiny, all portable to src/render/kit.ts.
import * as THREE from 'three';

export const INK = '#2b2d42';
export function rng(seed = 1) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const cache = new Map();
export function tex(key, w, h, draw, {repeat = null, srgb = true, aniso = 8} = {}) {
  let t = cache.get(key);
  if (!t) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
    t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
    t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; cache.set(key, t);
  }
  if (repeat) { t = t.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.needsUpdate = true; }
  return t;
}
const shade = (hex, k) => { const c = new THREE.Color(hex); c.offsetHSL(0, 0, k); return '#' + c.getHexString(); };

/** 4x4 carpet tiles, pile direction alternating per tile (the classic office quarter-turn). */
export const carpetTiles = (base = '#8193a9', key = 'carpet') => tex(key + base, 512, 512, (c) => {
  const r = rng(7); c.fillStyle = base; c.fillRect(0, 0, 512, 512);
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const x = i * 128, y = j * 128, v = (r() - .5) * .035;
    c.fillStyle = shade(base, v); c.fillRect(x, y, 128, 128);
    c.strokeStyle = shade(base, .05); c.lineWidth = 2; c.globalAlpha = .45;
    for (let k = 6; k < 128; k += 9) { c.beginPath(); if ((i + j) % 2) { c.moveTo(x + k, y + 3); c.lineTo(x + k, y + 125); } else { c.moveTo(x + 3, y + k); c.lineTo(x + 125, y + k); } c.stroke(); }
    c.globalAlpha = 1;
  }
  c.fillStyle = 'rgba(0,0,0,.10)'; for (let k = 0; k <= 512; k += 128) { c.fillRect(k - 1, 0, 2, 512); c.fillRect(0, k - 1, 512, 2); }
  for (let k = 0; k < 900; k++) { c.fillStyle = r() < .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.07)'; c.fillRect(r() * 512, r() * 512, 2, 2); }
});

/** Warm planks with per-board tint, grain and staggered butt joints. */
export const woodPlanks = (base = '#c99a64', key = 'planks') => tex(key + base, 512, 512, (c) => {
  const r = rng(11), rows = 8, rh = 64; c.fillStyle = base; c.fillRect(0, 0, 512, 512);
  for (let row = 0; row < rows; row++) {
    let x = -((row * 173) % 256);
    while (x < 512) {
      const len = 200 + r() * 180; c.fillStyle = shade(base, (r() - .5) * .09); c.fillRect(x, row * rh, len, rh);
      c.strokeStyle = 'rgba(110,65,30,.16)'; c.lineWidth = 2;
      for (let g = 0; g < 4; g++) { const gy = row * rh + 8 + r() * (rh - 16); c.beginPath(); c.moveTo(x + 6, gy); c.bezierCurveTo(x + len * .3, gy + (r() - .5) * 8, x + len * .6, gy + (r() - .5) * 8, x + len - 6, gy); c.stroke(); }
      c.fillStyle = 'rgba(80,45,20,.38)'; c.fillRect(x, row * rh, 3, rh); x += len;
    }
    c.fillStyle = 'rgba(80,45,20,.38)'; c.fillRect(0, row * rh, 512, 3); c.fillStyle = 'rgba(255,240,210,.12)'; c.fillRect(0, row * rh + 3, 512, 3);
  }
});

/** Kitchen checker with grout and a little tile-to-tile variation. */
export const tiles = (a = '#ece6d6', b = '#8fcac0', n = 8) => tex('tiles' + a + b, 512, 512, (c) => {
  const r = rng(3), s = 512 / n; c.fillStyle = '#c9c2b2'; c.fillRect(0, 0, 512, 512);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { c.fillStyle = shade((i + j) % 2 ? a : b, (r() - .5) * .03); c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4); c.fillStyle = 'rgba(255,255,255,.18)'; c.fillRect(i * s + 5, j * s + 5, s * .5, 3); }
});

export const concrete = (base = '#bdb6a8') => tex('conc' + base, 512, 512, (c) => {
  const r = rng(5); c.fillStyle = base; c.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 40; k++) { const g = c.createRadialGradient(r() * 512, r() * 512, 0, r() * 512, r() * 512, 60 + r() * 90); g.addColorStop(0, `rgba(${r() < .5 ? '0,0,0' : '255,255,255'},.05)`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(0, 0, 512, 512); }
  for (let k = 0; k < 1400; k++) { c.fillStyle = r() < .5 ? 'rgba(0,0,0,.09)' : 'rgba(255,255,255,.08)'; c.fillRect(r() * 512, r() * 512, 2, 2); }
  c.fillStyle = 'rgba(0,0,0,.13)'; c.fillRect(0, 255, 512, 3); c.fillRect(255, 0, 3, 512);
});

/** Soft wallpaper: faint vertical pinstripe + dots. */
export const wallpaper = (base = '#efe2c8') => tex('wall' + base, 256, 256, (c) => {
  c.fillStyle = base; c.fillRect(0, 0, 256, 256); c.fillStyle = shade(base, -.025);
  for (let x = 0; x < 256; x += 32) c.fillRect(x, 0, 10, 256);
  c.fillStyle = shade(base, .03); for (let y = 16; y < 256; y += 32) for (let x = 21; x < 256; x += 32) c.fillRect(x, y, 3, 3);
});

export const skyWindow = () => tex('sky', 256, 256, (c) => {
  const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#9fd3f2'); g.addColorStop(.7, '#d7eef5'); g.addColorStop(1, '#fbe9c8');
  c.fillStyle = g; c.fillRect(0, 0, 256, 256); const r = rng(9);
  c.fillStyle = 'rgba(255,255,255,.8)'; for (let k = 0; k < 3; k++) { const x = r() * 256, y = 30 + r() * 60; for (let b = 0; b < 4; b++) { c.beginPath(); c.arc(x + b * 16, y + (b % 2) * 5, 13, 0, 7); c.fill(); } }
  for (let x = 0; x < 256;) { const w = 22 + r() * 34, h = 50 + r() * 110; c.fillStyle = ['#8aa6c4', '#7c98b8', '#9bb3cc'][Math.floor(r() * 3)]; c.fillRect(x, 256 - h, w, h);
    c.fillStyle = 'rgba(255,248,220,.55)'; for (let wy = 256 - h + 8; wy < 250; wy += 12) for (let wx = x + 5; wx < x + w - 6; wx += 9) if (r() < .5) c.fillRect(wx, wy, 4, 5); x += w + 2; }
});

export const radial = (key, inner, outer = 'rgba(0,0,0,0)', stop = .0) => tex('rad' + key, 256, 256, (c) => {
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, inner); g.addColorStop(Math.max(stop, .001), inner); g.addColorStop(1, outer); c.fillStyle = g; c.fillRect(0, 0, 256, 256);
});
/** Light-shaft card: bright at the window end, fading along the beam and at both edges. */
export const shaft = () => tex('shaft', 128, 256, (c) => {
  const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,236,196,.95)'); g.addColorStop(.6, 'rgba(255,226,170,.35)'); g.addColorStop(1, 'rgba(255,220,160,0)'); c.fillStyle = g; c.fillRect(0, 0, 128, 256);
  c.globalCompositeOperation = 'destination-in'; const e = c.createLinearGradient(0, 0, 128, 0); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(.25, 'rgba(0,0,0,1)'); e.addColorStop(.75, 'rgba(0,0,0,1)'); e.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = e; c.fillRect(0, 0, 128, 256);
});
export const backdrop = (top = '#4b4169', mid = '#2c2b4a', bottom = '#191a2c', glowCol = 'rgba(255,190,140,.22)') => tex('bg' + top + mid + bottom, 1024, 640, (c) => {
  const g = c.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, top); g.addColorStop(.55, mid); g.addColorStop(1, bottom); c.fillStyle = g; c.fillRect(0, 0, 1024, 640);
  const r = c.createRadialGradient(512, 330, 0, 512, 330, 520); r.addColorStop(0, glowCol); r.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = r; c.fillRect(0, 0, 1024, 640);
  const rn = rng(21); c.fillStyle = 'rgba(255,255,255,.035)'; for (let k = 0; k < 60; k++) { c.beginPath(); c.arc(rn() * 1024, rn() * 640, 1 + rn() * 2.5, 0, 7); c.fill(); }
}, {aniso: 1});

// ---- wall art -------------------------------------------------------------------------------
export const poster = (kind) => tex('poster' + kind, 256, 340, (c) => {
  const P = {bolt: ['#ffc94d', '#e5484d'], mountain: ['#8fd3c8', '#3f7fd6'], graph: ['#fffaf0', '#3f7fd6'], cat: ['#f7b3c2', '#b392f0'], plant: ['#dff2d8', '#4caf50'], sun: ['#ffd9a0', '#f08a4b']}[kind] ?? ['#fffaf0', INK];
  c.fillStyle = '#fffaf0'; c.fillRect(0, 0, 256, 340); c.fillStyle = P[0]; c.fillRect(16, 16, 224, 250);
  c.fillStyle = P[1]; c.strokeStyle = INK; c.lineWidth = 8; c.lineJoin = c.lineCap = 'round';
  if (kind === 'bolt') { c.beginPath(); c.moveTo(150, 40); c.lineTo(80, 150); c.lineTo(128, 150); c.lineTo(104, 246); c.lineTo(184, 120); c.lineTo(136, 120); c.closePath(); c.fill(); c.stroke(); }
  if (kind === 'mountain') { c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(180, 80, 26, 0, 7); c.fill(); c.fillStyle = P[1]; c.beginPath(); c.moveTo(16, 266); c.lineTo(100, 120); c.lineTo(150, 190); c.lineTo(190, 140); c.lineTo(240, 266); c.fill(); c.fillStyle = '#fffaf0'; c.beginPath(); c.moveTo(100, 120); c.lineTo(80, 156); c.lineTo(120, 150); c.fill(); }
  if (kind === 'graph') { c.lineWidth = 12; c.strokeStyle = '#e5484d'; c.beginPath(); c.moveTo(40, 230); c.lineTo(90, 180); c.lineTo(130, 200); c.lineTo(210, 60); c.stroke(); c.fillStyle = '#3f7fd6'; for (let i = 0; i < 4; i++) c.fillRect(44 + i * 48, 240 - (i + 1) * 30, 30, (i + 1) * 30); }
  if (kind === 'cat') { c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(128, 160, 70, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(68, 130); c.lineTo(76, 70); c.lineTo(112, 96); c.closePath(); c.fill(); c.stroke(); c.beginPath(); c.moveTo(188, 130); c.lineTo(180, 70); c.lineTo(144, 96); c.closePath(); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(104, 156, 9, 0, 7); c.arc(152, 156, 9, 0, 7); c.fill(); c.beginPath(); c.arc(128, 182, 14, .2, Math.PI - .2); c.stroke(); }
  if (kind === 'plant') { c.fillStyle = '#e07a4f'; c.fillRect(96, 190, 64, 60); c.strokeRect(96, 190, 64, 60); c.fillStyle = P[1]; for (const [x, y, rr] of [[128, 120, 40], [92, 150, 30], [164, 150, 30], [128, 70, 26]]) { c.beginPath(); c.arc(x, y, rr, 0, 7); c.fill(); c.stroke(); } }
  if (kind === 'sun') { c.fillStyle = P[1]; c.beginPath(); c.arc(128, 150, 60, 0, 7); c.fill(); c.stroke(); for (let a = 0; a < 12; a++) { c.beginPath(); c.moveTo(128 + Math.cos(a * .52) * 78, 150 + Math.sin(a * .52) * 78); c.lineTo(128 + Math.cos(a * .52) * 100, 150 + Math.sin(a * .52) * 100); c.stroke(); } }
  c.fillStyle = INK; c.fillRect(40, 286, 176, 14); c.fillStyle = 'rgba(43,45,66,.4)'; c.fillRect(70, 310, 116, 8);
});
export const clockFace = () => tex('clock', 256, 256, (c) => {
  c.fillStyle = '#fffaf0'; c.beginPath(); c.arc(128, 128, 120, 0, 7); c.fill(); c.lineWidth = 16; c.strokeStyle = INK; c.stroke();
  c.fillStyle = INK; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.fillRect(128 + Math.cos(a) * 92 - 5, 128 + Math.sin(a) * 92 - 5, 10, 10); }
  c.lineCap = 'round'; c.lineWidth = 14; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + 50, 128 - 30); c.stroke(); c.lineWidth = 9; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 - 10, 128 - 85); c.stroke();
  c.strokeStyle = '#e5484d'; c.lineWidth = 4; c.beginPath(); c.moveTo(128, 128); c.lineTo(128 + 70, 128 + 40); c.stroke();
});
export const corkboard = () => tex('cork', 384, 256, (c) => {
  const r = rng(4); c.fillStyle = '#c9965e'; c.fillRect(0, 0, 384, 256); for (let k = 0; k < 900; k++) { c.fillStyle = r() < .5 ? 'rgba(90,50,20,.18)' : 'rgba(255,230,190,.15)'; c.fillRect(r() * 384, r() * 256, 3, 3); }
  const notes = ['#ffe36e', '#9fe0f0', '#f7a8c4', '#b8f0a0', '#fffaf0'];
  for (let k = 0; k < 9; k++) { const x = 20 + (k % 4) * 88 + r() * 16, y = 18 + Math.floor(k / 4) * 78 + r() * 12; c.save(); c.translate(x + 30, y + 30); c.rotate((r() - .5) * .3); c.fillStyle = notes[k % notes.length]; c.fillRect(-30, -30, 62, 62); c.fillStyle = 'rgba(43,45,66,.45)'; for (let l = 0; l < 3; l++) c.fillRect(-22, -16 + l * 13, 30 + r() * 14, 5); c.fillStyle = '#e5484d'; c.beginPath(); c.arc(0, -24, 6, 0, 7); c.fill(); c.restore(); }
  c.strokeStyle = '#8a5a2b'; c.lineWidth = 14; c.strokeRect(0, 0, 384, 256);
});

// ---- screens --------------------------------------------------------------------------------
export const screen = (kind) => tex('scr' + kind, 128, 96, (c) => {
  const r = rng(kind.length * 13 + kind.charCodeAt(0));
  const bg = {sheet: '#eaf4ff', code: '#1f2a44', chart: '#f3f7ff', chat: '#e9fff4', video: '#2c3d6e', mail: '#fff7e8', game: '#2b1d3f'}[kind] ?? '#dbe8ff';
  c.fillStyle = bg; c.fillRect(0, 0, 128, 96);
  if (kind === 'sheet') { c.fillStyle = '#3bb273'; c.fillRect(0, 0, 128, 12); c.strokeStyle = 'rgba(40,60,90,.25)'; for (let y = 16; y < 96; y += 8) { c.beginPath(); c.moveTo(0, y); c.lineTo(128, y); c.stroke(); } for (let x = 0; x < 128; x += 26) { c.beginPath(); c.moveTo(x, 12); c.lineTo(x, 96); c.stroke(); } c.fillStyle = 'rgba(40,60,90,.55)'; for (let k = 0; k < 30; k++) c.fillRect(Math.floor(r() * 5) * 26 + 3, 18 + Math.floor(r() * 9) * 8, 10 + r() * 10, 3); }
  if (kind === 'code') { const cols = ['#ffc94d', '#8fd3c8', '#f78fd0', '#9fb7ff', '#e9ecf5']; for (let y = 8; y < 92; y += 7) { let x = 6 + Math.floor(r() * 3) * 8; while (x < 110 && r() < .85) { const w = 6 + r() * 22; c.fillStyle = cols[Math.floor(r() * cols.length)]; c.fillRect(x, y, w, 3); x += w + 4; } } }
  if (kind === 'chart') { c.fillStyle = '#3f7fd6'; for (let i = 0; i < 6; i++) { const h = 15 + r() * 55; c.fillRect(10 + i * 19, 86 - h, 13, h); } c.strokeStyle = '#e5484d'; c.lineWidth = 3; c.beginPath(); c.moveTo(8, 70); for (let i = 1; i < 7; i++) c.lineTo(8 + i * 19, 70 - r() * 50); c.stroke(); }
  if (kind === 'chat') { for (let y = 8; y < 90; y += 18) { const left = r() < .5; c.fillStyle = left ? '#ffffff' : '#6cc58a'; const w = 40 + r() * 40; c.beginPath(); c.roundRect(left ? 8 : 120 - w, y, w, 13, 6); c.fill(); } }
  if (kind === 'video') { c.fillStyle = '#ffc94d'; c.beginPath(); c.arc(40, 40, 16, 0, 7); c.fill(); c.fillStyle = '#6cc58a'; c.fillRect(0, 60, 128, 36); c.fillStyle = '#fffaf0'; c.beginPath(); c.moveTo(58, 34); c.lineTo(78, 46); c.lineTo(58, 58); c.fill(); }
  if (kind === 'mail') { c.fillStyle = '#f08a4b'; c.fillRect(0, 0, 30, 96); for (let y = 6; y < 92; y += 14) { c.fillStyle = 'rgba(40,40,60,.55)'; c.fillRect(36, y, 50 + r() * 30, 3); c.fillStyle = 'rgba(40,40,60,.25)'; c.fillRect(36, y + 6, 70 + r() * 16, 2); } }
  if (kind === 'game') { for (let k = 0; k < 20; k++) { c.fillStyle = ['#f78fd0', '#ffc94d', '#8fd3c8'][k % 3]; c.fillRect(r() * 120, r() * 90, 6, 6); } }
  c.fillStyle = 'rgba(255,255,255,.14)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(60, 0); c.lineTo(20, 96); c.lineTo(0, 96); c.fill();
});
export const keyboardTex = () => tex('kb', 256, 96, (c) => {
  c.fillStyle = '#3a3d55'; c.fillRect(0, 0, 256, 96); c.fillStyle = '#e9e6dd';
  for (let row = 0; row < 4; row++) for (let k = 0; k < 13; k++) c.fillRect(8 + k * 18.6 + (row % 2) * 5, 8 + row * 21, 14, 16);
  c.fillRect(60, 8 + 4 * 21 - 2, 130, 10);
});
export const hazardStripe = () => tex('hazard', 128, 128, (c) => { c.fillStyle = '#ffc94d'; c.fillRect(0, 0, 128, 128); c.fillStyle = INK; for (let k = -128; k < 256; k += 40) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + 20, 0); c.lineTo(k - 108, 128); c.lineTo(k - 128, 128); c.fill(); } });
export const rugTex = (a = '#d98c5f', b = '#f2c98f') => tex('rug' + a, 256, 256, (c) => {
  c.fillStyle = a; c.fillRect(0, 0, 256, 256); c.strokeStyle = b; c.lineWidth = 10; c.strokeRect(14, 14, 228, 228); c.lineWidth = 4; c.strokeRect(30, 30, 196, 196);
  c.fillStyle = b; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if ((i + j) % 2 === 0) { c.save(); c.translate(56 + i * 36, 56 + j * 36); c.rotate(Math.PI / 4); c.fillRect(-7, -7, 14, 14); c.restore(); }
});

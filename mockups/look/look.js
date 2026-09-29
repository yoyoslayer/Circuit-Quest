// Entry: /mockups/look/look.html?shot=meeting-overview|meeting-closeup|lunch-overview[&post=0][&fps=1]
// Camera params use the game's own orbit model (yaw/pitch/zoom around a floor target) so they port 1:1.
import * as THREE from 'three';
import {createLookRenderer} from './post.js';
import {lightRig} from './room.js';
import {buildMeeting} from './meeting.js';
import {buildLunch} from './lunch.js';

const q = new URLSearchParams(location.search);
const shot = q.get('shot') ?? 'meeting-overview';
const num = (k, d) => q.has(k) ? parseFloat(q.get(k)) : d;
// Proposed default gameplay camera (overview) and the zoomed-in close-up.
const CAMS = {
  'meeting-overview': {yaw: .14, pitch: .68, zoom: 36.5, fov: 30, target: [.2, 0, 1.0]},
  'meeting-closeup': {yaw: .42, pitch: .44, zoom: 10, fov: 34, target: [5.6, .7, -3.0]},
  'lunch-overview': {yaw: .14, pitch: .68, zoom: 36.5, fov: 30, target: [-.9, 0, 1.0]},
};
const cam = {...CAMS[shot] ?? CAMS['meeting-overview']};
for (const k of ['yaw', 'pitch', 'zoom', 'fov']) cam[k] = num(k, cam[k]);
if (q.has('tx')) cam.target = [num('tx', 0), num('ty', 0), num('tz', 0)];

const canvas = document.createElement('canvas'); document.body.append(canvas); if (q.get('bg')) document.body.style.setProperty('--bg', q.get('bg'));
const view = createLookRenderer({canvas, width: innerWidth, height: innerHeight, pixelRatio: num('pr', 1), post: q.get('post') !== '0'});
const {scene, camera, passes, renderer} = view;
if (q.get('outline') === '0') view.effect.enabled = false;
if (q.get('flatbg')) scene.userData.flatbg = true;
if (q.get('ao') === '0') passes.ao.enabled = false;
if (q.get('bloom') === '0') passes.bloom.enabled = false;
if (q.get('grade') === '0') passes.grade.enabled = false;
if (q.get('ao') === 'only') passes.ao.output = 1; // debug: AO buffer

const rig = lightRig(scene, {W: 33, D: 20});
camera.fov = cam.fov; camera.updateProjectionMatrix();
const t = new THREE.Vector3(...cam.target);
camera.position.set(t.x + Math.sin(cam.yaw) * Math.cos(cam.pitch) * cam.zoom, t.y + Math.sin(cam.pitch) * cam.zoom, t.z + Math.cos(cam.yaw) * Math.cos(cam.pitch) * cam.zoom);
camera.lookAt(t);

const built = shot.startsWith('lunch') ? await buildLunch(scene, shot, rig) : await buildMeeting(scene, shot, rig);
if (shot === 'meeting-closeup') { rig.sun.shadow.camera.left = -9; rig.sun.shadow.camera.right = 9; rig.sun.shadow.camera.top = 9; rig.sun.shadow.camera.bottom = -9; rig.sun.target.position.set(5, 0, -3); rig.sun.position.set(5 - 11, 21, -3 + 13); scene.add(rig.sun.target); rig.sun.shadow.camera.updateProjectionMatrix(); }

if (scene.userData.flatbg) scene.background = new THREE.Color('#1d1f2b');
view.render(); renderer.info.autoReset = false; renderer.info.reset(); view.render(); renderer.info.autoReset = true;
const info = renderer.info.render;
window.__stats = {calls: info.calls, triangles: info.triangles, lights: 0};
scene.traverse(o => { if (o.isLight) window.__stats.lights++; });

// Measured frame time: N frames via requestAnimationFrame (vsync-capped at display rate).
if (q.get('fps') === '1') {
  const frames = [], N = 90; let last = performance.now(), gpuMs = [];
  await new Promise(res => { const tick = () => { const n = performance.now(); frames.push(n - last); last = n; const a = performance.now(); view.render(); renderer.getContext().finish(); gpuMs.push(performance.now() - a); if (frames.length < N) requestAnimationFrame(tick); else res(); }; requestAnimationFrame(tick); });
  frames.sort((a, b) => a - b); gpuMs.sort((a, b) => a - b);
  window.__fps = {fps: +(1000 / frames[Math.floor(N / 2)]).toFixed(1), frameMsMedian: +frames[Math.floor(N / 2)].toFixed(2), renderMsMedian: +gpuMs[Math.floor(N / 2)].toFixed(2), renderMsP90: +gpuMs[Math.floor(N * .9)].toFixed(2)};
}
window.__done = true;

// src/stations/spectrum/logic.ts
var C_LIGHT = 299792458;
var BANDS = {
  radio: { id: "radio", name: "Radio 100 MHz", short: "RADIO", lambda: C_LIGHT / 1e8, detector: "dipole", k: 36, n: 2, beam: false, color: "#e5484d", example: "FM radio", cycles: 1 },
  micro: { id: "micro", name: "Microwave 2.4 GHz", short: "MICROWAVE", lambda: C_LIGHT / 24e8, detector: "patch", k: 38, n: 2, beam: false, color: "#f08a4b", example: "Wi-Fi", cycles: 2 },
  thermal: { id: "thermal", name: "Thermal IR 10 \xB5m", short: "THERMAL IR", lambda: 1e-5, detector: "thermopile", k: 38, n: 2, beam: true, color: "#d9822b", example: "heat cameras", cycles: 4 },
  nir: { id: "nir", name: "Near IR 850 nm", short: "NEAR IR", lambda: 85e-8, detector: "nirdiode", k: 36, n: 2, beam: true, color: "#b0406a", example: "TV remote", cycles: 6.5 },
  vis: { id: "vis", name: "Visible 530 nm", short: "VISIBLE", lambda: 53e-8, detector: "visdiode", k: 35, n: 2, beam: true, color: "#3fae6a", example: "green light", cycles: 9 }
};
var BAND_IDS = Object.keys(BANDS);
var frequency = (b) => C_LIGHT / BANDS[b].lambda;
var DETECTORS = {
  dipole: { label: "Dipole antenna", band: "radio" },
  patch: { label: "Patch antenna", band: "micro" },
  thermopile: { label: "Thermopile", band: "thermal" },
  nirdiode: { label: "Near-IR photodiode", band: "nir" },
  visdiode: { label: "Green photodiode", band: "vis" }
};
var DETECTOR_IDS = Object.keys(DETECTORS);
var POWERS = [1, 10, 100];
var POWER_COST = { 1: 1, 10: 2, 100: 4 };
var dBm = (mw) => 10 * Math.log10(mw);
var SPEC = { works: 0, reliable: 10 };
var LOSS = {
  brick: { radio: 4, micro: 10, thermal: Infinity, nir: Infinity, vis: Infinity },
  wood: { radio: 2, micro: 5, thermal: Infinity, nir: Infinity, vis: Infinity },
  glass: { radio: 1, micro: 2, thermal: Infinity, nir: 1, vis: 1 },
  metal: { radio: Infinity, micro: Infinity, thermal: Infinity, nir: Infinity, vis: Infinity },
  // The open hatch: a 30 cm hole in the metal shutter. Far smaller than half of radio's 3 m wave.
  hatch: { radio: Infinity, micro: 8, thermal: 0, nir: 0, vis: 0 },
  mesh: { radio: Infinity, micro: Infinity, thermal: 3, nir: 3, vis: 3 },
  smoke: { radio: 0, micro: 0, thermal: 1, nir: 12, vis: 25 }
};
var MATERIAL_NAMES = { brick: "brick wall", wood: "wooden door", glass: "glass partition", metal: "metal shutter", hatch: "shutter hatch", mesh: "mesh cage", smoke: "toaster smoke" };
var TX = { x: -0.4, z: 2.3 };
var PADS = { store: { x: -8.2, z: -5.8 }, lab: { x: 7, z: -6 }, quiet: { x: 8.2, z: 4.8 } };
var PAD_NAMES = { store: "storeroom", lab: "glass lab", quiet: "quiet room" };
var POD_HOME = { x: -6.4, z: 5.2 };
var HATCH = { x0: 5.1, x1: 5.7, z: -3.2 };
var hatchMid = { x: (HATCH.x0 + HATCH.x1) / 2, z: HATCH.z };
var SPOTS = (() => {
  const d = { x: hatchMid.x - PADS.lab.x, z: hatchMid.z - PADS.lab.z }, l = Math.hypot(d.x, d.z);
  return { A: { x: +(hatchMid.x + d.x / l * 3.7).toFixed(3), z: +(hatchMid.z + d.z / l * 3.7).toFixed(3) }, B: { x: -2.6, z: -1.6 }, C: { x: 1, z: 5.8 } };
})();
var SPOT_IDS = Object.keys(SPOTS);
var MIRRORS = 2;
var SMOKE = { x: 2.4, z: 3.4, r: 1.3 };
var STORE = { x0: -11, x1: -4.6, z0: -8, z1: -3.2, door: [-11, -9.4], wood: [-6.4, -5] };
var LAB = { x0: 2, x1: 11, z0: -8, z1: -3.2, door: [9.4, 11] };
var QUIET = { x0: 5.5, x1: 11, z0: 1.5, z1: 8, door: [9.4, 11] };
function walls(hatchOpen) {
  const s = STORE, l = LAB, q = QUIET;
  return [
    { id: "store-front", a: { x: s.door[1], z: s.z1 }, b: { x: s.x1, z: s.z1 }, mat: ["brick"], thick: 0.3 },
    { id: "store-side-a", a: { x: s.x1, z: s.z0 }, b: { x: s.x1, z: s.wood[0] }, mat: ["brick"], thick: 0.3 },
    { id: "store-door", a: { x: s.x1, z: s.wood[0] }, b: { x: s.x1, z: s.wood[1] }, mat: ["wood"], thick: 0.12 },
    { id: "store-side-b", a: { x: s.x1, z: s.wood[1] }, b: { x: s.x1, z: s.z1 }, mat: ["brick"], thick: 0.3 },
    { id: "lab-side", a: { x: l.x0, z: l.z0 }, b: { x: l.x0, z: l.z1 }, mat: ["brick"], thick: 0.3 },
    // The shutter hangs on the hall side of the glass, so a beam meets the metal (or hatch) first.
    { id: "lab-front-a", a: { x: l.x0, z: l.z1 }, b: { x: HATCH.x0, z: l.z1 }, mat: ["metal", "glass"], thick: 0.16 },
    { id: "lab-hatch", a: { x: HATCH.x0, z: l.z1 }, b: { x: HATCH.x1, z: l.z1 }, mat: [hatchOpen ? "hatch" : "metal", "glass"], thick: 0.16 },
    { id: "lab-front-b", a: { x: HATCH.x1, z: l.z1 }, b: { x: l.door[0], z: l.z1 }, mat: ["metal", "glass"], thick: 0.16 },
    { id: "quiet-side", a: { x: q.x0, z: q.z0 }, b: { x: q.x0, z: q.z1 }, mat: ["mesh"], thick: 0.1 },
    { id: "quiet-front", a: { x: q.x0, z: q.z0 }, b: { x: q.door[0], z: q.z0 }, mat: ["mesh"], thick: 0.1 }
  ];
}
var cross = (a, b) => a.x * b.z - a.z * b.x;
var sub = (a, b) => ({ x: a.x - b.x, z: a.z - b.z });
var dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
function crossing(p, q, a, b) {
  const r = sub(q, p), s = sub(b, a), d = cross(r, s);
  if (Math.abs(d) < 1e-12) return void 0;
  const t = cross(sub(a, p), s) / d, u = cross(sub(a, p), r) / d;
  return t > 1e-6 && t < 1 - 1e-6 && u >= 0 && u <= 1 ? t : void 0;
}
function throughCloud(p, q, c) {
  const d = sub(q, p), l2 = d.x * d.x + d.z * d.z, t = Math.max(0, Math.min(1, ((c.x - p.x) * d.x + (c.z - p.z) * d.z) / l2)), x = p.x + d.x * t, z = p.z + d.z * t;
  return Math.hypot(x - c.x, z - c.z) < c.r ? t : void 0;
}
function legHits(p, q, band, hatchOpen) {
  const hits = [];
  for (const w of walls(hatchOpen)) {
    const t = crossing(p, q, w.a, w.b);
    if (t === void 0) continue;
    const at = { x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t };
    for (const m of w.mat) hits.push({ mat: m, at, loss: LOSS[m][band], wall: w.id, t });
  }
  const ts = throughCloud(p, q, SMOKE);
  if (ts !== void 0) hits.push({ mat: "smoke", at: { x: p.x + (q.x - p.x) * ts, z: p.z + (q.z - p.z) * ts }, loss: LOSS.smoke[band], t: ts });
  return hits.sort((a, b) => a.t - b.t).map(({ t: _t, ...h }) => h);
}
var JOBS = [
  {
    id: "store",
    pad: "store",
    title: "Through the brick wall",
    message: "STOCK CHECK AT 4",
    ask: "The storeroom keeper needs a message. The pod sits behind a solid brick wall."
  },
  {
    id: "lab",
    pad: "lab",
    title: "Into the shuttered lab",
    message: "LAB TEA IS READY",
    ambient: 6,
    hatch: true,
    ask: "The glass lab has its metal shutter down. Only a small hatch opens. The lab is sunny."
  },
  {
    id: "quiet",
    pad: "quiet",
    title: "Past the smoke, into the quiet room",
    message: "ALL CLEAR, PIP",
    ask: "Burnt toast fills the tea corner with smoke, and the quiet room is a copper-mesh cage. Find a band that gets through both."
  }
];
function along(band, power, path, spots, hatchOpen) {
  const b = BANDS[band], legs = [];
  let length = 0, loss = 0, capped = 0, blocked;
  for (let i = 1; i < path.length; i++) {
    const hits = legHits(path[i - 1], path[i], band, hatchOpen);
    legs.push({ a: path[i - 1], b: path[i], hits });
    length += dist(path[i - 1], path[i]);
    for (const h of hits) {
      loss += h.loss;
      capped += Math.min(1e3, h.loss);
      if (!blocked && !Number.isFinite(h.loss)) blocked = h;
    }
  }
  loss += spots.length;
  capped += spots.length;
  const spread = b.n * 10 * Math.log10(Math.max(1, length)), base = dBm(power) + b.k - spread;
  return { path, spots, legs, length, spread, loss, margin: base - loss, score: base - capped, blocked };
}
function orders(spots) {
  const out = [[]];
  for (const a of spots) {
    out.push([a]);
    for (const b of spots) if (b !== a) out.push([a, b]);
  }
  return out;
}
function bestRoute(job, s, to = PADS[job.pad]) {
  const tries = BANDS[s.band].beam ? orders(s.mirrors) : [[]];
  let best;
  for (const o of tries) {
    const r = along(s.band, s.power, [TX, ...o.map((k) => SPOTS[k]), to], o, s.hatchOpen);
    if (!best || r.score > best.score + 1e-9 || Math.abs(r.score - best.score) < 1e-9 && r.spots.length < best.spots.length) best = r;
  }
  return best;
}
var HALL = { x: 11, z: 8 };
var MIRROR_HALF = 0.78;
var POD_R = 0.75;
var heading = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
var unit = (v) => {
  const l = Math.hypot(v.x, v.z) || 1;
  return { x: v.x / l, z: v.z / l };
};
function mirrorYaw(at, from, to) {
  const a = unit(sub(from, at)), b = unit(sub(to, at));
  return Math.atan2(a.x + b.x, a.z + b.z);
}
var idleYaw = (s) => heading(SPOTS[s], TX);
function traceBeam(band, hatchOpen, aim, spots, target) {
  const R = 60, stops = walls(hatchOpen).filter((w) => w.mat.some((m) => !Number.isFinite(LOSS[m][band])));
  let p = TX, d = { x: Math.sin(aim.tx), z: Math.cos(aim.tx) }, last;
  const path = [TX], used = [];
  for (let bounce = 0; bounce < 6; bounce++) {
    const far = { x: p.x + d.x * R, z: p.z + d.z * R };
    const tx = d.x > 1e-9 ? (HALL.x - p.x) / (d.x * R) : d.x < -1e-9 ? (-HALL.x - p.x) / (d.x * R) : Infinity, tz = d.z > 1e-9 ? (HALL.z - p.z) / (d.z * R) : d.z < -1e-9 ? (-HALL.z - p.z) / (d.z * R) : Infinity;
    let t = Math.min(1, tx, tz), kind = "edge", hitSpot;
    for (const w of stops) {
      const c = crossing(p, far, w.a, w.b);
      if (c !== void 0 && c < t) {
        t = c;
        kind = "wall";
      }
    }
    for (const s of spots) {
      if (s === last) continue;
      const y = aim.mirrors[s] ?? idleYaw(s), u = { x: Math.cos(y), z: -Math.sin(y) }, at = SPOTS[s];
      const c = crossing(p, far, { x: at.x - u.x * MIRROR_HALF, z: at.z - u.z * MIRROR_HALF }, { x: at.x + u.x * MIRROR_HALF, z: at.z + u.z * MIRROR_HALF });
      if (c !== void 0 && c < t) {
        t = c;
        kind = "mirror";
        hitSpot = s;
      }
    }
    const tp = ((target.x - p.x) * d.x + (target.z - p.z) * d.z) / R, cx = p.x + d.x * R * tp, cz = p.z + d.z * R * tp;
    if (tp > 0 && tp < t && Math.hypot(cx - target.x, cz - target.z) < POD_R) {
      t = tp;
      kind = "pod";
    }
    const hit = { x: p.x + d.x * R * t, z: p.z + d.z * R * t };
    if (kind === "mirror") {
      const y = aim.mirrors[hitSpot] ?? idleYaw(hitSpot), n = { x: Math.sin(y), z: Math.cos(y) }, k = 2 * (d.x * n.x + d.z * n.z);
      d = unit({ x: d.x - k * n.x, z: d.z - k * n.z });
      path.push(hit);
      used.push(hitSpot);
      p = hit;
      last = hitSpot;
      continue;
    }
    if (kind === "wall") {
      path.push({ x: hit.x + d.x * 0.02, z: hit.z + d.z * 0.02 });
      return { path, spots: used, missed: false };
    }
    path.push(hit);
    return { path, spots: used, missed: kind === "edge" };
  }
  return { path, spots: used, missed: true };
}
function aimedRoute(job, s) {
  const tr = traceBeam(s.band, s.hatchOpen, s.aim, s.mirrors, PADS[job.pad]), r = along(s.band, s.power, tr.path, tr.spots, s.hatchOpen);
  return { ...r, missed: tr.missed && !r.blocked };
}
function read(job, s) {
  const route = BANDS[s.band].beam && s.aim ? aimedRoute(job, { ...s, aim: s.aim }) : bestRoute(job, s), detectorOk = DETECTORS[s.detector].band === s.band, ambient = s.band === "vis" ? job.ambient ?? 0 : s.band === "nir" ? (job.ambient ?? 0) / 3 : 0;
  return { route, margin: detectorOk && !route.missed ? route.margin - ambient : -Infinity, detectorOk, ambient, podOk: s.pod === job.pad };
}
var tierOf = (margin) => margin >= SPEC.reliable ? 2 : margin >= SPEC.works ? 1 : 0;
var cost = (s, r) => POWER_COST[s.power] + r.spots.length;
function whyBlocked(m, band) {
  const n = BANDS[band].short.toLowerCase();
  switch (m) {
    case "brick":
      return `Brick is opaque to ${n}: the beam stops at the wall.`;
    case "wood":
      return `Wood is opaque to ${n}.`;
    case "glass":
      return "Window glass lets visible and near-IR light through, but it absorbs 10 \xB5m thermal infrared.";
    case "metal":
      return `Metal reflects ${n}: the shutter stops it.`;
    case "hatch":
      return "The hatch is 30 cm across. Radio's 3 m wave can't pass a hole much smaller than half a wavelength.";
    case "mesh":
      return `The quiet room is a mesh cage: its holes are far smaller than the ${n} wavelength, so the mesh reflects it. Light passes between the wires.`;
    case "smoke":
      return "Smoke scatters it away.";
  }
}
function judge(job, s) {
  const r = read(job, s), c = cost(s, r.route), problems = [], notes = [], margin = +r.margin.toFixed(1);
  if (!r.podOk) problems.push(`The receiver pod isn't on the ${PAD_NAMES[job.pad]} pad.`);
  else if (!r.detectorOk) {
    const d = DETECTORS[s.detector];
    problems.push(`A ${d.label.toLowerCase()} only responds to ${BANDS[d.band].name.toLowerCase()}; it can't hear ${BANDS[s.band].name.toLowerCase()}.`);
  } else if (r.route.blocked) problems.push(`${MATERIAL_NAMES[r.route.blocked.mat][0].toUpperCase() + MATERIAL_NAMES[r.route.blocked.mat].slice(1)}: ${whyBlocked(r.route.blocked.mat, s.band)}`);
  else if (r.route.missed) problems.push("The beam misses the pod.");
  else if (r.margin < SPEC.works) {
    const smoke = r.route.legs.some((l) => l.hits.some((h) => h.mat === "smoke"));
    problems.push(`Too weak: ${margin} dB. ${smoke && (s.band === "vis" || s.band === "nir") ? "Smoke scatters short wavelengths hardest; long-wave thermal IR slips through. " : ""}${r.ambient ? s.band === "vis" ? "Sunlight swamps the green photodiode here. " : "Sunlight carries near IR too; the daylight filter only blunts it. " : ""}`.trim());
  }
  if (problems.length) return { tier: 0, problems, notes, margin, cost: c };
  if (r.margin < SPEC.reliable) {
    notes.push(`Received, but only ${margin} dB of margin (reliable needs ${SPEC.reliable} dB).`);
    return { tier: 1, problems, notes, margin, cost: c };
  }
  const best = leanest(job, s);
  if (best && (best.power < s.power || best.power === s.power && best.mirrors < r.route.spots.length)) {
    notes.push(best.power < s.power ? "Reliable, but it uses more power than this delivery needs." : "Reliable, but the beam bounces off more mirrors than it needs.");
    return { tier: 2, problems, notes, margin, cost: c };
  }
  return { tier: 3, problems, notes, margin, cost: c };
}
function solutions(job) {
  const out = [];
  const subsets = [[]];
  for (const a of SPOT_IDS) {
    subsets.push([a]);
    for (const b of SPOT_IDS) if (a < b) subsets.push([a, b]);
  }
  for (const band of BAND_IDS) for (const power of POWERS) for (const hatchOpen of [false, true]) for (const mirrors of subsets) {
    const setup = { band, detector: BANDS[band].detector, power, hatchOpen, mirrors, pod: job.pad }, r = read(job, setup);
    if (r.margin >= SPEC.reliable) out.push({ setup, margin: r.margin, power, mirrors: r.route.spots.length, cost: cost(setup, r.route) });
  }
  return out.sort((a, b) => a.power - b.power || a.mirrors - b.mirrors || b.margin - a.margin);
}
function leanest(job, _s) {
  const best = solutions(job)[0];
  if (!best) return void 0;
  const s = best.setup;
  return { ...best, hint: `${BANDS[s.band].name} at ${s.power} mW${best.mirrors ? ` with ${best.mirrors} mirror${best.mirrors > 1 ? "s" : ""}` : ""}` };
}
var SI = [[1e12, "T"], [1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "\xB5"], [1e-9, "n"]];
function si(v, unit2) {
  for (const [k, s] of SI) if (v >= k * 0.9995) return `${+(v / k).toPrecision(3)} ${s}${unit2}`;
  return `${v.toExponential(1)} ${unit2}`;
}
var lambdaText = (b) => si(BANDS[b].lambda, "m");
var freqText = (b) => si(frequency(b), "Hz");
export {
  BANDS,
  BAND_IDS,
  C_LIGHT,
  DETECTORS,
  DETECTOR_IDS,
  HALL,
  HATCH,
  JOBS,
  LAB,
  LOSS,
  MATERIAL_NAMES,
  MIRRORS,
  MIRROR_HALF,
  PADS,
  PAD_NAMES,
  POD_HOME,
  POD_R,
  POWERS,
  POWER_COST,
  QUIET,
  SMOKE,
  SPEC,
  SPOTS,
  SPOT_IDS,
  STORE,
  TX,
  aimedRoute,
  bestRoute,
  cost,
  crossing,
  dBm,
  dist,
  freqText,
  frequency,
  heading,
  idleYaw,
  judge,
  lambdaText,
  leanest,
  legHits,
  mirrorYaw,
  read,
  si,
  solutions,
  throughCloud,
  tierOf,
  traceBeam,
  walls,
  whyBlocked
};

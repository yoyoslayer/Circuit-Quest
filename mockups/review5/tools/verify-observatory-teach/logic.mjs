// src/stations/observatory/logic.ts
var part = (kind, value) => ({ kind, value });
var KINDS = ["R", "L", "C"];
var E6 = [1, 1.5, 2.2, 3.3, 4.7, 6.8];
var decades = (from, to) => {
  const out = [];
  for (let e = from; e <= to; e++) for (const m of E6) out.push(+(m * 10 ** e).toPrecision(2));
  return out;
};
var VALUES = { R: decades(1, 3), L: decades(-4, -2), C: decades(-8, -5) };
var DEFAULT = { R: 470, L: 1e-3, C: 1e-7 };
var dcr = (henries) => +(1 + 1100 * henries).toFixed(2);
function partCost(p) {
  return p.kind === "R" ? 1 : p.kind === "C" ? p.value > 2e-6 ? 2 : 1 : p.value >= 5e-3 ? 3 : 2;
}
var snap = (k, v) => VALUES[k].reduce((a, b) => Math.abs(Math.log(b / v)) < Math.abs(Math.log(a / v)) ? b : a);
var SI = [[1, ""], [1e-3, "m"], [1e-6, "\xB5"], [1e-9, "n"]];
function valueText(p) {
  if (p.kind === "R") return p.value >= 1e3 ? `${+(p.value / 1e3).toPrecision(2)} k\u03A9` : `${p.value} \u03A9`;
  const unit = p.kind === "L" ? "H" : "F";
  for (const [k, s] of SI) if (p.value >= k * 0.999) return `${+(p.value / k).toPrecision(2)} ${s}${unit}`;
  return `${p.value} ${unit}`;
}
var hz = (f) => f >= 1e3 ? `${+(f / 1e3).toPrecision(2)} kHz` : `${Math.round(f)} Hz`;
var CIRCUIT = { rs: 50, rl: 600, bias: 12, latchMin: 9 };
var C_LIGHT = 299792458;
var cx = (re, im = 0) => ({ re, im });
var add = (a, b) => cx(a.re + b.re, a.im + b.im);
var mul = (a, b) => cx(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
var div = (a, b) => {
  const d = b.re * b.re + b.im * b.im;
  return cx((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
};
var abs = (a) => Math.hypot(a.re, a.im);
var par = (a, b) => div(mul(a, b), add(a, b));
function impedance(m, f) {
  const w = 2 * Math.PI * f;
  if (m.kind === "R") return cx(m.value);
  if (m.kind === "L") return cx(dcr(m.value), w * m.value);
  return f === 0 ? cx(Infinity) : cx(0, -1 / (w * m.value));
}
function corner(slot, p) {
  const { rs, rl } = CIRCUIT, r = slot === "series" ? rs + rl : rs * rl / (rs + rl);
  if (p.kind === "C") return 1 / (2 * Math.PI * r * p.value);
  if (p.kind === "L") return (r + dcr(p.value)) / (2 * Math.PI * p.value);
  return void 0;
}
var passes = (slot, p) => p.kind === "R" ? void 0 : slot === "series" === (p.kind === "L") ? "low" : "high";
function transfer(filter, f) {
  const { rs, rl } = CIRCUIT, s = filter.series, p = filter.shunt;
  const zs = s ? impedance(s, f) : cx(0), zl = cx(rl);
  let zp = zl;
  if (p) {
    const z = impedance(p, f);
    if (Number.isFinite(z.re)) zp = par(z, zl);
  }
  if (!Number.isFinite(zs.re)) return cx(0);
  return div(zp, add(cx(rs), add(zs, zp)));
}
function gain(filter, f) {
  return abs(transfer(filter, f)) / abs(transfer({}, f));
}
var dB = (x) => 20 * Math.log10(Math.max(1e-9, x));
var latchVolts = (filter) => +(CIRCUIT.bias * abs(transfer(filter, 0))).toFixed(2);
var RODS = {
  r3: { length: 0.031, label: "3.1 cm", band: "2.4 GHz" },
  r17: { length: 0.173, label: "17 cm", band: "433 MHz" },
  r75: { length: 0.75, label: "75 cm", band: "100 MHz" },
  r150: { length: 1.5, label: "1.5 m", band: "50 MHz" }
};
var ROD_IDS = Object.keys(RODS);
var wavelength = (hz2) => C_LIGHT / hz2;
var quarterWave = (hz2) => wavelength(hz2) / 4;
function antennaFactor(rod, vertical, hz2) {
  const r = Math.log(RODS[rod].length / quarterWave(hz2)) / 0.35;
  return Math.exp(-r * r) * (vertical ? 1 : 0.1);
}
var brush = (f, a, n = 5) => Array.from({ length: n }, (_, k) => ({ f: f * (k + 1), a: a / (k + 1) }));
var JOBS = [
  {
    id: "garble",
    title: "Clean up the garbled message",
    ask: "Motor noise buries the Morse. Move the cart, reroute the cable, filter the line.",
    message: "CQ CQ DE PIP",
    fs: 700,
    noise: brush(9e3, 3.2),
    cart: true
  },
  {
    id: "latch",
    title: "Keep the shutter latch powered",
    ask: "The dome motor whines at 4 kHz. Filter it out, but the 12 V latch on the same line must still hold.",
    message: "DOME OPEN",
    fs: 700,
    noise: brush(4e3, 1.4, 4),
    latch: true
  },
  {
    id: "beacon",
    title: "Tune the antenna to the 100 MHz beacon",
    ask: "A new beacon transmits at 100 MHz, vertically polarised. Fit and orient the right whip.",
    message: "STARS CLEAR",
    fs: 700,
    noise: brush(4e3, 1.4, 4),
    latch: true,
    beacon: 1e8
  }
];
var SPEC = { decodeSnr: 6, reliableSnr: 12, minLevel: 0.5 };
function cartCoupling(distance, rerouted) {
  return Math.min(1, 1.2 / Math.max(0.3, distance)) * (rerouted ? 0.5 : 1);
}
var CART_SAFE = 4;
function read(job, s) {
  const ant = job.beacon ? antennaFactor(s.rod, s.vertical, job.beacon) : 1, scale = job.cart ? cartCoupling(s.cartDistance, s.rerouted) : 1;
  const tones = [{ f: job.fs, before: ant, after: ant * gain(s, job.fs), signal: true }, ...job.noise.map((t) => ({ f: t.f, before: t.a * scale, after: t.a * scale * gain(s, t.f), signal: false }))];
  const level = tones[0].after, noise = Math.hypot(...tones.slice(1).map((t) => t.after)), snr = +dB(level / Math.max(1e-6, noise)).toFixed(1);
  const latch = latchVolts(s);
  return { level, noise, snr, latch, latchOk: latch >= CIRCUIT.latchMin, antenna: ant, tones };
}
var cost = (f) => (f.series ? partCost(f.series) : 0) + (f.shunt ? partCost(f.shunt) : 0);
function describe(f) {
  const s = f.series, p = f.shunt;
  if (s?.kind === "L" && p?.kind === "C") return "LC low-pass";
  if (s?.kind === "R" && p?.kind === "C") return "RC low-pass";
  if (!s && p?.kind === "C") return "shunt-C low-pass";
  if (s?.kind === "C") return "high-pass (series C)";
  if (p?.kind === "L") return "high-pass (shunt L)";
  if (!s && !p) return "none (wire link)";
  return "filter";
}
var filterName = describe;
function judge(job, s) {
  const r = read(job, s), problems = [], notes = [], c = cost(s);
  const sm = s.series, pm = s.shunt;
  if (job.beacon && r.antenna < 0.3) problems.push(s.vertical || RODS[s.rod].length / quarterWave(job.beacon) < 0.7 || RODS[s.rod].length / quarterWave(job.beacon) > 1.4 ? `A ${RODS[s.rod].label} whip is far from a quarter wave at ${job.beacon / 1e6} MHz (\u03BB = c/f = ${wavelength(job.beacon).toFixed(1)} m, so \u03BB/4 \u2248 ${quarterWave(job.beacon).toFixed(2)} m). Most of the signal reflects.` : "The beacon is vertically polarised; a horizontal whip catches only a sliver of it.");
  if (job.latch && !r.latchOk) problems.push(sm?.kind === "C" ? `The latch dropped out: a series capacitor passes changes but no steady DC, so only ${r.latch} V reaches it (needs ${CIRCUIT.latchMin} V).` : sm?.kind === "R" ? `The latch dropped out: the ${valueText(sm)} resistor and the 600 \u03A9 load split the 12 V, leaving ${r.latch} V (needs ${CIRCUIT.latchMin} V).` : pm?.kind === "L" ? `The latch dropped out: a shunt inductor carries steady DC straight to ground, leaving ${r.latch} V.` : `Only ${r.latch} V reaches the latch; it needs ${CIRCUIT.latchMin} V.`);
  if (r.level < SPEC.minLevel && !problems.length) problems.push(`The tone itself is down to ${Math.round(r.level * 100)}% at ${job.fs} Hz: this filter cuts the message too.`);
  if (r.snr < SPEC.decodeSnr && !problems.length) problems.push(sm?.kind === "C" || pm?.kind === "L" ? `Signal/noise is ${r.snr} dB. A high-pass lets the motor noise straight through: it sits above the ${job.fs} Hz tone.` : `Signal/noise is ${r.snr} dB; the decoder needs ${SPEC.decodeSnr} dB. The motor noise sits at ${hz(job.noise[0].f)} and up, above the ${job.fs} Hz tone.`);
  if (problems.length) return { tier: 0, problems, notes, snr: r.snr, cost: c };
  if (r.snr < SPEC.reliableSnr) {
    notes.push(`It decodes, but ${r.snr} dB leaves little margin (reliable is ${SPEC.reliableSnr} dB).`);
    return { tier: 1, problems, notes, snr: r.snr, cost: c };
  }
  const best = cheapest(job, { cartDistance: Math.max(s.cartDistance, CART_SAFE) });
  if (best && c > best.cost) {
    notes.push(`Reliable. Cheaper parts can do it too (cost ${best.cost} vs ${c}).`);
    return { tier: 2, problems, notes, snr: r.snr, cost: c };
  }
  return { tier: 3, problems, notes, snr: r.snr, cost: c };
}
var ALL_PARTS = KINDS.flatMap((k) => VALUES[k].map((v) => part(k, v)));
var solved = /* @__PURE__ */ new Map();
function solutions(job, s) {
  const key = `${job.id}|${s.cartDistance}`;
  let out = solved.get(key);
  if (out) return out;
  out = [];
  const opts = [void 0, ...ALL_PARTS], rod = job.beacon ? ROD_IDS.reduce((a, b) => antennaFactor(b, true, job.beacon) > antennaFactor(a, true, job.beacon) ? b : a) : "r75";
  for (const series of opts) for (const shunt of opts) for (const rerouted of job.cart ? [false, true] : [false]) {
    const setup = { series, shunt, rerouted, rod, vertical: true, cartDistance: s.cartDistance }, r = read(job, setup);
    if (r.level >= SPEC.minLevel && r.snr >= SPEC.reliableSnr && (!job.latch || r.latchOk) && (!job.beacon || r.antenna >= 0.3)) out.push({ setup, cost: cost(setup), snr: r.snr });
  }
  out.sort((a, b) => a.cost - b.cost || b.snr - a.snr);
  solved.set(key, out);
  return out;
}
function cheapest(job, s) {
  const best = solutions(job, s)[0];
  if (!best) return void 0;
  const f = best.setup, parts = [f.series && `${valueText(f.series)} ${f.series.kind} in series`, f.shunt && `${valueText(f.shunt)} ${f.shunt.kind} in shunt`].filter(Boolean).join(" + ") || "no cans";
  return { ...best, hint: `${parts}${f.rerouted && job.cart ? ", cable rerouted" : ""}` };
}
function stepResponse(f, span = stepSpan(f), n = 240) {
  const { rs, rl, bias } = CIRCUIT, s = f.series, p = f.shunt;
  const rload = p?.kind === "R" ? 1 / (1 / rl + 1 / p.value) : rl, ra = rs + (s?.kind === "R" ? s.value : 0) + (s?.kind === "L" ? dcr(s.value) : 0);
  let iL = 0, vCs = 0, vCp = 0, iLp = 0;
  const node = () => {
    const vin = bias - (s?.kind === "C" ? vCs : 0);
    if (p?.kind === "C") return { v: vCp, i: s?.kind === "L" ? iL : (vin - vCp) / ra };
    if (s?.kind === "L") return { v: (iL - iLp) * rload, i: iL };
    const v = (vin / ra - iLp) / (1 / ra + 1 / rload);
    return { v, i: (vin - v) / ra };
  };
  const out = [{ t: 0, ...node() }], sub = 400, dt = span / (n * sub);
  for (let k = 1; k <= n; k++) {
    for (let j = 0; j < sub; j++) {
      const { v, i } = node();
      if (s?.kind === "L") iL += dt * (bias - ra * iL - v) / s.value;
      if (s?.kind === "C") vCs += dt * i / s.value;
      if (p?.kind === "C") vCp += dt * (i - v / rload) / p.value;
      if (p?.kind === "L") iLp += dt * (v - dcr(p.value) * iLp) / p.value;
    }
    out.push({ t: k * span / n, ...node() });
  }
  return out;
}
function stepSpan(f) {
  const { rs, rl } = CIRCUIT, taus = [2e-4];
  for (const [m, slot] of [[f.series, "series"], [f.shunt, "shunt"]]) {
    if (!m) continue;
    if (m.kind === "L") taus.push(m.value / (slot === "series" ? rs + rl + dcr(m.value) : rs * rl / (rs + rl) + dcr(m.value)));
    if (m.kind === "C") taus.push(m.value * (slot === "series" ? rs + rl : rs * rl / (rs + rl)));
  }
  if (f.series?.kind === "L" && f.shunt?.kind === "C") taus.push(Math.PI * Math.sqrt(f.series.value * f.shunt.value));
  return Math.min(0.04, Math.max(1e-3, 5 * Math.max(...taus)));
}
var MORSE = { A: ".-", B: "-...", C: "-.-.", D: "-..", E: ".", F: "..-.", G: "--.", H: "....", I: "..", J: ".---", K: "-.-", L: ".-..", M: "--", N: "-.", O: "---", P: ".--.", Q: "--.-", R: ".-.", S: "...", T: "-", U: "..-", V: "...-", W: ".--", X: "-..-", Y: "-.--", Z: "--.." };
function morse(text) {
  const marks = [];
  let t = 0;
  for (const ch of text) {
    if (ch === " ") {
      t += 4;
      continue;
    }
    const code = MORSE[ch];
    if (!code) continue;
    for (const s of code) {
      const len = s === "." ? 1 : 3;
      marks.push([t, len]);
      t += len + 1;
    }
    t += 2;
  }
  return { marks, length: t + 6 };
}
function decoded(text, snr, epoch) {
  const bad = Math.min(1, Math.max(0, (SPEC.reliableSnr - snr) / (SPEC.reliableSnr - SPEC.decodeSnr + 6)));
  const junk = "#?%*~";
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === " ") {
      out += " ";
      continue;
    }
    const h = Math.sin((i + 1) * 12.9898 + epoch * 78.233) * 43758.5453, r = h - Math.floor(h);
    out += r < bad ? junk[Math.floor(r * 997) % junk.length] : ch;
  }
  return out;
}
export {
  CART_SAFE,
  CIRCUIT,
  C_LIGHT,
  DEFAULT,
  JOBS,
  KINDS,
  RODS,
  ROD_IDS,
  SPEC,
  VALUES,
  antennaFactor,
  cartCoupling,
  cheapest,
  corner,
  cost,
  dB,
  dcr,
  decoded,
  filterName,
  gain,
  hz,
  impedance,
  judge,
  latchVolts,
  morse,
  part,
  partCost,
  passes,
  quarterWave,
  read,
  snap,
  solutions,
  stepResponse,
  stepSpan,
  transfer,
  valueText,
  wavelength
};

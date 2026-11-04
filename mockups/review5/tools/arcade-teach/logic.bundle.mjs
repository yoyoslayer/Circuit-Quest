// src/stations/arcade/logic.ts
var BLOCKS = [47, 100, 220, 470];
var BLOCK_RATING = 0.25;
var BLOCK_COST = 1;
var POSITIONS = 3;
var PER_POSITION = 2;
var HOUSE = {
  /** Wiring and supply resistance (Ω): tiny, but it is all that limits a short. */
  wire: 1,
  /** The channel's PTC fuse trips above this current (A) and conducts again after it cools (s). */
  fuseTrip: 0.1,
  fuseCool: 2.5,
  /** Below this LED current (A) the LED is too dim to count as lit. */
  lit: 2e-3,
  /** House rule: a resistor should run at no more than 60 % of its power rating. */
  margin: 0.6,
  ambient: 25,
  /** Temperature rise of a resistor at its full rated power (°C). */
  ratedRise: 125,
  /** LED thermal resistance, junction to air (°C/W): a small 5 mm LED. */
  ledTheta: 500,
  /** Thermal time constant of the parts on the bench (s). */
  tau: 2,
  /** An LED driven past this multiple of its rated current fails outright (it pops). */
  ledPop: 2.5,
  /** A kid plays the cabinet this long (s) with everything in spec before it can be signed off. */
  soak: 3,
  /** A 9 V alkaline battery, roughly (mAh). */
  battery: 500
};
var LED_VF = { red: 2, green: 2.1, blue: 3, white: 3 };
var led = (color) => ({ kind: "led", color, vf: LED_VF[color], imax: 0.02 });
var empty = () => [[], [], []];
var JOBS = [
  {
    id: "bumper",
    title: "Pinball bumper",
    cabinet: "PINBALL",
    supply: 5,
    load: led("red"),
    band: [0.012, 0.02],
    start: { chain: empty(), across: 100, reversed: false },
    story: "The last tech clipped a block across the LED. The fuse keeps clicking.",
    ask: "Red LED on 5 V: 12\u201320 mA"
  },
  {
    id: "rhythm",
    title: "Rhythm pad",
    cabinet: "RHYTHM",
    supply: 3.3,
    load: led("blue"),
    band: [0.01, 0.02],
    start: { chain: [[47], [], []], reversed: true },
    story: "This pad stays dark. Only 0.3 V is left over for the resistor on 3.3 V.",
    ask: "Blue LED on 3.3 V: 10\u201320 mA"
  },
  {
    id: "claw",
    title: "Claw machine",
    cabinet: "CLAW",
    supply: 12,
    load: led("green"),
    band: [0.01, 0.02],
    start: { chain: [[220], [], []], reversed: false },
    story: "The claw light glows white-hot and its block smells warm.",
    ask: "Green LED on 12 V: 10\u201320 mA"
  },
  {
    id: "handheld",
    title: "Handheld",
    cabinet: "HANDHELD",
    supply: 9,
    battery: true,
    load: led("red"),
    band: [5e-3, 0.015],
    start: { chain: [[220], [], []], reversed: false },
    story: "A 9 V battery handheld. Its power light is blinding, and the battery is flat by lunch.",
    ask: "Red LED on a 9 V battery: 5\u201315 mA, long battery life"
  },
  {
    id: "hopper",
    title: "Coin hopper",
    cabinet: "PRIZES",
    supply: 5,
    load: { kind: "base", vf: 0.7, imax: 0.02, imin: 2e-3, beta: 100, motor: 0.2 },
    band: [4e-3, 0.01],
    start: { chain: empty(), reversed: false },
    story: "A 5 V logic pin (rated 20 mA) switches the hopper motor through a transistor. The motor needs 2 mA of base current.",
    ask: "Transistor base on a 5 V pin: 4\u201310 mA"
  }
];
var positionR = (p) => p.length === 0 ? 0 : p.length === 1 ? p[0] : p[0] * p[1] / (p[0] + p[1]);
var chainR = (c) => c.reduce((n, p) => n + positionR(p), 0);
var blockCount = (c) => c.reduce((n, p) => n + p.length, 0);
function blockHeat(c, i) {
  const out = [];
  c.forEach((p, pos) => {
    if (p.length === 1) {
      const pw = i * i * p[0];
      out.push({ pos, slot: 0, r: p[0], p: pw, heat: pw / BLOCK_RATING });
    } else if (p.length === 2) {
      const [a, b] = p, ia = i * b / (a + b), ib = i * a / (a + b);
      out.push({ pos, slot: 0, r: a, p: ia * ia * a, heat: ia * ia * a / BLOCK_RATING }, { pos, slot: 1, r: b, p: ib * ib * b, heat: ib * ib * b / BLOCK_RATING });
    }
  });
  return out;
}
function read(job, s) {
  const V = job.supply, vf = job.load.vf, rc = chainR(s.chain), rs = rc + HOUSE.wire, rp = s.across;
  const conducts = !(job.load.kind === "led" && s.reversed);
  let i = 0, iLoad = 0, vLoad = 0;
  if (rp !== void 0) {
    const divider = V * rp / (rs + rp);
    if (conducts && divider > vf) {
      i = (V - vf) / rs;
      iLoad = i - vf / rp;
      vLoad = vf;
    } else {
      i = V / (rs + rp);
      vLoad = divider;
    }
  } else if (conducts && V > vf) {
    i = (V - vf) / rs;
    iLoad = i;
    vLoad = vf;
  } else vLoad = V;
  const pR = i * i * rc, pP = rp ? vLoad * vLoad / rp : 0, blocks = blockHeat(s.chain, i);
  const lit = job.load.kind === "led" ? iLoad >= HOUSE.lit : iLoad >= job.load.imin;
  return {
    i,
    iLoad,
    rChain: rc,
    vR: i * rc,
    pR,
    pP,
    vLoad,
    level: iLoad / job.load.imax,
    tripped: i > HOUSE.fuseTrip,
    lit,
    rHeat: Math.max(0, ...blocks.map((b) => b.heat)),
    pHeat: rp ? pP / BLOCK_RATING : 0,
    blocks,
    ledC: HOUSE.ambient + HOUSE.ledTheta * iLoad * vLoad,
    lifeH: job.battery && i > 0 ? HOUSE.battery / (i * 1e3) : void 0,
    pIn: V * i
  };
}
var mA = (a) => {
  const v = a * 1e3;
  return v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2);
};
var mAr = (a) => `${+(a * 1e3).toFixed(1)}`;
var ohms = (r) => r >= 1e3 ? `${+(r / 1e3).toFixed(2)} k\u03A9` : `${+r.toFixed(r < 100 ? 1 : 0)} \u03A9`;
var watts = (p) => p >= 1 ? `${p.toFixed(2)} W` : `${(p * 1e3).toFixed(p < 0.01 ? 1 : 0)} mW`;
var starZone = (job) => [job.band[0], job.band[0] + (job.band[1] - job.band[0]) / 3];
var partsCost = (s) => (blockCount(s.chain) + (s.across ? 1 : 0)) * BLOCK_COST;
function judge(job, s) {
  const r = read(job, s), problems = [], notes = [], isLed = job.load.kind === "led", cost = partsCost(s);
  const what = isLed ? "the LED" : "the base", none = blockCount(s.chain) === 0;
  if (r.tripped) {
    if (none && s.across) problems.push(`The block across ${what} limits nothing: ${what} still sits straight across ${job.supply} V, so the fuse tripped.`);
    else if (none) problems.push(`Nothing in the chain limits the current: ${isLed ? "an LED" : "a base\u2013emitter junction"} straight across ${job.supply} V draws amps, so the fuse tripped.`);
    else problems.push(`${ohms(r.rChain)} lets ${mA(r.i)} mA through: the fuse tripped.`);
  } else if (isLed && s.reversed && !r.lit) problems.push("Dark: the LED is in backwards. Current only flows from the anode (+, long leg) to the cathode.");
  else if (!r.lit) {
    if (s.across && r.i > HOUSE.lit) problems.push(`The block across ${what} steals the current (${mA(r.i - r.iLoad)} mA) and wastes it.`);
    else if (isLed) problems.push(`Too dim to see: ${mA(r.iLoad)} mA through ${ohms(r.rChain)}.`);
    else problems.push(`Only ${mA(r.iLoad)} mA into the base: the transistor is half on, so the motor crawls and the transistor heats. It needs ${mAr(job.load.imin)} mA.`);
  } else if (r.iLoad > job.load.imax) problems.push(isLed ? `${mA(r.iLoad)} mA is over the LED's ${mAr(job.load.imax)} mA rating: it runs hot and dies early. (I = (V \u2212 Vf) \xF7 R)` : `${mA(r.iLoad)} mA is over the logic pin's ${mAr(job.load.imax)} mA rating. (I = (5 V \u2212 0.7 V) \xF7 R)`);
  if (!problems.length) {
    const hot = r.blocks.find((b) => b.p > BLOCK_RATING);
    if (hot) problems.push(`A ${ohms(hot.r)} block turns ${watts(hot.p)} into heat (P = I\xB2R), but it is a \xBC W part: it scorches.`);
    else if (s.across && r.pP > BLOCK_RATING) problems.push(`The block across ${what} turns ${watts(r.pP)} into heat: it scorches.`);
  }
  if (problems.length) return { tier: 0, problems, notes, cost };
  const inBand = r.iLoad >= job.band[0] - 1e-9 && r.iLoad <= job.band[1] + 1e-9;
  if (!inBand) notes.push(r.iLoad < job.band[0] ? `${mA(r.iLoad)} mA is under the ${mAr(job.band[0])}\u2013${mAr(job.band[1])} mA band: too dim.` : `${mA(r.iLoad)} mA is over the ${mAr(job.band[0])}\u2013${mAr(job.band[1])} mA band.`);
  if (r.rHeat > HOUSE.margin) notes.push(`The hottest block runs at ${Math.round(r.rHeat * 100)} % of its \xBC W rating; the house rule is ${HOUSE.margin * 100} %.`);
  if (notes.length) return { tier: 1, problems, notes, cost };
  if (s.across) notes.push("The block across the LED only wastes current.");
  else if (r.iLoad > starZone(job)[1] + 1e-9) notes.push(`In the band, but above the \u2605 zone: a little more resistance wastes less power${job.battery ? " and the battery lasts longer" : ""}.`);
  return { tier: notes.length ? 2 : 3, problems, notes, cost };
}
var POSITION_OPTIONS = [[], ...BLOCKS.map((b) => [b]), ...BLOCKS.flatMap((a, i) => BLOCKS.slice(i).map((b) => [a, b]))];
function allChains() {
  const out = [];
  for (const a of POSITION_OPTIONS) for (const b of POSITION_OPTIONS) for (const c of POSITION_OPTIONS) out.push([a, b, c]);
  return out;
}
var cache;
var packed = (c) => c.every((p, k) => p.length === 0 || c.slice(0, k).every((q) => q.length > 0));
function best(job) {
  cache ??= allChains();
  let pick;
  for (const c of cache) {
    if (!packed(c)) continue;
    const s = { chain: c, reversed: false };
    if (judge(job, s).tier !== 3) continue;
    const n = blockCount(c), i = read(job, s).iLoad;
    if (!pick || n < pick.n || n === pick.n && i < pick.i) pick = { c, n, i };
  }
  return pick?.c;
}
function reliable(job) {
  cache ??= allChains();
  return cache.filter((c) => judge(job, { chain: c, reversed: false }).tier >= 2);
}
var heatAt = (steady, t) => steady * (1 - Math.exp(-t / HOUSE.tau));
var failTime = (steady) => steady > 1 ? -HOUSE.tau * Math.log(1 - 1 / steady) : Infinity;
var TIER_WORD = ["Fails", "Works", "Works reliably", "Elegant"];
var RUSH_CABINETS = ["PINBALL", "RHYTHM", "CLAW", "RACER", "SKEE", "DANCE", "LIGHTGUN", "PUSHER", "AIR HOCKEY", "TOKEN"];
var RUSH_FAULTS = ["across", "backwards", "hot", "dim", "empty"];
function rushJob(rng, n) {
  const pick = (a) => a[Math.floor(rng() * a.length)];
  for (; ; ) {
    const color = pick(["red", "green", "blue", "white"]), supply = pick(LED_VF[color] > 2.5 ? [5, 9, 12] : [3.3, 5, 9, 12]), band = pick([[0.01, 0.02], [8e-3, 0.016], [0.012, 0.02]]), cabinet = pick(RUSH_CABINETS), fault = pick(RUSH_FAULTS);
    const job = {
      id: `rush-${n}`,
      title: cabinet[0] + cabinet.slice(1).toLowerCase(),
      cabinet,
      supply,
      load: led(color),
      band,
      start: { chain: empty(), reversed: false },
      story: "",
      ask: `${color[0].toUpperCase() + color.slice(1)} LED on ${supply} V: ${Math.round(band[0] * 1e3)}\u2013${Math.round(band[1] * 1e3)} mA`
    };
    const fix = best(job);
    if (!fix) continue;
    switch (fault) {
      case "across":
        job.start = { chain: empty(), across: pick(BLOCKS), reversed: false };
        job.story = "Someone fitted a block across the LED. The fuse keeps clicking.";
        break;
      case "backwards":
        job.start = { chain: fix.map((p) => [...p]), reversed: true };
        job.story = "Right blocks, but the LED went in backwards. It stays dark.";
        break;
      case "hot":
        job.start = { chain: [[47], [], []], reversed: false };
        job.story = "Too bright, and the block smells warm.";
        break;
      case "dim":
        job.start = { chain: [[470], [470], [470]], reversed: false };
        job.story = "Barely glowing. The player says it looks broken.";
        break;
      case "empty":
        job.story = "The chain socket is empty.";
        break;
    }
    if (judge(job, job.start).tier >= 2) continue;
    return job;
  }
}
export {
  BLOCKS,
  BLOCK_COST,
  BLOCK_RATING,
  HOUSE,
  JOBS,
  LED_VF,
  PER_POSITION,
  POSITIONS,
  TIER_WORD,
  allChains,
  best,
  blockCount,
  blockHeat,
  chainR,
  failTime,
  heatAt,
  judge,
  mA,
  mAr,
  ohms,
  partsCost,
  positionR,
  read,
  reliable,
  rushJob,
  starZone,
  watts
};

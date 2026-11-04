// Builds mockups/review5/REVIEW.md from mockups/review5/data/*.json.
// Run from the repo root:  node mockups/review5/tools/report/build.mjs [--candidates]
import fs from 'fs';
import path from 'path';
import { GROUPS } from './merge.mjs';
import * as P from './prose.mjs';

const R5 = 'mockups/review5';
const DATA = `${R5}/data`;
const SHOTS = `${R5}/shots`;
const shotSet = new Set(fs.readdirSync(SHOTS));

// ---------- load ----------
const reviewers = [];
const all = new Map(); // id -> finding
const refuted = [];
for (const f of fs.readdirSync(DATA).filter(f => f.endsWith('.json')).sort()) {
  const d = JSON.parse(fs.readFileSync(`${DATA}/${f}`, 'utf8'));
  reviewers.push(d);
  d.findings.forEach((x, i) => {
    const id = `${d.key}#${i}`;
    const it = { ...x, id, key: d.key, keyRoom: d.room };
    if (x.verdict === 'REFUTED') refuted.push(it); else all.set(id, it);
  });
}
const raised = [...all.values()].length + refuted.length;

// ---------- room of a reviewer key ----------
const ROOMS = ['lobby', 'playground', 'meeting', 'lunch', 'arcade', 'arcade-rush', 'garage', 'qfn', 'observatory', 'spectrum'];
const SYSTEMS = {
  'pip-coworkers': { name: 'Pip & coworkers', keys: ['characters', 'gap6-world-reacts'] },
  props: { name: 'Props', keys: ['props-gallery', 'gap5-toon-pipeline'] },
  cable: { name: 'Cable', keys: ['cable', 'gap7-snap-grab-target'] },
  hud: { name: 'HUD & UI', keys: ['hud-ui', 'gap8-meta-settings-errors'] },
  camera: { name: 'Camera & rendering', keys: ['camera-render', 'gap2-quality2-retake'] },
  progression: { name: 'Progression, juice & recovery', keys: ['progression', 'gap4-juice-audio', 'gap1-stuck-respawn-softlock', 'gap3-recheck-list'] },
};
function roomOfKey(k) {
  for (const r of [...ROOMS].sort((a, b) => b.length - a.length)) if (k === r || k.startsWith(r + '-')) {
    if (r === 'arcade' && k.startsWith('arcade-rush')) return 'arcade-rush';
    return r;
  }
  return null;
}
function roomOfFinding(x) {
  const r = roomOfKey(x.key);
  if (r) return r;
  const rr = (x.room || '').toLowerCase();
  if (ROOMS.includes(rr)) return rr;
  return 'global';
}

// ---------- groups ----------
const used = new Set();
const groups = [];
for (const g of GROUPS) {
  const mem = g.ids.map(id => { const x = all.get(id); if (!x) throw new Error('missing/refuted id in merge map: ' + id); if (used.has(id)) throw new Error('id used twice: ' + id); used.add(id); return x; });
  groups.push({ ...g, mem });
}
for (const x of all.values()) if (!used.has(x.id)) groups.push({ ids: [x.id], mem: [x] });

const PRI = { P0: 0, P1: 1, P2: 2 };
const CAT = { playability: 0, teaching: 1, fun: 2, clarity: 3, overlap: 4, 'visual-bug': 5, 'model-detail': 6, 'art-style': 7 };
for (const g of groups) {
  const best = Math.min(...g.mem.map(m => PRI[m.priority]));
  g.pri = g.pri || ['P0', 'P1', 'P2'][best];
  const lead = g.mem.find(m => PRI[m.priority] === best);
  g.lead = lead;
  g.cat = lead.category;
  g.title = g.title || g.mem[0].title;
  const rooms = [...new Set(g.mem.map(roomOfFinding))];
  g.rooms = rooms;
  const ng = rooms.filter(r => r !== 'global');
  g.roomLabel = g.room || (ng.length === 0 ? 'global' : ng.length > 3 ? 'cross-cutting' : rooms.includes('global') ? 'global; ' + ng.join(', ') : ng.join(', '));
  if (process.env.DBG && rooms.includes('global') && ng.length >= 1) console.error('MIX', g.roomLabel, '|', g.title.slice(0, 90));
  g.reviewers = [...new Set(g.mem.map(m => m.key))];
  g.verdict = g.mem.some(m => m.verdict === 'CONFIRMED') ? 'CONFIRMED' : 'PLAUSIBLE';
  g.rules = [...new Set(g.mem.flatMap(m => [...(m.rules || []), ...((m.problem + ' ' + (m.fix || '')).match(/\bDR-\d\d\b|\bAGENTS \d+\b/g) || [])]))].sort();
}
groups.sort((a, b) => PRI[a.pri] - PRI[b.pri] || CAT[a.cat] - CAT[b.cat] || (a.rank || 0) - (b.rank || 0) || b.reviewers.length - a.reviewers.length || a.mem[0].id.localeCompare(b.mem[0].id));
groups.forEach((g, i) => { g.rid = 'R5-' + String(i + 1).padStart(3, '0'); });
const ridOf = new Map(); groups.forEach(g => g.mem.forEach(m => ridOf.set(m.id, g.rid)));
const idOf = id => { const r = ridOf.get(id); if (!r) throw new Error('prose refers to unknown id ' + id); return r; };

// ---------- batches ----------
const BATCHES = P.BATCHES;
const SYSKEY_BATCH = { cable: 'B7', 'gap7-snap-grab-target': 'B7', 'camera-render': 'B3', 'hud-ui': 'B6', 'gap8-meta-settings-errors': 'B2', characters: 'B10', 'props-gallery': 'B10', 'gap5-toon-pipeline': 'B8', 'gap2-quality2-retake': 'B8', progression: 'B5', 'gap4-juice-audio': 'B4', 'gap6-world-reacts': 'B4', 'gap1-stuck-respawn-softlock': 'B1' };
for (const g of groups) {
  if (g.batch) continue;
  const k = g.mem[0].key;
  if (SYSKEY_BATCH[k]) { g.batch = SYSKEY_BATCH[k]; continue; }
  const r = g.rooms.find(r => r !== 'global') || 'global';
  g.batch = 'R-' + (r === 'arcade-rush' ? 'arcade' : r);
}

// ---------- candidate duplicate pass ----------
const STOP = new Set('the a an and or of to in on at is are it its as by for with from that this be not no but when while into than then so all any every one two three only still has have does do can cant isnt dont there their them they which what where who pip room rooms'.split(' '));
const toks = s => new Set(s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
const jac = (a, b) => { let n = 0; for (const t of a) if (b.has(t)) n++; return n / (a.size + b.size - n || 1); };
const srcs = x => new Set((x.evidence || []).filter(e => e.startsWith('src/')).map(e => e.split(/[\s,(]/)[0]));
if (process.argv.includes('--candidates')) {
  const gi = new Map(); groups.forEach((g, i) => g.mem.forEach(m => gi.set(m.id, i)));
  const L = [...all.values()]; const out = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const a = L[i], b = L[j]; if (gi.get(a.id) === gi.get(b.id)) continue;
    const s = jac(toks(a.title), toks(b.title));
    const sa = srcs(a), sb = srcs(b); let shared = 0; for (const t of sa) if (sb.has(t)) shared++;
    if (s >= (+process.env.TJ||0.34) || (shared >= 2 && s >= (+process.env.TS2||0.12)) || (shared >= 1 && s >= (+process.env.TS1||0.22))) out.push(`${s.toFixed(2)} sh${shared} ${a.id} | ${a.title.slice(0, 70)}\n          ${b.id} | ${b.title.slice(0, 70)}`);
  }
  console.log(out.join('\n')); console.log(out.length, 'candidate pairs');
  process.exit(0);
}

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/<(?=[A-Za-z/!?])/g, '&lt;');
const cell = s => esc(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
function linkShots(s) {
  return esc(s).replace(/(?:mockups\/review5\/)?shots\/([\w.\-]+?\.jpg)/g, (m, n) => shotSet.has(n) ? `[${n}](shots/${n})` : `\`shots/${n}\` (missing)`);
}
function evLine(e) {
  const t = String(e);
  if (/^(src|tests|tools|docs|public)\//.test(t)) { const [p, ...rest] = t.split(' '); return '`' + p + '`' + (rest.length ? ' ' + linkShots(rest.join(' ')) : ''); }
  if (/^mockups\/review5\/tools\//.test(t)) { const [p, ...rest] = t.split(' '); return '`' + p + '`' + (rest.length ? ' ' + linkShots(rest.join(' ')) : ''); }
  return linkShots(t);
}
const oneLine = (s, n = 420) => { s = String(s || '').replace(/\s+/g, ' ').trim(); if (s.length <= n) return s; const cut = s.slice(0, n); const k = cut.lastIndexOf('. '); return (k > 200 ? cut.slice(0, k + 1) : cut + '…'); };
const para = s => linkShots(String(s || '').trim());
const ruleTitles = {};
for (const line of fs.readFileSync(`${R5}/RULES.md`, 'utf8').split('\n')) { const m = line.match(/^\*\*(DR-\d\d): (.+?)\*\*/); if (m) ruleTitles[m[1]] = m[2]; }

// ---------- counts ----------
const cnt = (arr, f) => arr.reduce((o, x) => (o[f(x)] = (o[f(x)] || 0) + 1, o), {});
const byPri = cnt(groups, g => g.pri), byCat = cnt(groups, g => g.cat);
const confirmedKept = [...all.values()].filter(x => x.verdict === 'CONFIRMED').length;
const plausibleKept = all.size - confirmedKept;
const ruleCount = {}; for (const g of groups) for (const r of g.rules) ruleCount[r] = (ruleCount[r] || 0) + 1;
const ruleRaw = {}; for (const x of all.values()) for (const r of new Set(x.rules || [])) ruleRaw[r] = (ruleRaw[r] || 0) + 1;
const AG = ['', 'Solo only.', 'Play by doing, with a minimal text HUD (objective card plus a one-line key prompt).', 'Big, dense rooms with hundreds of props.', 'The cable is the star: finite length, wraps, strain white → yellow → orange → red, slingshot.', 'Clean solution first, chaos shortcuts second, and chaos is never a fail.', 'Good Job grading: time, damage and cost, overall grade the best of the three.', 'Forgiving interaction: a plug that looks in snaps in, and stuck items respawn.', 'Player-orbit camera with occlusion fade.', 'Toon look: 3-step ramp, dark outlines, ACES, restrained glow.', 'Electricity is truthful at the level taught.'];
const C = { raised, refuted: refuted.length, kept: all.size, merged: groups.length, confirmedKept, plausibleKept, byPri, byCat, reviewers: reviewers.length, shots: shotSet.size };

// ---------- render ----------
const out = [];
const w = s => out.push(s);
w('# Design review 5 — playability and 3D models');
w('');
w(P.intro(C, idOf));
w('');
w('## 1. Verdicts');
w('');
for (const [h, t] of P.verdicts(C, idOf)) { w(`**${h}.** ${t}`); w(''); }

w('## 2. Design rules');
w('');
w('The rulebook is [RULES.md](RULES.md) (80 rules, DR-01 … DR-80, plus the AGENTS.md hard rules). "Entries" is the number of **merged** fix-list entries (section 4) that cite the rule; "Findings" is the number of kept reviewer findings before merging (a rule broken the same way in ten rooms is one entry but ten findings). One entry can cite several rules. Sorted by entries.');
w('');
w('| Rule | Entries | Findings | Rule text |');
w('|---|---:|---:|---|');
const rc = Object.entries(ruleCount).sort((a, b) => b[1] - a[1]);
for (const [r, n] of rc.slice(0, 30)) w(`| ${r} | ${n} | ${ruleRaw[r] || 0} | ${cell(ruleTitles[r] || (r.startsWith('AGENTS') ? 'AGENTS.md hard rule: ' + (AG[+r.split(' ')[1]] || '') : ''))} |`);
w('');
w('Other rules cited: ' + rc.slice(30).map(([r, n]) => `${r} (${n})`).join(', ') + '.');
w('');
w(P.rulesComment);
w('');

w('## 3. Rooms');
w('');
w('Each block quotes the reviewers\' own notes per dimension (reviewer key in italics), lists key screenshots, the re-check of earlier reviews (R3A/R3B/R4A/R4B and the RULES "Known" lines), and the fix IDs that touch the room. Notes are the reviewers\' words; where they disagree with a verified finding, the finding (section 4) wins.');
w('');
const DIMS = [['fun', 'Fun'], ['playability', 'Playability'], ['teaching', 'Teaching'], ['clarity', 'Clarity'], ['models', 'Models']];
function pickShots(d, n) {
  const s = (d.shots || []).map(p => path.basename(p)).filter(n => shotSet.has(n));
  if (s.length <= n) return s;
  const r = []; for (let i = 0; i < n; i++) r.push(s[Math.floor(i * (s.length - 1) / (n - 1))]);
  return [...new Set(r)];
}
function block(title, keys, idsFilter) {
  w(`### ${title}`);
  w('');
  const ds = reviewers.filter(d => keys.includes(d.key));
  w('Reviewers: ' + ds.map(d => '`' + d.key + '`').join(', ') + '.');
  w('');
  for (const [k, h] of DIMS) {
    const parts = ds.filter(d => d.notes && d.notes[k]);
    if (!parts.length) continue;
    w(`#### ${h}`);
    w('');
    for (const d of parts) {
      const body = para(d.notes[k]).split('\n').filter((l, i, a) => l.trim() || (a[i - 1] || '').trim());
      w(`> *${d.key}:* ` + body[0]);
      for (const l of body.slice(1)) w('> ' + l);
      w('');
    }
  }
  const shots = ds.flatMap(d => pickShots(d, 5));
  w('**Key screenshots:** ' + shots.map(n => `[${n.replace(/\.jpg$/, '')}](shots/${n})`).join(' · '));
  w('');
  const rc = ds.flatMap(d => (d.rechecked || []).map(t => ({ k: d.key, t })));
  if (rc.length) {
    const tally = cnt(rc, r => { const t = String(r.t); return /REGRESSION/i.test(t) ? 'regression' : /\bPARTIAL|\bIMPROVED/i.test(t) ? 'partial' : /STILL OPEN|still open|\bOPEN\b|\bFAIL/.test(t) ? 'still open' : /\bFIXED|\bPASS\b|\bOK\b/.test(t) ? 'fixed / pass' : 'note'; });
    w('**Earlier-review re-check** (' + Object.entries(tally).map(([a, b]) => `${a} ${b}`).join(', ') + '):');
    w('');
    for (const r of rc) w(`- *${r.k}:* ${para(String(r.t)).replace(/\n+/g, ' ')}`);
    w('');
  }
  const ids = groups.filter(idsFilter).map(g => `[${g.rid}](#${g.rid.toLowerCase()}) (${g.pri})`);
  w('**Fix IDs:** ' + (ids.join(', ') || 'none'));
  w('');
}
for (const r of ROOMS) {
  const keys = reviewers.filter(d => roomOfKey(d.key) === r).map(d => d.key);
  block(({ 'arcade-rush': 'Arcade Rush', qfn: 'QFN' }[r] || r[0].toUpperCase() + r.slice(1)) + ` (\`${r}\`)`, keys, g => g.rooms.includes(r));
}
for (const [sk, s] of Object.entries(SYSTEMS)) block(s.name + ' (cross-cutting)', s.keys, g => g.mem.some(m => s.keys.includes(m.key)));

w('## 4. Fix list');
w('');
w(`${groups.length} entries: ` + ['P0', 'P1', 'P2'].map(p => `${byPri[p] || 0} × ${p}`).join(', ') + '. IDs are ordered P0 → P1 → P2, and within a priority by player impact (playability > teaching > fun > clarity > overlap > visual-bug > model-detail > art-style), then by how many reviewers independently found it. "Room" is `cross-cutting` when the same root cause was found in several rooms; the entry lists every room. Line numbers are as of commit 853cad2.');
w('');
w('| ID | P | Room | Category | Title | Verdict | Found by |');
w('|---|---|---|---|---|---|---:|');
for (const g of groups) w(`| [${g.rid}](#${g.rid.toLowerCase()}) | ${g.pri} | ${g.roomLabel} | ${g.cat} | ${cell(g.title)} | ${g.verdict} | ${g.reviewers.length} |`);
w('');
for (const g of groups) {
  w(`### ${g.rid}`);
  w('');
  w(`**${g.rid} | ${g.pri} | ${g.rooms.join(', ')} | ${g.cat} | ${esc(g.title)}**`);
  w('');
  w(`Found by: ${g.mem.map(m => `\`${m.id}\` (${m.priority} ${m.category})`).join(', ')}. Batch: ${g.batch} (section 5).`);
  w('');
  w('**What is wrong.**');
  w('');
  for (const m of g.mem) { if (g.mem.length > 1) w(`*${m.key}* — **${esc(m.title)}.** ${para(m.problem)}`); else w(para(m.problem)); w(''); }
  w('**Evidence.**');
  w('');
  const ev = [...new Set(g.mem.flatMap(m => [...(m.evidence || []), ...(m.extra_evidence || [])]))];
  for (const e of ev) w('- ' + evLine(e));
  w('');
  w('**Fix.**');
  w('');
  for (const m of g.mem) {
    const pre = g.mem.length > 1 ? `*From ${m.key}:* ` : '';
    if (m.fix_correction) {
      w(`${pre}**Verifier correction (takes precedence over the reviewer's fix where they differ):** ${para(m.fix_correction)}`); w('');
      w(`Reviewer's fix: ${para(m.fix)}`); w('');
    } else { w(pre + para(m.fix)); w(''); }
  }
  if (g.mem.length > 1) { w('*Merged entry:* apply one fix for the shared root cause and check it against every room and reviewer listed above; where reviewers proposed different fixes, prefer the verifier-corrected one, then the lead (first) reviewer\'s.'); w(''); }
  w('**Verify.**');
  w('');
  for (const m of g.mem) w('- ' + (g.mem.length > 1 ? `*${m.key}:* ` : '') + para(m.verify).replace(/\n+/g, ' '));
  w('');
  w('**Rules:** ' + (g.rules.join(', ') || '—'));
  w('');
  w(`**Verdict:** ${g.verdict} — ${esc(oneLine(g.lead.verify_reason))}` + (g.mem.length > 1 ? ` (${g.mem.filter(m => m.verdict === 'CONFIRMED').length}/${g.mem.length} merged findings CONFIRMED.)` : ''));
  w('');
}

w('## 5. Suggested execution order');
w('');
w(P.execIntro);
w('');
const bOrder = [...Object.keys(BATCHES)];
for (const b of bOrder) {
  const gs = groups.filter(g => g.batch === b);
  if (!gs.length) continue;
  const B = BATCHES[b];
  const pc = cnt(gs, g => g.pri);
  w(`### ${b}. ${B.name}`);
  w('');
  w(`${gs.length} entries (${['P0', 'P1', 'P2'].filter(p => pc[p]).map(p => `${pc[p]} ${p}`).join(', ')}). Files: ${B.files}.`);
  w('');
  w('Entries: ' + gs.map(g => `${g.rid}`).join(', ') + '.');
  w('');
  w('Verification: ' + B.verify);
  w('');
}
for (const b of [...new Set(groups.map(g => g.batch))]) if (!BATCHES[b]) throw new Error('unknown batch ' + b);

w('## 6. Open questions for the product owner');
w('');
P.questions(idOf).forEach((q, i) => w(`${i + 1}. ${q}`));
w('');

w('## Appendix — refuted findings');
w('');
w('These were raised by a reviewer and refuted by the adversarial verifier. They are not in the fix list.');
w('');
for (const r of refuted) w(`- **${esc(r.title)}** (\`${r.id}\`, ${r.priority}) — ${esc(oneLine(r.verify_reason, 700))}`);
w('');
w('## Appendix — earlier-review items re-checked (cross-cutting reviewers)');
w('');
w('Room reviewers\' re-checks are listed in each room block in section 3. These are the re-checks from the cross-cutting and gap reviewers.');
w('');
for (const d of reviewers.filter(d => !roomOfKey(d.key))) {
  if (!(d.rechecked || []).length) continue;
  w(`**${d.key}**`);
  w('');
  for (const t of d.rechecked) w('- ' + para(String(t)).replace(/\n+/g, ' '));
  w('');
}
w('## Appendix — merge log');
w('');
w('Every fix-list entry that merges more than one reviewer finding, with the source finding ids (`reviewer-key#index` into `data/<key>.json`).');
w('');
for (const g of groups.filter(g => g.mem.length > 1)) w(`- ${g.rid}: ${g.mem.map(m => '`' + m.id + '`').join(', ')}`);
w('');

fs.writeFileSync(`${R5}/REVIEW.md`, out.join('\n'));
console.log(JSON.stringify({ ...C, rules: rc.slice(0, 12) }, null, 0));
console.log('top10:'); groups.slice(0, 10).forEach(g => console.log(g.rid, g.pri, g.roomLabel, g.cat, g.title.slice(0, 120)));
console.log('batches:', JSON.stringify(cnt(groups, g => g.batch)));

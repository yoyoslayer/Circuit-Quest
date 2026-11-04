import fs from 'fs';
const t = fs.readFileSync('mockups/review5/REVIEW.md', 'utf8').split('\n');
const shots = new Set(fs.readdirSync('mockups/review5/shots'));
let fence = false, odd = 0, badLink = 0, badTab = 0, anchors = new Set(), refs = [], tags = 0, hdr = 0;
let tableCols = null;
t.forEach((l, i) => {
  if (l.startsWith('```')) { fence = !fence; return; }
  if (fence) return;
  const m = l.match(/^#{1,6} (.*)/); if (m) { hdr++; anchors.add(m[1].toLowerCase().trim().replace(/[^\w\- ]/g, '').replace(/ /g, '-')); }
  const ticks = (l.match(/`/g) || []).length; if (ticks % 2) { odd++; if (odd < 6) console.log('odd backticks L' + (i + 1) + ': ' + l.slice(0, 160)); }
  for (const mm of l.matchAll(/\]\((shots\/[^)]+)\)/g)) if (!shots.has(mm[1].slice(6))) { badLink++; if (badLink < 5) console.log('missing', mm[1]); }
  for (const mm of l.matchAll(/\]\(#([^)]+)\)/g)) refs.push(mm[1]);
  for (const mm of l.replace(/`[^`]*`/g, '').matchAll(/<(?!br>)([a-zA-Z\/!])/g)) { tags++; if (tags < 4) console.log('raw tag L' + (i + 1) + ': ' + l.slice(0, 120)); }
  if (l.startsWith('|')) { const n = l.replace(/\\|/g, '').replace(/`[^`]*`/g, '').split('|').length; if (tableCols === null) tableCols = n; else if (n !== tableCols) { badTab++; if (badTab < 5) console.log('table cols L' + (i + 1), n, tableCols, l.slice(0, 120)); } } else tableCols = null;
});
const missingAnchors = refs.filter(r => !anchors.has(r));
console.log({ lines: t.length, hdr, fenceOpen: fence, odd, badLink, badTab, tags, refs: refs.length, missingAnchors: missingAnchors.slice(0, 5), nMissing: missingAnchors.length });

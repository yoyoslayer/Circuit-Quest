import fs from 'node:fs';
const text=fs.readFileSync('mockups/review5/REVIEW.md','utf8').replaceAll('\r\n','\n');
const owned=p=>/^src\/ui\/[^/]+\.css$/.test(p)||['src/ui/store.ts','src/ui/game-ui.ts','src/ui/objectives.ts','src/ui/screens.ts','src/ui/lunch-hud.ts','src/sim/grade.ts','src/hub/lobby.ts','src/render/pipRig.ts','src/render/actors.ts'].includes(p);
// Stop at the report footer, and never infer ownership just from paths in Fix.
// Existing tests and asset scripts are not editable under Astra's allowlist.
const entries=text.split(/\n### (?=R5-)/).slice(1).map(e=>e.split(/\n## /)[0]).filter(e=>/^R5-\d+\n\n\*\*R5-\d+ \| P2/.test(e));
const report=entries.map(e=>{const paths=[...new Set(e.match(/(?:src|tests|tools|public)\/[a-zA-Z0-9_./*-]+\.(?:ts|css|py|glb)/g)??[])];const fix=e.slice(e.indexOf('**Fix.**'),e.indexOf('**Verify.**'));const editPaths=[...new Set(fix.match(/src\/[a-zA-Z0-9_./*-]+\.(?:ts|css)/g)??[])];return {id:e.slice(0,6),title:e.split('\n').find(l=>l.startsWith('**R5-')),paths,editPaths,ownedOnly:paths.length>0&&paths.every(owned),mentionsOwned:paths.some(owned)};});
const dispositions={'R5-162':'Already fixed in merged lobby: rattle, padlock, tape and flash retained','R5-174':'Controls completed; gameplay assists require Game/station hooks (see Astra log)','R5-198':'Stage 2 desktop fail cause; mobile deferred by scope','R5-251':'Stage 1 distinct campaign rewards and stored stars/mastery','R5-255':'Stage 1 work-based Rush row and served best','R5-266':'Stages 1–2 ungraded practice and readable badge','R5-324':'Models merge and Stage 3 retain low two-handed haul'};
for(const row of report)if(dispositions[row.id])row.disposition=dispositions[row.id];
fs.writeFileSync('mockups/review5/tools/astra-review/p2-inventory.json',JSON.stringify(report,null,2)+'\n');
console.log(report.map(e=>`${e.id} ${e.ownedOnly?'OWNED':'SHARED'} ${e.title}`).join('\n'));

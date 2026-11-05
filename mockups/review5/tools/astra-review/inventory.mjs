import fs from 'node:fs';
const text=fs.readFileSync('mockups/review5/REVIEW.md','utf8').replaceAll('\r\n','\n');
const owned=p=>/^src\/ui\//.test(p)||['src/sim/grade.ts','src/hub/lobby.ts','src/render/pipRig.ts','src/render/actors.ts'].includes(p)||/^tests\//.test(p);
const entries=text.split(/\n### (?=R5-)/).slice(1).filter(e=>/^R5-\d+\n\n\*\*R5-\d+ \| P2/.test(e));
const report=entries.map(e=>{const paths=[...new Set(e.match(/(?:src|tests)\/[a-zA-Z0-9_./*-]+\.(?:ts|css)/g)??[])];const fix=e.slice(e.indexOf('**Fix.**'),e.indexOf('**Verify.**'));const editPaths=[...new Set(fix.match(/src\/[a-zA-Z0-9_./*-]+\.(?:ts|css)/g)??[])];return {id:e.slice(0,6),title:e.split('\n').find(l=>l.startsWith('**R5-')),paths,editPaths,ownedOnly:editPaths.length>0&&editPaths.every(owned),mentionsOwned:paths.some(owned)};}).filter(e=>e.mentionsOwned);
fs.writeFileSync('mockups/review5/tools/astra-review/p2-inventory.json',JSON.stringify(report,null,2)+'\n');
console.log(report.map(e=>`${e.id} ${e.ownedOnly?'OWNED':'SHARED'} ${e.title}`).join('\n'));

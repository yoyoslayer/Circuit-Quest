import fs from 'fs';
const dir='mockups/review5/data';
const out=[];
for(const f of fs.readdirSync(dir).sort()){const d=JSON.parse(fs.readFileSync(dir+'/'+f));
 d.findings.forEach((x,i)=>{ if(x.verdict==='REFUTED')return;
  const ev=(x.evidence||[]).filter(e=>/^src\//.test(e)).map(e=>e.replace(/\s.*$/,'')).slice(0,3).join(',');
  out.push(`${d.key}#${i} ${x.priority} ${x.category} | ${x.title.slice(0,110)} | ${ev}`);});}
fs.writeFileSync(process.argv[2],out.join('\n'));

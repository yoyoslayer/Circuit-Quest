// Lists fix-list entries of a priority that no fix log mentions yet.
// node mockups/review5/tools/open.cjs P1   (run from the repo root)
const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'..'),pri=process.argv[2]||'P1';
const md=fs.readFileSync(path.join(dir,'REVIEW.md'),'utf8');
const done=fs.readFileSync(path.join(dir,'FIXED.md'),'utf8')+fs.readdirSync(path.join(dir,'fixlog')).map(f=>fs.readFileSync(path.join(dir,'fixlog',f),'utf8')).join('\n');
const out=[];
for(const line of md.split(/\r?\n/)){
  if(!line.startsWith('**R5-'))continue;
  const parts=line.replace(/\*\*/g,'').split(' | ');
  if(parts[1]!==pri)continue;
  const id=parts[0];
  if(new RegExp(id+'(?![0-9])').test(done))continue;
  out.push(`${id} | ${parts[2]} | ${parts.slice(4).join(' | ').slice(0,140)}`);
}
console.log(out.length+' open');console.log(out.join('\n'));

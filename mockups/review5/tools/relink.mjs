// Points shot links at the committed JPG copies: node mockups/review5/tools/relink.mjs
// Rewrites "shots/x.png" and bare "x.png" (when shots/x.jpg exists) in .md and .json files.
import {readdirSync,readFileSync,writeFileSync,statSync} from 'node:fs';
import {join,dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const jpgs=new Set(readdirSync(join(root,'shots')).filter(n=>n.endsWith('.jpg')).map(n=>n.slice(0,-4)));
const skip=new Set(['shots','shots-full']);let files=0,links=0;
const walk=d=>{for(const n of readdirSync(d)){const p=join(d,n);if(statSync(p).isDirectory()){if(!skip.has(n))walk(p);continue;}
  if(!/\.(md|json)$/.test(n))continue;
  const s=readFileSync(p,'utf8');let c=0;
  const t=s.replace(/([\w.\-]+)\.png\b/g,(m,a)=>{if(!jpgs.has(a))return m;c++;return a+'.jpg';});
  if(c){writeFileSync(p,t);files++;links+=c;}}};
walk(root);console.log(`${links} links in ${files} files`);

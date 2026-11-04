// Prints fix-list entries from REVIEW.md: node mockups/review5/tools/entry.mjs R5-004 R5-006 [--full]
// Default prints the title line, Fix and Verify sections; --full prints the whole entry.
import {readFileSync} from 'node:fs';
const args=process.argv.slice(2),full=args.includes('--full'),ids=args.filter(a=>a.startsWith('R5-'));
const md=readFileSync(new URL('../REVIEW.md',import.meta.url),'utf8');
for(const id of ids){
  const start=md.indexOf(`\n### ${id}\n`);if(start<0){console.log(`${id}: not found`);continue;}
  const end=md.indexOf('\n### R5-',start+5),body=md.slice(start,end<0?undefined:end);
  if(full){console.log(body);continue;}
  const title=body.split('\n').find(l=>l.startsWith(`**${id} |`));
  const pick=name=>{const i=body.indexOf(`**${name}.**`);if(i<0)return '';const j=body.indexOf('\n**',i+name.length+6);return body.slice(i,j<0?undefined:j).trim();};
  console.log(`\n=== ${title}\n${pick('Fix')}\n${pick('Verify')}`);
}

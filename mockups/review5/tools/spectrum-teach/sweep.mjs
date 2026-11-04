import {chromium} from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage();
await p.goto('http://127.0.0.1:4173/?level=spectrum&manual');await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
const out=await p.evaluate(async()=>{const L=await import('/src/stations/spectrum/logic.ts');const rows=[];
  for(const j of L.JOBS)for(const band of L.BAND_IDS)for(const power of L.POWERS)for(const hatchOpen of [false,true])for(const mirrors of [[],['A'],['B'],['C']]){
    const s={band,detector:L.BANDS[band].detector,power,hatchOpen,mirrors,pod:j.pad};const v=L.judge(j,s);
    rows.push(`${j.id} ${band} ${power}mW hatch:${hatchOpen?1:0} m:${mirrors.join('')||'-'} tier${v.tier} ${v.margin} | ${(v.problems[0]||v.notes[0]||'')}`);}
  // hatch size, distances
  rows.push('HATCH width '+(L.HATCH.x1-L.HATCH.x0));rows.push('quiet door '+JSON.stringify(L.QUIET.door)+' lab door '+JSON.stringify(L.LAB.door));
  return rows;});
console.log(out.filter(r=>!/hatch:0 m:-|tier0/.test(r)||/m:- /.test(r)).join('\n'));await b.close();

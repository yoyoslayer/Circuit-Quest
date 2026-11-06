// Bench view screenshots with each render quality: q2 = outlines+AO+bloom, q1 = no AO.
// Usage: node bench-shot.mjs <prefix> [levels...]   (dev server on 127.0.0.1:4173)
import {chromium} from '@playwright/test';
const prefix=process.argv[2]||'bench';const levels=process.argv.slice(3).length?process.argv.slice(3):['observatory'];
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
for(const id of levels){
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.goto(`http://127.0.0.1:4173/?level=${id}&manual&fullfx`);await p.waitForSelector('body[data-ready="true"]');
  await p.getByRole('button',{name:'Start playing'}).click();
  await p.evaluate(()=>{const G=window.__game;const s=G.station.stand;G.player.setTranslation({x:s.x,y:1,z:s.z},true);G.enterBench();});
  await p.evaluate(()=>window.__circuitCrew.drive.advance(1.5));await p.waitForTimeout(800);
  for(const q of [2]){await p.evaluate(q=>window.__game.view.setQuality(q),q);await p.evaluate(()=>window.__circuitCrew.drive.advance(.1));await p.waitForTimeout(600);
    await p.screenshot({path:`mockups/review6/shots/${prefix}-${id}-q${q}.png`});}
  await p.close();
}
await b.close();console.log('ok');

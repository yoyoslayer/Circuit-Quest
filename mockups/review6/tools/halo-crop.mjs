// Close 2x crops with AO on (q2) and off (q1): the bench corner and Pip in a room.
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
async function shots(level,bench,clip,name){
  const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
  await p.goto(`http://127.0.0.1:4173/?level=${level}&manual&fullfx`);await p.waitForSelector('body[data-ready="true"]');
  await p.getByRole('button',{name:'Start playing'}).click();
  if(bench)await p.evaluate(()=>{const G=window.__game;const s=G.station.stand;G.player.setTranslation({x:s.x,y:1,z:s.z},true);G.enterBench();});
  await p.evaluate(()=>window.__circuitCrew.drive.advance(1.5));await p.waitForTimeout(800);
  for(const q of [2,1]){await p.evaluate(q=>window.__game.view.setQuality(q),q);await p.evaluate(()=>window.__circuitCrew.drive.advance(.1));await p.waitForTimeout(700);
    await p.screenshot({path:`mockups/review6/shots/halo-${name}-q${q}.png`,clip});}
  await p.close();
}
await shots('observatory',true,{x:1050,y:480,width:330,height:320},'benchcorner');
await shots('playground',false,{x:520,y:280,width:420,height:330},'pip');
await b.close();console.log('ok');

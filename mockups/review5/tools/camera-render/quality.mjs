// Fresh profile: Number(localStorage.getItem(...)) is Number(null)===0, so quality drops to 0 (no AO, no bloom, DPR 1).
import {chromium} from '@playwright/test';
import {launch} from '../cap.mjs';
import {hook,stats} from './hook.mjs';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('http://127.0.0.1:4173/?level=garage');await p.waitForSelector('body[data-ready="true"]');
await p.evaluate(async()=>{const m=await import('/src/game.ts');const P=m.Game.prototype;const o=P.render;P.render=function(dt){window.__game=this;return o.call(this,dt);};});
await p.waitForTimeout(500);
console.log('real player, fresh profile:',await p.evaluate(()=>({stored:localStorage.getItem('circuit-crew-quality'),quality:window.__game.view.getQuality(),dpr:window.__game.view.renderer.getPixelRatio()})));
await b.close();
for(const level of ['garage','arcade','meeting','lunch']){
  const g=await launch(level,{fullfx:true});await hook(g);await g.advance(1);
  await g.shot(`camera-render-${level}-20-quality0`);const s0=await stats(g);
  await g.page.evaluate(()=>window.__game.view.setQuality(2));await g.advance(.2);
  await g.shot(`camera-render-${level}-21-quality2`);const s2=await stats(g);
  console.log(level,'q0 draw',s0.draw,'q2 draw',s2.draw,'q',s2.quality);
  console.log(await g.close());
}

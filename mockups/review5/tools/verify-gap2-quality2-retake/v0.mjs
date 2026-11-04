import {chromium} from '@playwright/test';
const ARGS=['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11'];
const browser=await chromium.launch({args:ARGS});
async function probe(url,stored){
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();
  if(stored!==undefined)await ctx.addInitScript(v=>{try{localStorage.setItem('circuit-crew-quality',v)}catch{}},stored);
  await page.goto('http://127.0.0.1:4173/'+url);await page.waitForSelector('body[data-ready="true"]',{timeout:120000});
  const r=await page.evaluate(async()=>{const m=await import('/src/game.ts');const P=m.Game.prototype;const o=P.render;let G;P.render=function(dt){G=this;return o.call(this,dt);};
    const b=[...document.querySelectorAll('button')].find(b=>/Start playing/.test(b.textContent));if(b)b.click();
    if(window.__circuitCrew?.drive)await window.__circuitCrew.drive.advance(.1);else await new Promise(r=>setTimeout(r,1500));
    P.render=o;return G?{q:G.view.getQuality(),dpr:G.view.renderer.getPixelRatio(),passes:G.view.composer.passes.map(p=>p.constructor.name+':'+p.enabled).join(','),stored:localStorage.getItem('circuit-crew-quality')}:'nogame';});
  console.log(url,'stored=',stored,JSON.stringify(r));await ctx.close();
}
await probe('?level=garage');
await probe('?level=garage&manual');
await probe('?level=garage&manual&fullfx');
await probe('?level=garage&manual&lowfx','1');
await probe('?level=garage&manual&fullfx','2');
await browser.close();

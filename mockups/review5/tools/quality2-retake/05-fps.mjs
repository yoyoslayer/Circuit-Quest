// Real-time (no ?manual) fps and draw calls at quality 2, at DPR 1 and DPR 2 (pixelRatio caps to 1.5), and whether adaptQuality steps down.
import {chromium} from '@playwright/test';
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
for(const dsf of [1,2])for(const level of ['playground','meeting','lunch','arcade','garage','qfn','observatory','spectrum','lobby']){
  const ctx=await b.newContext({viewport:{width:1440,height:900},deviceScaleFactor:dsf});const p=await ctx.newPage();
  await p.addInitScript(()=>{try{localStorage.setItem('circuit-crew-quality','2');}catch{}});
  await p.goto(`http://127.0.0.1:4173/?${level==='lobby'?'':'level='+level}`);await p.waitForSelector('body[data-ready="true"]',{timeout:120000});
  await p.evaluate(async()=>{const m=await import('/src/game.ts');const P=m.Game.prototype;const o=P.render;P.render=function(dt){window.__game=this;return o.call(this,dt);};});
  const s=p.getByRole('button',{name:'Start playing'});if(await s.count())await s.click();
  const out=[];for(let i=0;i<5;i++){await p.waitForTimeout(2000);out.push(await p.evaluate(()=>{const G=window.__game;return `${G.view.getQuality()}/${G.fps.toFixed(0)}/${G.view.renderer.info.render.calls}/${G.profile.draw.toFixed(1)}ms`;}));}
  console.log('dsf',dsf,level.padEnd(12),'q/fps/draws/drawms over 10s:',out.join('  '),' stored',await p.evaluate(()=>localStorage.getItem('circuit-crew-quality')),'pr',await p.evaluate(()=>window.__game.view.renderer.getPixelRatio()));
  await ctx.close();}
await b.close();

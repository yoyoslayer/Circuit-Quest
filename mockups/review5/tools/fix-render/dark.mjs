// R5-141 check: the toon darkBox uniform in place of the lunch storeroom lid. Shots: lid as built,
// then lid hidden + darkness on (what lunch-runtime would do), then darkness half-way (the 0.5 s tween).
import {launch} from '../cap.mjs';
const g=await launch('lunch',{fullfx:true});await g.page.evaluate(()=>localStorage.setItem('circuit-crew-quality','2'));
await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
await g.advance(.5);await g.page.evaluate(()=>{const G=window.__game;G.yaw=-.5;G.zoom=16;G.focus.set(-11,0,-4);});await g.advance(.6);
await g.shot('fix-render-lunch-store-lid');
const set=amount=>g.page.evaluate(async a=>{const m=await import('/src/render/toon.ts');Object.assign(m.darkBox,{x:-16.6,y:-7.75,z:-10.2,w:0});m.darkness.amount=a;window.__game.lunch.dark.visible=false;window.__game.lunch.dark.scale.setScalar(0.0001);},amount);
await set(1);await g.advance(.1);await g.shot('fix-render-lunch-store-dark');
await set(.5);await g.advance(.1);await g.shot('fix-render-lunch-store-half');
console.log(g.errors.slice(0,5));await g.close();

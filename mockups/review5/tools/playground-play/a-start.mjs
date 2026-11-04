// playground-play A: start view, HUD text, survey, orbits, close-ups, audit.
import {launch} from '../cap.mjs';
const K='playground-play';
const g=await launch('playground',{fullfx:true});
const audit=await g.audit(.02);
console.log('audit',JSON.stringify(audit));
await g.advance(.5);
let s=await g.snap();
console.log('start',JSON.stringify({props:s.props,dc:s.drawCalls,fps:s.fps,player:s.player,plug:s.items.length,rope:s.rope}));
// kinds of props
const kinds=await g.page.evaluate(()=>{const g=window.__circuitCrew;return null;});
const hud=await g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText,prompt:document.querySelector('.prompt-pill')?.hidden?'(hidden)':document.querySelector('.prompt-pill')?.innerText,text:document.querySelector('[data-layer="hud"]')?.innerText}));
console.log('hud',JSON.stringify(hud));
await g.shot(`${K}-01-start`);
await g.survey();s=await g.snap();console.log('survey dc',s.drawCalls);
await g.shot(`${K}-02-survey`);
await g.survey();
await g.orbit(500,0);await g.shot(`${K}-03-orbit-right`);
await g.orbit(-1000,0);await g.shot(`${K}-04-orbit-left`);
await g.orbit(500,0);
await g.zoom(-1500);await g.shot(`${K}-05-close-start`);
await g.orbit(700,0);await g.shot(`${K}-06-close-back`);
await g.orbit(-700,0);
await g.zoom(3000);await g.shot(`${K}-07-maxzoom`);
console.log('errors',JSON.stringify(await g.close()));

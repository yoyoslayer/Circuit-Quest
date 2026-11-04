import {launch,W,R,brief,hudText} from './lib.mjs';
const K='lunch-teach';const t0=Date.now();
const g=await launch('lunch',{fullfx:true});
await g.advance(1.5);await g.shot(`${K}-01-start`);console.log('hud',await hudText(g));
const s=await brief(g,'start');console.log('fps',s.fps,'draw',s.drawCalls,'props',s.props);
await g.survey();await g.shot(`${K}-02-survey`);await g.key('Tab',.8);
// Close-up of the supply carts (gauges)
await W(g,-11,5);await g.zoom(-1500);await g.shot(`${K}-03-carts-close`);
// kitchen post close-up
await R(g,[[0,2],[0,-1.5],[-3.5,-2]]);await g.shot(`${K}-04-post-close`);
await W(g,-2.5,-6);await g.shot(`${K}-05-oven-close`);
await W(g,4,-4.5);await g.shot(`${K}-06-conveyor-close`);
await R(g,[[2,-1.5],[0,-1],[0,2],[10,1],[11.5,-3.5]]);await g.shot(`${K}-07-lift-close`);
await g.zoom(1500);console.log('hud',await hudText(g));
await brief(g,'after tour');
console.log('errors',JSON.stringify(await g.close()),'ms',Date.now()-t0);

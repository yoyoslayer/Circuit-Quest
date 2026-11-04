import {launch} from '../cap.mjs';import {hud,placeStrip,route} from './common.mjs';
const K='verify-meeting-play';const log=(...a)=>console.log(...a);
const g=await launch('meeting',{fullfx:true});await g.advance(.3);
// A: gauge before the strip exists
await route(g,[[-8,-1.4],[6,-1.2],[11.3,-0.6]]);let s=await g.snap();log('at door no strip',s.stripPlaced,JSON.stringify(await hud(g)));
await g.zoom(-1500);await g.shot(`${K}-20-door-before-strip-close`);await g.orbit(500,0);await g.shot(`${K}-21-door-before-strip-side`);await g.orbit(-500,0);await g.zoom(1500);
// B: fetch strip, place
await route(g,[[6,-1.2],[-8,-1.4]]);s=await placeStrip(g);log('placed',s.stripPlaced,'t',s.time.toFixed(1));
for(const [x,z] of [[11.2,-1.4],[12.3,-1.1],[12.9,-1.0],[11.7,-1.6]]){await g.walk(x,z,.25);s=await g.snap();const st=s.items.find(i=>i.id==='strip');log('at',x,z,'pip',s.player.x.toFixed(2),s.player.z.toFixed(2),'strip',st.pos.x.toFixed(2),st.pos.z.toFixed(2),JSON.stringify(await hud(g)));}
await g.shot(`${K}-22-at-placed-strip-prompt`);
// C: heater prompt from in front
for(const [x,z] of [[15.1,-1.0],[15.4,-1.1]]){await g.walk(x,z,.2);s=await g.snap();log('heater try',s.player.x.toFixed(2),s.player.z.toFixed(2),JSON.stringify(await hud(g)));}
await g.shot(`${K}-23-at-heater`);
// D: glass pane prompt + shove
await route(g,[[11,-0.8],[8.6,-1.2],[8.4,-3.6]],.3);s=await g.snap();log('by glass',JSON.stringify(s.player),JSON.stringify(await hud(g)),JSON.stringify(s.items.filter(i=>i.id?.startsWith('glass'))));
await g.shot(`${K}-24-glass-prompt`);
s=await g.advance(1.2,['KeyD','ShiftLeft']);s=await g.advance(1);log('after shove',JSON.stringify(s.items.filter(i=>i.id?.startsWith('glass')).map(i=>[i.id,i.pos.x.toFixed(2),i.pos.y.toFixed(2),i.pos.z.toFixed(2),i.visible])),'dmg',s.damage,'cost',s.cost,'pip',JSON.stringify(s.player));
await g.shot(`${K}-25-glass-shoved`);
// E: beanbag view
await route(g,[[8.6,0.5],[9.5,3.2]],.4);await g.shot(`${K}-26-lounge-beanbag`);
// F: coworker collision + vending prompt
await route(g,[[6,-1.2],[-8,-1.4],[-11,1.5]],.4);
let w=await g.walk(-12.7,2.8,.2);log('walk into coworker arrived',w.arrived,JSON.stringify(w.state.player));
await g.zoom(-1200);await g.shot(`${K}-27-pip-vs-coworker`);await g.zoom(1200);
await g.walk(-13.5,2.0,.3);log('vending',JSON.stringify(await hud(g)));await g.shot(`${K}-28-vending-prompt`);
console.log('errors',JSON.stringify(await g.close()));

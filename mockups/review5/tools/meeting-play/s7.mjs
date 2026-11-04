import {launch} from '../cap.mjs';import {hud,placeStrip,route} from './common.mjs';
const K='meeting-play';const log=(...a)=>console.log(...a);
let g=await launch('meeting',{fullfx:true});await g.advance(.3);
// Slingshot across the aisle: hold the plug, run east along the aisle past the length, Q.
await g.key('KeyF');await route(g,[[-8,-1.4],[4,-1.2]]);
let s=await g.advance(2.5,['KeyD','ShiftLeft']);log('stretched',s.rope.strain.toFixed(2),JSON.stringify(s.player),'bends',s.rope.bends.length,'alarmed',s.alarmed,'dmg',s.damage);
await g.shot(`${K}-68-sling-windup`);
const before=s.items;await g.key('KeyQ',.03);await g.shot(`${K}-69-sling-release`);
s=await g.advance(1.5);log('after fastest',s.fastestProp.toFixed(1),'dmg',s.damage,'cost',s.cost,'alarmed',s.alarmed,'plug',JSON.stringify(s.rope.length.toFixed(1)));
await g.shot(`${K}-70-sling-aftermath`);
await g.survey();await g.shot(`${K}-71-sling-aftermath-survey`);await g.survey();
console.log('errors',JSON.stringify(await g.close()));
// Glass smash: carry a chair and throw it at a boardroom pane; and sprint-shove a pane.
g=await launch('meeting',{fullfx:true});await g.advance(.3);
await route(g,[[-8,-1.4],[6,-1.2],[8.4,-3.6]],.4);s=await g.snap();log('at glass',JSON.stringify(await hud(g)));
await g.shot(`${K}-72-glass-pane`);
s=await g.advance(1.2,['KeyD','ShiftLeft']);s=await g.snap();log('shove glass dmg',s.damage,'cost',s.cost,JSON.stringify(s.items.filter(i=>i.id.startsWith('glass')).map(i=>[i.id,i.visible,+i.pos.x.toFixed(1),+i.pos.y.toFixed(1)])));
await g.advance(1);await g.shot(`${K}-73-glass-shoved`);
console.log('errors',JSON.stringify(await g.close()));
// Respawn: throw the strip onto the cabinet tops; and wedge it behind the box stack
g=await launch('meeting',{fullfx:true});await g.advance(.3);
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await g.walk(-8.2,-7.9,.3);s=await g.snap();log('by cabinets',JSON.stringify(s.player));
await g.page.keyboard.down('KeyW');await g.advance(.1,['KeyW']);await g.page.keyboard.up('KeyW');
await g.key('KeyQ',1);s=await g.snap();log('strip after throw',JSON.stringify(s.items.find(i=>i.id==='strip').pos));
await g.advance(6);s=await g.snap();log('strip 6s later',JSON.stringify(s.items.find(i=>i.id==='strip').pos));
await g.shot(`${K}-74-strip-thrown-cabinets`);
console.log('errors',JSON.stringify(await g.close()));

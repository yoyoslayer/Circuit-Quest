// Does the green-lit practice-wall socket accept the plug? (A false-affordance check.)
import {launch} from '../cap.mjs';
const K='playground-models';
const g=await launch('playground',{fullfx:true});
await g.advance(.5);await g.key('KeyF',.3);
await g.walk(-5,-1);await g.walk(-3.6,-8.9,.35);
let s=await g.snap();console.log('at practice wall',JSON.stringify(s.player),JSON.stringify(s.rope));
await g.zoom(-2000);await g.shot(`${K}-61-practice-wall-with-plug`);
await g.key('KeyF',.5);s=await g.snap();console.log('after F: holding',s.holdingPlug,'connected',s.connected,'electrical',s.electrical,'won',s.won);
await g.shot(`${K}-62-practice-wall-plug-dropped`);
console.log('errors',JSON.stringify(await g.close()));

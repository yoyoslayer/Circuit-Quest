import {launch} from './wrcap.mjs';
const g=await launch('playground');await g.advance(.3);
await g.key('KeyF',.1);await g.walk(-6.6,-1,.4);let w=await g.walk(-6.3,-5.6,.4,8);
let s=await g.snap();console.log('arrived',w.arrived,JSON.stringify(s.player),'bends',s.rope.bends.length,'strain',s.rope.strain.toFixed(2),'alarmed',s.alarmed);
await g.zoom(-700);await g.shot('world-reacts-24-playground-cable-through-blob');
await g.orbit(-260,0);await g.shot('world-reacts-25-playground-cable-through-blob-orbit');
console.log(JSON.stringify(await g.close()));

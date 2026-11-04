import {open,P} from './common.mjs';
const g=await open();
await g.advance(.5);
// bench from the room before parts
await g.tp(0.2,0.6,.8);await g.zoom(-2000,.8);await g.shot(`${P}-30-bench-room-close`);
await g.orbit(450,0);await g.shot(`${P}-31-bench-room-o450`);await g.orbit(450,0);await g.shot(`${P}-32-bench-room-o900`);await g.orbit(-900,0,.3);
await g.zoom(2000,.5);
// fetch the crate the spec way
await g.walk(-8.8,2.95,.5);await g.key('KeyE',.3);
console.log('held',(await g.snap()).held);
await g.zoom(-2000,.8);await g.shot(`${P}-33-carry-crate-close`);await g.orbit(500,0);await g.shot(`${P}-34-carry-crate-side`);await g.orbit(-500,0,.3);await g.zoom(2000,.5);
await g.walk(1.3,-.6,.5);await g.key('KeyE',.4);
console.log('partsReady',(await g.snap()).station.partsReady);
await g.advance(1);await g.zoom(-2000,.8);await g.shot(`${P}-35-crate-on-sidetable`);await g.orbit(300,-100);await g.shot(`${P}-36-sidetable-orbit`);await g.orbit(-300,100,.3);
await g.walk(0,-.5,.4);await g.key('KeyE',.2);await g.advance(1.5);
await g.shot(`${P}-37-bench-view-board1`);
const s=await g.snap();console.log('atBench',s.atBench,'dc',s.drawCalls);
console.log('errors',JSON.stringify(await g.close()));

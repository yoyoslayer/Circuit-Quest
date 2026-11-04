import {launch} from '../cap.mjs';import {toBench,txt} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.3);
await toBench(g,log);
const A=async(n,a)=>{const r=await g.act(n,a);if(!r.ok)log('act fail',n,a);};
const place=async(...pos)=>{for(const [k,p] of pos.entries())for(const v of p){await A('pick',v);await A('slot',k);}};
await A('slot','across');await place([220]);await A('power');await g.advance(3.3);await A('signoff');
await A('flip');await place([47]);await A('power');await g.advance(3.3);
await g.key('Escape',.2);await g.advance(.1);await A('signoff');await g.advance(.4);await g.shot(P+'70-signoff-from-room');
await g.advance(1);await g.shot(P+'71-two-cabinets-lit');
// occlusion: behind the bench
await g.walk(-3.6,-2.0,.4);await g.walk(-3.4,-4.6,.4);await g.walk(0,-4.8,.4);let s=await g.snap();log('behind bench',JSON.stringify(s.player));await g.shot(P+'72-pip-behind-bench');
await g.orbit(0,-200);await g.shot(P+'73-pip-behind-bench-low');await g.orbit(0,200);
// next to the back cabinets
await g.walk(-6.5,-5.8,.4);await g.zoom(-1500);await g.shot(P+'74-pip-by-back-cabinets-zoom9');
await g.orbit(700,0);await g.shot(P+'75-pip-by-back-cabinets-orbit180');await g.orbit(-700,0);await g.zoom(800);
// inside storeroom, low orbit from the hall side
await g.walk(-4,1,.5);await g.walk(-5.5,6.4,.5);await g.walk(-8.6,5.6,.4);await g.orbit(-350,-150);await g.shot(P+'76-pip-in-storeroom-orbit');
await g.orbit(350,150);
// right wall working cabinets
await g.walk(-2,1,.5);await g.walk(8.6,2.2,.4);await g.orbit(-500,0);await g.shot(P+'77-pip-by-right-cabinets-orbit');
log('errors',JSON.stringify(await g.close()));

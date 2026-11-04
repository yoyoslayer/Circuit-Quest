import {launch} from '../cap.mjs';
const P='lunch-play-s';
const g=await launch('lunch',{fullfx:true});
const item=async(id)=>(await g.snap()).items.find(i=>i.id===id);
await g.walk(-3,7,.4);await g.key('KeyE');console.log('held',(await g.snap()).held);
await g.walk(.2,-1,.4);await g.walk(3,-5.6,.4);let s=await g.snap();console.log('at',JSON.stringify(s.player));
// face north (-z): tap W (screen up is roughly -z at default yaw)
await g.advance(.2,['KeyW']);await g.key('KeyQ',.05);await g.advance(3);
let w=await item('wedge');console.log('wedge after throw',JSON.stringify(w.pos));
await g.shot(P+'01-wedge-thrown');
// try to reach it
const r=await g.walk(w.pos.x,w.pos.z,.6,15);console.log('reach wedge arrived',r.arrived,JSON.stringify(r.state.player));
await g.key('KeyE');console.log('held after try',(await g.snap()).held);
await g.advance(10);w=await item('wedge');console.log('wedge after 10s',JSON.stringify(w.pos));
await g.orbit(700,0);await g.zoom(-800);await g.shot(P+'02-wedge-behind-conveyor');
// mop: throw it too
console.log('errors',await g.close());

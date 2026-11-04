import {launch} from '../cap.mjs';
const P='verify-lunch-play-';
const g=await launch('lunch',{fullfx:true});
for(const [x,z] of [[0,1.5],[0,-1.5],[7.4,-1]]){const r=await g.walk(x,z,.4,10);console.log('walk',x,z,r.arrived,r.state.player.x.toFixed(2),r.state.player.z.toFixed(2),'door',JSON.stringify(r.state.lunch.door),'wedged',r.state.lunch.doorWedged,'held',r.state.held,r.state.lunch.held?.id);}
await g.zoom(-600);await g.shot(P+'40-leaf-pin-no-wedge');
for(const k of [['KeyD'],['KeyS'],['KeyA'],['KeyW']]){const s=await g.advance(1,k);console.log('keys',k[0],s.player.x.toFixed(2),s.player.z.toFixed(2));}
console.log('errors',await g.close());

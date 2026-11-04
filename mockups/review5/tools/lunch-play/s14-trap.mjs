import {launch} from '../cap.mjs';
const P='lunch-play-t';
const g=await launch('lunch',{fullfx:true});
const W=async(x,z,r=.5)=>{const r2=await g.walk(x,z,r);if(!r2.arrived)console.log('STUCK',x,z,JSON.stringify(r2.state.player));};
const R=async(pts,r=.5)=>{for(const [x,z] of pts)await W(x,z,r);};
await W(-3,7,.4);await g.key('KeyE');await W(0,1.4);await g.key('KeyE');await g.advance(.5);
await W(2,8,.4);await g.key('KeyE');await W(.3,2,.45);await g.advance(4);await W(2,2);await g.key('KeyE');
await W(-10,7.5,.3);await g.key('KeyF');await R([[1,3],[.2,-1.2],[-3.5,-3]],.45);await g.key('KeyF');await g.advance(.5);
await W(-6.5,-4.8);await g.key('KeyE');await W(-5.7,-3.3);await g.key('KeyE');
await R([[-8.8,-5],[-11.2,-6.8]]);await g.key('KeyE');
await R([[-8.8,-5],[-5,-5]]);
await R([[-1.5,-2],[.3,-1.3],[.3,2.4],[10,1],[11.3,-4.4]]);await g.key('KeyE');await g.advance(.1);
await W(10,1);let s=await g.snap();console.log('items',JSON.stringify(s.items.filter(i=>['wedge','thick-dolly','mop','capacitor'].includes(i.id)).map(i=>[i.id,i.pos.x.toFixed(2),i.pos.z.toFixed(2)])));
await W(1,-.5);s=await g.snap();console.log('pip',JSON.stringify(s.player),'door',JSON.stringify(s.lunch.door));
await g.shot(P+'01-trapped');await g.zoom(-1000);await g.shot(P+'02-trapped-close');await g.orbit(600,40);await g.shot(P+'03-trapped-orbit');
for(const k of [['KeyD'],['KeyS'],['KeyA'],['KeyW'],['KeyD','ShiftLeft'],['KeyS','KeyD']]){s=await g.advance(1,k);console.log('keys',k.join('+'),JSON.stringify({x:s.player.x.toFixed(2),z:s.player.z.toFixed(2)}));}
await g.key('Space',.6);s=await g.snap();console.log('after jump',JSON.stringify(s.player));
s=await g.advance(1,['KeyS','Space']);console.log('jump+S',JSON.stringify(s.player));
console.log('errors',await g.close());

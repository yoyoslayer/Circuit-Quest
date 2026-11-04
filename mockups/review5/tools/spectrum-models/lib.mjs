import {launch} from '../cap.mjs';
export const K='spectrum-models';
export async function start(opts={}){
  const g=await launch('spectrum',{fullfx:true,...opts});
  let yaw=.14;
  g.face=async(Y,dy=0)=>{let dx=(yaw-Y)/.006;yaw=Y;while(Math.abs(dx)>1e-3){const s=Math.max(-600,Math.min(600,dx));await g.orbit(s,0,.05);dx-=s;}if(dy)await g.orbit(0,dy,.05);await g.advance(.8);};
  g.look=async(px,pz,ox,oz,dy=0)=>{const Y=Math.atan2(-(ox-px),-(oz-pz));await g.face(Y,dy);};
  g.route=async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK toward',x,z,JSON.stringify(res.state.player));}};
  g.S=async(n,name)=>{const p=await g.shot(`${K}-${n}-${name}`);console.log('shot',n,name);return p;};
  return g;
}

import {launch} from '../cap.mjs';
const P='spectrum-play';
const g=await launch('spectrum',{fullfx:true});
const log=(...a)=>console.log(...a);
const W=async(x,z,r=.5)=>{const res=await g.walk(x,z,r);if(!res.arrived)log('STUCK',x,z);return res;};
await g.advance(1);
// Mark C area at start (1,5.8): walk near and zoom
await W(-.5,4.6,.5);await g.zoom(-700);await g.shot(`${P}-95-mark-C-clutter`);await g.zoom(700);
await W(-3.5,3.55,.4);await g.key('KeyE',.2);await g.advance(1.2);
await g.crop(`${P}-96-crop-band-labels`,{x:130,y:520,width:350,height:120});
await g.crop(`${P}-97-crop-power-labels`,{x:960,y:520,width:340,height:120});
await g.crop(`${P}-98-crop-bench-right-edge`,{x:1240,y:420,width:200,height:250});
// marker at game camera: crop
await g.key('KeyE',.3);await g.advance(.5);await g.shot(`${P}-99-marker-after-standup`);
log('ERR',JSON.stringify(await g.close()));

import {launch} from '../cap.mjs';
const P='meeting-models';
const g=await launch('meeting',{fullfx:true});
await g.advance(.5);
const go=async (pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('stuck',x,z,JSON.stringify(res.state.player));}};
await go([[-8,-1.4],[6,-1.2],[12.3,-1.2],[12.3,-3.4]],.4);
await g.orbit(350,0);await g.shot(`${P}-54-boardroom-behind-backwall`);
await g.orbit(0,-200);await g.shot(`${P}-55-boardroom-behind-low`);
await g.orbit(0,200);await g.orbit(-350,0);
await g.zoom(-2000);
await g.crop(`${P}-56-crop-pip-hat-back`,{x:520,y:200,width:400,height:420});
await g.orbit(350,0);await g.crop(`${P}-57-crop-pip-hat-front`,{x:520,y:200,width:400,height:420});
await g.orbit(175,0);await g.crop(`${P}-58-crop-pip-hat-side`,{x:520,y:200,width:400,height:420});
await g.orbit(-525,0);
// mail cart coupler at default zoom
await g.zoom(1600);await go([[12.3,-1.2],[6,-1.2],[-1.5,-1.3],[-1.5,3.2]],.4);await g.advance(.3);
let s=await g.snap();console.log('coupler',JSON.stringify(s.items.find(i=>i.id==='coupler')));
await g.shot(`${P}-59-mailcart-default-zoom`);
console.log('errors',JSON.stringify(await g.close()));

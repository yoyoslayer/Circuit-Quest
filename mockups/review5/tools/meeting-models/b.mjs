import {launch} from '../cap.mjs';
const P='meeting-models';
const g=await launch('meeting',{fullfx:true});
await g.advance(.5);
await g.zoom(-2000);
await g.crop(`${P}-10-crop-reel-plug`,{x:440,y:250,width:560,height:400});
const stops=[
 ['11-printer-strip',-9.2,-1.2],
 ['12-boxblock',-10.8,2.8],
 ['13-vending-coffee',-13.2,3.4],
 ['14-cooler-boxes',-13.4,8.6],
 ['15-whiteboard',-9.6,6.6],
 ['16-mailcart',-3.3,6.4],
];
for(const [n,x,z] of stops){const r=await g.walk(x,z,.4);console.log(n,r.arrived,JSON.stringify(r.state.player));await g.shot(`${P}-${n}`);}
// orbit around the mail cart
await g.orbit(350,0);await g.shot(`${P}-17-mailcart-back`);
await g.orbit(-175,0);await g.shot(`${P}-18-mailcart-side`);
console.log('errors',JSON.stringify(await g.close()));

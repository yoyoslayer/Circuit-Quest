import {launch} from '../cap.mjs';
const P='arcade-models';
const g=await launch('arcade',{fullfx:true});
await g.advance(.5);
let n=10;
async function at(name,x,z,views=[[0,0]]){
  const w=await g.walk(x,z,.4,40);const p=(await g.snap()).player;
  console.log(name,'arrived',w.arrived,p.x.toFixed(2),p.z.toFixed(2));
  await g.key('KeyC',.3);await g.zoom(-2000,.8);
  for(const [dx,dy] of views){if(dx||dy)await g.orbit(dx,dy);await g.shot(`${P}-${n++}-${name}${dx?`-o${dx}`:''}${dy?`-p${dy}`:''}`);}
}
await at('tray-counter',-7.6,5.2,[[0,0],[262,0]]);
await at('store-shelf',-8.4,6.4,[[0,0],[-200,0]]);
await at('storeroom-sign',-7.4,1.6,[[0,0],[524,0]]);
await at('pinball',-6.6,-4.3,[[0,0],[-150,0]]);
await at('rhythm',-4.6,-4.4,[[0,0]]);
await at('changer-prize',0,-5.9,[[0,0],[200,0]]);
await at('claw-handheld',5.9,-4.4,[[0,0],[150,0]]);
await at('hopper',8.1,-2.4,[[0,0],[-262,0]]);
console.log(await g.close());

import {open,P} from './common.mjs';
const g=await open();
await g.advance(.5);
let n=Number(process.argv[2]);const spots=JSON.parse(process.argv[3]);const z0=Number(process.argv[4]??-2000);
for(const [name,x,z,views] of spots){
  await g.tp(x,z,.8);await g.zoom(z0,.8);let cx=0,cy=0;
  for(const [dx,dy] of views){if(dx-cx||dy-cy)await g.orbit(dx-cx,dy-cy);cx=dx;cy=dy;await g.shot(`${P}-${n++}-${name}${dx?`-o${dx}`:''}${dy?`-p${dy}`:''}`);}
  if(cx||cy)await g.orbit(-cx,-cy,.3);
}
const s=await g.snap();console.log('damage',s.damage,'cost',s.cost);
console.log('errors',JSON.stringify(await g.close()));

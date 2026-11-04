import {launch} from '../cap.mjs';
const P='qfn-models';
const g=await launch('qfn',{fullfx:true});
await g.advance(.5);
let n=Number(process.argv[2]??10);
const spots=JSON.parse(process.argv[3]);
for(const [name,x,z,views] of spots){
  const w=await g.walk(x,z,.4,40);const p=(await g.snap()).player;
  console.log(name,'arrived',w.arrived,p.x.toFixed(2),p.z.toFixed(2));
  await g.zoom(-2000,.8);
  for(const [dx,dy] of views){if(dx||dy)await g.orbit(dx,dy);await g.shot(`${P}-${n++}-${name}${dx?`-o${dx}`:''}${dy?`-p${dy}`:''}`);}
  // reset orbit
  const tot=views.reduce((s,v)=>s+v[0],0),toty=views.reduce((s,v)=>s+v[1],0);if(tot||toty)await g.orbit(-tot,-toty,.3);
}
console.log('errors',JSON.stringify(await g.close()));

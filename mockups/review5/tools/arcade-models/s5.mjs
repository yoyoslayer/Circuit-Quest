import {launch} from '../cap.mjs';
const P='arcade-models';
const g=await launch('arcade',{fullfx:true});
const settle=async(n=20)=>{for(let i=0;i<n;i++)await g.advance(1/60);};
const shot=async(name)=>{await settle();return g.shot(`${P}-${name}`);};
let n=50;
async function at(name,x,z,views=[[0,0]]){
  const w=await g.walk(x,z,.4,40);const p=(await g.snap()).player;
  console.log(name,'arrived',w.arrived,p.x.toFixed(2),p.z.toFixed(2));
  await g.key('KeyC',.2);await g.zoom(-2000,.3);
  for(const [dx,dy] of views){if(dx||dy)await g.orbit(dx,dy,.2);await shot(`${n++}-${name}${dx?`-o${dx}`:''}${dy?`-p${dy}`:''}`);}
}
await settle();
// game-camera crop of back wall (default zoom 22)
await g.shot(`${P}-49-start-settled`);
await g.crop(`${P}-49b-crop-backwall-gamecam`,{x:350,y:60,width:760,height:260});
await at('west-wall-orbit',-5.9,5.2,[[262,0]]);
await at('right-wall-cabs',7.4,1.6,[[0,0],[-200,0]]);
await at('left-wall-cabs',-7.6,-1.2,[[0,0],[200,0]]);
await at('desk-cooler',7.6,5.3,[[0,0],[-200,0]]);
await at('lounge-beanbags',3.9,3.6,[[0,0],[0,200]]);
await at('poster-prize',1.4,-5.6,[[0,0]]);
await at('lamp-backleft',-3.6,-5.6,[[0,0]]);
console.log(await g.close());

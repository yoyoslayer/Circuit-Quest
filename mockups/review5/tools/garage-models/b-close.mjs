import {launch} from '../cap.mjs';
const P='garage-models-';
const part=process.argv[2]??'1';
const g=await launch('garage',{fullfx:true});
await g.advance(.3);await g.zoom(-2000);
const set1=[
 ['10-robot-pad',[[2,1],[6.4,-3.3]]],
 ['12-test-stand',[[2.9,-1.1],[2.9,-3.6]]],
 ['14-bench-front',[[0,-1.1]]],
 ['16-toolchest-pegboard',[[-3,1],[-4.6,-5.4]]],
 ['18-dock',[[-6.4,2.3],[-8.1,-1.2],[-8.1,-4.4]]],
 ['20-wheels-right',[[3.9,1.9],[8.4,-1.6]]],
 ['22-lamp-backright',[[8.6,-5.3]]],
];
const set2=[
 ['30-rug-coolbox',[[-3,3],[-6.2,3.0]]],
 ['32-desk-coworker',[[3.9,1.9],[6.6,3.5]]],
 ['34-cabinets-right',[[8.6,-.2]]],
 ['36-dolly',[[8.2,2.8]]],
 ['38-clutter-cab-behind-bench',[[2.9,-1.1],[2.9,-4],[-.6,-4.0]]],
 ['40-left-front-corner',[[-6.4,2.3],[-8.4,5.2]]],
 ['42-front-cart',[[-1,5.0]]],
];
for(const [name,pts] of part==='1'?set1:set2){
  for(const [x,z] of pts){const r=await g.walk(x,z,.5,25);if(!r.arrived)console.log('stall',name,x,z,JSON.stringify(r.state.player));}
  await g.advance(.4);await g.shot(P+name);
  await g.orbit(524,0,.8);const n=name.replace(/^(\d+)/,(m)=>String(+m+1));await g.shot(P+n+'-o180');await g.orbit(-524,0,.4);
}
console.log('ERR',JSON.stringify(await g.close()));

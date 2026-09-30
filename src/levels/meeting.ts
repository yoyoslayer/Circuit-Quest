import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
import {CHAIRC} from '../render/kit';
const props:PropSpec[]=[],npcs:NpcSpot[]=[{x:-12.4,z:5.9,standing:true},{x:-12.7,z:2.8,standing:true}];
for(const [px,pz] of [[-6,-4.5],[-1,-4.5],[4,-4.5],[-6,1.5],[-1,1.5],[4,1.5],[-6,7.6],[-.8,7.6]]){
  for(const dx of [-.85,.85])for(const dz of [-.48,.48]){
    const x=px+dx,z=pz+dz,n=props.length;props.push({kind:'desk',x,z,variant:(dz<0?10:0)+n%5});
    props.push({kind:'monitor',x,z:z+(dz<0?.17:-.17),y:1.2,rotation:dz<0?Math.PI:0,variant:n%7});
    props.push({kind:'chair',x,z:z+(dz<0?-1:1),rotation:dz<0?0:Math.PI,color:CHAIRC[props.length%CHAIRC.length]});
    props.push({kind:'mug',x:x+.55,z,y:1.08},{kind:'paper',x:x-.38,z,y:.99},{kind:'paper',x:x+.22,z:z+.16,y:1.01},{kind:'bin',x:x+.66,z:z+.64});
    if(npcs.length<22)npcs.push({x,z:z+(dz<0?-1:1)});
  }
}
for(let i=0;i<18;i++){props.push({kind:'cabinet',x:-9+i*.85,z:-9.2});props.push({kind:'box',x:-9+i*.85,z:-9.2,y:1.9});}
for(const [x,z] of [[-9,-8],[8,-8],[-9,8],[7,8],[14,8],[14,-2],[-3,0]])props.push({kind:'plant',x,z});
for(let i=0;i<14;i++)props.push({kind:'box',x:-12+(i%3)*.75,z:-1+Math.floor(i/3)*.72});
props.push({kind:'printer',x:-10,z:-2},{kind:'vending',x:-14.5,z:2},{kind:'cooler',x:-13.5,z:7},{kind:'whiteboard',x:-10,z:5,rotation:.45});
// The boardroom's power strip is missing from its spot by the door: it sits on the printer stand.
props.push({kind:'strip',x:-8.6,z:-3.2,id:'strip'});
props.push({kind:'cart',x:-3,z:4.7,id:'mail-cart'},{kind:'reel',x:-3,z:4.7,y:1,id:'extension'},{kind:'coupler',x:-3.6,z:4.7,y:.9,id:'coupler'});
props.push({kind:'desk',x:-14,z:5},{kind:'coffee',x:-14,z:5,y:1.3,id:'coffee'},{kind:'reel',x:-13,z:4.5,id:'coffee-reel'});
props.push({kind:'sofa',x:12,z:6.4,rotation:Math.PI},{kind:'beanbag',x:10,z:4.6,color:'#ffc94d'},{kind:'beanbag',x:14.6,z:4.4,color:'#5b9cf0'},{kind:'desk',x:12.5,z:4.2,color:'#b98552'},{kind:'pingpong',x:6,z:7.3},{kind:'bookshelf',x:9,z:3,rotation:Math.PI/2});
for(let i=0;i<8;i++){const x=i%2?13.2:10.8,z=-7.9+Math.floor(i/2)*1.05;props.push({kind:'chair',x,z,rotation:i%2?-Math.PI/2:Math.PI/2,color:'#3a3d55'});if(i<4)npcs.push({x,z});}
for(let i=0;i<4;i++)props.push({kind:'box',x:-15.2+(i%2)*.8,z:7.6+Math.floor(i/2)*.8});
for(let i=0;i<3;i++)props.push({kind:'glass',x:9.3,z:-8+i*2.5,id:`glass-${i}`});
export const meeting:Level={id:'meeting',name:'BIG MEETING',number:'01',tagline:'Big meeting. Little technician.',badge:'projector',next:'lunch',deadline:240,width:33,depth:20,spawn:{x:-10,z:-5.8},anchor:{x:-11.4,z:-7.8},target:{x:12.3,z:-2.25},switchAt:{x:12,z:-4.4},length:23.2,props,npcs,
  obstacles:[...[[-4.75,-2.9],[.15,-2.9],[5.1,-2.9],[-4.75,4.2],[.15,4.2]].map(([x,z],i)=>({id:`pillar-${i}`,minX:x-.45,maxX:x+.45,minZ:z-.45,maxZ:z+.45})),
    {id:'closet-east',minX:-12.025,maxX:-11.775,minZ:-10,maxZ:-5.5},{id:'closet-front',minX:-16.5,maxX:-11.775,minZ:-5.625,maxZ:-5.375}]};

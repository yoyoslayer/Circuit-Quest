import type {Level} from './types';
import type {PropSpec} from '../props/prefabs';
const props:PropSpec[]=[],npcs:{x:number;z:number}[]=[];
for(const [px,pz] of [[-6,-4.5],[-1,-4.5],[4,-4.5],[-6,1.5],[-1,1.5],[4,1.5],[-6,7.6],[-.8,7.6]]){
  for(const dx of [-.85,.85])for(const dz of [-.48,.48]){
    const x=px+dx,z=pz+dz;props.push({kind:'desk',x,z});
    props.push({kind:'monitor',x,z:z+(dz<0?.17:-.17),y:1.2,rotation:dz<0?Math.PI:0});
    props.push({kind:'chair',x,z:z+(dz<0?-1:1),rotation:dz<0?Math.PI:0,color:['#d89063','#80b1ac','#ac91b5'][props.length%3]});
    props.push({kind:'mug',x:x+.55,z,y:1.08},{kind:'paper',x:x-.38,z,y:.99},{kind:'paper',x:x+.22,z:z+.16,y:1.01},{kind:'bin',x:x+.66,z:z+.64});
    if(npcs.length<20)npcs.push({x,z:z+(dz<0?-1:1)});
  }
}
for(let i=0;i<18;i++){props.push({kind:'cabinet',x:-9+i*.85,z:-9.2});props.push({kind:'box',x:-9+i*.85,z:-9.2,y:1.9});}
for(const [x,z] of [[-9,-8],[8,-8],[-9,8],[7,8],[14,8],[14,-2],[-3,0]])props.push({kind:'plant',x,z});
for(let i=0;i<14;i++)props.push({kind:'box',x:-12+(i%3)*.75,z:-1+Math.floor(i/3)*.72});
for(let i=0;i<4;i++)props.push({kind:'cabinet',x:-14.7+i*.85,z:-8.8,color:'#333d53'});
props.push({kind:'printer',x:-10,z:-2},{kind:'vending',x:-14.5,z:2},{kind:'cooler',x:-13.5,z:7},{kind:'whiteboard',x:-10,z:5,rotation:.45});
props.push({kind:'cart',x:-3,z:4.7,id:'mail-cart'},{kind:'reel',x:-3,z:4.7,y:1,id:'extension'},{kind:'coupler',x:-3.6,z:4.7,y:.9,id:'coupler'});
props.push({kind:'desk',x:-14,z:5},{kind:'coffee',x:-14,z:5,y:1.3,id:'coffee'},{kind:'reel',x:-13,z:4.5,id:'coffee-reel'});
props.push({kind:'sofa',x:12,z:6},{kind:'desk',x:12,z:4.2},{kind:'pingpong',x:6,z:7.3},{kind:'bookshelf',x:9,z:3,rotation:Math.PI/2});
for(let i=0;i<3;i++)props.push({kind:'desk',x:12,z:-7+i*.9});
for(let i=0;i<8;i++){props.push({kind:'chair',x:i%2?13.2:10.8,z:-7+Math.floor(i/2)*.85});if(i<4)npcs.push({x:i%2?13.2:10.8,z:-7+Math.floor(i/2)*.85});}
for(let i=0;i<3;i++)props.push({kind:'glass',x:9.3,z:-8+i*2.5,id:`glass-${i}`});
export const meeting:Level={id:'meeting',width:33,depth:20,spawn:{x:-12,z:-6},anchor:{x:-11.4,z:-7.8},target:{x:12.3,z:-2.25},length:26,props,npcs,
  obstacles:[[-4.75,-2.9],[.15,-2.9],[5.1,-2.9],[-4.75,4.2],[.15,4.2]].map(([x,z],i)=>({id:`pillar-${i}`,minX:x-.45,maxX:x+.45,minZ:z-.45,maxZ:z+.45}))};

import type {Level} from './types';
import type {PropSpec} from '../props/prefabs';
const props:PropSpec[]=[
  {kind:'supply',id:'supply-a',x:-13,z:3,color:'#f2b93b'},{kind:'supply',id:'supply-b',x:-13,z:7,color:'#f08a4b'},
  {kind:'capcart',id:'capacitor',x:-12,z:-7},{kind:'coolbox',id:'cooler-box',x:-10,z:-8},
  {kind:'dolly',id:'thick-dolly',x:-10,z:7.5},{kind:'lamp',id:'portable-lamp',x:5,z:-3},
  {kind:'bookshelf',id:'shelf',x:-7.4,z:-5,rotation:Math.PI/2},
  {kind:'wedge',id:'wedge',x:-3,z:7},{kind:'mop',id:'mop',x:2,z:8},
  {kind:'bridge',id:'bridge-1',x:7,z:8},{kind:'bridge',id:'bridge-2',x:9,z:8},{kind:'bridge',id:'bridge-3',x:11,z:8},
  {kind:'splitter',id:'splitter-1',x:-14,z:0},{kind:'splitter',id:'splitter-2',x:-13.3,z:0},{kind:'splitter',id:'splitter-3',x:-12.6,z:0},
  {kind:'bin',x:5,z:-3},{kind:'plant',x:15.5,z:3},{kind:'desk',x:-.6,z:-4.3},{kind:'desk',x:1.2,z:-4.3},{kind:'tray',id:'tray',x:-2,z:-7,y:1.1}
];
for(let i=0;i<10;i++)props.push({kind:'box',x:-14+(i%3)*.9,z:-3-Math.floor(i/3)*.8});
for(let i=0;i<8;i++)props.push({kind:'mug',x:-1.2+i*.42,z:-4.45,y:1.1},{kind:'paper',x:-1.2+i*.42,z:-4.2,y:.98});
export const lunch:Level={id:'lunch',name:'LUNCH RUSH',number:'02',tagline:'Hot trays, a warm fridge and five bars per cart.',badge:'tray',width:33,depth:20,spawn:{x:-10,z:5},anchor:{x:-13,z:7},target:{x:12,z:-6},length:27,props,npcs:[
  // Chef by the oven, the liftman, and a hungry lunch crowd in the corridor.
  {x:-1.2,z:-5.9,color:'#fffaf0',acc:['tuft'],yaw:2.8,chef:true},{x:13,z:0,color:'#b392f0',acc:['headphones'],yaw:0},
  {x:-3.8,z:9,color:'#5b9cf0',acc:['mug','tuft'],mood:'happy',yaw:3},{x:-2.4,z:8.9,color:'#f08a4b',acc:['glasses'],yaw:3.4},
  {x:12.6,z:7.4,color:'#b392f0',acc:['bun','mug'],mood:'sleepy',yaw:2.5},{x:13.9,z:8.9,color:'#f78fd0',acc:['bun'],mood:'happy',yaw:3.3},
  {x:5.1,z:9.1,color:'#8fd3c8',acc:['glasses'],yaw:2.2},{x:-11.2,z:5.2,color:'#6cc58a',acc:['tuft','glasses'],yaw:.9},{x:-6.9,z:-8.2,color:'#ffc94d',acc:['cap'],mood:'happy',yaw:.3}],obstacles:[
  {id:'store-divider-1',minX:-7.9,maxX:-7.6,minZ:-10,maxZ:-6.5},
  {id:'store-divider-2',minX:-7.9,maxX:-7.6,minZ:-3.5,maxZ:0},
  {id:'kitchen-front-left',minX:-7.8,maxX:-1.5,minZ:0,maxZ:.3},
  {id:'kitchen-front-right',minX:1.5,maxX:8,minZ:0,maxZ:.3},
  {id:'lift-divider-back',minX:8,maxX:8.3,minZ:-10,maxZ:-7.85},
  {id:'lift-divider-front',minX:8,maxX:8.3,minZ:-6.15,maxZ:-2},
  {id:'store-front',minX:-16.5,maxX:-7.8,minZ:0,maxZ:.3}
]};

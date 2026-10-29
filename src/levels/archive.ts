import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
import {PARTS,binSpot} from '../stations/archive/logic';
// The Archive: a warm library wing. The datasheet desk sits against the back stacks, the test
// rig to its left, the stock counters (bins A–C) to the right, the post desk by the door.
const SHELF_COLOR:Record<string,string>={A:'#d9a441',B:'#98a257',C:'#c7774a'};
const props:PropSpec[]=[
  {kind:'tray',id:'orders',x:-8.75,z:3.15,y:.9,color:'#d9a441'},
  // One box per stocked part, on its counter (the label on top names it).
  ...PARTS.map(p=>{const s=binSpot(p.bin);return {kind:'box' as const,id:`part:${p.mpn}`,x:s.x,z:s.z,y:.72,color:SHELF_COLOR[p.bin[0]]};}),
  // Reading-room clutter: chairs, book carts, filing cabinets, plants, lamps, paper and mugs.
  ...[[-3.2,2.2,0],[-1.2,2.2,0],[-3.2,4.2,Math.PI],[-1.2,4.2,Math.PI],[1.2,2.2,0],[3.2,2.2,0],[1.2,4.2,Math.PI],[3.2,4.2,Math.PI]].map(([x,z,r],i)=>({kind:'chair' as const,x,z,rotation:r,color:['#8a9a4a','#d9a441','#a44a3f','#6f7a3a'][i%4]})),
  {kind:'cart',x:-5.2,z:6.2,color:'#7a4b2c'},{kind:'cart',x:9.4,z:3.4,color:'#8a9a4a'},
  {kind:'cabinet',x:-10.3,z:-.3,color:'#8a9a4a'},{kind:'cabinet',x:-10.3,z:.5,color:'#8a9a4a'},{kind:'cabinet',x:10.2,z:-6.8,color:'#b98552'},{kind:'cabinet',x:10.2,z:-6,color:'#b98552'},
  {kind:'bookshelf',x:9.9,z:1.8,rotation:-Math.PI/2,color:'#7a4b2c'},{kind:'bookshelf',x:6.8,z:7.3,color:'#7a4b2c'},
  {kind:'plant',x:-10.2,z:6.9},{kind:'plant',x:10.2,z:6.8},{kind:'plant',x:3.6,z:-7.2},{kind:'plant',x:-5.6,z:1.3},
  {kind:'lamp',x:-7.2,z:6.8},{kind:'lamp',x:9.8,z:5.4},{kind:'bin',x:-4.1,z:-4.6},{kind:'bin',x:8.9,z:-1.6},
  {kind:'beanbag',x:7.6,z:5.6,color:'#d9a441'},{kind:'beanbag',x:8.7,z:6.6,color:'#8a9a4a'},
  {kind:'mug',x:-2.6,z:3.0,y:.9},{kind:'mug',x:2.8,z:3.4,y:.9,color:'#8a9a4a'},
  {kind:'paper',x:-1.6,z:3.4,y:.83},{kind:'paper',x:1.6,z:3.0,y:.83},{kind:'paper',x:-4.2,z:7.1},{kind:'paper',x:.6,z:6.1},{kind:'paper',x:5.1,z:2.3},
  {kind:'box',x:-9.9,z:5.9,color:'#b98552'},{kind:'box',x:-9.9,z:5.1,color:'#c99a64'},
  {kind:'cone',x:-5.1,z:-2.3},
];
// Coworkers: the three customers wait by the reading tables, the archivist minds the post desk.
const npcs:NpcSpot[]=[
  {x:-.2,z:5.6,standing:true,acc:['glasses'],mood:'happy'},{x:1.6,z:5.9,standing:true,acc:['headphones']},{x:3.2,z:5.5,standing:true,acc:['bun'],mood:'sleepy'},
  {x:-8.3,z:1.6,standing:true,acc:['glasses','tie'],yaw:0},{x:9.4,z:-4.7,standing:true,acc:['cap'],yaw:-Math.PI/2},
];
export const archive:Level={id:'archive',name:'THE ARCHIVE',number:'05',tagline:'Three work orders. Read the fine print.',badge:'archive',station:'archive',
  width:22,depth:16,spawn:{x:-6.2,z:4.4},anchor:{x:-10,z:6},target:{x:-2,z:-4.35},length:10,obstacles:[],props,npcs};

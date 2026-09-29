import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Delivery Depot: a loading dock. The dispatch bench stands mid-room with the depot board on it;
// two orange trucks are backed up to the roller doors on the right, and the lamp and motor carts
// they delivered wait at the dock edge. Pallet racks line the back left.
const props:PropSpec[]=[
  {kind:'cart',id:'lampcart',x:5.9,z:-2.9,color:'#ffc94d'},{kind:'cart',id:'motorcart',x:9,z:-2.9,color:'#3f7fd6'},
  // Parcels and pallets off the trucks (all of it can be knocked about).
  ...[[7.4,-3.3],[7.6,-2.5],[10.2,-2.2],[10.3,-1.4],[5.4,2.2],[-9.8,-1.4],[-9.6,-.6],[-8.8,-1]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%3===0?'#c98f5a':i%3===1?'#d7a56d':'#b5835a'})),
  {kind:'cone',x:4.6,z:-3.4},{kind:'cone',x:4.6,z:-.4},{kind:'cone',x:10.2,z:.6},{kind:'cone',x:-4.6,z:2.6},
  {kind:'cart',x:-6.8,z:3.4,color:'#f28c28'},{kind:'reel',x:-9.6,z:3.2,color:'#f28c28'},{kind:'coolbox',x:-8.4,z:6.6,color:'#e9f0f2'},
  {kind:'desk',x:6.8,z:5.8,variant:2},{kind:'monitor',x:6.8,z:6,y:1.2,variant:1},{kind:'chair',x:6.8,z:4.8,color:'#f28c28'},
  {kind:'mug',x:6.4,z:5.7,y:1.1},{kind:'paper',x:7.2,z:5.6,y:1.05},{kind:'paper',x:7.4,z:5.8,y:1.05},
  {kind:'chair',x:-2.4,z:1.9,color:'#3f7fd6'},{kind:'chair',x:2.9,z:2.1,color:'#ffc94d'},{kind:'chair',x:3.4,z:-4.6,color:'#e5684d'},
  {kind:'plant',x:-10,z:1.2},{kind:'plant',x:10,z:7},{kind:'plant',x:1.6,z:-7.2},{kind:'bin',x:-3.8,z:-.6},{kind:'bin',x:3.6,z:-.4},
  {kind:'cooler',x:10,z:3.4},{kind:'cabinet',x:10,z:4.6,color:'#c9a07a'},{kind:'mop',x:-2.6,z:-6.9},
  {kind:'paper',x:-5.2,z:2.2},{kind:'paper',x:1.2,z:3.1},{kind:'paper',x:8.2,z:1.2},
  {kind:'box',x:-4.4,z:6.8,color:'#d7a56d'},{kind:'box',x:-3.7,z:6.9,color:'#c98f5a'},{kind:'beanbag',x:-1.2,z:6.6,color:'#f28c28'},
];
// Three dock hands: a driver by the trucks, the dispatcher at the desk, one stacking the racks.
const npcs:NpcSpot[]=[
  {x:7.5,z:-.8,standing:true,acc:['cap'],mood:'happy',yaw:-2.4},{x:6.8,z:4.4,standing:true,acc:['headphones'],yaw:Math.PI},
  {x:-7.2,z:-5.6,standing:true,acc:['glasses'],mood:'sleepy',yaw:Math.PI*.1},
];
export const depot:Level={id:'depot',name:'DELIVERY DEPOT',number:'11',tagline:'Energy per charge, charge per second, and a belt that races when the rails short.',badge:'truck',station:'depot',
  width:22,depth:16,spawn:{x:-3.5,z:4.6},anchor:{x:-10,z:6},target:{x:0,z:-1.5},length:10,obstacles:[],props,npcs};

import type {Level,NpcSpot} from './types';
import type {PropSpec} from '../props/prefabs';
// Clockwork Kitchen: a retro diner kitchen. The oven bench runs across the middle with the cook
// line and the big reference clock behind it; the clock-module shelf and the dough trays wait in
// the storeroom corner by the door; a diner counter with stools fills the front right.
const props:PropSpec[]=[
  {kind:'cart',id:'shelf',x:-7.4,z:6.1,color:'#8fd9c0'},
  {kind:'tray',id:'dough',x:-8.6,z:2.6,color:'#e5484d'},
  // Stock, pans and clutter (all of it can be knocked about).
  ...[[-10,6.6],[-9.2,6.8],[-10,5.8],[9.6,-2.8],[9.8,-1.9]].map(([x,z],i)=>({kind:'box' as const,x,z,color:i%2?'#c98f5a':'#d7a56d'})),
  {kind:'tray',x:-6.2,z:6.8,color:'#dfe4ea'},{kind:'tray',x:5.8,z:-5.6,color:'#dfe4ea'},{kind:'coolbox',x:-5.6,z:5.9,color:'#8fd9c0'},
  {kind:'chair',x:-2.8,z:1.4,color:'#e5484d'},{kind:'chair',x:2.9,z:1.6,color:'#8fd9c0'},{kind:'chair',x:-5,z:.6,color:'#ffc94d'},
  {kind:'plant',x:-10,z:-4.6},{kind:'plant',x:9.8,z:7},{kind:'plant',x:9.7,z:.2},
  {kind:'bin',x:-4,z:-.9},{kind:'bin',x:4.2,z:-.7},{kind:'cone',x:-2.6,z:-5.2},{kind:'cone',x:3,z:3.4},{kind:'mop',x:-6.6,z:-5.8},
  {kind:'mug',x:5.4,z:4.35,y:1.12},{kind:'mug',x:7.2,z:4.3,y:1.12,color:'#e5484d'},{kind:'paper',x:-3.4,z:2.6},{kind:'paper',x:1.8,z:3.1},
  {kind:'cooler',x:9.6,z:1.4},{kind:'cabinet',x:-7.6,z:-6.9,color:'#dfe4ea'},{kind:'cabinet',x:-6.8,z:-6.9,color:'#dfe4ea'},
  {kind:'cart',x:6.4,z:-2.2,color:'#e5484d'},{kind:'beanbag',x:-2,z:6.6,color:'#8fd9c0'},{kind:'lamp',x:1.6,z:6.8},
];
// Three cooks: one at the range, one at the pie case, one in the storeroom; a diner at the counter.
const npcs:NpcSpot[]=[
  {x:-2.6,z:-6.3,standing:true,chef:true,mood:'happy',yaw:Math.PI},{x:6.1,z:-6.3,standing:true,chef:true,acc:['glasses'],yaw:Math.PI*.9},
  {x:-8.4,z:4.2,standing:true,chef:true,mood:'sleepy',yaw:Math.PI/2},{x:6.7,z:5.5,standing:true,acc:['cap'],yaw:0},
];
export const clockwork:Level={id:'clockwork',name:'CLOCKWORK KITCHEN',number:'10',tagline:'Burnt trays and a wandering clock. Pick the right timing reference.',badge:'kitchenclock',station:'clockwork',
  width:22,depth:16,spawn:{x:-4.5,z:4.4},anchor:{x:-10,z:6},target:{x:0,z:-1.55},length:10,obstacles:[],props,npcs};

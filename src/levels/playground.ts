import type {Level} from './types';
export const playground:Level={id:'playground',name:'CABLE PLAYGROUND',number:'00',tagline:'A little tension goes a long way.',badge:'bolt',next:'meeting',width:20,depth:20,
  // A few crates, cones and a lounge corner round the edges; the drag to the lamp, the slingshot run
  // and the pins stay clear.
  clutter:{seed:1,step:2.6,recipes:['crates','cones','lounge','crates','plants'],fill:['box','cone','box'],max:90,
    lanes:[{points:[[-7,5],[-5,-1],[-4,-4],[5.8,-5.5],[6.6,-5.9]],r:1.3},{points:[[-7,5],[9,3.7]],r:1.3},{points:[[9,-1],[9,8]],r:1.1},{points:[[4.4,5.3],[5.5,5.3]],r:1.3}]},spawn:{x:-7,z:5},anchor:{x:-8,z:4},target:{x:7,z:-6},switchAt:{x:7.55,z:-6.35},length:19,
  obstacles:[{id:'pillar-a',minX:-2,maxX:-.6,minZ:-2,maxZ:-.6},{id:'pillar-b',minX:2.5,maxX:3.9,minZ:2,maxZ:3.4}],
  props:[
    // The obstacle course: crate stacks and strewn chairs between the reel and the lamp, to drag
    // the cable through and fling. (The slingshot test pulls the cable taut across the z≈4.6 row.)
    {kind:'box',x:-4,z:4.6,rotation:.2},{kind:'box',x:-3.2,z:4.4,rotation:-.1},{kind:'box',x:-2.4,z:4.8,rotation:.35},{kind:'box',x:-3.7,z:4.55,y:.95,rotation:.5},{kind:'box',x:-2.7,z:4.65,y:.95,rotation:-.3},
    {kind:'box',x:1,z:1,rotation:.1},{kind:'box',x:1.8,z:1.3,rotation:-.4},{kind:'box',x:1.3,z:1.1,y:.95,rotation:.7},{kind:'box',x:-1.2,z:6.4,rotation:.25},
    {kind:'chair',x:-1,z:3.6,rotation:.4},{kind:'chair',x:.6,z:5,rotation:-.6},{kind:'chair',x:3,z:5.6,rotation:1},{kind:'chair',x:-4.6,z:1.6,rotation:2.1},{kind:'chair',x:4.4,z:-.4,rotation:-2.4},
    {kind:'cone',x:6,z:-2},{kind:'cone',x:6.6,z:-1.2},{kind:'cone',x:5.4,z:-1.2},{kind:'cone',x:-6,z:7.5},{kind:'cone',x:1,z:-6.5},{kind:'cone',x:3,z:-7.2},
    {kind:'bin',x:-7.8,z:-7.6},{kind:'bin',x:8.6,z:-3},{kind:'box',x:8.2,z:8.2,y:.47},{kind:'box',x:8.9,z:8.4,y:.47},{kind:'box',x:8.5,z:8.3,y:1.1},{kind:'box',x:-7.6,z:-8.5},
    {kind:'plant',x:-8.8,z:8.6},{kind:'plant',x:8.9,z:-8.6},
    // Six white pins in a bowling triangle: a target for anything a taut cable flings.
    ...([[4.4,5.3],[4.95,5],[4.95,5.6],[5.5,4.7],[5.5,5.3],[5.5,5.9]] as const).map(([x,z],i)=>({kind:'cone' as const,x,z,color:'#fffaf0',id:`pin-${i+1}`}))],
  // Two trainers and a trainee watch from the sidelines.
  npcs:[{x:-6.6,z:-3.4,standing:true,color:'#8fd3c8',acc:['cap','mug'],yaw:.9},{x:4.8,z:8.7,standing:true,color:'#f78fd0',acc:['glasses'],mood:'happy',yaw:2.8},{x:9,z:1.6,standing:true,color:'#ffc94d',acc:['headphones'],yaw:-1.9}]};

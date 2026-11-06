import type {Level} from './types';
import type {PropSpec} from '../props/prefabs';
const props:PropSpec[]=[
  {kind:'supply',id:'supply-a',x:-13,z:3,color:'#f2b93b'},{kind:'supply',id:'supply-b',x:-13,z:7,color:'#f08a4b'},
  {kind:'capcart',id:'capacitor',x:-12,z:-7},{kind:'coolbox',id:'cooler-box',x:-10,z:-8},
  {kind:'dolly',id:'thick-dolly',x:-10,z:7.5},{kind:'lamp',id:'portable-lamp',x:5,z:-3},
  {kind:'bookshelf',id:'shelf',x:-7.4,z:-5,rotation:Math.PI/2},
  {kind:'wedge',id:'wedge',x:-3,z:7},{kind:'mop',id:'mop',x:2,z:8},
  {kind:'bridge',id:'bridge-1',x:7,z:8},{kind:'bridge',id:'bridge-2',x:9,z:8},{kind:'bridge',id:'bridge-3',x:11,z:8},
  {kind:'splitter',id:'splitter-1',x:-14,z:.65},{kind:'splitter',id:'splitter-2',x:-13.3,z:.65},{kind:'splitter',id:'splitter-3',x:-12.6,z:.65},
  {kind:'bin',x:6.1,z:-3.5},{kind:'plant',x:17,z:3},{kind:'desk',x:-.6,z:-4.3},{kind:'desk',x:1.2,z:-4.3},{kind:'tray',id:'tray',x:-2,z:-7,y:1.1}
];
// Storeroom stock: hand-stacked cartons (two-high stacks and strays at odd angles, not a grid: R5-155).
([[-15.2,-3.1,.12,1],[-14.15,-3.3,-.2,1],[-15.15,-4.5,.3,1],[-13.95,-4.55,.45,0],[-14.5,-5.65,-.25,0]] as const).forEach(([x,z,rot,top],i)=>{
  props.push({kind:'box',x,z,rotation:rot,color:['#c98f5a','#d7a56d','#b9875a'][i%3]});if(top)props.push({kind:'box',x:x+.04,z:z-.03,y:.95,rotation:rot+.35,color:'#e0b47a'});});
// Mugs and order slips scattered along the pass (jittered, mixed colours, not a ruled row).
for(const [x,dz,c] of [[-1.15,.05,'#f4efe6'],[-.55,-.08,'#e5484d'],[.35,.06,'#3f7fd6'],[.95,-.04,'#f4efe6'],[1.6,.08,'#6cc58a']] as const)props.push({kind:'mug',x,z:-4.45+dz,y:1.1,color:c});
for(const [x,dz,rot] of [[-.85,.02,.4],[.1,-.05,-.3],[1.3,.04,.9]] as const)props.push({kind:'paper',x,z:-4.2+dz,y:.98,rotation:rot});
// Review 6 (36 × 24 m): set pieces for the space the bigger shell opened up round the old room.
// Storeroom: steel shelving along the new back wall and filing cabinets on the left wall, stock on top.
for(const x of [-16.7,-14.45,-12.2])props.push({kind:'bookshelf',x,z:-11.55});
props.push({kind:'box',x:-16.95,z:-11.45,y:2.15,rotation:.06,color:'#d7a56d'},{kind:'box',x:-12,z:-11.45,y:2.15,rotation:-.06,color:'#c98f5a'},
  {kind:'cabinet',x:-17.45,z:-9.7},{kind:'cabinet',x:-17.45,z:-8.9});
// Kitchen: a trolley parked by the new back counters (the counters themselves are lunch-dressing.ts).
props.push({kind:'cart',x:-.3,z:-10.1,rotation:.2});
// Lift room: coolboxes stacked by the back wall waiting their turn upstairs, a parts trolley, a plant.
props.push({kind:'coolbox',x:15.3,z:-11.35},{kind:'coolbox',x:16.5,z:-11.35,rotation:.06},{kind:'coolbox',x:15.9,z:-11.35,y:.93,rotation:-.12},
  {kind:'cart',x:16.4,z:-9.9,rotation:.35},{kind:'plant',x:9,z:-11.4});
// Corridor: an overflow lunch bar (two tables pushed together, stools, mugs) and a coffee machine.
props.push({kind:'desk',x:4.2,z:10.95},{kind:'desk',x:5.8,z:10.95},{kind:'coffee',x:2.6,z:11.3},{kind:'bin',x:7.15,z:11.35});
for(const [x,z] of [[3.8,10.05],[4.65,10],[5.45,10.08],[6.3,10.02]] as const)props.push({kind:'stool',x,z});
for(const [x,dz,c] of [[3.7,.1,'#e5484d'],[4.6,-.12,'#f4efe6'],[5.5,.08,'#3f7fd6'],[6.2,-.05,'#f4efe6']] as const)props.push({kind:'mug',x,z:10.85+dz,y:1.08,color:c});
for(const [x,rot] of [[4.15,.5],[5.85,-.4]] as const)props.push({kind:'paper',x,z:11.05,y:.98,rotation:rot});
export const lunch:Level={id:'lunch',name:'LUNCH RUSH',number:'02',tagline:'Hot trays, a warm fridge and five bars per cart.',next:'arcade',badge:'tray',width:36,depth:24,
  // Kitchen and corridor clutter kept off every route Pip hauls cables, trays and carts along, and off
  // the cleaner bots' painted loop.
  clutter:{seed:2,step:2.1,jitter:.6,recipes:['crates','bins','crates','lounge','cart','cones','plants','crates','cooler'],fill:['crates','box','bin','box','litter'],max:260,colors:['#e5484d','#3f7fd6','#c4553b','#e9f0f2'],
    lanes:[{points:[[-10,5],[-3,7],[0,1.4],[2,8],[.3,2],[2,2],[-10,7.5],[1,3],[.2,-1.2],[-3.5,-3],[.3,-1.3],[.3,2.4],[-10.8,2],[.3,2.4],[.3,-1.3],[-3.8,-1.7]],r:1.3},
      {points:[[-2.4,-5.9],[.2,-5.8],[-6.5,-4.8],[-5.7,-3.3],[-8.8,-5],[-11.2,-6.8],[-8.8,-5],[-5,-5],[.3,-1.3],[.3,2.4],[10,1],[11.3,-4.4]],r:1.3},
      {points:[[10,1],[7,7.3],[-1.4,1.8],[10,1],[9,7.3],[1.5,.9],[10,1],[-9.8,3.5],[.3,2.4],[.3,-1.3],[4.7,-4.8]],r:1.3},
      {points:[[10,1],[11.8,-4.4]],r:1.3},{points:[[7,8],[-1.3,1.5]],r:1.1},{points:[[9,8],[.3,2.5]],r:1.1},{points:[[-9,6],[-12,6]],r:1.1},
      {points:[[-8.8,-5],[-10,-7.2]],r:1.1},{points:[[-8.8,-5],[-6.5,-3.8],[-4.4,-3.6],[-4.4,-1.8]],r:1.1},
      {points:[[-1,1.2],[14,1.2],[14,5.4],[-1,5.4],[-1,1.2]],r:.9},
      // The kitchen's machines are built by the Lunch runtime after the props, so they are kept clear here.
      {points:[[-3.5,-8.1],[-1.5,-8.1]],r:.95},{points:[[-5.6,-2.8],[-5.6,-1.8]],r:.75},{points:[[-4,-3.35],[-4,-3.35]],r:.6},{points:[[-.6,-7],[10.6,-7]],r:.75},
      {points:[[5,-6.1],[5,-6.1]],r:.6},{points:[[-6.9,-8.55],[-4.9,-8.55]],r:.75},{points:[[13.3,-5.4],[13.3,-4.2]],r:.8},{points:[[-10,-3],[-10,-3]],r:.5},{points:[[10.6,-7],[13.4,-7]],r:1.4},
      // Review 6: the wall-huggers lunch-dressing.ts moves out with the walls (after clutter runs), and the new back counters.
      {points:[[-17.6,3.2],[-17.6,6.8]],r:.55},{points:[[-7.3,11.3],[-2.1,11.4]],r:.6},{points:[[14.7,10.1],[14.7,10.1]],r:1.55},{points:[[16.9,9.6],[16.9,9.6]],r:.45},
      {points:[[17.1,5.2],[17.1,5.2]],r:.4},{points:[[17.3,-1.5],[17.3,-1.5]],r:.4},{points:[[-7.3,-11.35],[7.4,-11.35]],r:.45}]},spawn:{x:-10,z:5},anchor:{x:-13,z:7},target:{x:12,z:-6},length:27,props,npcs:[
  // Chef by the oven, the liftman, and a hungry lunch crowd in the corridor.
  {x:-1.2,z:-5.9,color:'#fffaf0',acc:['tuft'],yaw:2.8,chef:true},{x:13,z:0,color:'#b392f0',acc:['headphones'],yaw:0},
  {x:-4.2,z:11.45,seated:true,color:'#5b9cf0',acc:['mug','tuft'],mood:'happy',yaw:Math.PI+.2},{x:-2.6,z:11.45,seated:true,color:'#f08a4b',acc:['glasses'],yaw:Math.PI-.3},
  {x:13.4,z:9.5,color:'#b392f0',acc:['bun','mug'],mood:'sleepy',yaw:2.5},{x:16.8,z:11.3,color:'#f78fd0',acc:['bun'],mood:'happy',yaw:3.3},
  {x:7.3,z:10,color:'#8fd3c8',acc:['glasses'],yaw:-.6},{x:-11.2,z:5.2,color:'#6cc58a',acc:['tuft','glasses'],yaw:.9},{x:-6.6,z:-7.4,color:'#a7d3f0',acc:['cap'],mood:'happy',yaw:.3}],obstacles:[
  {id:'store-divider-1',minX:-7.9,maxX:-7.6,minZ:-12,maxZ:-6.5},
  {id:'store-divider-2',minX:-7.9,maxX:-7.6,minZ:-3.5,maxZ:0},
  {id:'kitchen-front-left',minX:-7.8,maxX:-1.5,minZ:0,maxZ:.3},
  {id:'kitchen-front-right',minX:1.5,maxX:8,minZ:0,maxZ:.3},
  {id:'lift-divider-back',minX:8,maxX:8.3,minZ:-12,maxZ:-7.85},
  {id:'lift-divider-front',minX:8,maxX:8.3,minZ:-6.15,maxZ:-2},
  {id:'store-front',minX:-18,maxX:-7.8,minZ:0,maxZ:.3}
]};

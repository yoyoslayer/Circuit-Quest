// usage: node station.mjs <level> — throws the room's required item into a corner and onto the bench, then tries to get it back.
import {launch,item,d2,retrieve,fmt} from './lib.mjs';
const K='stuck-softlock';const lv=process.argv[2];const L=(...a)=>console.log(lv,...a);
const CFG={
 garage:{id:'robot',grab:[[6.4,-4.2]],corner:{via:[[8.5,-3.4]],from:[[9.4,-3.4],[9.4,-5.2]],aim:'z-'},bench:{via:[[2.9,-1.1]],from:[[.6,.4],[.6,-.5]]},around:[[2.9,-1.1],[3.2,-4],[1.5,-5.6]]},
 qfn:{id:'parts',grab:[[-8.8,2.95]],corner:{via:[[-9,4.5]],from:[[-9.6,5.6],[-9.6,6.8]],aim:'z+'},bench:{via:[[-3,1.5]],from:[[.2,1.9],[.2,.9]]},around:[[3.9,-.5],[3.9,-4.2],[1.5,-4.3]]},
 observatory:{id:'motor',grab:[[-3.7,-.1]],corner:{via:[[-6,3.5]],from:[[-9.2,5],[-9.2,6.6]],aim:'z+'},bench:{via:[[-1.5,.6]],from:[[.3,.6],[.3,-.4]]},around:[[3,-1],[3,-3.6],[.5,-3.6]]},
 spectrum:{id:'pod',grab:[[-6.4,6.4]],corner:{via:[[-10.1,3],[-10.1,-2.2],[-10.1,-4.4]],from:[[-10.1,-5.2],[-10.1,-6.4]],aim:'z-'},bench:{via:[[-5,5.8]],from:[[-3.3,5.6],[-3.3,4.6]]},around:[[-.5,4.2],[-.5,1.6],[-3.3,1.6]]},
 'spectrum-m':{lvl:'spectrum',id:'mirror2',grab:[[-.9,-1.8],[-.9,-4.55]],corner:{via:[[-.9,-2.4]],from:[[1,-4.2],[1.5,-5.8]],aim:'z-'},bench:null},
};
const c=CFG[lv];const g=await launch(c.lvl??lv,{fullfx:true});
const route=async(pts,r=.4)=>{for(const [x,z] of pts){const o=await g.walk(x,z,r,20);if(!o.arrived)L('  stall',x,z,fmt(o.state.player));}};
const throwFrom=async(t)=>{await route(t.via);await g.walk(t.from[0][0],t.from[0][1],.2,15);await g.walk(t.from[1][0],t.from[1][1],.15,10);await g.key('KeyQ',.05);};
try{
await g.advance(.5);let s=await g.snap();const home=item(s,c.id).pos;L('home',fmt(home));
await route(c.grab);await g.key('KeyE');s=await g.snap();L('held',s.held);
await throwFrom(c.corner);await g.advance(10);s=await g.snap();let p=item(s,c.id).pos;L('corner after10',fmt(p),'fromHome',d2(p,home).toFixed(2));
await g.zoom(-700);await g.shot(`${K}-4${lv.length%10}-${lv}-${c.id}-corner-after10s`);await g.zoom(700);
let r=await retrieve(g,c.id);L('retrieve',JSON.stringify(r));
if(r.ok&&c.bench){await throwFrom(c.bench);await g.advance(10);s=await g.snap();p=item(s,c.id).pos;L('bench after10',fmt(p),'fromHome',d2(p,home).toFixed(2),'station',JSON.stringify(s.station).slice(0,120));
  await g.shot(`${K}-5${lv.length%10}-${lv}-${c.id}-thrown-at-bench-after10s`);
  if(c.around)await route(c.around);r=await retrieve(g,c.id);s=await g.snap();L('retrieve2',JSON.stringify(r),'atBench',s.atBench);}
}catch(e){L('ERR',e.message);}
L('errors',JSON.stringify(await g.close()));

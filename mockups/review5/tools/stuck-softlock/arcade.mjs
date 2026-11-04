import {launch,item,d2,face,grab,retrieve,fmt} from './lib.mjs';
const K='stuck-softlock';const g=await launch('arcade',{fullfx:true});const log=[];const L=(...a)=>{console.log(...a);log.push(a.join(' '));};
try{
await g.advance(.5);let s=await g.snap();const home=item(s,'blocks').pos;L('home',fmt(home));
await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');s=await g.snap();L('held',s.held);
// (a1) behind the storeroom stock shelf, against the wall
await face(g,[-9.6,6.3],[-9.6,8]);await g.key('KeyQ',.05);await g.shot(`${K}-01-arcade-tray-throw-behind-shelf`);
await g.advance(10);s=await g.snap();let p=item(s,'blocks').pos;L('a1 after10',fmt(p),'fromHome',d2(p,home).toFixed(2));
await g.zoom(-600);await g.shot(`${K}-02-arcade-tray-wedged-after10s`);await g.zoom(600);
let r=await retrieve(g,'blocks');L('a1 retrieve',JSON.stringify(r));
// (a2) far corner of the hall
if(r.ok){await face(g,[-9.8,-6.6],[-11,-8]);await g.key('KeyQ',.05);await g.advance(10);s=await g.snap();p=item(s,'blocks').pos;L('a2 corner after10',fmt(p),d2(p,home).toFixed(2));
 await g.shot(`${K}-03-arcade-tray-corner-after10s`);r=await retrieve(g,'blocks');L('a2 retrieve',JSON.stringify(r));}
// (b) jump-throw onto a 2.2 m side cabinet
if(r.ok){await face(g,[8.2,1.2],[10,1.2]);await g.key('Space',.18);await g.key('KeyQ',.05);await g.advance(.8);s=await g.snap();p=item(s,'blocks').pos;L('b after .8',fmt(p));
 await g.shot(`${K}-04-arcade-tray-on-cabinet`);await g.advance(4.2);s=await g.snap();p=item(s,'blocks').pos;L('b after 5',fmt(p),d2(p,home).toFixed(2));}
}catch(e){L('ERR',e.message);}
L('errors',JSON.stringify(await g.close()));

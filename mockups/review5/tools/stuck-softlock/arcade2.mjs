import {launch,item,d2,face,grab,retrieve,fmt} from './lib.mjs';
const K='stuck-softlock';const g=await launch('arcade',{fullfx:true});const L=(...a)=>console.log(...a);
try{
await g.advance(.5);let s=await g.snap();const home=item(s,'blocks').pos;
await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await g.walk(-5.5,6.4);await g.walk(.3,.6,.3);
// throw onto the bench from the front (not an E-drop)
await face(g,[.3,-.6],[.3,-3]);await g.key('KeyQ',.05);await g.advance(10);s=await g.snap();let p=item(s,'blocks').pos;
L('on bench after10',fmt(p),'home',d2(p,home).toFixed(2),'prompt',await g.page.locator('.prompt, [data-prompt]').first().textContent().catch(()=>'?'));
await g.shot(`${K}-05-arcade-tray-thrown-on-bench-after10s`);
// try E from in front
await g.walk(p.x,-1.4,.3);s=await g.snap();L('pip',fmt(s.player),'dStand',d2(s.player,{x:0,z:-1.55}).toFixed(2),'dTray',d2(s.player,p).toFixed(2));
await g.key('KeyE');s=await g.snap();L('E front -> held',s.held,'atBench',s.atBench);await g.shot(`${K}-06-arcade-tray-E-at-bench`);
if(s.atBench){await g.key('KeyE');}
const r=await retrieve(g,'blocks');L('retrieve',JSON.stringify(r));s=await g.snap();L('atBench',s.atBench,'held',s.held);
await g.shot(`${K}-07-arcade-tray-retrieve-attempt`);
}catch(e){L('ERR',e.message);}
L('errors',JSON.stringify(await g.close()));

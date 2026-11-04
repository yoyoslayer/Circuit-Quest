import {launch} from '../cap.mjs';import {txt,toTray} from '../arcade-rush-play/common.mjs';
const P='verify-arcade-rush-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade-rush',{fullfx:true});await g.advance(.5);
const tray=async()=>{const s=await g.snap();return s.items.find(i=>i.id==='blocks');};
await toTray(g,log);await g.key('KeyE',.2);let s=await g.snap();log('held',s.held,'dmg',s.damage);
await g.walk(-7.2,5.8,.5);await g.walk(-5.5,6.4,.5);await g.walk(-2,1.6,.5);
await g.advance(.2,['KeyW']);s=await g.snap();log('before throw player',JSON.stringify(s.player),'dmg',s.damage,'cost',s.cost);
await g.key('KeyQ',.1);
for(let i=0;i<6;i++){await g.advance(.25);s=await g.snap();const t=s.items.find(i=>i.id==='blocks');log('t+',((i+1)*.25).toFixed(2),JSON.stringify(t.pos),'dmg',s.damage,'cost',s.cost,'trayReady',s.station.trayReady);}
await g.advance(1.5);s=await g.snap();log('settled',JSON.stringify((await tray()).pos),'trayReady',s.station.trayReady,'dmg',s.damage,JSON.stringify(await txt(g)));
await g.shot(P+'10-tray-thrown');await g.zoom(-1200);await g.shot(P+'11-tray-thrown-close');
// Walk to bench and sit: what happens?
await g.walk(0,-1.55,.4);await g.key('KeyE',.5);s=await g.snap();log('sit',s.atBench,'trayReady',s.station.trayReady,JSON.stringify(await txt(g)));
await g.shot(P+'12-sit-after-throw');
log('errors',JSON.stringify(await g.close()));

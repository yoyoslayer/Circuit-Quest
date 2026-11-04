import {launch} from '../cap.mjs';import {toBench,txt} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.5);
const S=async l=>{const s=await g.snap();const t=s.station;log(l,'t',s.time.toFixed(1),JSON.stringify({atB:s.atBench,tray:t.trayReady,pw:t.powered,live:t.live,trip:t.tripped,soak:t.soak,done:t.soakDone,mis:t.mistakes,trips:t.trips,spent:t.spent,idx:t.index,i:t.reading&&+(t.reading.iLoad*1000).toFixed(1)}),JSON.stringify(await txt(g)));return s;};
await toBench(g,log);
// c) DR-19: power -> trip -> fix -> P
await g.key('KeyP',.3);await S('P trip');await g.key('KeyX');await g.key('Digit3');await g.key('KeyA');await S('fixed while tripped');
await g.key('KeyP',.3);await S('P after fix (retry)');await g.advance(3);await S('3s later');await g.shot(P+'52-retry-P-powered-off');
await g.key('KeyP',.3);await S('P again');await g.advance(1.2);await S('mid soak');await g.key('KeyP',.2);await S('P during "Play test"');await g.shot(P+'53-P-during-playtest');
// e) brute force with power ON, fast swaps (<0.6 s each) on the empty chain
await g.key('KeyA',.05);await g.key('KeyP',.05);await S('power on empty?');
const combos=[[47],[100],[220],[470],[47,47],[100,100]];
for(const c of combos){for(const v of c){await g.key('Digit'+(['47','100','220','470'].indexOf(String(v))+1),.02);await g.key('KeyA',.02);}await g.advance(.3);const s=await g.snap();log('bf',JSON.stringify(c),(s.station.reading.iLoad*1000).toFixed(1),'mis',s.station.mistakes,'trips',s.station.trips,'trip?',s.station.tripped);for(const v of c)await g.key('KeyA',.02);}
await S('after brute force');
// Space / Tab / Q at the bench
await g.key('Space',.3);let s=await g.snap();log('space at bench: pip y',s.player.y.toFixed(2),'pose air',s.pose?.airborne);
await g.page.keyboard.press('Tab');await g.advance(.5);await g.shot(P+'55-tab-at-bench');await g.page.keyboard.press('Tab');await g.advance(.3);
log('errors',JSON.stringify(await g.close()));

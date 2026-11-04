import {launch} from '../cap.mjs';
const P='verify-garage-play-';const log=(...a)=>console.log(...a);
const g=await launch('garage',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace(/\n/g,' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText,card:document.querySelector('.objective .cur')?.innerText,dots:[...document.querySelectorAll('.objective .dots b')].map(b=>b.className).join(','),panel:document.querySelector('.station-panel:not([hidden]) .build')?.innerText?.replace(/\n/g,' | ')}));
const st=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),held:s.held,atBench:s.atBench,dmg:s.damage,cost:s.cost,alarmed:s.alarmed,player:{x:+s.player.x.toFixed(2),y:+s.player.y.toFixed(2),z:+s.player.z.toFixed(2)},pose:s.pose&&{grounded:s.pose.grounded,air:s.pose.airborne},station:s.station&&{slots:s.station.slots,fuse:s.station.fuse,mistakes:s.station.mistakes,onStand:s.station.onStand,job:s.station.job,held:s.station.held,driving:s.station.driving}};};
await g.advance(.5);
let s=await g.snap();log('start dc',s.drawCalls,'props',s.props,'fps',s.fps,'rope',JSON.stringify(s.rope));
await g.shot(P+'01-start');
// robot prompt
await g.walk(6.4,-4.2,.5);log('at robot',JSON.stringify(await txt()));
await g.key('KeyE',.4);log('held',JSON.stringify(await st()));
await g.walk(4.6,-3.6,.4);await g.advance(.6);
await g.shot(P+'02-carry-game-cam');
await g.zoom(-1500);await g.orbit(350,0);await g.shot(P+'03-carry-zoom9-orbitR');
await g.orbit(-700,0);await g.shot(P+'04-carry-zoom9-orbitL');await g.orbit(350,0);await g.zoom(1500);
await g.walk(2.5,-4.4,.5);log('near stand',JSON.stringify(await txt()));await g.shot(P+'05-carry-at-stand');
await g.key('KeyE',.4);log('placed',JSON.stringify(await st()));
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE',.5);log('bench',JSON.stringify(await st()));
// F0: WASD with diode fitted
await g.act('pick','diode');await g.act('slot','fly');log('fitted',JSON.stringify((await st()).station.slots));
await g.key('KeyW',.1);log('after W',JSON.stringify((await st()).station.slots));
await g.key('KeyA',.1);log('after A',JSON.stringify((await st()).station.slots),JSON.stringify(await txt()));
await g.shot(P+'06-after-W-A');
// F16/F11: empty pulse panel
await g.act('pulse');await g.advance(2.2);log('empty pulse',JSON.stringify(await txt()));await g.shot(P+'07-empty-pulse');
// F11: cap-only failed TEST, toast life
await g.act('pick','cap');await g.act('slot','ctrl');await g.act('test');await g.advance(.3);let t0=(await g.snap()).time;log('failed test',JSON.stringify(await txt()),'len',(await txt()).toast?.length);
await g.shot(P+'08-failed-test');
await g.advance(8);log('toast +8s',JSON.stringify((await txt()).toast?.slice(0,30)));
await g.key('Escape',.5);log('after esc toast',JSON.stringify((await txt()).toast?.slice(0,30)));await g.shot(P+'09-after-esc-toast');
await g.advance(6);log('toast +14s',JSON.stringify((await txt()).toast?.slice(0,30)));
await g.key('KeyE',.5);
// F15: Tab and Space at bench
await g.key('Tab',.3);await g.key('Space',.15);log('space at bench',JSON.stringify(await st()));await g.advance(1);
await g.key('Escape',1.2);await g.shot(P+'10-after-tab-esc');await g.key('Tab',.8);
await g.key('KeyE',.5);log('rebench',JSON.stringify(await st()));
// F12: fuse
await g.act('clear');await g.act('pick','diode');await g.act('slot','fly');await g.act('flip');await g.act('pulse');await g.advance(.3);
log('fuse0',JSON.stringify(await txt()));await g.advance(.6);log('fuse+0.6',JSON.stringify((await txt()).panel),JSON.stringify(await st()));await g.shot(P+'11-fuse-tripped');
await g.advance(.6);log('fuse+1.2',JSON.stringify((await txt()).panel));
await g.advance(2);await g.act('flip');
// Job1 pass
await g.act('pulse');await g.advance(2);await g.act('test');await g.advance(.4);await g.shot(P+'12-job1-pass');await g.advance(3);
// Job2
await g.act('pick','diode');await g.act('pick','diode');await g.act('pick','tvs');await g.act('slot','switch');await g.act('pulse');await g.advance(2);await g.act('test');await g.advance(3);
// Job3
await g.act('pulse');await g.advance(2.5);log('job3 pulse',JSON.stringify(await txt()));await g.shot(P+'13-job3-after-pulse');
await g.act('ground');await g.act('pulse');await g.advance(2.5);log('job3 star',JSON.stringify(await txt()));
await g.key('KeyE',.3);await g.walk(2.9,-1.1,.4);await g.walk(3.75,-1.0,.2);log('on lane',JSON.stringify(await st()));
log('final test',JSON.stringify((await g.act('test'))?.ok));
for(let k=0;k<10;k++){await g.advance(.5);s=await g.snap();const bot=s.items.find(i=>i.id==='robot');log('drive',k,JSON.stringify({t:+s.time.toFixed(1),bot:{x:+bot.pos.x.toFixed(2),z:+bot.pos.z.toFixed(2)},pip:{x:+s.player.x.toFixed(2),z:+s.player.z.toFixed(2)},alarmed:s.alarmed}),JSON.stringify((await txt()).prompt));if(k===3)await g.shot(P+'14-robot-meets-pip');}
await g.advance(8);s=await g.snap();log('won',s.won,s.time,s.damage,s.cost,JSON.stringify(s.station.mistakes));
await g.advance(.5);await g.shot(P+'15-win-push');
await g.advance(2.5);log('result',(await g.page.evaluate(()=>document.querySelector('[class*=result]')?.innerText))?.replace(/\n/g,' | '));await g.shot(P+'16-result');
log('errors',JSON.stringify(await g.close()));

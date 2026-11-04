import {launch} from '../cap.mjs';
const P='garage-play-';const log=(...a)=>console.log(...a);
const g=await launch('garage',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText}));
const st=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),held:s.held,dmg:s.damage,cost:s.cost,alarmed:s.alarmed,fastest:+s.fastestProp.toFixed(1),player:{x:+s.player.x.toFixed(2),z:+s.player.z.toFixed(2)}};};
await g.advance(.5);
const near="n/a";
log('near spawn',JSON.stringify(near));
// Chaos 1: grab nearest light prop and throw it toward coworker at (7.6,4.6)
await g.walk(-1.6,4.4,.3);log('prompt near spawn',JSON.stringify(await txt()));await g.key('KeyE',.2);log('grabbed',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.walk(5.4,4.6,.3);await g.walk(5.9,4.6,.1);
await g.key('KeyQ',.05);await g.advance(.5);log('after throw at coworker',JSON.stringify(await st()));await g.shot(P+'60-throw-at-coworker');
await g.advance(1);log('1.5s later',JSON.stringify(await st()));
// Chaos 2: sprint through a crate pile
await g.walk(9.2,6.4,.3);await g.advance(.5);log('ploughed crates',JSON.stringify(await st()));await g.shot(P+'61-plough-crates');
// Chaos 3: grab a cone and throw it at the mechanic by the charging bays (8.2,-3.4)
await g.walk(5.8,-.8,.6);await g.key('KeyE',.2);log('cone?',JSON.stringify(await st()));await g.walk(7,-2.2,.2);await g.key('KeyQ',.05);await g.advance(.5);log('cone thrown',JSON.stringify(await st()));await g.shot(P+'62-cone-at-mechanic');
// F and Q with nothing in hand outside the bench
await g.key('KeyF',.3);log('F empty',JSON.stringify(await txt()));await g.key('KeyQ',.3);
// Wedge test: carry robot into right-wall clutter gap
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.3);await g.walk(9.3,-2.25,.3);await g.walk(9.7,-2.25,.1);await g.key('KeyE',.5);await g.advance(1);
let s=await g.snap();let bot=s.items.find(i=>i.id==='robot');log('robot dropped in clutter',JSON.stringify(bot.pos));await g.shot(P+'63-robot-wedged-attempt');
await g.walk(7.5,-1,.5);await g.advance(6);s=await g.snap();bot=s.items.find(i=>i.id==='robot');log('robot after 6s',JSON.stringify(bot.pos));
await g.walk(bot.pos.x-1.2,bot.pos.z,.5);log('reach robot',JSON.stringify(await txt()),JSON.stringify(await st()));
await g.key('KeyE',.3);log('regrab',JSON.stringify(await st()));
// put robot on stand, sit, solve fast
await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE',.4);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE',.5);
for(const [n,a] of [['pick','clamp'],['slot','fly'],['test'],['test'],['ground']])await g.act(n,a);
await g.advance(3);
// Leave the bench and stand on the robot's route before the final test
await g.key('KeyE',.3);await g.walk(2.9,-1.1,.4);await g.walk(3.75,-1.0,.2);log('on route',JSON.stringify(await st()));
// throw a cone onto the lane at (0,2.1) ? we just test Pip in the way. Final test triggered remotely.
log('final test',JSON.stringify((await g.act('test')).ok));
for(let k=0;k<8;k++){await g.advance(.5);s=await g.snap();bot=s.items.find(i=>i.id==='robot');log('drive',k,JSON.stringify({bot:{x:+bot.pos.x.toFixed(2),z:+bot.pos.z.toFixed(2)},pip:{x:+s.player.x.toFixed(2),z:+s.player.z.toFixed(2)}}));if(k===2)await g.shot(P+'64-robot-through-pip');if(k===3)await g.shot(P+'65-robot-through-pip-b');}
await g.advance(6);s=await g.snap();log('won',s.won,JSON.stringify({t:s.time,dmg:s.damage,cost:s.cost,mistakes:s.station.mistakes,spent:s.station.spent}));
await g.advance(3);log('result',(await g.page.evaluate(()=>document.querySelector('[class*=result]')?.innerText))?.replace(/\n/g,' | '));await g.shot(P+'66-result-after-chaos');
log('errors',JSON.stringify(await g.close()));

import {launch} from '../cap.mjs';
const P='garage-play-';const log=(...a)=>console.log(...a);
const g=await launch('garage',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText,card:document.querySelector('.objective .cur')?.innerText}));
const st=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),held:s.held,atBench:s.atBench,dmg:s.damage,cost:s.cost,alarmed:s.alarmed,fastest:+s.fastestProp.toFixed(1),station:s.station&&{slots:s.station.slots,fuse:s.station.fuse,mistakes:s.station.mistakes,onStand:s.station.onStand,job:s.station.job,held:s.station.held}};};
await g.advance(.5);
// 1. Wrong order: bench first.
await g.walk(0,-1.55,.4);log('bench first',JSON.stringify(await txt()));await g.key('KeyE',.5);log('sat',JSON.stringify(await st()),JSON.stringify(await txt()));
await g.shot(P+'40-bench-before-robot');
await g.key('KeyP',.3);log('P no robot',JSON.stringify(await txt()));await g.shot(P+'41-pulse-no-robot');
await g.key('KeyE',.3);log('left',JSON.stringify(await st()));
// 2. Try the decor robot at 4.4
await g.walk(4.4,-4.1,.5);log('decor robot',JSON.stringify(await txt()));await g.key('KeyE',.3);log('E on decor',JSON.stringify(await st()));await g.shot(P+'42-decor-robot');
// 3. Grab job robot, carry to 3 m from stand and throw it with Q
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.3);
await g.walk(4.2,-3.2,.5);log('before throw',JSON.stringify(await st()),JSON.stringify(await txt()));
// face the stand: walk a tiny step toward it
await g.walk(3.9,-3.4,.1);
await g.key('KeyQ',.05);await g.advance(.25);await g.shot(P+'43-robot-thrown-air');await g.advance(2);
let s=await g.snap();const bot=s.items.find(i=>i.id==='robot');log('after throw',JSON.stringify(bot),JSON.stringify(await st()),JSON.stringify(await txt()));
await g.shot(P+'44-robot-after-throw');
// 4. Pick it up again, drop it on the bench top from behind? Drop near stand from far side
await g.walk(bot.pos.x+.8,bot.pos.z+.2,.6);log('near thrown',JSON.stringify(await txt()));await g.key('KeyE',.3);log('regrab',JSON.stringify(await st()));
await g.walk(2.5,-4.4,.5);await g.key('KeyE',.4);log('placed',JSON.stringify(await st()));
// 5. Bench: real mouse play
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE',.5);
await g.page.mouse.move(1003,505);await g.advance(.2);log('hover diode',JSON.stringify(await txt()));await g.shot(P+'45-hover-diode');
await g.page.mouse.click(1003,505);await g.advance(.2);log('click diode',JSON.stringify(await st()));
await g.page.mouse.move(650,505);await g.advance(.2);log('hover switch socket with diode',JSON.stringify(await txt()));await g.shot(P+'46-hover-wrong-socket');
await g.page.mouse.click(650,505);await g.advance(.2);log('click wrong socket',JSON.stringify(await st()));
await g.page.mouse.click(428,505);await g.advance(.2);log('click right socket',JSON.stringify(await st()));
// flip diode backwards and pulse: dead short
await g.key('KeyF',.2);await g.key('KeyP',.1);await g.advance(.3);log('short',JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'47-fuse-tripped');
await g.key('KeyP',.2);log('P while cooling',JSON.stringify(await txt()));
await g.advance(1.2);await g.shot(P+'48-fuse-cooling');
await g.key('KeyF',.2);await g.advance(2);log('cooled',JSON.stringify(await st()));
// 6. WASD at bench with a part fitted
await g.key('KeyW',.1);await g.key('KeyA',.1);log('after W,A',JSON.stringify(await st()));
await g.key('KeyS',.1);await g.key('KeyD',.1);log('after S,D',JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'49-after-wasd');
// cap reversed
await g.key('Digit5',.1);await g.key('KeyD',.1);await g.key('KeyF',.1);await g.key('KeyP',.5);log('cap rev',JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'50-cap-reversed');
// test with failing setup (cap flipped back, no diode)
await g.key('KeyF',.1);await g.key('Enter',.6);log('failed test',JSON.stringify(await st()),JSON.stringify(await txt()));await g.shot(P+'51-failed-test');
await g.advance(3);
// Tab at bench then Esc
await g.key('Tab',.5);await g.shot(P+'52-tab-at-bench');log('tab at bench',JSON.stringify(await st()));
await g.key('Escape',.8);log('esc',JSON.stringify(await st()));await g.shot(P+'53-after-esc-from-bench');
// Space at bench
await g.key('KeyE',.4);await g.key('Space',.3);s=await g.snap();log('space at bench pose',JSON.stringify(s.pose),s.player.y);
log('errors',JSON.stringify(await g.close()));

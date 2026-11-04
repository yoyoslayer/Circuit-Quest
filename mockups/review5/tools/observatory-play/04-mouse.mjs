import {launch} from '../cap.mjs';
const P='observatory-play-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
const txt=async()=>g.page.evaluate(()=>({prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '),toast:document.querySelector('.station-toast:not([hidden])')?.innerText,cursor:document.body.style.cursor}));
const sn=async()=>{const s=await g.snap();return {atBench:s.atBench,held:s.station.held,series:s.station.series,shunt:s.station.shunt,rer:s.station.rerouted,rod:s.station.rod,vert:s.station.vertical,scope:s.station.scope,listen:s.station.listening,snr:s.station.reading.snr,mist:s.station.mistakes,job:s.station.job};};
await g.advance(.5);
await g.walk(-3.7,-.1,.6);await g.key('KeyE',.3);await g.walk(-6,3.5,.6);await g.key('KeyE',.4);
await g.walk(0,-1.55,.4);await g.key('KeyE',.8);
const pts={resistor:[1025,545],coil:[1115,540],cap:[1205,540],series:[620,535],shunt:[735,580],log:[1022,428],lever:[395,572],mount:[450,445],rod17:[285,470],rod75:[318,440],signal:[593,458],step:[690,457],speaker:[785,455],latch:[860,572],screen:[750,290]};
for(const [k,[x,y]] of Object.entries(pts)){await g.page.mouse.move(x,y);await g.advance(.15);log('hover',k,JSON.stringify(await txt()));}
await g.page.mouse.move(1205,540);await g.advance(.15);await g.shot(P+'60-hover-capacitor');
await g.page.mouse.click(1205,540);await g.advance(.2);log('click cap',JSON.stringify(await sn()));
await g.page.mouse.move(735,580);await g.advance(.15);log('hover shunt w/ held',JSON.stringify(await txt()));await g.shot(P+'61-held-cap-hover-shunt');
await g.page.mouse.click(735,580);await g.advance(.3);log('click shunt',JSON.stringify(await sn()));
// drag the knob sideways
await g.page.mouse.move(735,570);await g.advance(.1);log('hover slotted can',JSON.stringify(await txt()));
await g.page.mouse.down();for(let k=1;k<=10;k++){await g.page.mouse.move(735+k*18,570);await g.advance(.03);}await g.shot(P+'62-dragging-knob');await g.page.mouse.up();await g.advance(.2);log('after drag',JSON.stringify(await sn()));
// click lever, check the route sign
await g.page.mouse.click(395,572);await g.advance(.3);log('lever',JSON.stringify(await sn()),JSON.stringify(await txt()));
// Tab and right-drag at bench
await g.page.keyboard.press('Tab');await g.advance(1);log('tab at bench',JSON.stringify(await sn()));await g.shot(P+'63-tab-at-bench');await g.page.keyboard.press('Tab');await g.advance(1);
await g.orbit(400,0);log('orbit at bench',JSON.stringify(await sn()));await g.shot(P+'64-orbit-at-bench');
await g.orbit(-400,0);
await g.zoom(-800);await g.shot(P+'65-wheel-at-bench');
// space at bench
await g.key('Space',.4);log('space',JSON.stringify(await sn()));
await g.act('log');await g.advance(.3);log('logged',JSON.stringify(await sn()),JSON.stringify(await txt()));
// Job 2: shunt C swap with held coil onto shunt slot? click coil, click shunt (swap)
await g.page.mouse.click(1115,540);await g.advance(.15);await g.page.mouse.click(620,535);await g.advance(.3);log('coil series',JSON.stringify(await sn()),JSON.stringify(await txt()));
await g.shot(P+'66-job2-coil-in');
// keyboard: arrows turn the last slotted
for(let k=0;k<6;k++)await g.key('ArrowRight',.05);log('arrows',JSON.stringify(await sn()),JSON.stringify(await txt()));
await g.page.mouse.move(735,570);await g.advance(.15);
await g.page.mouse.down();for(let k=1;k<=6;k++){await g.page.mouse.move(735-k*18,570);await g.advance(.03);}await g.page.mouse.up();await g.advance(.2);log('drag shunt down',JSON.stringify(await sn()),JSON.stringify(await txt()));
await g.shot(P+'67-job2-tuned');
await g.key('Enter',.3);log('log2',JSON.stringify(await sn()),JSON.stringify(await txt()));
await g.advance(.8);await g.shot(P+'68-job3-gust-view');
// try clicking rods directly
await g.page.mouse.move(318,440);await g.advance(.15);log('hover rod after gust',JSON.stringify(await txt()));
await g.page.mouse.click(318,440);await g.advance(.3);log('click rod',JSON.stringify(await sn()),JSON.stringify(await txt()));
await g.page.mouse.move(450,445);await g.advance(.15);log('hover mount',JSON.stringify(await txt()));await g.shot(P+'69-hover-mount');
await g.page.mouse.click(450,445);await g.advance(.3);log('click mount',JSON.stringify(await sn()),JSON.stringify(await txt()));
await g.shot(P+'70-job3-mouse-result');
log('errors',JSON.stringify(await g.close()));

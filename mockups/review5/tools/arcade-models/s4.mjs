import {launch} from '../cap.mjs';
const P='arcade-models';
const g=await launch('arcade',{fullfx:true});
const settle=async(n=20)=>{for(let i=0;i<n;i++)await g.advance(1/60);};
const shot=async(name)=>{await settle();return g.shot(`${P}-${name}`);};
const route=async pts=>{for(const [x,z,r] of pts){const w=await g.walk(x,z,r??.5);if(!w.arrived)console.log('stuck',x,z,JSON.stringify(w.state.player));}};
await g.advance(.3);
await route([[-5.5,6.6],[-7.2,5.8],[-8.3,4.4,.3]]);await g.key('KeyE');console.log('held',(await g.snap()).held);
await g.key('KeyC',.2);await g.zoom(-2000);await shot('30-holding-tray-zoom9');
await g.orbit(262,0);await shot('31-holding-tray-side');await g.key('KeyC',.2);
await route([[-7.2,5.8],[-5.5,6.4]]);await g.walk(-1,-.6,.5);await shot('32-carry-near-bench');
await g.walk(1.2,-1.3,.5);await g.key('KeyE');await g.advance(.3);console.log('trayReady',(await g.snap()).station.trayReady);
await g.walk(0,-1.55,.4);
// kid + serviced cabinet close-up before sitting
await g.key('KeyC',.2);await g.zoom(-2000);await g.orbit(-120,0);await shot('33-serviced-cab-kid');
await g.orbit(-300,0);await shot('34-serviced-cab-side');
await g.orbit(-400,0);await shot('35-serviced-cab-back');
await g.key('KeyC',.2);
await g.key('KeyE');await g.advance(.5);console.log('atBench',(await g.snap()).atBench);
await shot('36-bench-view');
await g.act('power');await g.advance(.4);await shot('37-bench-fuse-trip');
await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.advance(2.7);await shot('38-bench-running');
await g.advance(3.2);await shot('39-bench-passed');
await g.act('signoff');await g.advance(.3);await shot('40-bench-signoff');
// rhythm: flip, 47||47
await g.act('flip');await g.act('pick',47);await g.act('slot',0);await g.act('power');await g.advance(3.4);await g.act('signoff');
// claw pop
await g.act('power');await g.advance(1.6);await shot('41-claw-heating');await g.advance(.8);await shot('42-claw-popped');
await g.page.keyboard.press('Escape');await g.advance(.5);
await g.key('KeyC',.2);await g.survey();await shot('43-survey-two-lit');await g.survey();
console.log(JSON.stringify((await g.snap()).station.served));
console.log(await g.close());

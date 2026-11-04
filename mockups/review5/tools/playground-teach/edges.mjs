import {launch} from '../cap.mjs';
const P='playground-teach';
const log=(k,s)=>console.log(k,JSON.stringify({t:+s.time.toFixed(2),won:s.won,hp:s.holdingPlug,el:s.electrical,sw:s.switchedOn,strain:+s.rope.strain.toFixed(3),len:+s.rope.length.toFixed(2),fast:+s.fastestProp.toFixed(2),pins:s.pinsDown,alarmed:s.alarmed,player:{x:+s.player.x.toFixed(2),z:+s.player.z.toFixed(2)}}));
const txt=g=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' ')}));
// A: idle hint on an open circuit
{const g=await launch('playground');await g.advance(37);log('idle',await g.snap());await g.shot(`${P}-12-idle-hint-dots`);await g.zoom(-600);await g.shot(`${P}-13-idle-hint-close`);
// B: switch first, unpowered
await g.walk(6.6,-5.9,.4);console.log('B',await txt(g));await g.zoom(-900);await g.shot(`${P}-14-switch-unpowered-prompt`);
await g.key('KeyE',.3);console.log('B after E',await txt(g));log('B',await g.snap());await g.shot(`${P}-15-switch-unpowered-after`);
console.log('errA',await g.close());}
// C: switch first, then plug in => instant win
{const g=await launch('playground');await g.walk(6.6,-5.9,.4);await g.key('KeyE',.2);await g.walk(-7,4.7,.5);await g.key('KeyF');
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);await g.key('KeyF',.05);log('C plugged',await g.snap());await g.shot(`${P}-16-switch-first-then-plug`);console.log('errC',await g.close());}
// D: wrong route (long way round pillar-b), sprint overstretch, F at socket
{const g=await launch('playground');await g.key('KeyF');
for(const [x,z] of [[0,5.2],[4.6,4.3],[4.6,1.5]]){const r=await g.walk(x,z);log('D leg',r.state??await g.snap());}
await g.advance(2.2,['KeyD','KeyW','ShiftLeft']);log('D sprint',await g.snap());
const r=await g.walk(6.2,-5.5,.6,8);log('D walk',await g.snap());console.log('D',await txt(g));await g.shot(`${P}-17-overstretch-at-socket`);
await g.key('KeyF',.3);log('D after F',await g.snap());console.log('D after',await txt(g));await g.shot(`${P}-18-overstretch-F-result`);console.log('errD',await g.close());}
// E: slingshot
{const g=await launch('playground');await g.key('KeyF');await g.walk(9,3.7);await g.advance(2.5,['KeyW','ShiftLeft']);log('E taut',await g.snap());console.log('E',await txt(g));await g.shot(`${P}-19-slingshot-taut`);
await g.key('KeyQ',.05);log('E fling',await g.snap());await g.shot(`${P}-20-slingshot-release`);await g.advance(1.5);log('E after',await g.snap());await g.shot(`${P}-21-slingshot-after`);console.log('errE',await g.close());}

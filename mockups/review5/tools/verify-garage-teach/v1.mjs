import {launch} from '../cap.mjs';
const K='verify-garage-teach';
const g=await launch('garage',{fullfx:true});
const log=(...a)=>console.log(...a);
const st=async()=>(await g.snap()).station;
const prompt=()=>g.page.evaluate(()=>[...document.querySelectorAll('[data-layer="hud"] *')].filter(e=>/prompt/i.test(e.className)&&e.offsetParent).map(e=>e.innerText.replace(/\s+/g,' ')).join(' | '));
const robot={x:820,y:60,width:260,height:330};
await g.advance(.3);
await g.walk(6.4,-4.2,.5);await g.key('KeyE');await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE');await g.advance(.3);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE');await g.advance(.6);
log('atBench',(await g.snap()).atBench);
// profile paragraph visibility (finding 12)
log('profile display',await g.page.evaluate(()=>{const p=document.querySelector('.station-panel .profile');return p?getComputedStyle(p).display:'none-found';}));
// JOB1 reboot frames (finding 9)
await g.act('pulse');await g.advance(.82);await g.crop(`${K}-01-reboot-t002`,robot);
await g.advance(.15);await g.crop(`${K}-02-reboot-t017`,robot);
await g.advance(.3);await g.shot(`${K}-03-reboot-t047-full`);
// fuse cooling (finding 7)
await g.act('pick','diode');await g.act('slot','fly');await g.act('flip','fly');await g.act('pulse');await g.advance(.2);
log('prompt cooling',await prompt());
const r=await g.act('pulse');log('pulse while cooling ok?',r.ok);
await g.crop(`${K}-04-panel-cooling-a`,{x:1120,y:90,width:310,height:260});
await g.advance(1.5);await g.crop(`${K}-05-panel-cooling-b`,{x:1120,y:90,width:310,height:260});
await g.advance(1.2);log('fuse',(await st()).fuse);
await g.act('flip','fly');
// stuck: TVS flipped alone (no diode) vs with diode
await g.act('pick','diode');await g.act('pick','diode');
await g.act('pick','tvs');await g.act('slot','switch');await g.act('flip','switch');await g.act('pulse');await g.advance(1.3);await g.shot(`${K}-06-stuck-tvs-only`);
await g.act('pick','tvs');await g.act('pick','tvs');
// job1 diode test pass timing (finding 10)
await g.act('pick','diode');await g.act('slot','fly');await g.act('pulse');await g.advance(2.2);
await g.act('test');await g.advance(.3);await g.shot(`${K}-07-test-pass-t03`);
log('after test job',(await st()).job,JSON.stringify((await st()).logged));
await g.advance(2.2);await g.shot(`${K}-08-test-pass-t25`);
await g.advance(1.5);
// job2 diode TEST -> slow : reset flash (finding 5)
await g.act('pulse');await g.advance(2.2);
await g.act('test');await g.advance(.55);await g.crop(`${K}-09-slowtest-robot-t055`,robot);
await g.advance(.25);await g.shot(`${K}-10-slowtest-t080`);
await g.advance(3);
await g.act('pick','clamp');await g.act('slot','fly');await g.act('pulse');await g.advance(2);await g.act('test');await g.advance(4);
// job3
await g.act('ground');await g.act('pulse');await g.advance(2);await g.act('test');await g.advance(2);
log('prompt drive',await prompt());await g.shot(`${K}-11-drive-t2`);
await g.advance(10);await g.page.waitForTimeout(3000);await g.shot(`${K}-12-win`);
const s=await g.snap();log('won',s.won,'mist',s.station.mistakes,'spent',s.station.spent);
log('errors',JSON.stringify(await g.close()));

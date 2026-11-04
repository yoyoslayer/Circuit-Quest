import {launch} from '../cap.mjs';
const K='garage-teach';
const g=await launch('garage',{fullfx:true});
const log=(...a)=>console.log(...a);
const st=async()=>(await g.snap()).station;
await g.advance(.5);await g.shot(`${K}-01-start`);
await g.survey();await g.shot(`${K}-02-survey`);await g.key('Tab');await g.advance(1);
// set up (as in tests/station-garage.spec.ts)
await g.walk(6.4,-4.2,.5);await g.key('KeyE');log('held',(await g.snap()).held);
await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.shot(`${K}-03-carry-at-stand`);
await g.key('KeyE');await g.advance(.3);log('onStand',(await st()).onStand);
await g.advance(.5);await g.shot(`${K}-04-on-stand-toast`);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE');await g.advance(.6);
log('atBench',(await g.snap()).atBench);
await g.shot(`${K}-05-bench-start`);
// JOB 1: nothing fitted
await g.act('pulse');await g.advance(.85);await g.shot(`${K}-06-j1-pulse-arc`);
await g.advance(1.2);await g.shot(`${K}-07-j1-pulse-after`);
log('cap',JSON.stringify((await st()).capture));
// backwards diode -> short
await g.act('pick','diode');await g.act('slot','fly');await g.advance(.1);await g.shot(`${K}-08-j1-diode-fitted`);
await g.act('flip','fly');await g.act('pulse');await g.advance(.3);await g.shot(`${K}-09-j1-short`);
log('fuse',(await st()).fuse,'mist',(await st()).mistakes);
await g.advance(1.2);await g.shot(`${K}-10-j1-fuse-cooling`);
await g.advance(1.4);await g.act('flip','fly');
// backwards TVS -> stuck
await g.act('pick','tvs');await g.act('slot','switch');await g.act('flip','switch');await g.act('pulse');await g.advance(.85);await g.shot(`${K}-11-j1-tvs-backwards`);
await g.advance(1.5);await g.shot(`${K}-12-j1-tvs-backwards-after`);
log('stuck cap',JSON.stringify((await st()).capture));
await g.act('pick','tvs');await g.act('pick','tvs');await g.advance(.1);
// diode right way
await g.act('pulse');await g.advance(.85);await g.shot(`${K}-13-j1-diode-flyback`);
await g.advance(1.2);await g.shot(`${K}-14-j1-diode-after`);
await g.act('test');await g.advance(1.5);await g.shot(`${K}-15-j1-test-pass`);
log('logged',JSON.stringify((await st()).logged));
await g.advance(3);
// JOB 2
await g.shot(`${K}-16-j2-start`);
await g.act('pulse');await g.advance(.85);await g.shot(`${K}-17-j2-diode-slow`);
await g.advance(1.5);await g.shot(`${K}-18-j2-diode-slow-after`);
await g.act('test');await g.advance(1.2);await g.shot(`${K}-19-j2-test-fail`);
log('mist',(await st()).mistakes);
await g.advance(3);
await g.act('pick','clamp');await g.act('slot','fly');await g.act('pulse');await g.advance(1.5);await g.shot(`${K}-20-j2-clamp`);
await g.act('test');await g.advance(1.5);log('logged',JSON.stringify((await st()).logged));await g.advance(3);
// JOB 3
await g.shot(`${K}-21-j3-start`);
await g.act('pulse');await g.advance(.25);await g.shot(`${K}-22-j3-start-reboot`);
await g.advance(1.5);await g.shot(`${K}-23-j3-scope-start`);
await g.act('pick','cap');await g.act('slot','ctrl');await g.act('flip','ctrl');await g.act('pulse');await g.advance(.4);await g.shot(`${K}-24-j3-cap-reversed`);
await g.act('flip','ctrl');await g.act('pulse');await g.advance(1.5);await g.shot(`${K}-25-j3-cap-partial`);
log('cap',JSON.stringify((await st()).capture));
await g.act('pick','cap');await g.act('pick','cap');await g.act('ground');await g.act('pulse');await g.advance(1.5);await g.shot(`${K}-26-j3-star`);
await g.act('test');await g.advance(2);await g.shot(`${K}-27-drive-start`);
await g.advance(6);await g.shot(`${K}-28-drive-mid`);
await g.advance(6);await g.shot(`${K}-29-win`);
const s=await g.snap();log('won',s.won,'grade',JSON.stringify(s.grade??s.result??null),'mist',s.station?.mistakes);
console.log('errors',JSON.stringify(await g.close()));

import {launch} from '../cap.mjs';
const P='garage-models-';
const g=await launch('garage',{fullfx:true});
await g.advance(.3);await g.zoom(-2000);
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.4);
console.log('held',(await g.snap()).held);
await g.shot(P+'50-carry-robot');
await g.orbit(262,0,.6);await g.shot(P+'51-carry-robot-side');await g.orbit(-262,0,.4);
await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE',.5);
const s=await g.snap();console.log('onStand',s.station?.onStand);
await g.walk(2.9,-4,.4);await g.advance(.3);
await g.orbit(-262,0,.6);await g.shot(P+'52-robot-on-stand');
await g.orbit(524,0,.6);await g.shot(P+'53-robot-on-stand-o');await g.orbit(-262,0,.4);
await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE',.6);
console.log('atBench',(await g.snap()).atBench);
await g.shot(P+'54-bench-view');
await g.crop(P+'55-bench-crop-board',{x:200,y:250,width:1040,height:520});
// pulse with nothing fitted: arc
await g.act('pulse');await g.advance(.85);await g.shot(P+'56-bench-arc');
await g.advance(.4);await g.shot(P+'57-bench-arc-later');
// fit diode, pulse
await g.advance(1.5);await g.act('pick','diode');await g.advance(.2);await g.shot(P+'58-bench-holding-diode');
await g.act('slot','fly');await g.act('pulse');await g.advance(1.3);await g.shot(P+'59-bench-diode-fade');
await g.act('test');await g.advance(1.5);await g.shot(P+'60-bench-job1-pass');
// job 2
await g.act('pick','diode');await g.act('pick','diode');await g.act('pick','tvs');await g.act('slot','switch');await g.act('pulse');await g.advance(1);
await g.act('test');await g.advance(1.5);
// job 3: backwards cap? just star ground
await g.act('pulse');await g.advance(1);await g.shot(P+'61-bench-job3-brownout');
await g.act('ground');await g.advance(.3);await g.shot(P+'62-bench-star-ground');
await g.act('pulse');await g.advance(.5);await g.act('test');await g.advance(2);
const s3=await g.snap();console.log('driving',s3.station?.driving,s3.atBench);
await g.shot(P+'63-drive-start');
await g.advance(3);await g.shot(P+'64-driving');
await g.advance(6);await g.shot(P+'65-delivered');
const s4=await g.snap();console.log('won',s4.won,JSON.stringify(s4.station?.delivered));
await g.advance(2);await g.shot(P+'66-result');
console.log('ERR',JSON.stringify(await g.close()));

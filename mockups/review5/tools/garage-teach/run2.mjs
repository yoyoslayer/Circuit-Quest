import {launch} from '../cap.mjs';
const K='garage-teach';
const g=await launch('garage',{fullfx:true});
const log=(...a)=>console.log(...a);
const st=async()=>(await g.snap()).station;
await g.advance(.3);
await g.walk(6.4,-4.2,.5);await g.key('KeyE');await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE');await g.advance(.3);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE');await g.advance(.6);
// diode polarity close-ups
await g.act('pick','diode');await g.act('slot','fly');await g.advance(.1);
await g.crop(`${K}-30-crop-diode-normal`,{x:300,y:460,width:420,height:170});
await g.act('flip','fly');await g.advance(.1);
await g.crop(`${K}-31-crop-diode-flipped`,{x:300,y:460,width:420,height:170});
await g.act('flip','fly');
await g.crop(`${K}-32-crop-tray`,{x:940,y:470,width:320,height:160});
// held part prompt (where to fit)
await g.act('pick','diode');await g.act('pick','tvs');await g.advance(.1);await g.shot(`${K}-33-held-tvs-prompt`);
log('held',(await st()).held);
// try to fit TVS across motor (wrong slot)
const r=await g.act('slot','fly');log('tvs into fly ok?',r.ok);
await g.act('slot','switch');await g.act('pick','tvs');await g.act('pick','tvs');
// arc frames DR-66
await g.act('pulse');await g.advance(.8);await g.crop(`${K}-34-arc-t0`,{x:180,y:200,width:900,height:450});
await g.advance(.1);await g.crop(`${K}-35-arc-t1`,{x:180,y:200,width:900,height:450});
await g.advance(.3);await g.crop(`${K}-36-arc-t4`,{x:180,y:200,width:900,height:450});
// short: fuse crop during cooling and press P
await g.act('pick','diode');await g.act('slot','fly');await g.act('flip','fly');await g.act('pulse');await g.advance(.15);
await g.crop(`${K}-37-crop-short-fuse`,{x:180,y:470,width:360,height:180});
const p=await g.act('pulse');log('pulse while cooling ok?',p.ok);
await g.advance(1);await g.crop(`${K}-38-crop-panel-cooling`,{x:1120,y:90,width:310,height:240});
await g.advance(2);await g.crop(`${K}-39-crop-panel-cooled`,{x:1120,y:90,width:310,height:240});
await g.act('flip','fly');
// pulse with diode: during run vs after switch-off — sample dot positions via robot/board? use two quick frames
await g.act('pulse');await g.advance(.4);await g.crop(`${K}-40-run-dots-a`,{x:180,y:470,width:780,height:160});
await g.advance(1/60);await g.crop(`${K}-41-run-dots-b`,{x:180,y:470,width:780,height:160});
await g.advance(.42);await g.crop(`${K}-42-fly-dots-a`,{x:180,y:470,width:780,height:160});
await g.advance(1/60);await g.crop(`${K}-43-fly-dots-b`,{x:180,y:470,width:780,height:160});
// robot crop during reboot (job1, nothing fitted)
await g.act('pick','diode');await g.act('pick','diode');
await g.act('pulse');await g.advance(.9);await g.crop(`${K}-44-crop-robot-reboot`,{x:640,y:90,width:420,height:330});
// test failure with no parts: watch cycles
await g.advance(3);await g.act('test');await g.advance(1.3);await g.shot(`${K}-45-test-fail-nothing`);
log('mist',(await st()).mistakes);
// pause to see profile disclosure
await g.key('Escape');await g.advance(.1);await g.shot(`${K}-46-esc`);
log('atBench',(await g.snap()).atBench);
await g.page.keyboard.press('KeyP');await g.page.waitForTimeout(500);await g.shot(`${K}-47-pause`);
console.log('errors',JSON.stringify(await g.close()));

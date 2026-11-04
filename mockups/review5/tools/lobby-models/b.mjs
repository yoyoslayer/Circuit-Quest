import {launch} from '../cap.mjs';
const P='lobby-models-';
const g=await launch('lobby',{fullfx:true,start:false});
await g.page.evaluate(()=>{localStorage.setItem('circuit-crew:best:v1',JSON.stringify({playground:{grade:'A',time:30,damage:0,cost:0},meeting:{grade:'B',time:200,damage:3,cost:50},lunch:{grade:'C',time:400,damage:9,cost:200},arcade:{grade:'A',time:300,damage:0,cost:20}}));});
await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');
const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
await g.advance(1);await g.shot(P+'19-done-start');
let s=await g.snap();console.log(JSON.stringify(s.hub.doors.map(d=>[d.id,d.done,d.locked])));
await g.walk(-9.4,-6.2,.3);await g.advance(1.2);await g.zoom(-2000);await g.shot(P+'20-done-door-close');
await g.orbit(0,-90);await g.shot(P+'21-done-door-lowpitch');await g.orbit(0,90);
// rush unlocked?
await g.walk(6.96,-8.4,.3);await g.advance(1.5);await g.shot(P+'22-rush-unlocked-open');
// workshop
await g.walk(7.5,6.9,.3);await g.advance(.8);await g.shot(P+'23-workshop-close');
await g.orbit(524,0);await g.shot(P+'24-workshop-back');await g.orbit(-524,0);
await g.walk(7.5,5.6,.3);await g.advance(.3);await g.key('KeyE',.4);await g.shot(P+'25-workshop-picker');await g.key('Escape',.3);
const p=await g.snap();console.log('paused?',p.paused);
if(p.paused) await g.key('Escape',.3);
// props
await g.walk(8.6,7.3,.3);await g.advance(.6);await g.shot(P+'26-beanbag-close');
await g.walk(-4.0,8.6,.3);await g.advance(.6);await g.shot(P+'27-cooler-cone');
await g.walk(-8.6,8.7,.3);await g.advance(.6);await g.shot(P+'28-boxes');
await g.walk(-6.5,5.2,.3);await g.advance(.6);await g.shot(P+'29-bench-blob');
await g.walk(4.6,8.0,.3);await g.advance(.6);await g.shot(P+'30-bin');
await g.walk(5,.8,.3);await g.advance(.6);await g.shot(P+'31-plant-pendant');
await g.orbit(0,-100);await g.shot(P+'32-pendant-low');await g.orbit(0,100);
await g.walk(3.3,-1.9,.3);await g.advance(.6);await g.orbit(-262,0);await g.shot(P+'33-board-side');await g.orbit(262,0);
s=await g.snap();console.log('dc',s.drawCalls,'fps',s.fps);
console.log('ERR',JSON.stringify(await g.close()));

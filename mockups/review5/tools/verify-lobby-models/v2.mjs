import {launch} from '../cap.mjs';
const P='verify-lobby-models-';
const g=await launch('lobby',{fullfx:true,start:false});
await g.page.evaluate(()=>{localStorage.setItem('circuit-crew:best:v1',JSON.stringify({playground:{grade:'A',time:30,damage:0,cost:0},meeting:{grade:'B',time:30,damage:0,cost:0},qfn:{grade:'B',time:200,damage:3,cost:50}}));});
await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');
const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
await g.advance(1);
// Pip walking along the back wall from the hinge side through the open Meeting leaf (hinge x=-7.8)
await g.walk(-9.4,-8.55,.15);await g.advance(.1);
await g.walk(-7.45,-8.55,.05);await g.advance(.6);let s=await g.snap();console.log('cross',JSON.stringify(s.player));
await g.zoom(-2000);await g.shot(P+'08-meeting-leaf-cross-close');
await g.orbit(-400,0);await g.shot(P+'09-meeting-leaf-cross-orbit');await g.orbit(400,0);await g.zoom(1400);
// Done-state glows over a cut-away back wall: orbit 180 near the back wall
await g.walk(-9,-6,.3);await g.advance(.8);await g.orbit(524,0);await g.advance(1.5);await g.shot(P+'10-done-glow-backwall-cutaway');
await g.orbit(-524,0);
// side wall cutaway with qfn done
await g.walk(-11.5,-5.5,.3);await g.advance(.8);await g.orbit(262,0);await g.advance(1.5);await g.shot(P+'11-done-glow-sidewall-cutaway');
console.log('ERR',JSON.stringify(await g.close()));

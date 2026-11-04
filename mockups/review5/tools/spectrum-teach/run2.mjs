import {launch} from '../cap.mjs';
const P='spectrum-teach-';
const g=await launch('spectrum',{fullfx:true});
await g.advance(.5);
// mesh close-up
await g.walk(4.6,2.6,.4);await g.zoom(-1500);await g.shot(P+'30-mesh-close');
await g.orbit(300,0);await g.shot(P+'31-mesh-close-orbit');await g.orbit(-300,0);
// quiet room doorway
await g.walk(9.6,.4,.4);await g.shot(P+'32-quiet-doorway-close');
// lab doorway
await g.walk(9.8,-1.6,.4);await g.orbit(-200,0);await g.shot(P+'33-lab-doorway-close');await g.orbit(200,0);
// hatch close-up
await g.walk(5.4,-1.8,.4);await g.shot(P+'34-hatch-close');
// wall chart
await g.walk(-9.8,0,.4);await g.orbit(450,0);await g.shot(P+'35-chart-close');
await g.zoom(1500);await g.orbit(-450,0);
// desk: radio broadcast seen in hall
await g.walk(-6.3,3.6,.5);await g.walk(-3.5,3.55,.4);await g.key('KeyE',.2);await g.advance(1);
await g.act('band','radio');await g.advance(.3);await g.key('KeyE',.2);await g.advance(1.3);await g.shot(P+'36-hall-radio-broadcast');
await g.walk(-5.5,-2.2,.4);await g.zoom(-600);await g.advance(.4);await g.shot(P+'37-radio-at-brick');
// thermal: aim tower at a sunny wall? just show thermal beam hitting the brick
await g.zoom(600);await g.walk(-3.5,3.55,.4);await g.key('KeyE',.2);await g.advance(1);await g.act('band','thermal');await g.act('send');await g.advance(.4);await g.shot(P+'38-desk-thermal-fail-store');
await g.key('KeyE',.2);await g.advance(.3);await g.shot(P+'39-hall-after-fail');
console.log('errors',await g.close());

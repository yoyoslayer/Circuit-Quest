import {launch} from '../cap.mjs';
const P='recheck-list-';const log=(...a)=>console.log(...a);
const g=await launch('lunch',{fullfx:true});
const strainState=()=>g.page.evaluate(()=>{const s=document.querySelector('.strain');return s?{cls:s.className,vis:getComputedStyle(s).opacity}:null;});
try{
await g.advance(.5);
// (3) vending machine in the corridor
let r=await g.walk(-5,7.6,.5);log('vend walk',r.arrived);
await g.shot(P+'03a-lunch-vending-gamecam');await g.zoom(-1500);await g.shot(P+'03b-lunch-vending-z9');await g.orbit(-300,0);await g.shot(P+'03c-lunch-vending-z9-orbit');await g.orbit(300,0);await g.zoom(1500);
// (2) shove through the swing door and back, then check leaves
r=await g.walk(0,3,.4);r=await g.walk(0,-2,.4);log('through door',r.arrived,r.state.player);
await g.advance(.25);await g.shot(P+'02a-lunch-door-mid-swing');
await g.advance(3);await g.zoom(-1500);await g.shot(P+'02b-lunch-door-after-shove-z9');await g.orbit(-400,150);await g.shot(P+'02c-lunch-door-after-shove-side');await g.orbit(400,-150);await g.zoom(1500);
// (5) LR7: kitchen/corridor wall fade with Pip at (-7.2,-0.6)
r=await g.walk(-7.2,-.6,.4);log('LR7',r.arrived,r.state.player);
await g.advance(.4);await g.shot(P+'05a-lunch-kitchen-wall-gamecam');await g.zoom(-1500);await g.advance(.4);await g.shot(P+'05b-lunch-kitchen-wall-z9');await g.orbit(0,200);await g.shot(P+'05c-lunch-kitchen-wall-z9-low');await g.orbit(0,-200);await g.zoom(1500);
// (7) LR6: unwedged door cuts the thick cable; does the meter flash gold?
r=await g.walk(.2,-1.2,.4);r=await g.walk(.3,2,.4);
r=await g.walk(2,8,.4);await g.key('KeyE');r=await g.walk(.3,2,.45);await g.advance(4);r=await g.walk(2,2);await g.key('KeyE');log('water',(await g.snap()).lunch.water);
r=await g.walk(-10,7.5,.3);await g.key('KeyF');log('held',(await g.snap()).lunch.held?.id);
for(const [x,z] of [[1,3],[.2,-1.2],[-3.5,-3]])await g.walk(x,z,.45);
await g.key('KeyF',0);
const samples=[];for(let i=0;i<12;i++){await g.advance(.15);const s=await g.snap();const c=s.lunch.cables.find(c=>c.id==='thick');samples.push({t:+s.time.toFixed(2),dead:c.dead,ports:c.ports,strain:await strainState()});if(i===3)await g.shot(P+'07a-lunch-cut-cable-meter');}
log(JSON.stringify(samples));
await g.shot(P+'07b-lunch-cut-cable-after');
}catch(e){log('ERR',e.message);}
log('errors',JSON.stringify(await g.close()));

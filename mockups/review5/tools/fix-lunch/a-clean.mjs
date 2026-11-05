// Fix-lunch check A: the clean route with logging (cart tilt, door trap, wedge, dolly, lift, tray).
// BASE=http://127.0.0.1:4196 node mockups/review5/tools/fix-lunch/a-clean.mjs
import {launch} from '../cap.mjs';
const g=await launch('lunch');const L=(...a)=>console.log(...a);
const s=()=>g.snap();
await g.advance(1);await g.shot('fix-lunch-01-start');
// R5-017: walk past cart A along the reviewer's path.
let r=await g.walk(-14.2,5,.4);r=await g.walk(-12,1.6,.4);
const q=await g.ev('const p=window.__game.props.find(p=>p.spec.id==="supply-a");const r=p.body.rotation();return {pos:p.body.translation(),up:1-2*(r.x*r.x+r.z*r.z)}');L('cartA after walk',JSON.stringify(q));
await g.advance(2);await g.shot('fix-lunch-02-cartA-after-walk');
// Wedge + mop.
r=await g.walk(-3,7,.4);await g.key('KeyE');r=await g.walk(0,1.4);await g.key('KeyE');await g.advance(.5);L('wedged',(await s()).lunch.doorWedged);
r=await g.walk(2,8,.4);await g.key('KeyE');r=await g.walk(.3,2,.45);await g.advance(4);r=await g.walk(2,2);await g.key('KeyE');L('water',(await s()).lunch.water);
// Thick to the kitchen; log dolly distance along the way.
r=await g.walk(-10,7.5,.3);await g.key('KeyF');L('held',JSON.stringify((await s()).lunch.held));
for(const [x,z] of [[1,3],[.2,-1.2],[-3.5,-3]]){r=await g.walk(x,z,.45);const st=await s(),d=st.items.find(i=>i.id==='thick-dolly').pos;L('leg',x,z,'arrived',r.arrived,'pip',JSON.stringify(st.player),'dolly',d.x.toFixed(2),d.z.toFixed(2),'d',Math.hypot(d.x-st.player.x,d.z-st.player.z).toFixed(2),'thick strain',st.lunch.cables.find(c=>c.id==='thick').strain.toFixed(2));if(x===1)await g.shot('fix-lunch-03-dolly-trailing');}
await g.key('KeyF');await g.advance(.6);let st=await s();L('oven',st.lunch.loads.find(l=>l.id==='oven').state,'b',JSON.stringify(st.lunch.sources),'thick',JSON.stringify(st.lunch.cables.find(c=>c.id==='thick')));
await g.advance(1.5);st=await s();const d=st.items.find(i=>i.id==='thick-dolly').pos;L('dolly after plug',d.x.toFixed(2),d.z.toFixed(2),'from door',Math.hypot(d.x,d.z-.15).toFixed(2));
r=await g.walk(.3,-1.3);L('walk out .3,-1.3 arrived',r.arrived,JSON.stringify(r.state.player));await g.shot('fix-lunch-04-doorway');
// R5-018 trap route and R5-019 wedge.
for(const [x,z] of [[.3,2.4],[10,1],[1,-.5]]){r=await g.walk(x,z,.5);L('trap leg',x,z,r.arrived,JSON.stringify(r.state.player));}
await g.advance(1,['KeyD']);L('after D',JSON.stringify((await s()).player));
r=await g.walk(-1,-2.5,.5);L('to -1,-2.5',r.arrived);
r=await g.walk(1.3,-.9,.4);await g.key('KeyE');await g.advance(.3);st=await s();L('E near wedge: held',st.held,'wedged',st.lunch.doorWedged,'busy',st.lunch.doorBusy,'thick dead',st.lunch.cables.find(c=>c.id==='thick').dead);
await g.shot('fix-lunch-05-near-wedge');
// R5-136: try to walk under the lift car.
await g.ev('window.__game.player.setNextKinematicTranslation({x:12,y:.91,z:-3.4});return 0');await g.advance(.3);r=await g.walk(12,-7.2,.3,8);L('walk under car',r.arrived,JSON.stringify(r.state.player));
await g.shot('fix-lunch-06-lift');
L('errors',JSON.stringify(await g.close()));

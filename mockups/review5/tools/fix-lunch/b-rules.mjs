// Fix-lunch check B: lift surge badge, capacitor charge and kick, cable wrap round a desk, slingshot near the crowd.
// BASE=http://localhost:4196 node mockups/review5/tools/fix-lunch/b-rules.mjs
import {launch} from '../cap.mjs';
const g=await launch('lunch');const L=(...a)=>console.log(...a);const s=()=>g.snap();
const lunch=async()=>(await s()).lunch;
await g.advance(1);
// 1. Lift kick with no capacitor: cart A trips, the surge badge floats over the winch.
let r=await g.walk(-10.8,2,.4);await g.key('KeyF');L('held',JSON.stringify((await lunch()).held));
for(const [x,z] of [[.3,2.4],[10,1],[11.8,-4.4]])r=await g.walk(x,z,.5);
await g.key('KeyF');await g.key('KeyE',.4);let l=await lunch();L('after lift on: a',JSON.stringify(l.sources[0]),'surge',l.surgeHint,'capHint',l.capHint,'lift',JSON.stringify(l.loads.find(x=>x.id==='lift')),'told',l.told);
await g.shot('fix-lunch-10-surge-lift');
// 2. Bring the capacitor cart over (moved by hand here), feed it, watch it charge, then start the lift.
await g.ev('const c=window.__game.props.find(p=>p.spec.id==="capacitor");c.body.setTranslation({x:11.3,y:.62,z:-4.2},true);c.body.setLinvel({x:0,y:0,z:0},true);return 0');await g.advance(.5);
l=await lunch();L('docked',l.capDocked,'thin-1 ports',JSON.stringify(l.cables.find(c=>c.id==='thin-1').ports));
await g.ev('window.__game.lunch.circuit.resetBreaker("a");return 0');
r=await g.walk(11.4,-3.2,.4);await g.key('KeyF');L('held',JSON.stringify((await lunch()).held));
const cap=(await s()).items.find(i=>i.id==='capacitor').pos;r=await g.walk(cap.x-.9,cap.z,.3);await g.key('KeyF');l=await lunch();L('thin-1 ports',JSON.stringify(l.cables.find(c=>c.id==='thin-1').ports),'charge',l.capCharge,'draw a',l.draw.a);
await g.advance(3);l=await lunch();L('3 s later charge',l.capCharge,'draw a',l.draw.a);await g.shot('fix-lunch-11-cap-charging');
await g.advance(5);r=await g.walk(11.8,-4.4,.4);l=await lunch();L('before start charge',l.capCharge);
await g.key('KeyE',.3);l=await lunch();L('0.3 s into kick: charge',l.capCharge,'draw a',l.draw.a,'tripped',l.sources[0].tripped);await g.shot('fix-lunch-12-cap-kick');
await g.advance(1);l=await lunch();L('after kick: charge',l.capCharge,'draw a',l.draw.a,'lift',l.loads.find(x=>x.id==='lift').state);
await g.advance(3.5);l=await lunch();L('liftRan',l.liftRan,'charge',l.capCharge,'draw a',l.draw.a);
// 3. Drag thin-2 round the kitchen desks: it should bend at a desk corner.
await g.ev('window.__game.lunch.circuit.resetBreaker("a");return 0');
r=await g.walk(-10,3.5,.4);await g.key('KeyF');L('held',JSON.stringify((await lunch()).held));
for(const [x,z] of [[.3,2.4],[.3,-1.3],[-1.9,-3],[-1.9,-5.4],[4.6,-5.4]]){r=await g.walk(x,z,.4);}
l=await lunch();L('thin-2 points',JSON.stringify(l.cablePoints['thin-2']),'strain',l.cables.find(c=>c.id==='thin-2').strain.toFixed(2));
await g.shot('fix-lunch-13-wrap-desk');
await g.key('KeyF');
// 4. The short spare on cart B, sprinted past the corridor benches, then let go.
r=await g.walk(-11,6.2,.4);await g.key('KeyF');L('held',JSON.stringify((await lunch()).held));
r=await g.walk(-3,7.6,.4);l=await lunch();L('strain at -3,7.6',l.cables.find(c=>c.id==='thin-3').strain.toFixed(2));
let max=0;for(let i=0;i<8;i++){await g.ev('return window.__circuitCrew.drive.advance(.15,["KeyD","ShiftLeft"])');const st=await lunch();max=Math.max(max,st.cables.find(c=>c.id==='thin-3').strain);}
const pre=await s();L('max strain',max.toFixed(2),'alarmed',pre.alarmed,'pip',JSON.stringify(pre.player));await g.shot('fix-lunch-14-strain');
await g.key('KeyQ',.05);const post=await s();L('after Q fastestProp',post.fastestProp.toFixed(2),'alarmed',post.alarmed);await g.advance(.3);await g.shot('fix-lunch-15-fling');
// 5. Close-ups of the load tags.
r=await g.walk(-2.4,-6.2,.4);await g.zoom(-600);await g.shot('fix-lunch-16-oven-tag');
L('errors',JSON.stringify(await g.close()));

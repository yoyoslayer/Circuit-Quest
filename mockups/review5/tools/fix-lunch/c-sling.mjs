// Fix-lunch check C: the short spare on cart B, sprinted past the corridor benches, then let go; load-tag close-ups.
// BASE=http://localhost:4196 node mockups/review5/tools/fix-lunch/c-sling.mjs
import {launch} from '../cap.mjs';
const g=await launch('lunch');const L=(...a)=>console.log(...a);const s=()=>g.snap();
const lunch=async()=>(await s()).lunch;
await g.advance(1);
let r=await g.walk(-11,6.2,.4);await g.key('KeyF');L('held',JSON.stringify((await lunch()).held));
r=await g.walk(-4,7.6,.4);let l=await lunch();L('strain at -4,7.6',l.cables.find(c=>c.id==='thin-3').strain.toFixed(2),'pip',JSON.stringify(r.state.player));
// Face east, then sprint east along the corridor past the benches.
await g.walk(-3.5,7.6,.2);
let max=0;for(let i=0;i<10;i++){await g.ev('return drive.advance(.12,["KeyD","ShiftLeft"])');const st=await lunch();max=Math.max(max,st.cables.find(c=>c.id==='thin-3').strain);}
const pre=await s();L('max strain',max.toFixed(2),'alarmed',pre.alarmed,'pip',JSON.stringify(pre.player),'prompt',await g.page.locator('.prompt-pill').innerText().catch(()=>''));await g.shot('fix-lunch-14-strain');
await g.key('KeyQ',.05);const post=await s();L('after Q fastestProp',post.fastestProp.toFixed(2),'alarmed',post.alarmed);await g.advance(.3);await g.shot('fix-lunch-15-fling');
// Load-tag close-ups: oven, conveyor, winch.
for(const [x,z,name] of [[-2.4,-6.2,'oven'],[5,-4.6,'conveyor'],[11.6,-4.0,'winch']]){r=await g.walk(...(x===-2.4?[.3,2.4]:[10,1]),.5);if(x===-2.4)await g.walk(.3,-1.3,.5);r=await g.walk(x,z,.4);await g.zoom(-700);await g.shot(`fix-lunch-16-${name}-tag`);await g.zoom(700);}
L('errors',JSON.stringify(await g.close()));

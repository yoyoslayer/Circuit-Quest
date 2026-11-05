// Fix-lunch check D: Pip can't walk under the lift car; the tray rides belt all the way and hops onto the car.
// BASE=http://localhost:4196 node mockups/review5/tools/fix-lunch/d-lift.mjs
import {launch} from '../cap.mjs';
const g=await launch('lunch');const L=(...a)=>console.log(...a);const s=()=>g.snap();
await g.advance(1);
for(const [x,z] of [[.3,2.4],[10,1],[12,-3.4]])await g.walk(x,z,.5);
let r=await g.walk(12,-7.2,.3,8);L('walk under car arrived',r.arrived,JSON.stringify(r.state.player));
await g.shot('fix-lunch-20-lift-front');
// Put a tray on the belt by hand and sample its path.
await g.ev(`const G=window.__game,l=G.lunch,t=G.props.find(p=>p.spec.id==='tray');l.job.tray='conveyor';t.mesh.visible=true;t.body.setEnabled(true);t.body.setBodyType(2,true);
  l.circuit.loads.find(x=>x.id==='conveyor').state='on';return 0`);
for(const tr of [.2,.6,.85,.98]){await g.ev(`window.__game.lunch.job.transport=${tr};return 0`);await g.advance(.1);const it=(await s()).items.find(i=>i.id==='tray');L('transport',tr,'tray',it.pos.x.toFixed(2),it.pos.y.toFixed(2),it.pos.z.toFixed(2));if(tr===.85)await g.shot('fix-lunch-21-tray-on-run');}
await g.ev(`const l=window.__game.lunch;l.job.transport=1;l.job.tray='lift';return 0`);await g.advance(.6);let it=(await s()).items.find(i=>i.id==='tray');L('on car',it.pos.x.toFixed(2),it.pos.y.toFixed(2));
L('errors',JSON.stringify(await g.close()));

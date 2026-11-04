import {launch} from '../cap.mjs';import {hook,ui,K} from './h.mjs';
const L=(...a)=>console.log(...a.map(x=>typeof x==='string'?x:JSON.stringify(x)));
const g=await launch('garage',{fullfx:true});await hook(g);await g.advance(.5);
const rob=async()=>{const s=await g.snap();const r=s.items.find(i=>i.id==='robot').pos;return {pip:[+s.player.x.toFixed(2),+s.player.z.toFixed(2)],robot:[+r.x.toFixed(2),+r.y.toFixed(2),+r.z.toFixed(2)],held:s.held,onStand:s.station.onStand};};
await g.walk(6.4,-4.2,.5);await g.key('KeyE');L('grabbed',await rob());
await g.walk(3.4,-4,.3);L('carried west',await rob());
// turn around: walk east 1 m, then west again 1.5 m (a natural "overshoot then back" move)
await g.walk(4.6,-4,.25);L('back east 1.2',await rob());await g.walk(2.6,-4.3,.25);L('west again',await rob());
await g.zoom(-500);await g.shot(`${K}-34-ga-after-turnaround`);
await g.key('KeyE',.6);L('drop',await rob(),(await ui(g)).prompt);await g.shot(`${K}-35-ga-turnaround-drop`);
// throw near the stand with Q
await g.key('KeyE');await g.walk(2.4,-4.4,.25);L('regrab',await rob());await g.key('KeyQ',1);L('after Q throw',await rob(),(await ui(g)).prompt);
await g.advance(8);L('8s later',await rob());await g.shot(`${K}-36-ga-after-Q`);
L('errors',await g.close());

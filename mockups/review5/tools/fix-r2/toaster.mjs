// station-cable.spec toaster lob: where does the cone go, and where is the toaster?
import {launch} from '../cap.mjs';
const g=await launch('spectrum',{fullfx:false});await g.advance(.1);
for(const [x,z] of [[-6.3,3.6],[-6.4,1.2],[0,-1.4],[4.2,.6]])await g.walk(x,z);await g.walk(4.6,1,.9);await g.key('KeyE',.1);
const s0=await g.snap();console.log('held',s0.held,'player',JSON.stringify(s0.player));
await g.walk(2.1,1.5,.3);const w=await g.walk(2.1,2.9,.12);console.log('walk2',w.arrived,JSON.stringify(w.state.player));
const info=()=>g.page.evaluate(()=>{const G=window.__game,t=G.props.find(q=>q.spec.id==='toaster'||q.spec.kind==='toaster'),c=G.held??G.props.find(q=>q.spec.kind==='cone');const f=o=>o?{k:o.spec.id??o.spec.kind,...o.body.translation()}:null;return {toaster:f(t),cone:f(c),heading:G.heading};});
await g.page.evaluate(()=>{window.__cone=window.__game.held;});
const tr=()=>g.page.evaluate(()=>{const c=window.__cone.body.translation(),t=window.__game.station.room?.toaster??window.__game.station.toaster;const tb=t?.body?.translation?.();return {cone:[+c.x.toFixed(2),+c.y.toFixed(2),+c.z.toFixed(2)],toaster:tb?[+tb.x.toFixed(2),+tb.y.toFixed(2),+tb.z.toFixed(2)]:Object.keys(window.__game.station).filter(k=>/toast|room/i.test(k))};});
console.log('before',JSON.stringify(await tr()));await g.page.keyboard.press('KeyQ');for(let i=0;i<10;i++){await g.advance(.15);console.log(JSON.stringify(await tr()));}console.log('down',(await g.snap()).station.toasterDown);
await g.close();

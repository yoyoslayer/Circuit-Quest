import {launch} from '../cap.mjs';import {hook,ui,propsNear,vis,sweep,summarize,approach,K} from './h.mjs';
const g=await launch('playground',{fullfx:true});await hook(g);await g.advance(.5);
const L=(...a)=>console.log(...a.map(x=>typeof x==='string'?x:JSON.stringify(x)));
L('start',await ui(g));L('near plug',await propsNear(g,-7.3,4.7,2.6));
await g.shot(`${K}-01-pg-start`);
// (b) junk nearer than the plug: put a mug 0.25 m closer to Pip than the plug (Pip at spawn -7,5; plug -7.3,4.7)
await g.page.evaluate(()=>{const G=window.__game;const m=G.props.find(p=>p.spec.kind==='mug'&&!p.spec.id)||G.props.find(p=>!p.spec.id&&p.spec.kind!=='box');window.__junk=m.spec.kind;const p=G.player.translation();m.body.setTranslation({x:p.x-.1,y:.3,z:p.z-.15},true);m.body.setLinvel({x:0,y:0,z:0},true);});
await g.advance(.4);L('junk placed',await g.page.evaluate(()=>window.__junk),await ui(g));
await g.zoom(-1500);await g.shot(`${K}-02-pg-junk-near-plug`);
await g.key('KeyE');L('after E',await ui(g));await g.key('KeyE');// put down
await g.key('KeyF');L('after F',await ui(g));
await g.zoom(1500);
// DR-13 step 2 target with plug in hand — approach socket (7,-6)
for(const [x,z] of [[-5,-1],[-4,-4],[3.5,-5.2]])await g.walk(x,z);
L('at 3.5 from socket',await ui(g));
await approach(g,7,-6,1.5);L('1.5m',await ui(g));await g.zoom(-600);await g.shot(`${K}-03-pg-socket-1p5m`);
await approach(g,7,-6,.6);L('0.6m',await ui(g));await g.shot(`${K}-04-pg-socket-0p6m`);
// release with Q 0.3 m off
await approach(g,7,-6,.95);L('pre-Q',await ui(g));await g.key('KeyQ',.4);L('after Q (plug dropped next to socket)',await ui(g),(await g.snap()).electrical);
await g.shot(`${K}-05-pg-socket-dropQ`);
await g.advance(2);L('2s later',await ui(g));
// pick it back and press F
await g.key('KeyF');L('re-pick',await ui(g));await g.key('KeyF',.3);L('F plug in',await ui(g));
await g.shot(`${K}-06-pg-socket-plugged`);
await g.zoom(1500);
// step3: switch
L('step3 marker',await ui(g));
const sw=await sweep(g,[[7.55,1.0,-6.35,'switch'],[7.55,2.1,-6.35,'marker'],[7,.3,-6,'socket']],'pg-sw',(z,k,v)=>v.some(x=>x.name==='marker'&&(x.blocked||!x.inFrame)));
L(summarize(sw));
L('errors',await g.close());

import {launch} from '../cap.mjs';import {hook,ui,propsNear,sweep,summarize,approach,K} from './h.mjs';
const L=(...a)=>console.log(...a.map(x=>typeof x==='string'?x:JSON.stringify(x)));
const g=await launch('meeting',{fullfx:true});await hook(g);await g.advance(.5);
const stripAt=(await g.snap()).items.find(i=>i.id==='strip').pos;L('strip at',stripAt,'start ui',await ui(g));
// DR-13 step 1 target (strip on printer stand) from spawn
const s1=await sweep(g,[[stripAt.x,stripAt.y+.1,stripAt.z,'strip'],[stripAt.x,2.1,stripAt.z,'marker']],'mt-s1',(z,k,v)=>v.some(x=>x.name==='marker'&&(x.blocked||!x.inFrame))&&k%2===0);L('SWEEP step1 from spawn\n'+summarize(s1));
await g.walk(-8.6,-3.9,.4);L('near strip',await propsNear(g,stripAt.x,stripAt.z,1.8),await ui(g));
// (b) junk: move nearest junk prop between Pip and strip, slightly closer
await g.page.evaluate(()=>{const G=window.__game,p=G.player.translation();const m=G.props.find(q=>q.spec.kind==='mug'&&!q.spec.id);m.body.setTranslation({x:p.x+.05,y:p.y+.2,z:p.z+.25},true);m.body.setLinvel({x:0,y:0,z:0},true);});await g.advance(.4);
L('junk mug placed',await ui(g));await g.zoom(-1500);await g.shot(`${K}-10-mt-junk-near-strip`);
await g.key('KeyE');L('E took',await ui(g));if((await ui(g)).held!=='strip'){await g.key('KeyE');await g.page.evaluate(()=>{const G=window.__game,m=G.props.find(q=>q.spec.kind==='mug'&&!q.spec.id);m.body.setTranslation({x:-6,y:.3,z:-1},true);});await g.advance(.3);await g.key('KeyE');}
L('holding',await ui(g));await g.zoom(1500);
for(const [x,z] of [[-8,-1.4],[6,-1.2],[9.5,-1.4]])await g.walk(x,z);
L('strip 2.8m',await ui(g));
await approach(g,12.3,-2.25,1.5);L('strip 1.5m',await ui(g));await g.zoom(-700);await g.shot(`${K}-11-mt-strip-1p5m`);
await approach(g,12.3,-2.25,.6);L('strip 0.6m',await ui(g));await g.shot(`${K}-12-mt-strip-0p6m`);
await approach(g,12.3,-2.25,1.1);await g.key('KeyE',.4);let s=await g.snap();L('after E: stripPlaced',s.stripPlaced,s.items.find(i=>i.id==='strip').pos);await g.shot(`${K}-13-mt-strip-placed`);
await g.zoom(1500);
// step 2: plug at reel in closet
L('step2 ui',await ui(g));
for(const [x,z] of [[6,-1.2],[-8,-1.4],[-9,-6]])await g.walk(x,z);
const u2=await ui(g);L('step2 at reel',u2);
const s2=await sweep(g,[[u2.plug[0],.4,u2.plug[1],'plug'],[u2.plug[0],2.1,u2.plug[1],'marker']],'mt-s2',(z,k,v)=>v.some(x=>x.name==='marker'&&(x.blocked||!x.inFrame))&&k%2===0);L('SWEEP step2 plug\n'+summarize(s2));
await g.walk(-10.7,-6.8,.4);L('at reel',await propsNear(g,u2.plug[0],u2.plug[1],1.9),await ui(g));
await g.key('KeyF');
// coffee reel nearby? coupler route
await g.walk(-9,-6,.3);await g.walk(-9,5.3,.3);await g.walk(-4.5,5.3,.3);
L('near cart',await propsNear(g,-3.3,4.7,1.8),await ui(g));await g.zoom(-1500);await g.shot(`${K}-14-mt-cart-holding-plug`);
await g.walk(-3.3,5.5,.3);L('at cart (spec spot)',await ui(g));await g.shot(`${K}-15-mt-cart-attach-cue`);
await g.key('KeyF');L('F1',await ui(g),(await g.snap()).rope.maxLength);await g.key('KeyF');L('F2',await ui(g),(await g.snap()).rope.maxLength);
await g.zoom(1500);
for(const [x,z] of [[-1,3],[-1,-1.5],[6,-1.2],[9.5,-1.4]])await g.walk(x,z);
await approach(g,12.3,-2.25,1.5);L('plug 1.5m',await ui(g));await g.zoom(-700);await g.shot(`${K}-16-mt-wallplug-1p5m`);
await approach(g,12.3,-2.25,.6);L('plug 0.6m',await ui(g));await g.shot(`${K}-17-mt-wallplug-0p6m`);
await approach(g,12.3,-2.25,.95);await g.key('KeyQ',.4);s=await g.snap();L('after Q near strip: connected?',(await ui(g)),s.electrical);await g.shot(`${K}-18-mt-wallplug-afterQ`);
await g.key('KeyF');await g.key('KeyF',.3);L('F re-pick + F',await ui(g));
await g.zoom(1500);
// step3: switch inside boardroom; sweep from the door
const s3=await sweep(g,[[12,1,-4.4,'switch'],[12,2.1,-4.4,'marker']],'mt-s3',(z,k,v)=>v.some(x=>x.name==='marker'&&(x.blocked||!x.inFrame))&&k%2===0);L('SWEEP step3 switch\n'+summarize(s3));
L('errors',await g.close());

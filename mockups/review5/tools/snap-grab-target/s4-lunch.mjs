import {launch} from '../cap.mjs';import {hook,ui,sweep,summarize,approach,K} from './h.mjs';
const L=(...a)=>console.log(...a.map(x=>typeof x==='string'?x:JSON.stringify(x)));
const g=await launch('lunch',{fullfx:true});await hook(g);await g.advance(.5);
const lu=async()=>{const s=await g.snap();const u=await ui(g);return {prompt:u.prompt,pip:u.pip,held:s.lunch.held,cables:s.lunch.cables.map(c=>c.id+':'+c.ports.join('>')),capDocked:s.lunch.capDocked,marker:u.marker};};
await g.walk(-3,7,.4);await g.key('KeyE');await g.walk(0,1.4);await g.key('KeyE',.5);
await g.walk(2,8,.4);await g.key('KeyE');await g.walk(.3,2,.45);await g.advance(4);await g.walk(2,2);await g.key('KeyE');
L('step3 marker',await lu());
const s3=await sweep(g,[[-4,.6,-3,'post'],[-4,2.1,-3,'marker']],'lu-post-from-door',(z,k,v)=>v.some(x=>x.name==='marker'&&(x.blocked||!x.inFrame))&&k%2===0);L('SWEEP step3 (Pip at 2,2)\n'+summarize(s3));
await g.walk(-10,7.5,.3);await g.key('KeyF');L('thick',await lu());
for(const [x,z] of [[1,3],[.2,-1.2],[-2,-1.6]])await g.walk(x,z,.45);
L('2m',await lu());await g.zoom(-600);await g.shot(`${K}-20-lu-post-2m`);
// approach from the fridge side: stand where the fridge port is nearer to Pip
await g.walk(-3.4,-2.25,.12,8);L('between ports (fridge nearer Pip, plug end ahead)',await lu());await g.shot(`${K}-21-lu-between-ports`);
await g.key('KeyF',.5);L('after F',await lu(),(await g.snap()).lunch.loads.map(l=>l.id+':'+l.state).join(' '));await g.shot(`${K}-22-lu-after-F`);
await g.zoom(1500);
L('errors',await g.close());

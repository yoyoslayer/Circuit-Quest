import {launch} from '../cap.mjs';import {hook,ui,propsNear} from '../snap-grab-target/h.mjs';
const K='verify-gap7-snap-grab-target';const L=(...a)=>console.log(...a.map(x=>typeof x==='string'?x:JSON.stringify(x)));
const which=process.argv[2]||'all';
if(which==='all'||which==='m'){
const g=await launch('meeting',{fullfx:true});await hook(g);await g.advance(.5);
await g.page.evaluate(()=>{window.__game.zoom=9;window.__game.yaw=.14+Math.PI;});await g.advance(1.2);await g.shot(`${K}-01-mt-spawn-y180`);
L('meet', await g.page.evaluate(()=>{const G=window.__game,c=G.view.camera.position,p=G.player.translation();return {cam:[c.x,c.y,c.z].map(v=>+v.toFixed(2)),pip:[p.x,p.z].map(v=>+v.toFixed(2)),walls:G.shellWalls.map(w=>{const a=w.group.parent.getWorldPosition(new window.__T.Vector3());const t=new window.__T.Vector3(c.x-a.x,0,c.z-a.z);const plane=w.normal.dot(t);t.normalize();return {at:[+a.x.toFixed(1),+a.z.toFixed(1)],n:[w.normal.x,w.normal.z],dot:+w.normal.dot(t).toFixed(3),planeDist:+plane.toFixed(2),scale:+w.group.scale.y.toFixed(2)};})};}),await ui(g));
await g.shot(`${K}-01-mt-spawn-y180`);
// Q drop near socket test in meeting? skip; check cart reticle
L(await g.close());}
if(which==='all'||which==='p'){
const g=await launch('playground',{fullfx:true});await hook(g);await g.advance(.5);
await g.page.evaluate(()=>{const G=window.__game;const m=G.props.find(p=>p.spec.kind==='mug'&&!p.spec.id);const p=G.player.translation();m.body.setTranslation({x:p.x-.1,y:.3,z:p.z-.15},true);m.body.setLinvel({x:0,y:0,z:0},true);});
await g.advance(.4);L('junk',await ui(g));await g.zoom(-1500);await g.shot(`${K}-02-pg-junk`);
await g.key('KeyF');L('after F (prompted key)',await ui(g));
for(const [x,z] of [[-5,-1],[-4,-4],[3.5,-5.2]])await g.walk(x,z);
await g.walk(7-.95,-6,.12,10);const u=await ui(g);L('beforeQ',u,'plug->socket',Math.hypot(u.plug[0]-7,u.plug[1]+6).toFixed(2));
await g.key('KeyQ',.6);const u2=await ui(g);L('afterQ',u2,'plug->socket',Math.hypot(u2.plug[0]-7,u2.plug[1]+6).toFixed(2),(await g.snap()).electrical);
await g.shot(`${K}-03-pg-afterQ`);
await g.key('KeyE',.3);L('after E',await ui(g));
L(await g.close());}
if(which==='all'||which==='l'){
const g=await launch('lunch',{fullfx:true});await hook(g);await g.advance(.5);
const lu=async()=>{const s=await g.snap();const u=await ui(g);return {prompt:u.prompt,pip:u.pip,cables:s.lunch.cables.map(c=>c.id+':'+c.ports.join('>')),hand:await g.page.evaluate(()=>{const h=window.__game.handPosition();return [+h.x.toFixed(2),+h.z.toFixed(2)];})};};
await g.walk(-3,7,.4);await g.key('KeyE');await g.walk(0,1.4);await g.key('KeyE',.5);
await g.walk(2,8,.4);await g.key('KeyE');await g.walk(.3,2,.45);await g.advance(4);await g.walk(2,2);await g.key('KeyE');
await g.walk(-10,7.5,.3);await g.key('KeyF');
for(const [x,z] of [[1,3],[.2,-1.2],[-2,-1.6]])await g.walk(x,z,.45);
await g.walk(-3.4,-2.25,.12,8);L('between',await lu());await g.zoom(-600);await g.shot(`${K}-04-lu-between`);
await g.key('KeyF',.5);L('afterF',await lu(),(await g.snap()).lunch.loads.map(l=>l.id+':'+l.state).join(' '));
L(await g.close());}

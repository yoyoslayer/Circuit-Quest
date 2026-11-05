// Replays lunch-rules "emptying the fridge into the cooler box" and, where the walk stalls, lists the
// colliders near Pip (what each belongs to) and takes a shot. BASE=http://localhost:4212 node cooler.mjs
import {launch} from '../cap.mjs';
const g=await launch('lunch',{fullfx:false});
const go=async(x,z,r=.5)=>{const res=await g.walk(x,z,r);if(!res.arrived){console.log('STUCK toward',x,z,'at',JSON.stringify(res.state.player));return false;}return true;};
const route=async(pts,r)=>{for(const [x,z] of pts)if(!await go(x,z,r))return false;return true;};
const E=()=>g.key('KeyE'),F=()=>g.key('KeyF');
// wedgeDoor, mopPuddle, takeThick, feedKitchen
await go(-3,7,.4);await E();await go(0,1.4);await E();await g.advance(.5);
await go(2,8,.4);await E();await go(.3,2,.45);await g.advance(4);await go(2,2);await E();
await go(-10,7.5,.3);await F();await route([[1,3],[.2,-1.2],[-3.5,-3]],.45);await F();await g.advance(.4);
await go(-6.5,-4.8);await E();console.log('held',(await g.snap()).held);await go(-5.7,-3.3);await E();
const ok1=await route([[-8.8,-5],[-10,-7.2]],.45);await E();console.log('held',(await g.snap()).held,ok1);
const ok=await route([[-8.8,-5],[-6.5,-3.8],[-4.4,-3.6],[-4.4,-1.8]],.5);
const dump=await g.page.evaluate(()=>{const G=window.__game,p=G.player.translation(),out=[];
  G.world.forEachCollider(c=>{const t=c.translation();const d=Math.hypot(t.x-p.x,t.z-p.z);if(d>2.2)return;const b=c.parent();const prop=G.props.find(q=>q.body===b);
    const he=c.halfExtents?.()??null;out.push({d:+d.toFixed(2),at:[+t.x.toFixed(2),+t.y.toFixed(2),+t.z.toFixed(2)],shape:c.shapeType(),he:he&&[+he.x.toFixed(2),+he.y.toFixed(2),+he.z.toFixed(2)],r:c.radius?.(),prop:prop?(prop.spec.id??prop.spec.kind):null,held:prop&&G.held===prop,enabled:c.isEnabled(),sensor:c.isSensor(),body:b?b.bodyType():null});});
  return {player:p,held:G.held?.spec.id??G.held?.spec.kind,colliders:out.sort((a,b)=>a.d-b.d)};});
console.log('route ok',ok);console.log(JSON.stringify(dump,null,0));
await g.advance(1);console.log('box',JSON.stringify((await g.snap()).items.find(i=>i.id==='cooler-box')),'cooled',(await g.snap()).lunch.job.cooled);await g.shot('fix-lunch2-cooler-after');await g.close();

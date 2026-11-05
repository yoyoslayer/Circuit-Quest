// Debug: tower positions and the rope route around a sprint-and-Q near the aisle end.
import {launch} from '../cap.mjs';
const g=await launch('meeting');await g.advance(.3);
const tw=()=>g.page.evaluate(()=>{const q=window.__game;return JSON.stringify({tower:q.props.filter(p=>q.strip.isTower(p)).map(p=>{const t=p.body.translation();return [t.x.toFixed(2),t.y.toFixed(2),t.z.toFixed(2)];}),rope:q.ropePoints.map(p=>[p.x.toFixed(1),p.z.toFixed(1)]),pip:q.player.translation()});});
console.log('start',await tw());
const route=async(pts,r=.5)=>{for(const [x,z] of pts)await g.walk(x,z,r);};
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE');
await route([[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');await route([[-8,-5],[-1,-1.5],[6,-1.2]]);
for(const [keys,s] of [[['KeyD','ShiftLeft'],2]]){await g.advance(s,keys);}
console.log('taut',await tw(),(await g.snap()).rope.strain);
await g.key('KeyQ',.05);await g.advance(1.5);console.log('after',await tw(),(await g.snap()).strip.towerDown);
await g.close();

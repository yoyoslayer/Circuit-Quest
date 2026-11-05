// Dumps each station room's fixed colliders, job items and coworkers, plus a survey shot.
import {launch} from '../cap.mjs';
const levels=process.argv.slice(2).length?process.argv.slice(2):['arcade','garage','qfn','observatory','spectrum'];
for(const lv of levels){
  const g=await launch(lv,{fullfx:false});await g.advance(.3);
  const info=await g.page.evaluate(()=>{const G=window.__game,out=[];
    G.world.forEachCollider(c=>{const b=c.parent();if(!b||!b.isFixed())return;const h=c.shape.halfExtents;if(!h)return;const t=c.translation();if(h.y<.15||t.y+h.y<.3)return;if(h.x>6||h.z>6)return;
      const own=G.props.some(p=>p.body===b);if(own)return;
      const q=c.rotation();const yaw=2*Math.atan2(q.y,q.w);const ca=Math.abs(Math.cos(yaw)),sa=Math.abs(Math.sin(yaw));const hx=ca*h.x+sa*h.z,hz=sa*h.x+ca*h.z;
      out.push(`[${(t.x-hx).toFixed(2)},${(t.x+hx).toFixed(2)}]x[${(t.z-hz).toFixed(2)},${(t.z+hz).toFixed(2)}] top ${(t.y+h.y).toFixed(2)}`);});
    return {fixed:out,stand:G.station.stand,table:G.station.table,items:G.props.filter(p=>p.spec.id).map(p=>p.spec.id+' '+p.spec.kind+' '+p.spec.x+','+p.spec.z),
      heavy:G.props.filter(p=>!p.spec.id&&['desk','cabinet','bookshelf','vending','printer','cart','pingpong','coolbox','cooler','whiteboard'].includes(p.spec.kind)).map(p=>p.spec.kind+' '+p.body.translation().x.toFixed(1)+','+p.body.translation().z.toFixed(1)).join(' | '),
      npcs:G.npcs.map(n=>n.group.position.x.toFixed(1)+','+n.group.position.z.toFixed(1)),spawn:G.level.spawn,lanes:JSON.stringify(G.level.clutter?.lanes)};});
  console.log('=====',lv);console.log(JSON.stringify(info,null,1));
  await g.survey();await g.shot(`fix-stationcable-explore-${lv}-survey`);
  await g.close();
}

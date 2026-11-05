// What solid sits on the line (-4.6,-3.6) -> (-4.4,-1.8) in Lunch (cooler-box route in lunch-rules.spec)?
import {launch} from '../cap.mjs';
const g=await launch('lunch',{fullfx:false});await g.advance(1);
console.log(await g.page.evaluate(()=>{const G=window.__game,out=new Set();
  for(let k=0;k<=20;k++){const x=-4.6+.2*k/20,z=-3.6+1.8*k/20;for(const y of [.3,.8,1.2])G.world.forEachCollider(c=>{if(c===G.playerCollider)return;if(c.containsPoint({x,y,z})){const b=c.parent(),p=G.props.find(q=>q.body.handle===b?.handle);out.add(`${p?(p.spec.id??p.spec.kind):'fixed'} ${b?.isFixed()?'F':'D'} @${c.translation().x.toFixed(2)},${c.translation().z.toFixed(2)} y${y}`);}});}
  return [...out];}));
await g.close();

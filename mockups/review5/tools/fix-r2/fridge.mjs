// lunch-rules 'cooler box' route: where does Pip get stuck carrying the cooler box?
import {launch} from '../cap.mjs';
const g=await launch('lunch',{fullfx:false});await g.advance(1);
// Skip the setup: teleport next to the cooler box in the store with the lamp lit is hard; just walk the
// final leg empty-handed and report what is in the way near (-5.2,-3.9).
const near=await g.page.evaluate(()=>{const G=window.__game;return G.props.filter(q=>Math.hypot(q.body.translation().x+5,q.body.translation().z+3.8)<1.6).map(q=>`${q.spec.id??q.spec.kind}@${q.body.translation().x.toFixed(2)},${q.body.translation().z.toFixed(2)} y${q.body.translation().y.toFixed(2)}`).concat(G.npcs.filter(n=>Math.hypot(n.group.position.x+5,n.group.position.z+3.8)<2).map(n=>`npc@${n.group.position.x},${n.group.position.z} seated ${n.seated}`));});
console.log(near.join('\n'));await g.close();

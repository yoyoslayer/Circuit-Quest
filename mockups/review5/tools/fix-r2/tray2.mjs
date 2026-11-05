import {launch} from '../cap.mjs';
const g=await launch('arcade-rush',{fullfx:false});await g.advance(1);
for(const [x,z] of [[-8.5,4.3],[-9.2,3.6],[-9.9,4.3],[-9.2,5]]){const r=await g.walk(x,z,.2);const n=await g.page.evaluate(()=>{const G=window.__game,q=G.nearest();return q?(q.spec.id??q.spec.kind):null;});console.log(x,z,'arrived',r.arrived,JSON.stringify(r.state.player),'nearest',n);}
await g.close();

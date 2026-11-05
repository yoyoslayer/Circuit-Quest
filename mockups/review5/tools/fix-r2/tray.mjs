// Where the Rush tray sits and what is nearest to it.
import {launch} from '../cap.mjs';
const g=await launch('arcade-rush',{fullfx:false});await g.advance(1);
console.log(await g.page.evaluate(()=>{const G=window.__game,t=G.props.find(q=>q.spec.id==='blocks');const p=t.body.translation();
  return {tray:p,kind:t.spec.kind,near:G.props.filter(q=>q!==t&&Math.hypot(q.body.translation().x-p.x,q.body.translation().z-p.z)<1.5).map(q=>q.spec.kind+'@'+q.body.translation().x.toFixed(1)+','+q.body.translation().z.toFixed(1)),table:G.station.table,stand:G.station.stand};}));
await g.close();

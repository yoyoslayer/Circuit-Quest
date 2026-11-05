// Lists props near a point at start: BASE=... node probe.mjs level x z r
import {launch} from '../cap.mjs';
const [level='playground',x='7',z='-6',r='2.5']=process.argv.slice(2);
const g=await launch(level);await g.advance(.3);
const out=await g.page.evaluate(([x,z,r])=>{const gm=window.__game;return gm.props.filter(p=>{const t=p.body.translation();return Math.hypot(t.x-x,t.z-z)<r;}).map(p=>{const t=p.body.translation();return `${p.spec.kind} ${t.x.toFixed(2)},${t.y.toFixed(2)},${t.z.toFixed(2)} home ${p.home.x.toFixed(2)},${p.home.z.toFixed(2)}`;});},[+x,+z,+r]);
console.log(out.join('\n'));await g.close();

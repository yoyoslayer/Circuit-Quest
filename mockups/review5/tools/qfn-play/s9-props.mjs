import {launch} from '../cap.mjs';import {log} from './common.mjs';
const g=await launch('qfn',{fullfx:false});
const r=await g.page.evaluate(()=>{const G=window.__circuitCrew;const ps=(G.game??G).props??[];return null;});
const k=await g.ev('const ps=game.props||game.game?.props;if(!ps)return Object.keys(game);const c={};for(const p of ps){c[p.spec.kind]=(c[p.spec.kind]||0)+1;}const near=ps.filter(p=>{const t=p.body.translation();return Math.hypot(t.x,t.z+.5)<3.2;}).map(p=>p.spec.kind+(p.spec.color?":"+p.spec.color:"")+"@"+p.body.translation().x.toFixed(1)+","+p.body.translation().z.toFixed(1));const yel=ps.filter(p=>/ffc6|ffc9|f2b9|ffd8/i.test(p.spec.color||"")).map(p=>p.spec.kind+"@"+p.body.translation().x.toFixed(1)+","+p.body.translation().z.toFixed(1)+(p.spec.id?"(JOB)":""));return {c,near,yel};');
log(k);
await g.close();

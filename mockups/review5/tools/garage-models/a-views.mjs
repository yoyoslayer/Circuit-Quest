import {launch} from '../cap.mjs';
const P='garage-models-';
const g=await launch('garage',{fullfx:true});
const au=await g.audit(.02);console.log('AUDIT .02',JSON.stringify(au));
const au4=await g.audit(.04);console.log('AUDIT .04',au4.length);
const s=await g.snap();console.log('SNAP',JSON.stringify({props:s.props,fps:s.fps,drawCalls:s.drawCalls,player:s.player}));
// list prop kinds via page
const kinds=await g.page.evaluate(()=>{const gm=window.__circuitCrew;const c={};for(const p of gm.props??[]){c[p.spec.kind]=(c[p.spec.kind]||0)+1;}return c;}).catch(e=>String(e));
console.log('KINDS',JSON.stringify(kinds));
await g.advance(.5);await g.shot(P+'01-start');
await g.survey();await g.shot(P+'02-survey');
const s2=await g.snap();console.log('SURVEY',JSON.stringify({fps:s2.fps,drawCalls:s2.drawCalls}));
await g.key('Tab',.1);await g.advance(1.2);
for(const [i,dx] of [[3,350],[4,350],[5,350],[6,350]]){await g.orbit(dx,0,1);await g.shot(P+`0${i}-orbit${(i-2)*90}`);}
await g.orbit(0,-200,1);await g.shot(P+'07-orbit-low');
await g.orbit(0,300,1);await g.shot(P+'08-orbit-high');
console.log('ERR',JSON.stringify(await g.close()));

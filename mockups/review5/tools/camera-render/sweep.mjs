// Per-level camera/render sweep: start, survey, orbits, zoom 9/38, low pitch, flicker triple, occlusion sweep.
// node mockups/review5/tools/camera-render/sweep.mjs <level> <NN-prefix>
import {launch} from '../cap.mjs';
import {hook,occl,stats,camInfo} from './hook.mjs';
import {writeFileSync,mkdirSync} from 'node:fs';
const [level='playground',tag='p']=process.argv.slice(2);
const K=`camera-render-${tag}`;const log={level};
const g=await launch(level,{fullfx:true});
try{
await hook(g);await g.advance(1);
await g.shot(`${K}-01-start`);log.start={stats:await stats(g),cam:await camInfo(g),occ:await occl(g),snap:(s=>({drawCalls:s.drawCalls,fps:s.fps,props:s.props}))(await g.snap())};
await g.survey();await g.shot(`${K}-02-survey`);log.survey={stats:await stats(g),cam:await camInfo(g)};
await g.key('Tab',.1);await g.advance(.5);
// 8-yaw sweep at default zoom (metrics only), shots at two yaws
log.sweepDefault=[];
for(let i=0;i<8;i++){await g.orbit(131,0,.6);const o=await occl(g);log.sweepDefault.push(o);if(i===2)await g.shot(`${K}-03-orbit-a`);if(i===5)await g.shot(`${K}-04-orbit-b`);}
// low pitch
await g.orbit(0,-400,.6);log.low=await occl(g);await g.shot(`${K}-05-orbit-low`);
// zoom 9 sweep
await g.zoom(-1500);log.sweep9=[];
for(let i=0;i<8;i++){await g.orbit(131,0,.6);const o=await occl(g);log.sweep9.push(o);if(i===3)await g.shot(`${K}-06-zoom9`);}
// flicker triple at zoom 9 (0.2 s apart, no settle wait)
for(let k=0;k<3;k++){await g.advance(.2);await g.page.waitForTimeout(150);await g.page.screenshot({path:`mockups/review5/shots/${K}-07-flicker-${k}.png`});}
// zoom 38 high
await g.orbit(0,500,.6);await g.zoom(3000);log.z38={cam:await camInfo(g),stats:await stats(g),occ:await occl(g)};await g.shot(`${K}-08-zoom38-high`);
}catch(e){log.error=String(e.stack||e);}
log.errors=await g.close();
mkdirSync('mockups/review5/tools/camera-render/out',{recursive:true});writeFileSync(`mockups/review5/tools/camera-render/out/${tag}.json`,JSON.stringify(log,null,1));
const blockedCount=a=>a?.filter(o=>Object.values(o.blocked).some(h=>h.length)).length;
console.log(level,'draw',log.start?.stats?.draw,'survey',log.survey?.stats?.draw,'fps',log.start?.stats?.fps,'points',log.start?.stats?.points,'mats',JSON.stringify(log.start?.stats?.mats),'blocked default',blockedCount(log.sweepDefault),'/8 z9',blockedCount(log.sweep9),'/8 errors',log.errors?.length,log.error??'');

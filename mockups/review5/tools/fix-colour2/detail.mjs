// Close shots of the colour2 changes. BASE=http://localhost:4211 node mockups/review5/tools/fix-colour2/detail.mjs
import {launch} from '../cap.mjs';
const cam=(g,yaw,pitch,zoom)=>g.page.evaluate(([y,p,z])=>{const G=window.__game;G.yaw=y;G.pitch=p;G.zoom=z;},[yaw,pitch,zoom]);
const look=async(g,name,x,z,yaw,pitch,zoom)=>{await g.walk(x,z,.6);await cam(g,yaw,pitch,zoom);await g.advance(.6);await g.shot(`fix-colour2-${name}`);};
const only=process.argv.slice(2);
const run=async(lv,f)=>{if(only.length&&!only.includes(lv))return;const g=await launch(lv,{fullfx:true});await g.advance(1);try{await f(g);}catch(e){console.log(lv,'error',e.message);}console.log(lv,g.errors.filter(e=>!e.includes('403')).slice(0,3));await g.browser.close();};
await run('meeting',async g=>{
  await look(g,'meeting-pods',-3,-1.2,0,-.5,11);
  await look(g,'meeting-pods-back',-3,-1.2,Math.PI,-.5,11);
  await look(g,'meeting-coffee',-12.8,4,-Math.PI/2,-.45,10);
  await look(g,'meeting-lounge',10,2,0,-.5,11);
  await look(g,'meeting-pillar',-4.75,5.6,0,-.3,9);
});
await run('playground',async g=>{
  await look(g,'playground-pins',3,3.5,.4,-.45,10);
  await look(g,'playground-lamp',4,-3.5,0,-.4,11);
  const ok=await g.page.evaluate(()=>{const G=window.__game;if(G.lightUp){G.lightUp();return true;}return false;});
  await g.advance(.5);await g.shot('fix-colour2-playground-lamp-lit');console.log('lit via decor',ok);
});
await run('lunch',async g=>{await look(g,'lunch-sidewall',-12,2,-Math.PI/2,-.35,11);await look(g,'lunch-backwall',12,-4,0,-.3,12);});
await run('arcade',async g=>{await look(g,'arcade-stools',0,-3,0,-.5,14);await look(g,'arcade-stools-side',6,1,-Math.PI/2,-.45,11);await look(g,'arcade-store',-8,5,-Math.PI/2,-.45,9);});
await run('qfn',async g=>{await g.survey();await g.shot('fix-colour2-qfn-survey');});

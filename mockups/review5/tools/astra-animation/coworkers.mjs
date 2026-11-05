// Presentation fixtures using real alarm/cheer signals. Same BASE/SWIFT settings as capture.mjs.
import {launch,SHOTS} from '../cap.mjs';
import {resolve} from 'node:path';
const label=process.argv[2]??'after';
const g=await launch('meeting',{fullfx:false,query:'lowfx'});
try{
 await g.page.waitForFunction(()=>!!window.__game?.rig,{timeout:120000});
 await g.page.evaluate(()=>{const game=window.__game,n=game.npcs.find(n=>!n.seated)??game.npcs[0];window.__astraNpc=n;const p=n.group.position;game.player.setTranslation({x:p.x-1.3,y:.8,z:p.z+1.8},true);game.zoom=9;game.yaw=0;game.pitch=0;for(let i=0;i<30;i++)game.render(1/60);});
 for(const mood of ['idle','alarm','cheer']){
  await g.page.evaluate(mood=>{const game=window.__game,n=window.__astraNpc;if(mood==='alarm')game.alarm(n.group.position,1);else if(mood==='cheer'){n.alarm=0;game.cheerNear(n.group.position,2);}for(let i=0;i<10;i++)game.render(1/60);},mood);
  await g.page.waitForTimeout(150);await g.page.screenshot({path:resolve(SHOTS,`astra-${label}-coworker-${mood}.png`),timeout:120000});
 }
 const errors=g.errors.filter(e=>!/403|Fredoka/.test(e));console.log(JSON.stringify({label,shots:3,errors}));if(errors.length)process.exitCode=1;
}finally{await g.close();}

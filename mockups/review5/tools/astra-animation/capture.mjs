// Deterministic rig presentation fixtures, not gameplay completion tests.
// Start npx.cmd vite --port 4192 --strictPort, then:
// $env:BASE='http://localhost:4192'; $env:SWIFT='1'; node .../capture.mjs before
import {launch,SHOTS} from '../cap.mjs';
import {resolve} from 'node:path';
import {writeFileSync} from 'node:fs';
const label=process.argv[2]??'after';
const g=await launch('playground',{fullfx:false,query:'lowfx'});
try {
 await g.page.waitForFunction(()=>!!window.__game?.rig,{timeout:120000});
 await g.zoom(-1500);await g.orbit(130,0);
 await g.page.evaluate(()=>{const game=window.__game,rig=game.rig;const original=rig.update.bind(rig);window.__astraPose={};rig.update=s=>original({...s,...window.__astraPose});window.__astraRigUpdate=original;});
 const poses=[
  ['idle',{},1],['grab',{carrying:'light',carryWidth:.7},.12],['carry',{carrying:'heavy',carryWidth:1.2},.6],
  ['throw',{sinceThrow:.15},.18],['haul',{holdingPlug:true,strain:1.08},.6],['release',{sinceRelease:.12},.18],
  ['air',{grounded:false,airborne:.6,rising:false},.3],['landing',{grounded:true,airborne:0},.08],
  ['tired',{},16],['bumped',{bumped:true},.13],['cheer',{won:true},.8],['failure',{failed:true},.4]
 ];
 const metrics=[];
 for(const [name,pose,seconds] of poses){
  await g.page.evaluate(([pose,seconds])=>{const game=window.__game;const base={dt:1/60,time:5,speed:0,grounded:true,rising:false,airborne:0,turnRate:0,carrying:'none',holdingPlug:false,strain:0,won:false,waving:false,sinceThrow:9,sinceRelease:9,failed:false,bumped:false,...pose};for(let i=0;i<seconds*60;i++)window.__astraRigUpdate({...base,time:5+i/60});window.__astraPose={...base,dt:0};game.render(0);},[pose,seconds]);
  await g.page.waitForTimeout(80);await g.page.screenshot({path:resolve(SHOTS,`astra-${label}-${name}.png`),timeout:120000});
  metrics.push(await g.page.evaluate(name=>{const r=window.__game.rig;r.body.updateMatrixWorld(true);return {name,bodyScale:r.body.scale.toArray(),torso:r.torso.rotation.x,arms:r.arms.map(a=>a.rotation.x),head:r.head.rotation.x,hand:r.hand.getWorldPosition(r.hand.position.clone()).toArray()};},name));
 }
 writeFileSync(new URL(`./${label}-poses.json`,import.meta.url),JSON.stringify(metrics,null,2)+'\n');
 const errors=g.errors.filter(e=>!/403|Fredoka/.test(e));console.log(JSON.stringify({label,shots:poses.length,errors}));if(errors.length)process.exitCode=1;
}finally{await g.close();}

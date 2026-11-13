// Close looks at any spot in a level, for judging models by eye.
//   node tools/look.mjs <outDir> <level> [--port=4173] [--bench] [--list] <view>...
// A view is one of:
//   default            the play camera as the level opens (page screenshot, HUD included)
//   survey             the Tab survey of the whole room (page screenshot)
//   bench              sitting at the station bench (stations only; page screenshot with its panel)
//   name:x,y,z,dist,yaw,pitch   a free camera looking at x,y,z from `dist` metres, yaw and pitch in degrees
//                               (yaw 0 looks from +z toward -z, 90 from +x; pitch 0 is level, 90 straight down)
// --bench sits Pip at the bench before the free views, so bench parts are in their working state.
// --list prints the room size, the station spots, coworkers and every prop (kind, id, position) as JSON and exits.
// Free views render one frame with the game's own renderer and read the canvas back, so the HUD is not in them.
// Needs a dev server (node node_modules/vite/bin/vite.js --port <port> --host 127.0.0.1 --strictPort).
import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
const args=process.argv.slice(2),flag=n=>args.find(a=>a===`--${n}`||a.startsWith(`--${n}=`)),port=flag('port')?.split('=')[1]??4173;
const [out,level,...views]=args.filter(a=>!a.startsWith('--'));
if(!out||!level){console.error('usage: node tools/look.mjs <outDir> <level> [--port=4173] [--bench] [--list] <view>...');process.exit(1);}
mkdirSync(out,{recursive:true});
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const p=await b.newPage({viewport:{width:1440,height:900}});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(`http://127.0.0.1:${port}/?level=${level}&manual&fullfx`);await p.waitForSelector('body[data-ready="true"]');
await p.getByRole('button',{name:'Start playing'}).click();
await p.evaluate(()=>window.__circuitCrew.drive.advance(1));await p.waitForTimeout(700);
if(flag('list')){
  console.log(JSON.stringify(await p.evaluate(()=>{const G=window.__game,r=v=>Math.round(v*100)/100,at=t=>[r(t.x),r(t.y),r(t.z)];
    return {level:G.level.id,width:G.level.width,depth:G.level.depth,pip:at(G.player.translation()),
      station:G.station?{table:at(G.station.table),stand:at(G.station.stand)}:undefined,target:G.level.target,
      coworkers:G.npcs.map(n=>({at:at(n.group.position),seated:n.seated})),
      props:G.props.map(q=>({kind:q.spec.kind,id:q.spec.id,at:at(q.body.translation())}))};})));
  await b.close();process.exit(0);
}
const page=async name=>{await p.waitForTimeout(500);await p.screenshot({path:`${out}/${level}-${name}.png`});};
const bench=async()=>{await p.evaluate(()=>{const G=window.__game,s=G.station.stand;G.player.setTranslation({x:s.x,y:1,z:s.z},true);G.enterBench();window.__circuitCrew.drive.advance(1.5);});};
if(flag('bench'))await bench();
for(const view of views){
  if(view==='default'){await page('default');continue;}
  if(view==='survey'){await p.evaluate(()=>{window.__game.survey=true;window.__circuitCrew.drive.advance(1.5);});await page('survey');await p.evaluate(()=>{window.__game.survey=false;window.__circuitCrew.drive.advance(1);});continue;}
  if(view==='bench'){await bench();await page('bench');continue;}
  const [name,rest]=view.split(':'),[x,y,z,dist=3,yaw=30,pitch=25]=(rest??'').split(',').map(Number);
  if(!rest||[x,y,z].some(Number.isNaN)){console.error(`bad view "${view}"`);continue;}
  const url=await p.evaluate(([x,y,z,dist,yaw,pitch])=>{const G=window.__game,cam=G.view.camera,a=yaw*Math.PI/180,e=pitch*Math.PI/180;
    window.__circuitCrew.drive.advance(.05);G.view.setQuality(2);
    cam.position.set(x+Math.sin(a)*Math.cos(e)*dist,y+Math.sin(e)*dist,z+Math.cos(a)*Math.cos(e)*dist);cam.lookAt(x,y,z);cam.updateMatrixWorld();
    // The see-through oval round Pip was placed for the play camera: re-place it for this one.
    G.updateSeeThrough();G.view.render();return G.view.renderer.domElement.toDataURL('image/png');},[x,y,z,dist,yaw,pitch]);
  writeFileSync(`${out}/${level}-${name}.png`,Buffer.from(url.split(',')[1],'base64'));
}
console.log(errors.length?errors.join('\n'):'no errors');await b.close();

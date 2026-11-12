// Close-ups of Pip from four sides plus a play-distance shot: node tools/pip-shot.mjs <outDir> [prefix] [query]
// (needs the dev server on 4173, or PIP_PORT). Uses the host GPU so outlines and AO match the real game.
import {chromium} from '@playwright/test';
const [out='artifacts',prefix='pip',query='']=process.argv.slice(2),port=process.env.PIP_PORT??4173;
const b=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const p=await b.newPage({viewport:{width:1280,height:800},deviceScaleFactor:1.5});
const errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.goto(`http://127.0.0.1:${port}/?level=playground&manual&fullfx${query?'&'+query:''}`);await p.waitForSelector('body[data-ready="true"]');
await p.getByRole('button',{name:'Start playing'}).click();
await p.evaluate(()=>{document.querySelector('#hud')?.style.setProperty('opacity','0');document.querySelectorAll('.card,.prompt,.objective').forEach(e=>e.style.opacity='0');});
const view=async(name,yaw,zoom,pitch=-.1)=>{
  await p.evaluate(([yaw,zoom,pitch])=>{const G=window.__game;G.heading=0;G.yaw=yaw;G.zoom=zoom;G.pitch=pitch;window.__circuitCrew.drive.advance(1.2);},[yaw,zoom,pitch]);
  await p.waitForTimeout(500);await p.screenshot({path:`${out}/${prefix}-${name}.png`});
};
await view('front',0,3.6);await view('threeq',.7,3.6);await view('side',1.57,3.6);await view('back',3.14,3.6);await view('play',2.6,24,0);
// The title screen: Pip waving in the lobby.
await p.goto(`http://127.0.0.1:${port}/?manual&fullfx${query?'&'+query:''}`);await p.waitForSelector('body[data-ready="true"]');await p.waitForTimeout(1500);await p.screenshot({path:`${out}/${prefix}-title.png`});
console.log(errors.length?errors.join('\n'):'no errors');await b.close();

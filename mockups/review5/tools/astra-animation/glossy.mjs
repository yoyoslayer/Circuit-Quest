import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});
try{
 await g.page.waitForFunction(()=>!!window.__game?.rig);
 await g.zoom(-1500);await g.orbit(130,0);
 await g.page.waitForFunction(()=>window.__game.view.renderer.info.programs.some(p=>p.cacheKey.includes('glossyToon')));
 await g.shot('astra-glossy-pip');
 const programs=await g.page.evaluate(()=>window.__game.view.renderer.info.programs.filter(p=>p.cacheKey.includes('glossyToon')).length);
 const errors=g.errors.filter(e=>!/403|Fredoka/.test(e));console.log(JSON.stringify({glossyPrograms:programs,errors}));if(errors.length)process.exitCode=1;
}finally{await g.close();}

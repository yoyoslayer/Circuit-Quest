import {launch} from '../cap.mjs';import {toBench} from '../arcade-play/common.mjs';
const P='verify-arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true,width:844,height:390});await g.advance(.5);
await toBench(g,log);await g.advance(.5);
for(const s of [['slot','across'],['pick',220],['slot',0],['power']])await g.act(...s);await g.advance(3.4);
await g.page.addStyleTag({content:'.hud *{visibility:hidden!important}'});
await g.shot(P+'02-landscape-hud-hidden');
await g.page.addStyleTag({content:'.hud *{visibility:visible!important}'});
const args=process.argv.slice(2).map(Number);
if(args.length){for(let i=0;i<args.length;i+=2){await g.click(args[i],args[i+1]);const s=await g.snap();log('tap',args[i],args[i+1],'index',s.station.index,'powered',s.station.powered);if(s.station.index>0)break;}}
log('errors',JSON.stringify(await g.close()));

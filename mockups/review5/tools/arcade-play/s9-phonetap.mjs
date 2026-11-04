import {launch} from '../cap.mjs';import {toBench,txt} from './common.mjs';
const P='arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true,width:390,height:844});await g.advance(.5);
await toBench(g,log);await g.advance(.5);
const st=async l=>{const s=await g.snap();log(l,JSON.stringify({held:s.station.held,chain:s.station.setup.chain,across:s.station.setup.across,pw:s.station.powered,done:s.station.soakDone,idx:s.station.index}));};
// tap grid over the left edge (bins) and right edge (sign-off)
for(const [x,y] of [[6,430],[20,430],[6,470],[20,470],[30,450]]){await g.click(x,y);await st(`tap ${x},${y}`);}
// clear held
await g.act('clear');
// tap across slot to remove it (x~290,y~450), then right-edge for sign-off
await g.click(290,452);await st('tap across');
for(const [x,y] of [[385,495],[388,480],[380,500]]){await g.click(x,y);await st(`tap ${x},${y}`);}
await g.click(345,440);await st('tap lever');
log('errors',JSON.stringify(await g.close()));

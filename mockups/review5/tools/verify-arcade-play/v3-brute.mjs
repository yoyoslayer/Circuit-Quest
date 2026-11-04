import {launch} from '../cap.mjs';import {toBench,txt} from '../arcade-play/common.mjs';
const P='verify-arcade-play-';const log=(...a)=>console.log(...a);
const g=await launch('arcade',{fullfx:true});await g.advance(.5);
await toBench(g,log);await g.advance(.3);
const st=async(l)=>{const s=(await g.snap()).station;log(l,JSON.stringify({p:s.powered,live:s.live,trip:s.tripped,soak:s.soak,done:s.soakDone,mis:s.mistakes,trips:s.trips,spent:s.spent,i:s.reading?+(s.reading.iLoad*1000).toFixed(1):null,chain:s.setup.chain,tier:s.verdict?.tier}));return s;};
await g.act('slot','across');await g.act('pick',47);await g.act('slot',0);await g.act('power');
for(const v of [100,220,470,220,100,47,100,220]){await g.advance(.3);await st('before swap');await g.act('slot',0);await g.act('pick',v);await g.act('slot',0);}
await g.advance(3.4);await st('final');
await g.shot(P+'07-after-bruteforce-sweep');
await g.act('signoff');await st('signed');
// Cabinet 2 (rhythm) untouched start: power on just to look
await g.act('power');await g.advance(1);await st('rhythm diagnose power');
log('prompt',(await txt(g)).prompt);
log('errors',JSON.stringify(await g.close()));

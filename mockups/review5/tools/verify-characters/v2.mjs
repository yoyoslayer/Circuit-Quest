import {launch} from '../cap.mjs';
let g=await launch('lobby',{fullfx:true,start:false});
for(const [i,t] of [[10,1.5],[11,.17],[12,.17]]){await g.ev('return drive.advance(a[0])',t).catch(e=>console.log('adv err',e.message));await g.shot(`verify-characters-${i}-title-hero-t${i}`);}
console.log(await g.close());
g=await launch('lobby',{fullfx:true,start:false,width:390,height:844});
await g.ev('return drive.advance(1.5)').catch(()=>{});await g.shot('verify-characters-13-title-hero-portrait');
console.log(await g.close());
g=await launch('playground',{fullfx:true});
await g.advance(1);await g.zoom(-1500);
await g.key('KeyF');await g.advance(.3);
await g.walk(-5,-1);await g.walk(-4,-4);await g.advance(.5);
await g.shot('verify-characters-14-plug-hold-route');
await g.orbit(520,0);await g.shot('verify-characters-15-plug-hold-route-o180');
await g.orbit(260,0);await g.shot('verify-characters-16-plug-hold-route-o270');
console.log(await g.close());

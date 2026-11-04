import {launch} from '../cap.mjs';
const P='verify-observatory-play-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
const st=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),dmg:s.damage,cost:s.cost,held:s.held,cartD:s.station.cartDistance,moved:s.station.cartMoved,motor:s.items.find(i=>i.id==='motor')?.pos};};
await g.advance(2.5);
await g.walk(-3.7,-.1,.6);await g.key('KeyE',.3);log('held',JSON.stringify(await st()));
await g.walk(-5,1.8,.6);await g.key('KeyQ',.1);await g.advance(2.5);log('after throw',JSON.stringify(await st()));
await g.shot(P+'05-cart-thrown');
await g.walk(0,-1.55,.4);await g.key('KeyE',.6);
for(const [n,a] of [['pick','C'],['slot','shunt'],['value',{slot:'shunt',value:1.5e-6}],['route'],['log'],['pick','L'],['slot','series'],['value',{slot:'series',value:.047}],['log'],['rod','r75'],['orient'],['log']]){const r=await g.act(n,a);}
await g.advance(4);const s=await g.snap();log('final',JSON.stringify({won:s.won,dmg:s.damage,cost:s.cost,tiers:s.station.logged.map(l=>l.tier),cartD:s.station.cartDistance}));
log('result',await g.page.evaluate(()=>document.querySelector('.result')?.innerText?.replace(/\n/g,' | ')));
await g.shot(P+'06-chaos-result');
log('errors',JSON.stringify(await g.close()));

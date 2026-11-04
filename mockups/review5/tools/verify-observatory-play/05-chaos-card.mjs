import {launch} from '../cap.mjs';
const P='verify-observatory-play-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
const st=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),dmg:s.damage,cost:s.cost,cartD:s.station.cartDistance};};
await g.advance(2.5);
await g.walk(-3.7,-.1,.6);await g.key('KeyE',.3);
await g.walk(-5,1.8,.6);await g.key('KeyQ',.1);await g.advance(2.5);log('after throw',JSON.stringify(await st()));
await g.walk(0,-1.55,.4);await g.key('KeyE',.6);
for(const [n,a] of [['pick','C'],['slot','shunt'],['value',{slot:'shunt',value:1.5e-6}],['route'],['log'],['pick','L'],['slot','series'],['value',{slot:'series',value:.047}],['log'],['rod','r75'],['orient']]){await g.act(n,a);}
let s=await g.snap();log('before last log',JSON.stringify({reading:s.station.reading&&{snr:s.station.reading.snr,ant:s.station.reading.antenna},vertical:s.station.vertical,rod:s.station.rod}));
await g.act('log');
await g.advance(4);await g.page.waitForTimeout(3500);s=await g.snap();
log('final',JSON.stringify({won:s.won,dmg:s.damage,cost:s.cost,tiers:s.station.logged.map(l=>l.tier),series:s.station.series,shunt:s.station.shunt,rod:s.station.rod,vertical:s.station.vertical}));
log('grades',await g.page.evaluate(()=>[...document.querySelectorAll('[class*=result] *')].filter(e=>e.children.length===0&&e.innerText).map(e=>e.innerText).slice(0,30).join(' | ')));
await g.shot(P+'07-chaos-result-card');
log('errors',JSON.stringify(await g.close()));

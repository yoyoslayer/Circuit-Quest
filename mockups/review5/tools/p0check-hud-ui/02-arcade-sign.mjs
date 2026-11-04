import {launch} from '../cap.mjs';
const [w,h,tag]=[+process.argv[2],+process.argv[3],process.argv[4]];
const out={w,h};
const g=await launch('arcade',{fullfx:true,width:w,height:h});await g.advance(.5);
await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.act('power');await g.advance(8);
let s=(await g.snap()).station;out.beforeSign={soakDone:s.soakDone,powered:s.powered,setup:s.setup};
out.pill=await g.page.evaluate(()=>document.querySelector('.prompt-pill')?.innerText);
await g.shot(`p0check-hud-ui-${tag}4-arc-soaked`);
// which DOM element sits on top at a grid of points (to see panel coverage)
let signed=null;const step=+(process.argv[5]??Math.max(8,Math.round(w/50)));
for(let y=Math.round(h*.2);y<=Math.round(h*.95)&&!signed;y+=step)for(let x=2;x<w;x+=step){await g.page.mouse.click(x,y);await g.advance(.03);const t=(await g.snap()).station;if(t.served.length>0){signed=[x,y];break;}if(t.powered===false){await g.act('power');await g.advance(8);}}
out.signedByTapAt=signed;
await g.shot(`p0check-hud-ui-${tag}5-arc-after-sign`);
out.err=await g.close();
console.log(JSON.stringify(out));

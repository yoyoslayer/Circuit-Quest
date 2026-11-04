import {launch} from '../cap.mjs';
const out={};
const pill=g=>g.page.evaluate(()=>document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' '));
const g=await launch('arcade',{fullfx:true});await g.advance(.5);
await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
await g.page.keyboard.press('KeyP');await g.advance(.6);let s=(await g.snap()).station;out.trip={powered:s.powered,live:s.live,tripped:s.tripped,pill:await pill(g)};
await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.advance(.3);out.fixed={pill:await pill(g)};
await g.page.keyboard.press('KeyP');await g.advance(3);s=(await g.snap()).station;out.afterP={powered:s.powered,live:s.live,tripped:s.tripped,pill:await pill(g)};
await g.shot('hud-ui-37d-arc-after-P-during-cooling');
// hover hint on a bin: move mouse over bins
await g.page.mouse.move(200,480);await g.advance(.2);out.hover=await pill(g);await g.shot('hud-ui-38d-arc-hover-bin');
out.e=await g.close();
console.log(JSON.stringify(out,null,1));

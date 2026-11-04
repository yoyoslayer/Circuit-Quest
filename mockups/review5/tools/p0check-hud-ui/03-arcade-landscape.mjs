import {launch} from '../cap.mjs';
const out={};
const g=await launch('arcade',{fullfx:true,width:844,height:390});await g.advance(.5);
await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
out.atBench=(await g.snap()).atBench;
await g.shot('p0check-hud-ui-03-arc-landscape-bench');
const got=new Set();
for(let y=150;y<=360;y+=8)for(let x=2;x<844;x+=10){
  const b=(await g.snap()).station;await g.page.mouse.click(x,y);await g.advance(.03);const s=(await g.snap()).station;
  if(s.held!=null&&s.held!==b.held){got.add(s.held);await g.act('clear');}
  if(s.powered!==b.powered&&s.powered)await g.act('power');
}
out.takeable=[...got].sort((a,b)=>a-b);
let s=(await g.snap()).station;out.setup=s.setup;
await g.act('clear');await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.act('power');await g.advance(8);
s=(await g.snap()).station;out.ready={soakDone:s.soakDone,served:s.served.length};
await g.shot('p0check-hud-ui-04-arc-landscape-ready');
let signed=null;
for(let y=150;y<=380&&!signed;y+=8)for(let x=440;x<844;x+=8){await g.page.mouse.click(x,y);await g.advance(.03);const t=(await g.snap()).station;if(t.served.length>0){signed=[x,y];break;}if(t.powered===false){await g.act('power');await g.advance(8);}}
out.signedByTapAt=signed;
out.err=await g.close();console.log(JSON.stringify(out));

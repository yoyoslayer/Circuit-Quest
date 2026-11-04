import {launch} from '../cap.mjs';
const out={};
const g=await launch('arcade',{fullfx:true,width:390,height:844});await g.advance(.5);
await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
out.atBench=(await g.snap()).atBench;
await g.shot('verify-hud-ui-01p-arc-bench');
const got=new Set();let other=[];
for(let y=360;y<=540;y+=8)for(let x=1;x<390;x+=9){
  const before=(await g.snap()).station;
  await g.page.mouse.click(x,y);await g.advance(.04);
  const s=(await g.snap()).station;
  if(s.held!=null){got.add(s.held);await g.act('clear');}
  if(s.powered!==before.powered){other.push(['power',x,y]);if(s.powered)await g.act('power');}
  if(JSON.stringify(s.setup)!==JSON.stringify(before.setup))other.push(['setup',x,y]);
}
out.phoneTakeable=[...got].sort((a,b)=>a-b);out.otherHits=other.slice(0,12);
// now set up the clean pinball fix by act(), power, soak, then try to sign off by tapping
let s=(await g.snap()).station;out.start=s.setup;out.fix=s.fix;
await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.act('power');await g.advance(8);
s=(await g.snap()).station;out.beforeSign={soakDone:s.soakDone,served:s.served.length,powered:s.powered,live:s.live};
await g.shot('verify-hud-ui-02p-arc-ready-to-sign');
let signed=null;
for(let y=300;y<=640&&!signed;y+=10)for(let x=1;x<390;x+=10){await g.page.mouse.click(x,y);await g.advance(.03);const t=(await g.snap()).station;if(t.served.length>0){signed=[x,y];break;}if(t.powered===false){await g.act('power');await g.advance(8);} }
out.signedByTapAt=signed;
out.err=await g.close();
console.log(JSON.stringify(out,null,1));

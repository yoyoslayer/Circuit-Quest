import {launch} from '../cap.mjs';
const [w,h,tag]=[+process.argv[2],+process.argv[3],process.argv[4]];
const out={w,h};
const g=await launch('arcade',{fullfx:true,width:w,height:h});await g.advance(.5);
await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
out.atBench=(await g.snap()).atBench;
await g.shot(`p0check-hud-ui-${tag}1-arc-bench`);
const got=new Set();const other=[];const step=Math.max(8,Math.round(w/45));
for(let y=Math.round(h*.25);y<=Math.round(h*.85);y+=step)for(let x=2;x<w;x+=step){
  const before=(await g.snap()).station;
  await g.page.mouse.click(x,y);await g.advance(.04);
  const s=(await g.snap()).station;
  if(s.held!=null){got.add(s.held);await g.act('clear');}
  if(s.powered!==before.powered){other.push(['power',x,y]);if(s.powered)await g.act('power');}
}
out.takeable=[...got].sort((a,b)=>a-b);out.power=other.slice(0,3);
let s=(await g.snap()).station;out.fix=s.fix;
await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.act('power');await g.advance(8);
s=(await g.snap()).station;out.beforeSign={soakDone:s.soakDone,powered:s.powered};
await g.shot(`p0check-hud-ui-${tag}2-arc-ready`);
let signed=null;
for(let y=Math.round(h*.25);y<=Math.round(h*.9)&&!signed;y+=step)for(let x=2;x<w;x+=step){await g.page.mouse.click(x,y);await g.advance(.03);const t=(await g.snap()).station;if(t.served.length>0){signed=[x,y];break;}if(t.powered===false){await g.act('power');await g.advance(8);}}
out.signedByTapAt=signed;
await g.shot(`p0check-hud-ui-${tag}3-arc-after`);
out.err=await g.close();
console.log(JSON.stringify(out));

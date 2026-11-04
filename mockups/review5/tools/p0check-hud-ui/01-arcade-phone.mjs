import {launch} from '../cap.mjs';
const out={};
const g=await launch('arcade',{fullfx:true,width:390,height:844});await g.advance(.5);
await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
out.atBench=(await g.snap()).atBench;
await g.shot('p0check-hud-ui-01-arc-phone-bench');
// tap grid across most of the screen, tracking any station state change
const got=new Set(),hits=[];
for(let y=150;y<=760;y+=10)for(let x=2;x<390;x+=10){
  const b=JSON.stringify((await g.snap()).station);
  await g.page.mouse.click(x,y);await g.advance(.03);
  const s=(await g.snap()).station;
  if(JSON.stringify(s)===b)continue;
  if(s.held!=null){got.add(s.held);await g.act('clear');continue;}
  const bp=JSON.parse(b);
  if(s.powered!==bp.powered){hits.push(['power',x,y]);if(s.powered)await g.act('power');continue;}
  if(JSON.stringify(s.setup)!==JSON.stringify(bp.setup)){hits.push(['setup',x,y]);continue;}
}
out.takeable=[...got].sort((a,b)=>a-b);out.otherHits=hits.slice(0,20);out.nOther=hits.length;
// desktop comparison values
out.err=await g.close();
const d=await launch('arcade',{fullfx:true});await d.advance(.5);
await d.walk(-5.5,6.6);await d.walk(-7.2,5.8);await d.walk(-8.3,4.4,.3);await d.key('KeyE');
await d.walk(-7.2,5.8);await d.walk(-5.5,6.4);await d.walk(1.2,-1.3,.5);await d.key('KeyE',.2);await d.walk(0,-1.55,.4);await d.key('KeyE',1);
await d.shot('p0check-hud-ui-02-arc-desktop-bench');await d.close();
console.log(JSON.stringify(out,null,1));

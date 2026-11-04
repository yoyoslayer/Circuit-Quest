import {launch} from '../cap.mjs';
async function run(w,h,box,tag){
  const g=await launch('arcade',{fullfx:true,width:w,height:h});await g.advance(.5);
  await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
  await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
  await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.act('power');await g.advance(8);
  const s0=(await g.snap()).station;await g.shot(`p0check-hud-ui-${tag}`);
  let signed=null,disturbed=[];
  for(let y=box.y0;y<=box.y1&&!signed;y+=6)for(let x=box.x0;x<=box.x1;x+=6){
    const b=JSON.stringify((await g.snap()).station.setup);await g.page.mouse.click(x,y);await g.advance(.03);const t=(await g.snap()).station;
    if(t.served.length>0){signed=[x,y];break;}
    if(JSON.stringify(t.setup)!==b||!t.powered){disturbed.push([x,y]);await g.close();return {tag,soak:s0.soakDone,signed,disturbedAt:[x,y]};}
  }
  const err=await g.close();return {tag,soak:s0.soakDone,signed,err};
}
console.log(JSON.stringify(await run(844,390,{x0:640,x1:800,y0:200,y1:330},'05-land-ready')));
console.log(JSON.stringify(await run(390,844,{x0:360,x1:389,y0:380,y1:540},'06-port-ready')));

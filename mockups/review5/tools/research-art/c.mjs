import {launch} from '../cap.mjs';
const P='research-art';let n=30;const nn=()=>String(n++).padStart(2,'0');
{ // meeting: Pip close-ups, lounge, boardroom
  const g=await launch('meeting',{fullfx:true});await g.advance(1);
  await g.zoom(-2000);await g.advance(.5);
  await g.crop(`${P}-${nn()}-meeting-pip-front`,{x:520,y:220,width:400,height:420});
  await g.walk(7.5,2.5,.5);await g.advance(.6);await g.zoom(-2000);await g.orbit(-120,0);await g.shot(`${P}-${nn()}-meeting-lounge`);
  await g.walk(8.6,-3.6,.5);await g.advance(.6);await g.orbit(150,0);await g.shot(`${P}-${nn()}-meeting-boardroom`);
  await g.zoom(3000);await g.shot(`${P}-${nn()}-meeting-max-zoomout`);
  console.log('meeting errors',JSON.stringify(await g.close()));
}
{ // observatory overlap audit + close look
  const g=await launch('observatory',{fullfx:true});await g.advance(1);
  console.log('obs audit',JSON.stringify(await g.audit(.02)).slice(0,1500));
  const s=await g.snap();console.log(JSON.stringify(s.player));
  await g.walk(3.5,2.5,.6);await g.zoom(-1500);await g.shot(`${P}-${nn()}-observatory-lounge`);
  console.log('obs errors',JSON.stringify(await g.close()));
}
{ // arcade bench close-up (route from tools/debug/bench-arcade.mjs)
  const g=await launch('arcade',{fullfx:true});await g.advance(.5);
  for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z,.6);
  await g.walk(-8.3,4.4,.3);await g.key('KeyE',.2);
  for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.6);
  await g.walk(1.2,-1.3,.5);await g.zoom(-800);await g.shot(`${P}-${nn()}-arcade-counter-kid`);
  await g.key('KeyE',.3);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
  await g.shot(`${P}-${nn()}-arcade-bench`);
  for(const s of [['slot','across'],['pick',220],['slot',0],['pick',47],['slot',1],['pick',47],['slot',1],['power']])await g.act(...s);
  await g.advance(2.2);await g.shot(`${P}-${nn()}-arcade-bench-running`);
  console.log('arcade errors',JSON.stringify(await g.close()));
}

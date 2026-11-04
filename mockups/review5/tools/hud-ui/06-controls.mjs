import {launch} from '../cap.mjs';
const out={};
// 1) phone arcade: tap a grid across the visible bench and record which blocks can be taken
{
  const g=await launch('arcade',{fullfx:true,width:390,height:844});await g.advance(.5);
  await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
  await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
  const got=new Set();
  for(let x=2;x<390;x+=8)for(let y=380;y<500;y+=8){
    await g.page.mouse.click(x,y);await g.advance(.05);const s=(await g.snap()).station;if(s.held!=null){got.add(s.held);await g.act('clear');}
    if(s.held!=null)await g.page.keyboard.press('Backspace');
  }
  out.phoneTakeable=[...got];
  await g.shot('hud-ui-50p-arc-bench-tapgrid');
  out.e1=await g.close();
}
// 2) workshop picker with real keyboard
{
  const g=await launch('lobby',{fullfx:true});await g.advance(.3);await g.walk(7.5,5.5,.5);await g.key('KeyE',.3);
  const p0=(await g.snap()).player;
  await g.page.keyboard.down('KeyS');await g.advance(.8);await g.page.keyboard.up('KeyS');await g.advance(.1);
  const p1=(await g.snap()).player;
  out.pickerWalk={dz:+(p1.z-p0.z).toFixed(2),open:await g.page.evaluate(()=>!document.querySelector('.workshop-picker').hidden)};
  await g.shot('hud-ui-51d-picker-walked-away');
  for(let i=0;i<3;i++){await g.page.keyboard.press('Tab');await g.advance(.1);}
  out.pickerFocus=await g.page.evaluate(()=>document.activeElement?.tagName+' '+(document.activeElement?.className||''));
  await g.page.keyboard.press('Enter');await g.advance(.3);out.pickerUrl=g.page.url();
  out.e2=await g.close();
}
// 3) R in play restarts instantly, and the retry time to first input
{
  const g=await launch('meeting',{fullfx:true});await g.advance(.3);await g.walk(-8.6,-3.9,.4);await g.key('KeyE');
  const held=(await g.snap()).held;const t0=Date.now();
  const nav=g.page.waitForNavigation({timeout:5000}).then(()=>true).catch(()=>false);await g.page.keyboard.press('KeyR');out.Rplay={held,reloaded:await nav};
  await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000});out.Rplay.msToReady=Date.now()-t0;
  out.Rplay.screen=await g.page.evaluate(()=>document.body.dataset.screen);
  out.e3=await g.close();
}
// 4) emulated gamepad: which buttons do what in play
{
  const {chromium}=await import('@playwright/test');
}
console.log(JSON.stringify(out,null,1));

import {launch} from '../cap.mjs';
const out={};
const rect=(g,sels)=>g.page.evaluate(sels=>Object.fromEntries(sels.map(s=>{const e=document.querySelector(s);if(!e||e.hidden||e.offsetParent===null&&getComputedStyle(e).position!=='fixed')return [s,null];const r=e.getBoundingClientRect();return [s,{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),op:getComputedStyle(e).opacity}];})),sels);
const hud=g=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText.replace(/\n+/g,' | '),pill:document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' ')}));
// playground phone: strain meter vs card
{const g=await launch('playground',{fullfx:true,width:390,height:844});await g.advance(.5);await g.key('KeyF',.3);await g.walk(-5,-1);await g.walk(-4,-4);await g.advance(.4);
  out.pgPhone=await rect(g,['.objective','.strain','.topright','.pausebtn']);await g.shot('verify-hud-ui-07p-pg-strain-card');out.pgE=await g.close();}
// lunch phone: chain vs card
{const g=await launch('lunch',{fullfx:true,width:390,height:844});await g.advance(1);out.lunchPhone=await rect(g,['.objective','.chain','.breakers','.act.cam']);out.lunchPhoneHud=await hud(g);await g.shot('verify-hud-ui-08p-lunch-start');out.lE=await g.close();}
// lunch + meeting desktop start pills
{const g=await launch('lunch',{fullfx:true});await g.advance(1);out.lunchD=await hud(g);out.lunchDE=await g.close();}
{const g=await launch('meeting',{fullfx:true});await g.advance(1);out.meetD=await hud(g);await g.shot('verify-hud-ui-09d-meet-start');out.meetDE=await g.close();}
// arcade phone walking: panel position
{const g=await launch('arcade',{fullfx:true,width:390,height:844});await g.advance(1);out.arcPhone=await rect(g,['.station-panel','.objective','.prompt-pill','.actions']);await g.shot('verify-hud-ui-10p-arc-walk');out.aE=await g.close();}
// lobby picker: keyboard
{const g=await launch('lobby',{fullfx:true});await g.advance(.3);await g.walk(7.5,5.5,.5);await g.key('KeyE',.3);
  out.pickerOpen=await g.page.evaluate(()=>!!document.querySelector('.workshop-picker:not([hidden])'));
  const p0=(await g.snap()).player;await g.advance(.8,['KeyS']);const p1=(await g.snap()).player;out.pickerMove=+Math.hypot(p1.x-p0.x,p1.z-p0.z).toFixed(2);
  out.pickerStillOpen=await g.page.evaluate(()=>!!document.querySelector('.workshop-picker:not([hidden])'));
  for(let i=0;i<3;i++){await g.page.keyboard.press('Tab');await g.advance(.1);}
  out.pickerFocus=await g.page.evaluate(()=>document.activeElement?.tagName+'.'+document.activeElement?.className);
  await g.page.keyboard.press('ArrowRight');await g.page.keyboard.press('Enter');await g.advance(.3);out.pickerUrl=g.page.url();
  out.pickerHud=await hud(g);await g.shot('verify-hud-ui-11d-picker-open');
  await g.page.keyboard.press('KeyE');await g.advance(.2);out.pickerAfterE=await g.page.evaluate(()=>!!document.querySelector('.workshop-picker:not([hidden])'));
  await g.page.keyboard.press('Escape');await g.advance(.2);out.pickerAfterEsc=await g.page.evaluate(()=>({open:!!document.querySelector('.workshop-picker:not([hidden])'),screen:document.body.dataset.screen}));
  await g.page.keyboard.press('Escape');await g.advance(.3);out.lobbyPauseHeader=await g.page.evaluate(()=>document.querySelector('.pause-screen h2')?.innerText);
  out.pauseText=await g.page.evaluate(()=>document.querySelector('.pause-screen')?.innerText.replace(/\n+/g,' | '));
  out.lobbyCard=await rect(g,['.objective']);
  out.lbE=await g.close();}
console.log(JSON.stringify(out,null,1));

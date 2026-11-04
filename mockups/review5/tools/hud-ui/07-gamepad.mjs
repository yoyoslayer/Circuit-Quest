import {launch} from '../cap.mjs';
const out={};
const fake=`window.__pad={id:'Fake Xbox pad',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};navigator.getGamepads=()=>[window.__pad,null,null,null];dispatchEvent(new Event('gamepadconnected'));`;
async function press(g,i,ms=120){await g.page.evaluate(i=>{window.__pad.buttons[i].pressed=true;window.__pad.buttons[i].value=1;},i);await g.page.waitForTimeout(ms);await g.page.evaluate(i=>{window.__pad.buttons[i].pressed=false;window.__pad.buttons[i].value=0;},i);await g.page.waitForTimeout(ms);}
const cam=g=>g.page.evaluate(()=>{const s=window.__circuitCrew.snapshot();return {snapKeys:Object.keys(s).join(','),survey:s.survey,cam:s.camera};});
{
  const g=await launch('playground',{fullfx:true});await g.page.evaluate(fake);await g.advance(.3);await g.page.waitForTimeout(800);
  await g.shot('hud-ui-60d-pad-hud');
  out.keys=(await cam(g)).snapKeys;
  out.padClass=await g.page.evaluate(()=>document.querySelector('[data-layer="hud"]').className);
  // grab plug with X? (start next to the plug: X = grab)
  await press(g,2);await g.advance(.1);out.afterX=(await g.snap()).holdingPlug;
  await press(g,1);await g.advance(.1);out.afterB=(await g.snap()).holdingPlug;
  // orbit then RS-click (11) vs Back (8)
  await g.orbit(300,0);const y0=await g.page.evaluate(()=>window.__circuitCrew.snapshot().yaw??null);
  out.camAfterOrbit=await g.page.evaluate(()=>{const c=document.querySelector('canvas');return null;});
  const shotA=await g.shot('hud-ui-61d-pad-orbited');
  await press(g,11);await g.advance(.8);await g.shot('hud-ui-62d-pad-after-RS-click');
  await press(g,8);await g.advance(.8);await g.shot('hud-ui-63d-pad-after-Back');
  await press(g,10);await g.advance(1.2);await g.shot('hud-ui-64d-pad-after-L3');
  out.e=await g.close();
}
{
  const g=await launch('lobby',{fullfx:true});await g.page.evaluate(fake);await g.advance(.3);await g.walk(7.5,5.5,.5);
  await press(g,2);await g.advance(.3);out.pickerOpenByX=await g.page.evaluate(()=>!!document.querySelector('.workshop-picker:not([hidden])'));
  for(const b of [1,0,3,9,12,13,14,15]){await press(g,b);await g.advance(.1);}
  out.pickerAfterPadButtons=await g.page.evaluate(()=>({open:!!document.querySelector('.workshop-picker:not([hidden])'),screen:document.body.dataset.screen,focus:document.activeElement?.tagName,url:location.search}));
  await g.shot('hud-ui-65d-pad-picker-stuck');
  out.e2=await g.close();
}
console.log(JSON.stringify(out,null,1));

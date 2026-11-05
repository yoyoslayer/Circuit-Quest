// B7 checks: slingshot prompt only with energy, recoil, release-at-socket seats, socket cue, cable clears Pip, joint.
// node mockups/review5/tools/fix-b7/cable.mjs [case...]   (dev server on 4173)
import {launch} from '../cap.mjs';
const only=process.argv.slice(2),want=n=>!only.length||only.includes(n),out={};
const pill=g=>g.page.evaluate(()=>document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' '));
if(want('sling')){const g=await launch('playground');await g.advance(.3);await g.key('KeyF');await g.walk(9,3.7);
  // Walk into the limit without sprinting: strain near 1 but no stored energy.
  await g.advance(1.5,['KeyW']);let s=await g.snap();const walkPill=await pill(g);
  await g.advance(2.5,['KeyW','ShiftLeft']);s=await g.snap();const sprintPill=await pill(g);
  const nav=s.rope;await g.page.keyboard.press('KeyQ');await g.advance(.12);await g.shot('fix-b7-recoil-mid');await g.advance(.4);
  const after=await g.snap();out.sling={walkStrain:+nav.strain.toFixed(3),walkPill,sprintPill,heldAfter:after.holdingPlug,fastestProp:+(after.fastestProp??0).toFixed(1),errors:await g.close()};}
if(want('seat')){const g=await launch('playground');await g.advance(.3);await g.key('KeyF');
  for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);await g.advance(.2);await g.shot('fix-b7-socket-cue');const p0=await pill(g);
  await g.page.keyboard.press('KeyQ');await g.advance(.3);const s=await g.snap();out.seat={pillBefore:p0,connectedAfterQ:await g.page.evaluate(()=>window.__game.connected),holding:s.holdingPlug,errors:await g.close()};}
if(want('pip')){const g=await launch('playground');await g.advance(.3);await g.key('KeyF');await g.walk(-5,-1);await g.walk(-6,-3);
  await g.page.evaluate(()=>{const G=window.__game;Object.assign(G,{yaw:Math.PI*.6,pitch:-.2,zoom:9});});await g.advance(.6);await g.shot('fix-b7-cable-round-pip');out.pip={errors:await g.close()};}
if(want('joint')){const g=await launch('meeting');await g.advance(.3);
  await g.walk(-9,-6,.5);await g.key('KeyF');for(const [x,z] of [[-9,5.3],[-3.3,5.5]])await g.walk(x,z,.3);
  await g.key('KeyF');await g.key('KeyF');let s=await g.snap();for(const [x,z] of [[-1,3],[-1,-1.5]])await g.walk(x,z);
  await g.page.evaluate(()=>{const G=window.__game;Object.assign(G,{zoom:14});});await g.advance(.8);await g.shot('fix-b7-meeting-joint');
  out.joint={maxLength:s.rope.maxLength,errors:await g.close()};}
console.log(JSON.stringify(out,null,1));

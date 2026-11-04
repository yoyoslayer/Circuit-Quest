// B3 check: Pip behind tall fixtures (see-through oval), surveys that fit, wall corners.
// node mockups/review5/tools/fix-b3/look.mjs [case...]   (dev server on 4173; ?manual exposes window.__game)
import {launch} from '../cap.mjs';
const only=process.argv.slice(2),want=n=>!only.length||only.includes(n);
const cam=(g,o)=>g.page.evaluate(o=>{const G=window.__game;Object.assign(G,o);},o);
const settle=async g=>{await g.advance(.1);await g.page.evaluate(()=>{const G=window.__game;for(let i=0;i<240;i++)G.updateCamera(1/60);G.render(1/60);});};
if(want('arcade')){const g=await launch('arcade');await g.advance(.3);
  // Storeroom, low orbit from the hall side (review shot arcade-play-76).
  await g.walk(-4,1,.5);await g.walk(-5.5,6.4,.5);await g.walk(-8.6,5.6,.4);await g.orbit(-350,-150);await g.shot('fix-b3-arcade-storeroom-orbit');
  // Back cabinets, zoom 9, from behind (review shots arcade-play-74/75).
  await g.walk(-4,1,.5);await g.walk(-6.5,-5.8,.4);await cam(g,{yaw:Math.PI+.14,pitch:-.2,zoom:12});await settle(g);await g.shot('fix-b3-arcade-back-cabinets-behind');
  console.log('arcade',JSON.stringify(await g.close()));}
if(want('lobby')){const g=await launch('lobby');await g.advance(.3);
  await g.walk(-3,-1.8,.3);await g.walk(0,-1.8,.3);await g.advance(1);await g.shot('fix-b3-lobby-behind-board');
  await cam(g,{survey:true});await settle(g);await g.shot('fix-b3-lobby-survey');
  console.log('lobby',JSON.stringify(await g.close()));}
if(want('playground')){const g=await launch('playground');await g.advance(.3);
  // Behind hazard pillar-a (x -2..-0.6, z -2..-0.6) at zoom 9, camera on the far side.
  await g.walk(-1.3,-2.8,.3);await cam(g,{yaw:.14,pitch:-.25,zoom:9});await settle(g);await g.shot('fix-b3-playground-pillar-z9');
  await cam(g,{yaw:.14,pitch:0,zoom:26});await g.walk(-1.3,-2.6,.3);await settle(g);await g.shot('fix-b3-playground-pillar-z26');
  console.log('playground',JSON.stringify(await g.close()));}
if(want('meeting')){const g=await launch('meeting');await g.advance(.3);
  await cam(g,{survey:true});await settle(g);await g.shot('fix-b3-meeting-survey');
  await cam(g,{survey:false,yaw:2.4,pitch:-.2,zoom:14});await g.walk(-10,-5.5,.4);await settle(g);await g.shot('fix-b3-meeting-closet-corner');
  // Pip among the desks behind a monitor row, low orbit.
  await cam(g,{yaw:Math.PI+.14,pitch:-.2,zoom:14});await g.walk(-6,-5.6,.4);await settle(g);await g.shot('fix-b3-meeting-desks-behind');
  console.log('meeting',JSON.stringify(await g.close()));}
if(want('garage')){const g=await launch('garage');await g.advance(.3);
  await g.walk(0,-3.6,.4);await cam(g,{yaw:.14,pitch:-.25,zoom:12});await settle(g);await g.shot('fix-b3-garage-behind-bench');
  console.log('garage',JSON.stringify(await g.close()));}
if(want('lunch')){const g=await launch('lunch');await g.advance(.3);
  await cam(g,{survey:true});await settle(g);await g.shot('fix-b3-lunch-survey');
  await cam(g,{survey:false});await g.walk(-2,-3.5,.5);await cam(g,{yaw:.14,pitch:-.3,zoom:12});await settle(g);await g.shot('fix-b3-lunch-kitchen-low');
  console.log('lunch',JSON.stringify(await g.close()));}

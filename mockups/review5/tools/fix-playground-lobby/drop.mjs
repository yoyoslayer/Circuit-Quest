// R5-262: a loose plug lying by the lamp switch. The pill must offer the plug, and E must pick it up.
import {launch} from '../cap.mjs';
const g=await launch('playground');await g.advance(.3);await g.key('KeyF');
for(const [x,z] of [[-5,-1],[-4,-4],[4.6,-5.4]])await g.walk(x,z,.5);
// Lay the plug down by the switch, out of seating range of the socket.
await g.page.evaluate(()=>{const gm=window.__game;gm.holdingPlug=false;gm.rope.release();gm.plugPosition.set(7.6,.22,-4.7);});
await g.walk(7.2,-5,.3);await g.advance(.2);
const pill=await g.page.locator('.prompt-pill').innerText();console.log('pill:',pill.replace(/\s+/g,' '),'nearSwitch',await g.page.evaluate(()=>{const gm=window.__game;return gm.nearSwitch(gm.player.translation());}));
await g.key('KeyE',.2);const s=await g.snap();console.log('after E holdingPlug',s.holdingPlug,'switchedOn',s.switchedOn);
await g.close();

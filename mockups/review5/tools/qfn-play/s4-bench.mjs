import {launch} from '../cap.mjs';import {txt,log} from './common.mjs';
const g=await launch('qfn',{fullfx:true});const P=g.page;
await g.advance(.3);
await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE',.2);await g.walk(0,-.5,.4);await g.key('KeyE');await g.advance(1.5);
await P.waitForTimeout(1500);
const st=async()=>(await g.snap()).station;
let s=await st();const c=s.cells,b=s.bodies;log('bodies',b);
const mv=async(k,steps=4)=>{const [x,y]=c[k];await P.mouse.move(x,y,{steps});await g.advance(.03);};
// 1. new player grabs C1 by its big coloured end (pad at 10,7) and drags it toward the chip
await mv('10,7');log('hover pad',(await st()).hoverBody,await txt(g));
await P.mouse.down();for(const k of ['9,7','8,7','8,6','7,6'])await mv(k);await g.shot('qfn-play-50-drag-pad-draws');
await P.mouse.up();await g.advance(.1);s=await st();log('after pad drag',s.design.place.C1,s.design.traces.length,await txt(g));await g.shot('qfn-play-51-after-pad-drag');
await g.act('undo');
// 2. drag C1 by its body
await P.mouse.move(...b.C1,{steps:3});log('hover body',(await st()).hoverBody,await txt(g));await g.shot('qfn-play-52-hover-body');
await P.mouse.down();for(const k of ['9,6','6,6','3,5','2,4'])await mv(k);await g.shot('qfn-play-53-drag-body');await P.mouse.up();await g.advance(.1);
s=await st();log('C1 after body drag',s.design.place.C1);
// click again to turn
const b2=(await st()).bodies;await P.mouse.click(...b2.C1);await g.advance(.1);s=await st();log('C1 after click',s.design.place.C1,await txt(g));
// 3. drag C1 onto the chip (illegal)
const b3=(await st()).bodies;await P.mouse.move(...b3.C1);await P.mouse.down();for(const k of ['3,4','5,4'])await mv(k);await g.shot('qfn-play-54-drag-illegal');await P.mouse.up();await g.advance(.1);log('illegal drop',(await st()).design.place.C1,await txt(g));
// 4. a stroke that would short (VDD pad U1 (4,3) over GND pad (4,4)?) -> from U1 VDD 4,3 down
await mv('4,3');await P.mouse.down();for(const k of ['3,3','3,4','3,5'])await mv(k);await g.shot('qfn-play-55-stroke-blocked');await P.mouse.up();await g.advance(.1);log('blocked stroke',await txt(g));
// 5. ship scrambled
await g.act('undo');await g.act('undo');await g.act('undo');
await g.act('ship');await g.advance(.2);s=await g.snap();log('ship scrambled',s.station.mistakes,s.alarmed,await txt(g));await g.shot('qfn-play-56-sent-back');
// 6. CHECK on scrambled
await g.act('check');await g.advance(.3);log('check',await txt(g));
// 7. try rotate locked U1
await g.act('rotate','U1');log('rot U1',await txt(g));
// leave bench mid-board and look at the room camera
await g.key('Escape',.8);await g.shot('qfn-play-57-stand-up');log('stand', (await g.snap()).atBench,await txt(g));
await g.zoom(-1500);await g.shot('qfn-play-58-stand-up-close');
log('errors',await g.close());

// P0 fix check (R5-001): tapping the bench prompt pill presses its key (garage "P Pulse the motor").
import {launch} from '../cap.mjs';
const g=await launch('garage',{fullfx:true,width:390,height:844});await g.advance(.5);
await g.walk(6.4,-4.2,.5);await g.key('KeyE');await g.walk(3.4,-4);await g.walk(2.5,-4.4);await g.key('KeyE',.3);await g.walk(2.9,-4);await g.walk(2.9,-1.1);await g.walk(0,-1.55,.4);await g.key('KeyE',1.2);
const pill=()=>g.page.evaluate(()=>document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' '));
const before=JSON.stringify((await g.snap()).station);console.log('pill before:',await pill());
const box=await g.page.locator('.prompt-pill').boundingBox();await g.page.mouse.click(box.x+box.width/2,box.y+box.height/2);await g.advance(1.5);
const after=JSON.stringify((await g.snap()).station);console.log('pill after:',await pill(),'| station changed:',before!==after,'| still at bench:',(await g.snap()).atBench);
await g.shot('fix-p0-garage-p-pilltap');console.log('errors',JSON.stringify(await g.close()));

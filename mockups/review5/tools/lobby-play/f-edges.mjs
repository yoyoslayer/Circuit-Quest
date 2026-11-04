import {launch} from '../cap.mjs';
const g=await launch('lobby',{fullfx:true});
const prompt=async()=>{const v=await g.page.locator('.prompt-pill').isVisible();return v?await g.page.locator('.prompt-pill').innerText():'(none)';};
await g.advance(.3);
// Behind the reception board
await g.walk(0.3,-2.3,.3);await g.advance(.4);const p=(await g.snap()).player;console.log('behind board pos',p.x.toFixed(2),p.z.toFixed(2));await g.shot('lobby-play-41-behind-reception-board');
await g.walk(0,-1.5,.2,4);await g.advance(.3);console.log('try walk into board pos',JSON.stringify((await g.snap()).player));await g.shot('lobby-play-42-under-board');
// board from behind, low
await g.walk(0,-4.5,.4);await g.orbit(524,-100);await g.zoom(-600);await g.shot('lobby-play-43-board-from-behind');await g.zoom(600);await g.orbit(-524,100);
// Behind the workshop arch
await g.walk(7.5,3.6,.3);await g.advance(.3);console.log('behind arch prompt',await prompt());await g.shot('lobby-play-44-behind-workshop-arch');
// Picker open, then hold W
await g.walk(7.5,5.5,.4);await g.key('KeyE',.2);const a=(await g.snap()).player;await g.advance(1.2,['KeyS']);const b=(await g.snap()).player;
console.log('picker open, held S: moved',Math.hypot(b.x-a.x,b.z-a.z).toFixed(2),'picker visible',await g.page.locator('.workshop-picker').isVisible(),'prompt',await prompt());
await g.shot('lobby-play-45-picker-open-walked-away');
// Tab while picker open
await g.page.keyboard.press('Tab');await g.advance(1.2);console.log('survey after Tab with picker open',await g.page.evaluate(()=>window.__circuitCrew.survey));await g.shot('lobby-play-46-picker-tab');
await g.page.keyboard.press('Escape');await g.advance(.2);
// Beanbag next to workshop: can it be grabbed?
await g.walk(9.6,6.2,.3);await g.advance(.2);console.log('far side beanbag prompt',await prompt());
// Throw cone at green coworker (-7,2.2)
await g.walk(-3.4,7.3,.4);await g.advance(.2);console.log('cone prompt',await prompt());await g.key('KeyE',.2);
await g.walk(-5.2,4.0,.3);await g.advance(.1);await g.key('KeyQ',.05);let al=0;for(let i=0;i<6;i++){await g.advance(.1);al=Math.max(al,(await g.snap()).alarmed);}console.log('cone throw alarmed',al);
await g.shot('lobby-play-47-cone-throw');
// kick a prop off the room front edge (no front wall?)
await g.walk(4.6,6.6,.6);await g.key('KeyE',.2);await g.walk(4.6,9.2,.3);await g.key('KeyQ',.05);await g.advance(2);const s=await g.snap();console.log('player',JSON.stringify(s.player));await g.shot('lobby-play-48-front-edge');
// walk off front edge
await g.walk(0,11.5,.3,6);await g.advance(1);console.log('front edge pos',JSON.stringify((await g.snap()).player));
console.log(await g.close());

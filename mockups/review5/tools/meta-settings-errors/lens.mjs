import {launch} from '../cap.mjs';
const P='meta-settings-errors-';
const lensClick=async g=>{await g.page.keyboard.press('Escape');await g.advance(.2);await g.page.waitForTimeout(800);const t=g.page.locator('.pause-screen [data-ui="lens"]');await t.click();const lbl=await t.innerText();await g.page.waitForTimeout(300);await g.page.keyboard.press("Escape");await g.advance(.3);return lbl;};
// Meeting floor: Standard (42) default, then Wide (54), then Close (32)
let g=await launch('meeting');await g.page.evaluate(()=>localStorage.removeItem('circuit-crew-fov'));
await g.advance(1);
const names=['42-standard','54-wide','32-close'];
for(let i=0;i<3;i++){
  if(i>0)console.log('lens tile ->',await lensClick(g));
  await g.shot(`${P}0${i+1}-meeting-fov${names[i]}`);
  await g.zoom(-1500);await g.shot(`${P}0${i+4}-meeting-close-fov${names[i]}`);await g.zoom(1500);await g.zoom(-700);
}
// back to standard
console.log('lens tile ->',await lensClick(g));
console.log('meeting errors',await g.close());
const benchLens=async g=>{await g.page.locator('[data-ui="pause"]').click();await g.advance(.2);await g.page.waitForTimeout(800);console.log('screen',await g.page.evaluate(()=>document.body.dataset.screen));const t=g.page.locator('.pause-screen [data-ui="lens"]');await t.click();const lbl=await t.innerText();await g.page.locator('.pause-screen [data-ui="resume"]').click();await g.advance(.3);console.log('atBench after resume',(await g.snap()).atBench);return lbl;};
// Arcade bench at each lens
g=await launch('arcade');await g.advance(.5);
const route=[[-5.5,6.6],[-7.2,5.8]];for(const [x,z] of route)await g.walk(x,z,.6);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.6);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.3);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
for(let i=0;i<3;i++){
  if(i>0){console.log('bench lens ->',await benchLens(g));await g.advance(1);}
  console.log('atBench',(await g.snap()).atBench);
  await g.shot(`${P}1${i}-arcade-bench-fov${names[i]}`);
}
console.log('lens tile ->',await benchLens(g));
// camera reset at bench: C
await g.key('KeyC',1);await g.shot(`${P}13-arcade-bench-after-C`);
console.log('arcade errors',await g.close());

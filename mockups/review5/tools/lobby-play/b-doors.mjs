import {launch} from '../cap.mjs';
const g=await launch('lobby',{fullfx:true});
await g.advance(.3);
await g.crop('lobby-play-09-crop-marker',{x:280,y:20,width:200,height:140});
const prompt=async()=>{const v=await g.page.locator('.prompt-pill').isVisible();return v?await g.page.locator('.prompt-pill').innerText():'(none)';};
// Walk to playground door (first step)
let t0=(await g.snap()).time;
await g.walk(-11.6,-8.9,.4);let t1=(await g.snap()).time;console.log('walk to playground door s',(t1-t0).toFixed(2));
await g.advance(.6);console.log('prompt pg:',await prompt());await g.shot('lobby-play-10-at-playground-door');
await g.zoom(-1500);await g.shot('lobby-play-11-playground-door-zoom9');
await g.orbit(300,0);await g.shot('lobby-play-12-door-orbit');await g.orbit(-300,0);await g.zoom(1000);
// locked rush door
t0=(await g.snap()).time;await g.walk(6.96,-8.9,.4);t1=(await g.snap()).time;console.log('walk pg->rush',(t1-t0).toFixed(2));
await g.advance(.3);console.log('prompt rush:',await prompt());await g.key('KeyE',.15);await g.shot('lobby-play-13-locked-rush');
// side wall door qfn
t0=(await g.snap()).time;await g.walk(-13.9,-5.5,.4);t1=(await g.snap()).time;console.log('walk rush->qfn',(t1-t0).toFixed(2));
await g.advance(.6);console.log('prompt qfn:',await prompt());await g.shot('lobby-play-14-at-qfn-side-door');
await g.walk(-13.9,3.7,.4);await g.advance(.6);console.log('prompt spectrum:',await prompt());await g.shot('lobby-play-15-at-spectrum-side-door');
await g.zoom(-1500);await g.shot('lobby-play-16-spectrum-zoom9');await g.zoom(700);
// Workshop
t0=(await g.snap()).time;await g.walk(7.5,5.5,.5);t1=(await g.snap()).time;console.log('walk spectrum->workshop',(t1-t0).toFixed(2));
await g.advance(.3);console.log('prompt ws:',await prompt());await g.shot('lobby-play-17-at-workshop');
await g.key('KeyE',.3);await g.shot('lobby-play-18-workshop-picker');
console.log('picker text:',await g.page.locator('.workshop-picker').innerText());
// keys while picker open: Tab, WASD
const before=(await g.snap()).player;await g.page.keyboard.down('KeyW');await g.advance(1);await g.page.keyboard.up('KeyW');const after=(await g.snap()).player;
console.log('moved while picker open',JSON.stringify(before),JSON.stringify(after));await g.shot('lobby-play-19-picker-after-W');
await g.page.keyboard.press('Escape');await g.advance(.3);console.log('paused after Esc?',(await g.snap()).paused,'picker hidden',await g.page.locator('.workshop-picker').isHidden());
await g.shot('lobby-play-20-after-esc');
console.log(await g.close());

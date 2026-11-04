import {launch} from '../cap.mjs';
const P='playground-teach';
const g=await launch('playground');
const hideHud=on=>g.page.addStyleTag({content:on?'#hud,.objective,.prompt-pill,.panel,.action-bar{visibility:hidden!important}':''});
// plug in hand close-up
await g.key('KeyF');await g.advance(.3);await g.zoom(-1500);await g.orbit(300,0);await g.shot(`${P}-22-plug-in-hand-close`);
await g.crop(`${P}-22b-plug-crop`,{x:520,y:250,width:420,height:400});
await g.zoom(1500);await g.orbit(-300,0);
// walk to the glowing wall socket with the plug
await g.walk(-3.6,-8.6,.4);await g.advance(.3);const t=await g.page.evaluate(()=>document.querySelector('.prompt-pill:not([hidden])')?.innerText);console.log('wall socket prompt',t);
await g.zoom(-1200);await g.shot(`${P}-23-plug-at-glowing-wall-socket`);
await g.key('KeyF',.4);console.log('after F',JSON.stringify((await g.snap()).electrical),(await g.snap()).holdingPlug);await g.zoom(1200);
// pick up again and go clean
await g.walk(-3.8,-8.2,.4);await g.key('KeyF');console.log('hp',(await g.snap()).holdingPlug);
await g.walk(-4,-4);await g.walk(5.8,-5.5);await g.key('KeyF',.3);console.log('conn',(await g.snap()).electrical);
await g.walk(6.6,-5.9,.4);await g.zoom(600);
await hideHud(true);await g.shot(`${P}-24-nohud-plugged-off`);
await g.page.keyboard.press('KeyE');await g.ev('return drive.advance(a[0])',.02);await g.page.waitForTimeout(100);
await g.page.screenshot({path:`mockups/review5/shots/${P}-25-nohud-lamp-on-first-frame.png`});
await g.page.waitForTimeout(1600);await g.shot(`${P}-26-nohud-winpush`);
await g.crop(`${P}-26b-winpush-pip-crop`,{x:250,y:220,width:500,height:560});
console.log('errors',await g.close());

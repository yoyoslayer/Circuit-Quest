import {launch} from '../cap.mjs';
const g=await launch('lobby',{fullfx:true});
const prompt=async()=>{const v=await g.page.locator('.prompt-pill').isVisible();return v?await g.page.locator('.prompt-pill').innerText():'(none)';};
await g.advance(.3);
await g.crop('lobby-play-21-crop-marker-start',{x:250,y:0,width:260,height:200});
// F with nothing: shrug
await g.key('KeyF',.3);console.log('after F prompt',await prompt());
// grab red chair
await g.walk(1.6,4.9,.4);await g.advance(.2);console.log('near chair prompt',await prompt());
await g.key('KeyE',.2);console.log('held',(await g.snap()).held,'prompt',await prompt());
await g.shot('lobby-play-22-holding-chair');
// face the reception coworker at (-1.4,.6): walk toward
await g.walk(-.6,2.6,.4);await g.advance(.1);
await g.key('KeyQ',.05);
let mx=0,al=0;for(let i=0;i<8;i++){await g.advance(.1);const s=await g.snap();mx=Math.max(mx,s.fastestProp);al=Math.max(al,s.alarmed);}
const s1=await g.snap();console.log('after throw: fastest',mx.toFixed(2),'alarmed',al,'damage',s1.damage,'time',s1.time.toFixed(1));
await g.shot('lobby-play-23-after-chair-throw');
// throw the mug at the board
await g.walk(.9,1.9,.3);await g.advance(.2);console.log('near mug prompt',await prompt());await g.key('KeyE',.2);console.log('held',(await g.snap()).held);
await g.key('Space',.6);console.log('jump while holding mug ok');
await g.key('KeyQ',.05);mx=0;al=0;for(let i=0;i<8;i++){await g.advance(.1);const s=await g.snap();mx=Math.max(mx,s.fastestProp);al=Math.max(al,s.alarmed);}
console.log('mug throw fastest',mx.toFixed(2),'alarmed',al,'damage',(await g.snap()).damage);
await g.shot('lobby-play-24-after-mug-throw');
// push beanbag into a doorway: grab beanbag (8.6,5.8) heavy?
await g.walk(8.0,5.2,.4);await g.advance(.2);console.log('near beanbag prompt',await prompt());
// cooler + boxes: carry box to playground door and drop in doorway
await g.walk(-8.6,6.0,.4);await g.advance(.2);console.log('near box prompt',await prompt());await g.key('KeyE',.2);console.log('held',(await g.snap()).held);
await g.walk(-11.6,-8.4,.4);await g.advance(.3);console.log('holding box at door prompt',await prompt());await g.shot('lobby-play-25-box-at-door');
await g.key('KeyE',.4);console.log('after E at door with box: url',g.page.url(),'held',(await g.snap()).held,'prompt',await prompt());
await g.shot('lobby-play-26-box-dropped-at-door');
// all items
const s=await g.snap();console.log('items',JSON.stringify(s.items),'dmg',s.damage,'cost',s.cost,'time',s.time.toFixed(1));
// result: try Tab and R
await g.page.keyboard.press('Escape');await g.advance(.3);await g.shot('lobby-play-27-pause-menu');console.log('pause text:',(await g.page.locator('[data-screen],.pause,.screen').allInnerTexts()).join(' | ').slice(0,1500));
console.log(await g.close());

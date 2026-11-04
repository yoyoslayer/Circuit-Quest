import {launch} from '../cap.mjs';
const g=await launch('lobby',{fullfx:true,width:390,height:844,start:false});
await g.ev('return drive.advance(1)');await g.shot('lobby-play-33-phone-title');
await g.page.getByRole('button',{name:'Start playing'}).click();await g.advance(.5);
await g.shot('lobby-play-34-phone-start');
await g.survey();await g.shot('lobby-play-35-phone-survey');await g.survey();
await g.walk(-13.9,-.9,.4);await g.advance(.6);await g.shot('lobby-play-36-phone-observatory-door');
await g.walk(7.5,5.5,.5);await g.advance(.3);await g.key('KeyE',.3);await g.shot('lobby-play-37-phone-picker');
console.log(await g.close());
const h=await launch('lobby',{fullfx:true});await h.advance(.3);
await h.page.keyboard.down('ShiftLeft');await h.walk(-6,-6,.4);await h.page.keyboard.up('ShiftLeft');
await h.zoom(-900);await h.shot('lobby-play-38-trail-after-walk');await h.advance(3);await h.shot('lobby-play-39-trail-after-3s');
// blade sign close-up
await h.walk(-12.6,-.9,.4);await h.advance(.4);await h.orbit(-150,-60);await h.zoom(-800);await h.shot('lobby-play-40-blade-sign-close');
console.log(await h.close());

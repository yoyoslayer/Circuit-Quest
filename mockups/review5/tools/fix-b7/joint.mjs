// Where the coupler joint sits after joining the second reel at the mail cart.
import {launch} from '../cap.mjs';
const g=await launch('meeting');await g.advance(.3);
await g.walk(-9,-6,.5);await g.key('KeyF');for(const [x,z] of [[-9,5.3],[-3.3,5.5]])await g.walk(x,z,.3);
await g.key('KeyF');await g.key('KeyF');for(const [x,z] of [[-1,3],[-1,-1.5]])await g.walk(x,z);await g.advance(.3);
const j=await g.page.evaluate(()=>{const G=window.__game;const p=G.joint?.position;return {joint:p&&[+p.x.toFixed(2),+p.y.toFixed(2),+p.z.toFixed(2)],joinAt:+G.joinAt.toFixed(2),len:+G.rope.length.toFixed(2)};});
await g.page.evaluate(([x,z])=>{const G=window.__game;G.player.setTranslation({x,y:.77,z},true);},[j.joint[0]+1.2,j.joint[2]+1.2]);
await g.page.evaluate(()=>{Object.assign(window.__game,{zoom:10,pitch:.1});});await g.advance(.8);await g.shot('fix-b7-meeting-joint-close');
console.log(JSON.stringify(j),JSON.stringify(await g.close()));

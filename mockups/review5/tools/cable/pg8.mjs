import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('playground',{fullfx:true});
try{
const prompt=()=>g.page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&/slingshot|Drop the plug|Plug in/.test(e.textContent)).map(e=>e.textContent).join('|'));
await g.advance(.5);await g.key('KeyF');
// walk east along the north lane away from the socket until the cable stops Pip
await g.walk(0,4.6,.5,10);
let s=await g.advance(4,['KeyD']);log('walk to limit E',s.player.x.toFixed(2),s.player.z.toFixed(2),'strain',s.rope.strain.toFixed(4),await prompt());
s=await g.advance(.5);log('stood .5s strain',s.rope.strain.toFixed(4),'energy',(Math.max(0,s.rope.length-s.rope.maxLength)**2*60).toFixed(2),await prompt());
await g.shot('cable-120-pg-standing-limit-q-prompt');
await g.page.keyboard.press('KeyQ');s=await g.advance(1/60);log('Q: fastest',s.fastestProp.toFixed(2),'holding',s.holdingPlug);
s=await g.advance(.5);await g.shot('cable-121-pg-standing-q-result');log('after .5 fastest',s.fastestProp.toFixed(2),'damage',s.damage);
// White cable on cream floor: crop near Pip for contrast
await g.key('KeyF');await g.walk(-2,4.6,.5,10);s=await g.snap();log('re-held',s.holdingPlug,'strain',s.rope.strain.toFixed(3));
await g.advance(.3);await g.shot('cable-122-pg-white-cable-gamecam');
await g.crop('cable-123-crop-white-cable-floor',{x:380,y:380,width:420,height:260});
// walk the cable through the pink coworker and close to boxes; zoom close
await g.zoom(-1500);await g.shot('cable-124-pg-cable-close-zoom9');
}finally{log(await g.close());}

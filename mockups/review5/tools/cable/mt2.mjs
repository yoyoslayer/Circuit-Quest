import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('meeting',{fullfx:true});
const route=async (pts,r=.5)=>{let s;for(const [x,z] of pts){const w=await g.walk(x,z,r,40);s=w.state;if(!w.arrived)log('STUCK',x,z);}return s;};
await g.advance(.5);
// clean coupler route via F at mail cart (spec 'holding the plug, F at the mail cart')
await g.key('KeyF');let s=await route([[-9,-6],[-9,5.3],[-3.3,5.5]],.3);log('at cart',s.rope.strain.toFixed(3),s.rope.maxLength);
await g.shot('cable-70-mt-at-mailcart-before');
await g.zoom(-1200);await g.shot('cable-71-mt-mailcart-close-before');
await g.key('KeyF');await g.advance(.3);await g.shot('cable-72-mt-coupler-attached');
await g.key('KeyF');await g.advance(.3);s=await g.snap();log('after ext',s.rope.maxLength,s.rope.strain.toFixed(3));await g.shot('cable-73-mt-extension-attached');
await g.zoom(1200);
// look at reel spool now
await route([[-9,5.3],[-9,-5]],.5);await g.zoom(-1200);await g.shot('cable-74-mt-reel-spool-after-ext');await g.zoom(1200);
// wrong order test fresh: not here
log(await g.close());

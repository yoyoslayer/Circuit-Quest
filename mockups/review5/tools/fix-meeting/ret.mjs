// Debug: what the grab cue marks near the projector switch.
import {launch} from '../cap.mjs';
const g=await launch('meeting');await g.advance(.3);
await g.walk(13.1,-3.3,.3);await g.advance(.3);
console.log(await g.page.evaluate(()=>{const q=window.__game,n=q.nearest();return JSON.stringify({kind:n?.spec.kind,id:n?.spec.id,pos:n?.body.translation(),scale:q.reticle.scale,pos2:q.reticle.position,vis:q.reticle.visible,rot:q.reticle.rotation});}));
await g.close();

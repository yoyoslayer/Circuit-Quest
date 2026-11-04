// (d) zoom-9 close-ups of unbevelled/low-bevel boxes + a default-camera Meeting shot for handheld pixel sizes.
import {launch} from '../cap.mjs';
let g=await launch('lunch',{fullfx:true});
await g.walk(-3,6,.4);await g.zoom(-1500);await g.advance(.5);await g.shot('toon-pipeline-11-lunch-wedge-bridge-zoom9');
await g.orbit(300,0,1);await g.shot('toon-pipeline-12-lunch-wedge-orbit-zoom9');
console.log(await g.close());
g=await launch('playground',{fullfx:true});
await g.walk(-4.6,3.2,.4);await g.zoom(-1500);await g.advance(.5);await g.shot('toon-pipeline-13-playground-crates-zoom9');
await g.orbit(-500,0,1);await g.shot('toon-pipeline-14-playground-crates-orbit-zoom9');
console.log(await g.close());
g=await launch('meeting',{fullfx:true});
await g.advance(.5);await g.shot('toon-pipeline-15-meeting-gamecam');
await g.zoom(-1500);await g.advance(.5);await g.shot('toon-pipeline-16-meeting-zoom9');
console.log(JSON.stringify((await g.snap()).camera??{}));
console.log(await g.close());

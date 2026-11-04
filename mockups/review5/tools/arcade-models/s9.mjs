import {launch} from '../cap.mjs';
const P='arcade-models';
const g=await launch('arcade',{fullfx:true});
const settle=async(n=20)=>{for(let i=0;i<n;i++)await g.advance(1/60);};
const shot=async(name)=>{await settle();return g.shot(`${P}-${name}`);};
await settle();
// claw + handheld side view (camera from +x side, low)
let w=await g.walk(5.9,-4.6,.4);console.log(w.arrived);
await g.key('KeyC',.2);await g.zoom(-2000,.3);await g.orbit(-262,-150,.2);await shot('80-claw-handheld-side-low');
await g.orbit(-120,0,.2);await shot('81-handheld-side');
// beanbag / paper overlap top-down
await g.key('KeyC',.2);w=await g.walk(4.6,1.2,.4);console.log(w.arrived);await g.key('KeyC',.2);await g.zoom(-2000,.3);await g.orbit(0,300,.2);await shot('82-beanbag-paper-topdown');
// storeroom sign edge-on
await g.key('KeyC',.2);w=await g.walk(-5.8,2.2,.4);console.log(w.arrived);await g.key('KeyC',.2);await g.zoom(-2000,.3);await g.orbit(-262,-100,.2);await shot('83-storeroom-sign-edge');
const p=await g.snap();console.log('fps',p.fps,'dc',p.drawCalls);
console.log(await g.close());

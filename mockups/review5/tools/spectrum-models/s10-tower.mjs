import {start} from './lib.mjs';
const g=await start();
await g.advance(.5);await g.zoom(-2000);
await g.walk(.9,2.3,.25);await g.face(.14);await g.S('B0','tower-side-z9');
await g.face(.14,150);await g.S('B1','tower-side-z9-high');
await g.face(.14+Math.PI);await g.S('B2','tower-other-side-z9');
// toaster from side: Pip at (2.4,3.7) facing -z? toaster at (2.1,1.0,4.85) -> stand at 3.6,4.0 face toward +z
await g.walk(3.4,3.9,.25);await g.face(Math.PI+.3,120);await g.S('B3','toaster-side-z9');
await g.page.evaluate(()=>{});
console.log('errors',JSON.stringify(await g.close()));

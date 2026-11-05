// R5-302 check: the two corridor-bench coworkers sit on the benches. BASE=http://localhost:4215
import {launch} from '../cap.mjs';
const g=await launch('lunch');await g.advance(1);
await g.walk(-3.4,6.5,.5);await g.advance(.5);
await g.orbit(0,-60);await g.zoom(-600);
console.log(JSON.stringify((await g.snap()).npcs.filter(n=>n.z>9)));
console.log(await g.shot('fix-lunch3-bench'));console.log(await g.close());

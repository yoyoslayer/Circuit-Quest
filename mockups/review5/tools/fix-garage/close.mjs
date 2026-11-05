// Close looks at the garage models (chargers, stand, shelves). BASE=http://localhost:4192 node mockups/review5/tools/fix-garage/close.mjs
import {launch} from '../cap.mjs';
const K='fix-garage';
const g=await launch('garage',{fullfx:true});
await g.advance(.5);
const look=async(x,z,name)=>{await g.walk(x,z,.5);await g.advance(.6);await g.zoom(-1200);await g.shot(`${K}-${name}`);await g.zoom(1200);};
await look(6.4,-3.6,'20-chargers-close');
await look(1.6,-3.4,'21-stand-close');
await look(-8.1,-4.6,'22-shelves-close');
console.log(JSON.stringify(await g.ev('return 1')));
console.log(JSON.stringify(await g.close()));

// Prints the lobby's door approach points (hub snapshot). BASE=http://localhost:4205 SWIFT=1
import {launch} from '../cap.mjs';
const g=await launch('lobby',{fullfx:false});
const s=await g.snap();console.log(JSON.stringify(s.hub.doors));
await g.browser.close();

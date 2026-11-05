// Prints the layout audit (start-of-level overlaps) for the given levels.
import {launch} from '../cap.mjs';
for(const lv of process.argv.slice(2)){const g=await launch(lv,{fullfx:false});console.log(lv,JSON.stringify(await g.audit()));await g.close();}

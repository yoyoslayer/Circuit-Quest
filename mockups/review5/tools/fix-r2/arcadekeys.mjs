// R5-246: key chips on the Arcade bench bins, supply and stamp.
import {launch} from '../cap.mjs';
const g=await launch('arcade',{fullfx:true});await g.advance(1);
await g.page.evaluate(()=>{const s=window.__game.station;s.binsGroup.visible=true;});
await g.walk(0,-1.55,.4);await g.key('KeyE',1.2);await g.shot('fix-r2-arcade-keys');await g.close();

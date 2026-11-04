import {launch} from '../cap.mjs';
for(const lv of ['lunch','garage']){const g=await launch(lv,{fullfx:true});await g.advance(.5);const s=await g.snap();console.log(lv,'drawCalls',s.drawCalls,'fps',s.fps);await g.close();}

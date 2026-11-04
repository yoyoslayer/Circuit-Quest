import {launch} from '../cap.mjs';
for(const lv of ['lunch','garage','meeting']){const g=await launch(lv,{fullfx:false});await g.advance(.5);const s=await g.snap();console.log(lv,'lowfx drawCalls',s.drawCalls);await g.close();}

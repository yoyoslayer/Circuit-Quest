import {launch} from '../cap.mjs';
for(const lv of ['lunch','meeting','playground']){const g=await launch(lv,{fullfx:true});await g.advance(1);const s=await g.snap();console.log(lv,'dc',s.drawCalls,'fps',Math.round(s.fps),'props',s.props);await g.close();}

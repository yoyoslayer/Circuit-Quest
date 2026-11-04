import {launch} from '../cap.mjs';
for(const fx of [false,true]){const g=await launch('spectrum',{fullfx:fx});await g.advance(.6);const s=await g.snap();console.log('fullfx',fx,'dc',s.drawCalls,'props',s.props);await g.close();}
const g=await launch('lunch',{fullfx:true});await g.advance(.6);console.log('lunch dc',(await g.snap()).drawCalls);await g.close();

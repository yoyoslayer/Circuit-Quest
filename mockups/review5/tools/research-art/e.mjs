import {launch} from '../cap.mjs';
const P='research-art';
for(const [q,name] of [['','41-meeting-ramp-default'],['hardcel','42-meeting-ramp-hardcel']]){
  const g=await launch('meeting',{fullfx:true,query:q});await g.advance(1);await g.walk(-6.5,-1.2,.5);await g.advance(.5);await g.zoom(-700);
  await g.shot(`${P}-${name}`);await g.close();
}

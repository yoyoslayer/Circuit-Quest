import {launch} from '../cap.mjs';
const P='recheck-list-';const log=(...a)=>console.log(...a);
for(const [lvl,x,z] of [['playground',-8.6,-8.6],['meeting',-11.3,-7.4],['lunch',14.5,8.4]]){
  const g=await launch(lvl,{fullfx:true});
  try{await g.advance(.3);const r=await g.walk(x,z,.4);log(lvl,r.arrived,JSON.stringify(r.state.player));
  await g.zoom(-1500);
  for(const [tag,dy] of [['def',0],['low',-200]]){if(dy)await g.orbit(0,dy);
    for(let i=0;i<8;i++){await g.orbit(-180,0,.6);await g.page.screenshot({path:`mockups/review5/shots/_tmp-${lvl}-${tag}-${i}.png`});}}
  }catch(e){log('ERR',e.message);}
  log('errors',JSON.stringify(await g.close()));
}

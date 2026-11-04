// P0 fix check (R5-001): every bench at phone portrait and desktop. node mockups/review5/tools/fix-p0/benches.mjs [levels...]
import {launch} from '../cap.mjs';
const preps={
  arcade:async g=>{await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);},
  garage:async g=>{await g.walk(6.4,-4.2,.5);await g.key('KeyE');await g.walk(3.4,-4);await g.walk(2.5,-4.4);await g.key('KeyE',.3);await g.walk(2.9,-4);await g.walk(2.9,-1.1);await g.walk(0,-1.55,.4);},
  observatory:async g=>{await g.walk(-3.7,-.1,.6);await g.key('KeyE');await g.walk(-6,3.5,.6);await g.key('KeyE',.3);await g.walk(0,-1.55,.4);},
  qfn:async g=>{await g.walk(-8.8,2.95,.5);await g.key('KeyE');await g.walk(1.3,-.6,.5);await g.key('KeyE',.2);await g.walk(0,-.5,.4);},
  spectrum:async g=>{await g.walk(-6.3,3.6);await g.walk(-3.5,3.55,.4);},
};
const levels=process.argv.slice(2).length?process.argv.slice(2):Object.keys(preps);
for(const lvl of levels)for(const [tag,w,h] of [['p',390,844],['d',1440,900]]){
  const g=await launch(lvl,{fullfx:true,width:w,height:h});await g.advance(.5);
  await preps[lvl](g);await g.key('KeyE',1.2);
  const at=(await g.snap()).atBench;await g.shot(`fix-p0-${lvl}-${tag}-bench`);
  console.log(lvl,tag,'atBench',at,'errors',JSON.stringify(await g.close()));
}

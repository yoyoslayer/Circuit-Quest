import {launch} from '../cap.mjs';
for(const lv of ['meeting','arcade','qfn']){const g=await launch(lv);await g.advance(.5);console.log(lv,JSON.stringify(await g.audit(.02)).slice(0,700));await g.close();}

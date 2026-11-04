import {launch} from '../cap.mjs';
const P='verify-gap3-recheck-list-';
const g=await launch('meeting',{fullfx:true});
try{await g.advance(.3);const r=await g.walk(-11.3,-7.4,.4);console.log('arrived',r.arrived,JSON.stringify(r.state.player));
await g.zoom(-1500);await g.orbit(0,-200);
for(let i=0;i<8;i++){await g.orbit(-180,0,.6);await g.page.screenshot({path:`mockups/review5/shots/${P}0${i}-meeting-closet-low.png`});}
}catch(e){console.log('ERR',e.message);}
console.log('errors',JSON.stringify(await g.close()));

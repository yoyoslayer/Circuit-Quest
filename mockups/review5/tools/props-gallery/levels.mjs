import {launch} from '../cap.mjs';
const lvls=process.argv.slice(2);let n=Number(process.env.N??50);
for(const lv of lvls){const g=await launch(lv,{fullfx:true});const P='props-gallery-'+(n++);
await g.advance(.5);await g.shot(P+'a-'+lv+'-start');
await g.survey();await g.shot(P+'b-'+lv+'-survey');await g.key('Tab',1);
await g.zoom(-1500);await g.orbit(300,0);await g.shot(P+'c-'+lv+'-close-o300');
console.log(lv,await g.close());}

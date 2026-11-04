import {launch} from '../cap.mjs';
for(const [w,h,s] of [[1440,900,''],[390,844,'-phone']]){const g=await launch('lobby',{fullfx:true,start:false,width:w,height:h});await g.page.waitForTimeout(2500);await g.shot(`camera-render-lo-70-title${s}`);console.log(await g.close());}

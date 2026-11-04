import {launch} from '../cap.mjs';
for(const lv of ['lobby','playground','meeting','lunch','arcade','garage','qfn','observatory','spectrum']){
const g=await launch(lv,{fullfx:false});
const s=await g.snap();const a=await g.audit(.02);
console.log(lv,'props',typeof s.props==='number'?s.props:JSON.stringify(s.props).slice(0,200),'audit',a.length,JSON.stringify(a.slice(0,8)));
const e=await g.close();if(e.length)console.log('errors',e);}

import {launch} from '../cap.mjs';
const lv=process.argv[2]??'playground';
const g=await launch(lv,{fullfx:false});
const s=await g.snap();console.log(Object.keys(s).join(','));
console.log(JSON.stringify(s.items?.slice?.(0,3)??s.props?.slice?.(0,3)));
const a=await g.audit(.02);console.log('audit',JSON.stringify(a).slice(0,1500));
console.log(await g.close());

import {launch} from '../cap.mjs';
for(const lv of ['meeting','playground','arcade','garage','qfn','observatory','lunch','spectrum']){
  const g=await launch(lv,{fullfx:false});
  const a=await g.audit(.02);
  const kinds={};for(const o of a){const k=[o.a.split(' @')[0],o.b.split(' @')[0]].sort().join('+');kinds[k]=(kinds[k]||0)+1;}
  console.log(lv,'audit',a.length,JSON.stringify(kinds));
  if(lv==='meeting')console.log(JSON.stringify(a.filter(o=>/extension|cabinet|beanbag/.test(o.a+o.b)).slice(0,6)));
  const e=await g.close();if(e.length)console.log('errors',e.slice(0,3));
}

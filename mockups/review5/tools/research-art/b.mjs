import {launch} from '../cap.mjs';
const P='research-art';
const levels=(process.argv[2]).split(',');let n=Number(process.argv[3]??1);
for(const lv of levels){
  const g=await launch(lv,{fullfx:true});
  await g.advance(1.5);
  const nn=()=>String(n++).padStart(2,'0');
  await g.shot(`${P}-${nn()}-${lv}-start`);
  await g.zoom(-1500);await g.orbit(-250,-40);await g.shot(`${P}-${nn()}-${lv}-close`);
  console.log(lv,'errors',JSON.stringify(await g.close()).slice(0,400));
}

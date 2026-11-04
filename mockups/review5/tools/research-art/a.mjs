import {launch} from '../cap.mjs';
const P='research-art';
const levels=(process.argv[2]??'meeting,lunch,arcade').split(',');let n=Number(process.argv[3]??1);
for(const lv of levels){
  const g=await launch(lv,{fullfx:true});
  await g.advance(1.5);
  const nn=()=>String(n++).padStart(2,'0');
  await g.shot(`${P}-${nn()}-${lv}-start`);
  const s=await g.snap();console.log(lv,'player',JSON.stringify(s.player),'props',s.props,'dc',s.drawCalls);
  const au=await g.audit();console.log('audit',JSON.stringify(au).slice(0,1500));
  await g.survey();await g.shot(`${P}-${nn()}-${lv}-survey`);
  await g.key('Tab',.1);await g.advance(1.2);
  await g.zoom(-1500);await g.shot(`${P}-${nn()}-${lv}-zoomin`);
  await g.orbit(380,-60);await g.shot(`${P}-${nn()}-${lv}-zoomin-orbit`);
  console.log('errors',JSON.stringify(await g.close()).slice(0,800));
}

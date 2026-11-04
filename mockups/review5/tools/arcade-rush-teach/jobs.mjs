import {launch} from '../cap.mjs';
const g=await launch('arcade-rush',{fullfx:false,start:false});
const out=await g.page.evaluate(async()=>{
  const L=await import('/src/stations/arcade/logic.ts');const {rng}=await import('/src/render/textures.ts');
  const r=rng(20261029);const jobs=[];
  for(let n=0;n<16;n++){const j=L.rushJob(r,n);const fix=L.best(j);const st=L.read(j,j.start);const v=L.judge(j,j.start);
    const fr=L.read(j,{chain:fix,reversed:false});
    jobs.push({n,ask:j.ask,story:j.story,start:j.start,startI:+(st.iLoad*1000).toFixed(1),startTotI:+(st.i*1000).toFixed(1),tripped:st.tripped,level:+st.level.toFixed(2),rHeat:+st.rHeat.toFixed(2),prob:v.problems[0]||v.notes[0],fix:JSON.stringify(fix),fixI:+(fr.iLoad*1000).toFixed(1),fixHeat:+fr.rHeat.toFixed(2),nReliable:L.reliable(j).length});}
  // stats over many rush jobs
  const r2=rng(1);const stats={};let pops=0,trips=0,hotStoryMismatch=0,total=0;
  for(let n=0;n<2000;n++){const j=L.rushJob(r2,n);const st=L.read(j,j.start);total++;
    const key=j.story;stats[key]=(stats[key]||0)+1;
    if(st.tripped)trips++;else if(st.level>2.5)pops++;
    if(j.story.startsWith('Too bright')&&(st.tripped||st.level>2.5))hotStoryMismatch++;}
  return {jobs,stats,trips,pops,hotStoryMismatch,total};
});
console.log(JSON.stringify(out,null,1));
console.log(await g.close());

import {JOBS,read,judge,allChains,best,reliable,blockCount,chainR,rushJob,HOUSE,failTime} from './logic.bundle.mjs';
const all=allChains();
const key=c=>JSON.stringify(c.map(p=>[...p].sort()));
for(const j of JOBS){
  const seen=new Map();for(const c of all){const k=key(c);if(!seen.has(k))seen.set(k,c);}
  const uniq=[...seen.values()];const t=[0,0,0,0];const rs=new Map();
  for(const c of uniq){const v=judge(j,{chain:c,reversed:false});t[v.tier]++;}
  const singles=[47,100,220,470].map(b=>{const s={chain:[[b],[],[]],reversed:false},r=read(j,s),v=judge(j,s);return `${b}:${(r.iLoad*1000).toFixed(1)}mA t${v.tier} blk${(r.rHeat).toFixed(2)}`;});
  const b=best(j);
  // distinct resistances that are tier3
  const r3=[...new Set(uniq.filter(c=>judge(j,{chain:c,reversed:false}).tier===3).map(c=>chainR(c).toFixed(1)))].sort((a,b)=>a-b);
  console.log(j.id,'tiers(fail,works,reliable,elegant)',t,'best',JSON.stringify(b),'singles',singles.join(' | '),'elegant R values',r3.slice(0,12).join(','),r3.length>12?'...':'');
}
// claw: block pop times for 1.2..2 x
console.log('failTime 1.2x',failTime(1.2).toFixed(2),'1.5x',failTime(1.5).toFixed(2),'1.77x',failTime(1.77).toFixed(2));
// rhythm sensitivity: Vf 2.8..3.2, supply 3.135..3.465 with 47||47
const rh=JOBS[1];for(const vf of [2.8,2.9,3.0,3.1,3.2])for(const V of [3.135,3.3,3.465]){const j={...rh,supply:V,load:{...rh.load,vf}};const r=read(j,{chain:[[47,47],[],[]],reversed:false});process.stdout.write(`Vf${vf}/V${V}:${(r.iLoad*1000).toFixed(1)}mA  `);}console.log();
// bumper 220: sensitivity to Vf 1.8..2.2
for(const vf of [1.8,2.0,2.2]){const j={...JOBS[0],load:{...JOBS[0].load,vf}};console.log('bumper220 vf',vf,(read(j,{chain:[[220],[],[]],reversed:false}).iLoad*1000).toFixed(1));}
// hopper notes
for(const c of [[[470],[470],[470]],[[47],[],[]],[[100],[],[]]]){const v=judge(JOBS[4],{chain:c,reversed:false});console.log('hopper',JSON.stringify(c),v.tier,v.problems,v.notes);}
// handheld / claw starts
for(const j of JOBS){const v=judge(j,j.start);console.log('start',j.id,v.tier,v.problems[0]);}
// rush: sample

import * as L from './tmp/logic.mjs';
for(const j of L.JOBS){
  const sol=L.solutions(j);
  console.log('JOB',j.id,'reliable solutions:',sol.length);
  for(const s of sol.slice(0,40))console.log('  ',s.setup.band,s.setup.power+'mW','hatch',s.setup.hatchOpen,'mirrors',JSON.stringify(s.setup.mirrors),'used',s.mirrors,'margin',s.margin.toFixed(1),'cost',s.cost);
  console.log('  leanest:',L.leanest(j)?.hint);
  // tier of each band x power, no mirrors, hatch shut, best aim
  for(const band of L.BAND_IDS)for(const power of L.POWERS){const v=L.judge(j,{band,detector:L.BANDS[band].detector,power,hatchOpen:j.hatch??false,mirrors:j.id==='lab'?['A']:[],pod:j.pad});if(v.tier>0)console.log('   tier',v.tier,band,power,v.margin,v.notes[0]??'');}
}
// Lab with mirror only on B or C
for(const m of [['B'],['C'],['B','C'],['A','B']]){const j=L.JOBS[1];let best=null;for(const band of L.BAND_IDS)for(const power of L.POWERS)for(const hatchOpen of [true,false]){const r=L.read(j,{band,detector:L.BANDS[band].detector,power,hatchOpen,mirrors:m,pod:'lab'});if(!best||r.margin>best.m)best={m:r.margin,band,power,hatchOpen,spots:r.route.spots};}console.log('lab with mirrors',m,'best',JSON.stringify(best));}
console.log('SPOTS',JSON.stringify(L.SPOTS));

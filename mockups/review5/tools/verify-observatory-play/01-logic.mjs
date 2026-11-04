import {launch} from '../cap.mjs';
const g=await launch('observatory',{fullfx:false});
const out=await g.page.evaluate(async()=>{
  const L=await import('/src/stations/observatory/logic.ts');
  const J=L.JOBS;const base={series:undefined,shunt:undefined,rerouted:true,cartDistance:8,rod:'r75',vertical:true};
  const r={};
  // F0: 68uF shunt, rerouted, cart 8m
  const s0={...base,shunt:L.part('C',68e-6)};const rd=L.read(J[0],s0);r.f0={snr:rd.snr,level:rd.level,decoded:L.decoded(J[0].message,rd.snr,3),judge:L.judge(J[0],s0)};
  // F5: job2 shunt-C only sweep
  r.f5=L.VALUES.C.map(v=>{const x=L.read(J[1],{...base,shunt:L.part('C',v)});return [v,x.snr,+x.level.toFixed(2),L.judge(J[1],{...base,shunt:L.part('C',v)}).tier];}).filter(a=>a[1]>6);
  // any passing job2 with shunt C only, any series kind?
  r.f5any=L.solutions(J[1],{cartDistance:8}).slice(0,5).map(x=>[x.setup.series&&x.setup.series.kind+x.setup.series.value,x.setup.shunt&&x.setup.shunt.kind+x.setup.shunt.value,x.cost,x.snr]);
  // F6: tier of 1.5uF shunt rerouted vs cart distance
  r.f6=[4,6,7.9,9.66,11.6].map(d=>{const v=L.judge(J[0],{...base,cartDistance:d,shunt:L.part('C',1.5e-6)});const ch=L.cheapest(J[0],{cartDistance:d});return [d,v.tier,v.notes[0],ch&&ch.cost,ch&&ch.hint];});
  r.f6none=[6,8,9.66,11.6].map(d=>{const x=L.read(J[0],{...base,cartDistance:d});return [d,x.snr];});
  // F15
  r.f15=L.ROD_IDS.map(id=>[id,L.read(J[2],{...base,series:L.part('L',.01),shunt:L.part('C',1e-6),rod:id,vertical:false}).snr,L.read(J[2],{...base,series:L.part('L',.01),shunt:L.part('C',1e-6),rod:id,vertical:true}).snr]);
  r.costLimit=Math.ceil(J.reduce((n,j)=>n+(L.cheapest(j,{cartDistance:L.CART_SAFE})?.cost??0),0)*1.25);
  r.cheapAt4=J.map(j=>L.cheapest(j,{cartDistance:4})?.hint);
  return r;});
console.log(JSON.stringify(out,null,1));
console.log('errors',JSON.stringify(await g.close()));

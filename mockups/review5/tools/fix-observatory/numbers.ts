// Tuning table for the observatory fixes (R5-043/045/063). Bundle and run:
//   npx esbuild mockups/review5/tools/fix-observatory/numbers.ts --bundle --platform=node --outfile=mockups/review5/tools/fix-observatory/numbers.cjs && node mockups/review5/tools/fix-observatory/numbers.cjs
import {JOBS,read,part,judge,CART_SAFE,solutions,cheapest,type Setup} from '../../../../src/stations/observatory/logic';
const S=(o:Partial<Setup>):Setup=>({rerouted:false,cartDistance:CART_SAFE,rod:'r75',vertical:true,...o});
const j1=JOBS[0];
for(const d of [1.42,2,3,4,5,6,7,10,14]){
  const row:unknown[]=[d];
  for(const rr of [false,true]){row.push(rr?'rr':'--',read(j1,S({cartDistance:d,rerouted:rr})).snr);
    for(const c of [6.8e-7,1e-6,1.5e-6,2.2e-6,3.3e-6]){const s=S({cartDistance:d,rerouted:rr,shunt:part('C',c)}),r=read(j1,s);row.push(`${+(c*1e6).toFixed(2)}u:${r.snr}/t${judge(j1,s).tier}`);}}
  console.log(row.join(' '));
}
for(const j of JOBS)for(const d of [1.42,CART_SAFE,7]){const b=cheapest(j,{cartDistance:d});console.log(j.id,d,b?.cost,b?.hint,b?.snr,solutions(j,{cartDistance:d}).length);}

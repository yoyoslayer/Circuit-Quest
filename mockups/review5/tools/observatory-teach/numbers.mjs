import * as L from './logic.mjs';
const {JOBS,CIRCUIT,CART_SAFE,read,judge,solutions,cheapest,corner,passes,gain,dB,latchVolts,part,VALUES,hz,valueText,quarterWave,antennaFactor,RODS,ROD_IDS,stepResponse,dcr}=L;
const S=(s)=>({rerouted:false,cartDistance:CART_SAFE,rod:'r75',vertical:true,...s});
console.log('VALUES',VALUES.R.length,VALUES.L.length,VALUES.C.length);
console.log('VALUES L',VALUES.L.join(','));
// corners
for(const v of [1e-7,1e-6,1.5e-6,1e-5])console.log('shunt C',v,hz(corner('shunt',part('C',v))));
for(const v of [1e-4,1e-3,1e-2])console.log('series L',v,hz(corner('series',part('L',v))),'dcr',dcr(v));
console.log('shunt L 1e-3',hz(corner('shunt',part('L',1e-3))),'series C 1e-6',hz(corner('series',part('C',1e-6))));
// job readings
for(const j of JOBS){
  console.log('\n==',j.id);
  const start=read(j,S({cartDistance:Math.hypot(-3.7+3.25,-1.1+2.45)}));console.log('start snr (cart at spawn place)',start.snr, 'lvl',start.level.toFixed(2));
  const sols=solutions(j,{cartDistance:CART_SAFE});console.log('reliable solutions',sols.length,'cheapest',cheapest(j,{cartDistance:CART_SAFE}).hint,'cost',sols[0].cost);
  const byCost={};for(const s of sols)byCost[s.cost]=(byCost[s.cost]||0)+1;console.log('by cost',JSON.stringify(byCost));
  const tier3=sols.filter(s=>s.cost===sols[0].cost).map(s=>`${s.setup.series?valueText(s.setup.series)+s.setup.series.kind+'ser':''} ${s.setup.shunt?valueText(s.setup.shunt)+s.setup.shunt.kind+'sh':''} ${s.setup.rerouted?'RR':''}`);
  console.log('tier3 list',tier3.length,tier3.slice(0,40).join(' | '));
}
// job 2 at default 1mH + 1.5uF carried from job1
const j2=JOBS[1];
for(const [l,c] of [[1e-3,1.5e-6],[1e-3,1e-6],[1e-2,1e-6],[1e-2,1.5e-6],[4.7e-3,1.5e-6],[2.2e-3,1.5e-6]]){const r=read(j2,S({series:part('L',l),shunt:part('C',c)}));console.log('j2 L',l,'C',c,'snr',r.snr,'lvl',r.level.toFixed(2),'latch',r.latch,'gain4k',dB(gain({series:part('L',l),shunt:part('C',c)},4000)).toFixed(1),'f0',hz(1/(2*Math.PI*Math.sqrt(l*c))));}
// what tag shows for series L in LC (corner of L alone) vs actual LC resonance
console.log('series L 10mH alone corner',hz(corner('series',part('L',.01))),'shunt 1u corner',hz(corner('shunt',part('C',1e-6))),'LC f0',hz(1/(2*Math.PI*Math.sqrt(.01*1e-6))));
// job3 carry over: after job2 filter, set rod r75, vertical false -> antenna
const j3=JOBS[2];for(const id of ROD_IDS)for(const v of [true,false])console.log('rod',id,v,antennaFactor(id,v,100e6).toFixed(3));
// series R latch, shunt R
for(const v of [10,22,47,100,150]){console.log('series R',v,'latch',latchVolts({series:part('R',v)}));}
for(const v of [1000]){console.log('shunt R',v,'latch',latchVolts({shunt:part('R',v)}));}
console.log('plain latch',latchVolts({}),'plain level',read(JOBS[0],S({})).level);
// job1: snr vs distance plain + reroute only
for(const d of [1,2,4,6,9])console.log('j1 plain d',d,read(JOBS[0],S({cartDistance:d})).snr,'rerouted',read(JOBS[0],S({cartDistance:d,rerouted:true})).snr,'shunt1.5u rr',read(JOBS[0],S({cartDistance:d,rerouted:true,shunt:part('C',1.5e-6)})).snr);
// job1 at cart not moved but filtered strongly: can you solve without moving cart?
const near=Math.hypot(-3.7+3.25,-1.1+2.45);console.log('near dist',near);
const solsNear=solutions(JOBS[0],{cartDistance:near});console.log('job1 solvable with cart near?',solsNear.length, solsNear[0]&&cheapest(JOBS[0],{cartDistance:near}).hint);
// tone level 1 for shunt C large
for(const v of [2.2e-6,3.3e-6,4.7e-6,6.8e-6,1e-5])console.log('shunt C',v,'level',read(JOBS[0],S({shunt:part('C',v),rerouted:true})).level.toFixed(2),'snr',read(JOBS[0],S({shunt:part('C',v),rerouted:true})).snr);
// LC resonance peak gain
const lc={series:part('L',1e-3),shunt:part('C',1.5e-6)};let mx=0,fm=0;for(let f=200;f<5e4;f*=1.01){const g=gain(lc,f);if(g>mx){mx=g;fm=f;}}console.log('1mH/1.5u peak',mx.toFixed(2),hz(fm));
// Q of 10mH/1uF
const lc2={series:part('L',1e-2),shunt:part('C',1e-6)};mx=0;for(let f=200;f<5e4;f*=1.01){const g=gain(lc2,f);if(g>mx){mx=g;fm=f;}}console.log('10mH/1u peak',mx.toFixed(2),hz(fm),'gain700',gain(lc2,700).toFixed(2));
// brute force: count all two-can combos tier>=2 for job2
let tot=0,ok=0;const opts=[undefined,...['R','L','C'].flatMap(k=>VALUES[k].map(v=>part(k,v)))];for(const a of opts)for(const b of opts){tot++;const v=judge(j2,S({series:a,shunt:b}));if(v.tier>=2)ok++;}console.log('job2 combos',tot,'reliable',ok);
// latch through shunt C + series L: step response peak voltage (overshoot) 
const sr=stepResponse({series:part('L',1e-2),shunt:part('C',1e-6)});console.log('step peak v',Math.max(...sr.map(p=>p.v)).toFixed(2),'final',sr[sr.length-1].v.toFixed(2));
const sr1=stepResponse({series:part('L',1e-3),shunt:part('C',1.5e-6)});console.log('step 1mH peak v',Math.max(...sr1.map(p=>p.v)).toFixed(2));
console.log('---extra');
for(const d of [10,12,14,17])console.log('j1 plain rr d',d,read(JOBS[0],S({cartDistance:d,rerouted:true})).snr,'cheapest',cheapest(JOBS[0],{cartDistance:d})?.hint,cheapest(JOBS[0],{cartDistance:d})?.cost);
console.log('j1 shunt1u rr at d=14 verdict',JSON.stringify(judge(JOBS[0],S({cartDistance:14,rerouted:true,shunt:part('C',1e-6)}))));
console.log('series10m + shunt L1m latch',latchVolts({series:part('L',.01),shunt:part('L',1e-3)}));
console.log('j2 shunt C only best', Math.max(...VALUES.C.map(v=>read(JOBS[1],S({shunt:part('C',v)})).snr)));
console.log('j2 series L only best', Math.max(...VALUES.L.map(v=>read(JOBS[1],S({series:part('L',v)})).snr)));
const v1=judge(JOBS[1],S({series:part('L',.01),shunt:part('C',1e-6)}));console.log('j2 10m/1u verdict',JSON.stringify(v1));
const v3=judge(JOBS[2],S({series:part('L',.01),shunt:part('C',1.5e-6),rod:'r3',vertical:false}));console.log('j3 r3 flat',JSON.stringify(v3.problems));
const v4=judge(JOBS[2],S({series:part('L',.01),shunt:part('C',1.5e-6),rod:'r150',vertical:true}));console.log('j3 r150 up',JSON.stringify(v4.problems));
// half-wave real check: 1.5 m at 100MHz is λ/2
console.log('r150 / qw',RODS.r150.length/quarterWave(100e6));
// job1 fail with cart near no filter
console.log(JSON.stringify(judge(JOBS[0],S({cartDistance:1.42})).problems));
console.log(JSON.stringify(judge(JOBS[0],S({series:part('C',1e-6)})).problems));
console.log(JSON.stringify(judge(JOBS[1],S({shunt:part('C',1e-5)})).problems));
console.log(JSON.stringify(judge(JOBS[1],S({shunt:part('C',1.5e-6)})).problems), read(JOBS[1],S({shunt:part('C',1.5e-6)})).snr);
console.log('j1 tier1 example', JSON.stringify(judge(JOBS[0],S({shunt:part('C',1e-6)}))));

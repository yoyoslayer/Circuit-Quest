import * as L from './logic.mjs';
const {JOBS,CART_SAFE,read,judge,part,VALUES,gain,solutions}=L;
const pk=(f)=>{let mx=0,fm=0;for(let x=100;x<60000;x*=1.01){const g=gain(f,x);if(g>mx){mx=g;fm=x}}return [mx.toFixed(2),fm.toFixed(0)];};
console.log('1m100n',pk({series:part('L',1e-3),shunt:part('C',1e-7)}),'10m100n',pk({series:part('L',1e-2),shunt:part('C',1e-7)}));
// fix (b) check: whine 2.2
const j2={...JOBS[1],id:'latch-x',noise:Array.from({length:4},(_,k)=>({f:4000*(k+1),a:2.2/(k+1)}))};
const S=(s)=>({rerouted:false,cartDistance:CART_SAFE,rod:'r75',vertical:true,...s});
console.log('whine2.2: LC10m1u',judge(j2,S({series:part('L',1e-2),shunt:part('C',1e-6)})).tier,judge(j2,S({series:part('L',1e-2),shunt:part('C',1e-6)})).snr,'n solutions',solutions(j2,{cartDistance:CART_SAFE}).length,'cheapest',solutions(j2,{cartDistance:CART_SAFE})[0]?.cost);
let single=0;for(const k of ['R','L','C'])for(const sl of ['series','shunt'])for(const v of VALUES[k])if(judge(j2,S({[sl]:part(k,v)})).tier>0)single++;console.log('whine2.2 singles tier>0',single);
// decodeSnr 9 for job2 equivalent: singles with snr>=9
let s9=0;for(const v of VALUES.C){const r=read(JOBS[1],S({shunt:part('C',v)}));if(r.snr>=9&&r.level>=.5)s9++;}console.log('singles >=9dB',s9);
// what LC options are tier 3 at original
console.log('orig solutions count',solutions(JOBS[1],{cartDistance:CART_SAFE}).length);

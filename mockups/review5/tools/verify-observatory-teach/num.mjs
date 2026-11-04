import * as L from './logic.mjs';
const {JOBS,CART_SAFE,read,judge,part,VALUES,valueText,gain,latchVolts,stepResponse,corner,filterName,decoded,cheapest,cost}=L;
const S=(s)=>({rerouted:false,cartDistance:CART_SAFE,rod:'r75',vertical:true,...s});
// F0: job1 with no filter
for(const d of [1.42,4,6.5,7,8,10,14])for(const rr of [false,true]){const j=judge(JOBS[0],S({cartDistance:d,rerouted:rr}));console.log('j1 nofilter d',d,'rr',rr,'tier',j.tier,j.snr,j.notes[0]??'',j.problems[0]??'');}
// F0: job2 single caps
for(const v of VALUES.C){const j=judge(JOBS[1],S({shunt:part('C',v)}));if(j.tier>0)console.log('j2 shuntC',valueText(part('C',v)),'tier',j.tier,j.snr);}
let best=-99;for(const k of ['R','L','C'])for(const sl of ['series','shunt'])for(const v of VALUES[k]){const j=judge(JOBS[1],S({[sl]:part(k,v)}));const r=read(JOBS[1],S({[sl]:part(k,v)}));if(r.latchOk&&r.level>=.5)best=Math.max(best,r.snr);}
console.log('best single part snr j2 (latch ok, level ok)',best);
let rc=0;for(const rv of VALUES.R)for(const cv of VALUES.C){if(judge(JOBS[1],S({series:part('R',rv),shunt:part('C',cv)})).tier>0)rc++;}console.log('RC tier>0',rc);
for(const j of JOBS)console.log('cheapest',j.id,JSON.stringify(cheapest(j,{cartDistance:CART_SAFE})?.hint),cheapest(j,{cartDistance:CART_SAFE})?.cost);
// F4: LC 10mH+1u gain
const LC={series:part('L',1e-2),shunt:part('C',1e-6)};
let mx=0,fm=0;for(let f=100;f<50000;f*=1.01){const g=gain(LC,f);if(g>mx){mx=g;fm=f}}console.log('LC10m1u peak',mx.toFixed(3),'at',fm.toFixed(0),'gain4k',gain(LC,4000).toFixed(3),'gain700',gain(LC,700).toFixed(3),'cornerL',corner('series',LC.series),'cornerC',corner('shunt',LC.shunt),'f0',1/(2*Math.PI*Math.sqrt(1e-8)));
console.log('j2 LC10m1u', JSON.stringify(judge(JOBS[1],S(LC))), read(JOBS[1],S(LC)).level);
// F7: 1mH + 1.5uF
const L1={series:part('L',1e-3),shunt:part('C',1.5e-6)};mx=0;for(let f=100;f<50000;f*=1.01){const g=gain(L1,f);if(g>mx){mx=g;fm=f}}
const sr=stepResponse(L1);console.log('1m1u5 maxgain',mx.toFixed(3),fm.toFixed(0),'g4k dB',(20*Math.log10(gain(L1,4000))).toFixed(2),'step peak',Math.max(...sr.map(p=>p.v)).toFixed(2),'final',sr.at(-1).v.toFixed(2));
const LL={series:part('L',1e-2),shunt:part('L',1e-3)};console.log('LL latch',latchVolts(LL));
const L10n={series:part('L',1e-2),shunt:part('C',150e-9)};mx=0;for(let f=100;f<50000;f*=1.01){const g=gain(L10n,f);if(g>mx){mx=g;fm=f}}console.log('10m150n peak',mx.toFixed(3),fm.toFixed(0),'g4k dB',(20*Math.log10(gain(L10n,4000))).toFixed(2));
const sr2=stepResponse(LC);console.log('LC10m1u step peak',Math.max(...sr2.map(p=>p.v)).toFixed(2),'final',sr2.at(-1).v.toFixed(2));
// F9
console.log('name CC',filterName({series:part('C',1e-6),shunt:part('C',1.5e-6)}),'LL',filterName(LL),'RL',filterName({series:part('R',100),shunt:part('L',1e-3)}));
// F6 decoded garble frac
for(const snr of [6,7.1,9,10.7,11.9]){let bad=0,n=0;for(let e=0;e<50;e++){const o=decoded('STARS CLEAR',snr,e);for(let i=0;i<o.length;i++)if(o[i]!==' '){n++;if(o[i]!=='STARS CLEAR'[i])bad++;}}console.log('snr',snr,'junk frac',(bad/n).toFixed(2),'formula',((12-snr)/12).toFixed(2));}
// F10
const r3=read(JOBS[2],S({rod:'r3',shunt:part('C',3.3e-6)}));console.log('r3 snr',r3.snr,'level',r3.level,'ant',r3.antenna);
// F11
for(const d of [10,12,14]){const v=judge(JOBS[0],S({cartDistance:d,rerouted:true,shunt:part('C',1e-6)}));console.log('j1 d',d,'1uF+rr tier',v.tier,v.notes[0]);const b=cheapest(JOBS[0],{cartDistance:d});console.log('  cheapest',b?.hint,b?.cost);}
// F5 messages
console.log(judge(JOBS[2],S({rod:'r150',shunt:part('C',3.3e-6)})).problems[0]);
// F1 limits
console.log('limit cost',Math.ceil(JOBS.reduce((n,j)=>n+(cheapest(j,{cartDistance:CART_SAFE})?.cost??0),0)*1.25));
// job3 with 3.3u single
console.log('j3 3u3 r75', JSON.stringify(judge(JOBS[2],S({shunt:part('C',3.3e-6)}))));

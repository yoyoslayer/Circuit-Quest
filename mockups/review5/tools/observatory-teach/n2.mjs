import * as L from './logic.mjs';
const {JOBS,CART_SAFE,read,judge,part,VALUES,valueText,gain,dB,latchVolts}=L;
const S=(s)=>({rerouted:false,cartDistance:CART_SAFE,rod:'r75',vertical:true,...s});
for(const v of VALUES.C){const r=read(JOBS[1],S({shunt:part('C',v)}));const j=judge(JOBS[1],S({shunt:part('C',v)}));if(j.tier>0)console.log('j2 shunt',valueText(part('C',v)),'snr',r.snr,'lvl',r.level.toFixed(2),'tier',j.tier,j.notes[0]);}
// R series + C shunt that holds latch & decodes? 
for(const rv of VALUES.R)for(const cv of VALUES.C){const s=S({series:part('R',rv),shunt:part('C',cv)});const j=judge(JOBS[1],s);if(j.tier>0)console.log('j2 RC',rv,valueText(part('C',cv)),'tier',j.tier,'latch',latchVolts(s));}
// series L + shunt R?
let n=0;for(const lv of VALUES.L)for(const rv of VALUES.R){const s=S({series:part('L',lv),shunt:part('R',rv)});const j=judge(JOBS[1],s);if(j.tier>0)n++;}console.log('L+R tier>0',n);
// job 1 sequence: tier counts for single shunt C at d=6.55 rerouted / not
for(const rr of [false,true])for(const v of VALUES.C){const j=judge(JOBS[0],S({shunt:part('C',v),rerouted:rr,cartDistance:6.55}));if(j.tier>0)console.log('j1 d6.55 rr',rr,valueText(part('C',v)),'tier',j.tier,j.snr);}
// job1 with cart not moved (1.42) 
for(const rr of [false,true])for(const v of VALUES.C){const j=judge(JOBS[0],S({shunt:part('C',v),rerouted:rr,cartDistance:1.42}));if(j.tier>0)console.log('j1 near rr',rr,valueText(part('C',v)),'tier',j.tier,j.snr);}

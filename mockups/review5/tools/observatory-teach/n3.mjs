import * as L from './logic.mjs';
const {gain,dB,part,read,JOBS,CART_SAFE,hz}=L;
const S=(s)=>({rerouted:false,cartDistance:CART_SAFE,rod:'r75',vertical:true,...s});
for(const [l,c] of [[1e-3,1.5e-6],[1e-2,1.5e-7],[1e-2,1e-7],[4.7e-3,3.3e-7],[2.2e-2,6.8e-8],[1e-2,2.2e-7]]){const f={series:part('L',l),shunt:part('C',c)};let mx=0,fm=0;for(let x=200;x<5e4;x*=1.01){const g=gain(f,x);if(g>mx){mx=g;fm=x;}}
 console.log(l,c,'g4k dB',dB(gain(f,4000)).toFixed(1),'peak',dB(mx).toFixed(1),'@',hz(fm),'snr',read(JOBS[1],S(f)).snr);}

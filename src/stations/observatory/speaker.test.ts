import {describe,expect,it} from 'vitest';
import {holdLevel} from './speaker';

/** An AudioParam driven only by setTargetAtTime, following the Web Audio timeline rules: events run in
 *  time order, each starts from the value the one before reached, and cancel drops events at or after t. */
function param(){
  let ev:{t:number;v:number;tau:number}[]=[];
  return {
    cancelScheduledValues(t:number){ev=ev.filter(e=>e.t<t);return this as unknown as AudioParam;},
    setTargetAtTime(v:number,t:number,tau:number){ev.push({t,v,tau});ev.sort((a,b)=>a.t-b.t);return this as unknown as AudioParam;},
    at(time:number){let v=0;const on=ev.filter(e=>e.t<=time);
      on.forEach((e,i)=>{const end=Math.min(time,on[i+1]?.t??time);v=e.v+(v-e.v)*Math.exp(-(end-e.t)/e.tau);});return v;},
  };
}
const HOLD=.3,FRAME=1/60;

describe('decoder speaker level',()=>{
  it('stays up while frames keep coming, without dipping between them',()=>{
    const p=param();for(let t=0;t<1;t+=FRAME)holdLevel(p,true,t,HOLD);
    let low=1;for(let t=.3;t<1;t+=.002)low=Math.min(low,p.at(t));expect(low).toBeGreaterThan(.99);
  });
  it('falls silent by itself once the frames stop (a pause): no later call is needed',()=>{
    const p=param();let t=0;for(;t<1;t+=FRAME)holdLevel(p,true,t,HOLD);
    expect(p.at(t+HOLD+.3)).toBeLessThan(.01);
  });
  it('goes quiet at once on a frame that is not live (muted, or Pip left the bench)',()=>{
    const p=param();let t=0;for(;t<1;t+=FRAME)holdLevel(p,true,t,HOLD);holdLevel(p,false,t,HOLD);
    expect(p.at(t+.25)).toBeLessThan(.01);
  });
});

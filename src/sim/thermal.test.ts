import {describe,expect,it} from 'vitest';
import {thermalStep,tripSeconds,THERMAL_TRIP} from './thermal';

const run=(amps:number,seconds:number)=>{let heat=0;for(let t=0;t<seconds;t+=1/60)heat=thermalStep(heat,amps,5,1/60);return heat;};
describe('thermal breaker (Big Meeting strip)',()=>{
  it('5.5 A on a 5 A strip has not tripped after 1 s and has by 3 s',()=>{
    expect(run(5.5,1)).toBeLessThan(THERMAL_TRIP);expect(run(5.5,3)).toBeGreaterThanOrEqual(THERMAL_TRIP);
  });
  it('never trips at or under the limit, and cools back down',()=>{
    expect(run(5,60)).toBe(0);expect(run(4.5,60)).toBe(0);
    let heat=.4;for(let i=0;i<120;i++)heat=thermalStep(heat,3,5,1/60);expect(heat).toBe(0);
  });
  it('a bigger overload trips sooner',()=>{
    expect(tripSeconds(5.5,5)).toBeGreaterThan(2);expect(tripSeconds(7.5,5)).toBeLessThan(.5);expect(tripSeconds(16,5)).toBe(0);expect(tripSeconds(4,5)).toBe(Infinity);
  });
});

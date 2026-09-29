import {describe,expect,it} from 'vitest';
import {JOBS,RACK,RATINGS,HOUSE,read,judge,best,reliable,heatAt,failTime,type Setup} from './logic';

const job=(id:string)=>JOBS.find(j=>j.id===id)!;
const series=(r:number,rating:.125|.25|1=.125,extra:Partial<Setup>={}):Setup=>({series:{r,rating},reversed:false,...extra});

describe('arcade circuit rules',()=>{
  it('a series resistor sets the LED current: I = (V − V_f) ÷ R',()=>{
    const r=read(job('bumper'),series(150));
    expect(r.iLoad).toBeCloseTo(3/151,6);expect(r.vLoad).toBe(2);expect(r.vR).toBeCloseTo(r.i*150,9);
    expect(r.pR).toBeCloseTo(r.i*r.i*150,9);expect(r.tripped).toBe(false);
  });
  it('an LED in backwards stays dark: no current flows',()=>{
    const r=read(job('rhythm'),series(22,.125,{reversed:true}));
    expect(r.i).toBe(0);expect(r.lit).toBe(false);expect(r.vLoad).toBe(3.3);
    expect(judge(job('rhythm'),series(22,.125,{reversed:true})).problems[0]).toMatch(/backwards/);
  });
  it('a resistor across the LED does not limit it: with nothing in series the fuse trips',()=>{
    const j=job('bumper'),s:Setup={parallel:{r:150,rating:.125},reversed:false},r=read(j,s);
    expect(r.tripped).toBe(true);expect(r.iLoad).toBeGreaterThan(1);
    expect(judge(j,s).problems[0]).toMatch(/limits nothing/);
    // With a series resistor as well, the parallel one just steals current and wastes power.
    const both=read(j,series(150,.125,{parallel:{r:150,rating:.125}})),alone=read(j,series(150));
    expect(both.iLoad).toBeLessThan(alone.iLoad);expect(both.i).toBeCloseTo(alone.i,9);expect(both.pP).toBeGreaterThan(0);
    expect(judge(j,series(150,.125,{parallel:{r:1000,rating:.125}})).tier).toBeLessThan(3);
  });
  it('a small resistor across the LED pulls the node under V_f and the LED goes out',()=>{
    const r=read(job('bumper'),series(2200,.125,{parallel:{r:47,rating:.125}}));
    expect(r.iLoad).toBe(0);expect(r.vLoad).toBeLessThan(2);
  });
  it('with no resistor at all the fuse trips on every channel',()=>{
    for(const j of JOBS)expect(read(j,{reversed:false}).tripped,j.id).toBe(true);
  });
  it('too much LED current fails, and too little is dark',()=>{
    expect(judge(job('bumper'),series(100)).problems[0]).toMatch(/over the LED/);
    // (5 − 2) ÷ 2201 Ω = 1.4 mA: too dim to count as lit.
    expect(judge(job('bumper'),series(2200)).problems[0]).toMatch(/Too dim/);
    expect(judge(job('bumper'),series(330)).tier).toBe(1); // lit, but under the band
  });
  it('power in the resistor matters: 680 Ω on 12 V needs more than ⅛ W',()=>{
    const j=job('claw'),v=judge(j,series(680,.125));
    expect(read(j,series(680)).pR).toBeGreaterThan(.125);expect(v.tier).toBe(0);expect(v.problems[0]).toMatch(/scorches/);
    // 820 Ω on ⅛ W works but runs at 95 % of its rating; ¼ W has margin; 1 W works but costs more.
    expect(judge(j,series(820,.125)).tier).toBe(1);expect(judge(j,series(820,.25)).tier).toBe(3);expect(judge(j,series(820,1)).tier).toBe(2);
  });
  it('a battery lasts longer with less current',()=>{
    const j=job('handheld'),a=read(j,series(470)).lifeH!,b=read(j,series(1200)).lifeH!;
    expect(b).toBeGreaterThan(a*2);expect(b).toBeCloseTo(HOUSE.battery/((7/1201)*1000),6);
  });
  it('a logic pin driving a transistor base needs a resistor, and enough base current for the motor',()=>{
    const j=job('hopper');
    expect(judge(j,series(1000)).tier).toBe(3);
    expect(judge(j,series(2200)).problems[0]).toMatch(/half on/);
    expect(judge(j,series(47)).problems[0]).toMatch(/pin/);
    expect(judge(j,series(1200)).tier).toBe(1);
  });
  it('every job has a reliable answer and a single elegant one',()=>{
    const want:{[id:string]:[number,number]}={bumper:[220,.125],rhythm:[22,.125],claw:[820,.25],handheld:[1200,.125],hopper:[1000,.125]};
    for(const j of JOBS){
      expect(reliable(j).length,j.id).toBeGreaterThan(0);
      const b=best(j)!;expect([b.r,b.rating],j.id).toEqual(want[j.id]);
      expect(judge(j,{series:b,reversed:false}).tier,j.id).toBe(3);
      // The elegant answer is the only tier-3 option on the rack.
      let n=0;for(const r of RACK)for(const rating of RATINGS)if(judge(j,series(r,rating)).tier===3)n++;
      expect(n,j.id).toBe(1);
    }
  });
  it('every job starts broken',()=>{
    for(const j of JOBS)expect(judge(j,j.start).tier,j.id).toBeLessThan(2);
  });
  it('heat ramps toward its steady value and fails only when the steady value is over the limit',()=>{
    expect(heatAt(1,0)).toBe(0);expect(heatAt(1,100)).toBeCloseTo(1,6);
    expect(failTime(.9)).toBe(Infinity);expect(failTime(3)).toBeLessThan(failTime(1.2));
    expect(heatAt(2,failTime(2))).toBeCloseTo(1,6);
  });
});

import {describe,expect,it} from 'vitest';
import {JOBS,HOUSE,BLOCK_RATING,read,judge,best,reliable,chainR,positionR,blockHeat,starZone,rushJob,heatAt,failTime,type Setup,type Chain,type Block} from './logic';
import {rng} from '../../render/textures';

const job=(id:string)=>JOBS.find(j=>j.id===id)!;
const chain=(...ps:Block[][]):Chain=>[...ps,...[[],[],[]]].slice(0,3) as Chain;
const s=(c:Chain,extra:Partial<Setup>={}):Setup=>({chain:c,reversed:false,...extra});

describe('blocks in a chain',()=>{
  it('end to end they add; side by side they share the current and come out smaller than either',()=>{
    expect(chainR(chain([100],[220]))).toBe(320);
    expect(positionR([47,47])).toBeCloseTo(23.5,9);expect(positionR([100,220])).toBeLessThan(100);
    expect(chainR(chain([470],[100,100],[]))).toBeCloseTo(520,9);
  });
  it('a side-by-side pair splits the current inversely to resistance, so the smaller block runs hotter',()=>{
    const [a,b]=blockHeat(chain([100,220]),.02);
    expect(a.p).toBeGreaterThan(b.p);expect(a.p+b.p).toBeCloseTo(.02*.02*positionR([100,220]),9);
    // Two equal blocks each take a quarter of what one alone would at the same current.
    const [x]=blockHeat(chain([47,47]),.05),[y]=blockHeat(chain([47]),.05);expect(x.p).toBeCloseTo(y.p/4,9);
  });
});

describe('arcade circuit rules',()=>{
  it('the chain sets the LED current: I = (V − V_f) ÷ R',()=>{
    const r=read(job('bumper'),s(chain([220])));
    expect(r.iLoad).toBeCloseTo(3/221,6);expect(r.vLoad).toBe(2);expect(r.vR).toBeCloseTo(r.i*220,9);expect(r.tripped).toBe(false);
  });
  it('an LED in backwards stays dark, and the verdict says why without naming the fix',()=>{
    const v=judge(job('rhythm'),s(chain([47,47]),{reversed:true}));
    expect(v.tier).toBe(0);expect(v.problems[0]).toMatch(/backwards/);expect(v.problems[0]).not.toMatch(/FLIP|Flip/);
  });
  it('a block across the LED limits nothing: with an empty chain the fuse trips',()=>{
    const j=job('bumper'),r=read(j,j.start);expect(r.tripped).toBe(true);
    expect(judge(j,j.start).problems[0]).toMatch(/limits nothing/);
    // With a chain as well, the block across just steals current.
    expect(read(j,s(chain([220]),{across:470})).iLoad).toBeLessThan(read(j,s(chain([220]))).iLoad);
    expect(judge(j,s(chain([220]),{across:470})).tier).toBeLessThan(3);
  });
  it('with no resistor at all the fuse trips on every channel',()=>{for(const j of JOBS)expect(read(j,s(chain())).tripped,j.id).toBe(true);});
  it('3.3 V blue: no single block works, two small ones side by side do',()=>{
    const j=job('rhythm');
    for(const b of [47,100,220,470] as Block[])expect(judge(j,s(chain([b]))).tier,String(b)).toBeLessThan(2);
    expect(judge(j,s(chain([47,47]))).tier).toBe(3);
  });
  it('power matters: a small block on 12 V scorches; sharing the heat keeps blocks cool',()=>{
    const v=judge(job('claw'),job('claw').start);expect(v.tier).toBe(0);
    const r=read(job('claw'),s(chain([220])));expect(r.iLoad).toBeGreaterThan(.02);
    // 47 Ω alone on the claw: way over the LED's rating.
    expect(judge(job('claw'),s(chain([47]))).problems[0]).toMatch(/fuse tripped/);
    expect(judge(job('claw'),s(chain([100]))).problems[0]).toMatch(/over the LED/);
    // A 3.3 V channel at 25 mA through a single 47 Ω block is fine, but heat is reported per block.
    expect(read(job('claw'),s(chain([470],[470]))).rHeat).toBeLessThan(HOUSE.margin);
    expect(BLOCK_RATING).toBe(.25);
  });
  it('too dim is dark; under the band only works',()=>{
    expect(judge(job('rhythm'),s(chain([470]))).problems[0]).toMatch(/Too dim/);
    expect(judge(job('bumper'),s(chain([220],[47]))).tier).toBe(1);
  });
  it('the ★ zone (lowest third of the band) is elegant; above it is reliable',()=>{
    const j=job('bumper');expect(starZone(j)[1]).toBeCloseTo(.012+.008/3,9);
    expect(judge(j,s(chain([220]))).tier).toBe(3);expect(judge(j,s(chain([100],[100]))).tier).toBe(2);
  });
  it('a battery lasts longer with less current',()=>{
    const j=job('handheld'),a=read(j,s(chain([470]))).lifeH!,b=read(j,s(chain([470],[470]))).lifeH!;expect(b).toBeGreaterThan(a*1.9);
  });
  it('a logic pin driving a transistor base needs enough base current for the motor',()=>{
    const j=job('hopper');
    expect(judge(j,s(chain([470],[470],[470]))).tier).toBe(1);
    expect(judge(j,s(chain([47]))).problems[0]).toMatch(/pin/);
    expect(judge(j,s(chain([470],[220],[100]))).tier).toBe(3);
  });
  it('every job has an elegant chain, and every starting state is broken',()=>{
    for(const j of JOBS){expect(best(j),j.id).toBeDefined();expect(reliable(j).length,j.id).toBeGreaterThan(0);expect(judge(j,j.start).tier,j.id).toBeLessThan(2);}
  });
  it('thermal ramps: a part at 150 % of its rating fails after a couple of seconds, one at 90 % never does',()=>{
    expect(failTime(1.5)).toBeGreaterThan(1);expect(failTime(.9)).toBe(Infinity);expect(heatAt(1,HOUSE.tau)).toBeCloseTo(1-Math.exp(-1),9);
  });
});

describe('arcade rush cabinets',()=>{
  it('are always fixable elegantly from the bins, and start broken',()=>{
    const r=rng(11);for(let i=0;i<120;i++){const j=rushJob(r,i),fix=best(j);expect(fix,j.ask).toBeDefined();
      expect(judge(j,s(fix!)).tier).toBe(3);expect(judge(j,j.start).tier,`${j.ask} ${JSON.stringify(j.start)}`).toBeLessThan(2);}
  });
});

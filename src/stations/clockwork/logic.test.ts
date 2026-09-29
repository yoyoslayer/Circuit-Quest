import {describe,expect,it} from 'vitest';
import {JOBS,SOURCES,DIVIDERS,judge,run,worstError,cheapest,solutions,dividerError,bestDivider,freqError,cookError,type Setup} from './logic';

const job=(id:string)=>JOBS.find(j=>j.id===id)!;
const setup=(s:Partial<Setup>):Setup=>({divider:8000,clear:false,...s});

describe('clockwork kitchen rules',()=>{
  it('every job has a reliable answer, and the solver names the elegant one',()=>{
    for(const j of JOBS)expect(cheapest(j),j.id).toBeDefined();
    expect(cheapest(job('eggs'))!.setup.source).toBe('rc');
    expect(cheapest(job('oven'))!.setup).toMatchObject({source:'xtal12',divider:12000});
    expect(cheapest(job('pastry'))!.setup).toMatchObject({source:'res8',divider:8000,clear:true});
  });
  it('no clock selected: the timer never ticks',()=>{
    const v=judge(job('eggs'),setup({}));expect(v.tier).toBe(0);expect(v.problems[0]).toMatch(/No clock/);
    expect(run(job('eggs'),setup({})).every(t=>t.doneness==='raw')).toBe(true);
  });
  it('the internal RC is enough for the egg timer; a crystal there works but is not elegant',()=>{
    expect(judge(job('eggs'),setup({source:'rc'})).tier).toBe(3);
    const x=judge(job('eggs'),setup({source:'xtal12',divider:12000}));expect(x.tier).toBe(2);expect(x.notes[0]).toMatch(/cheaper/);
  });
  it('the divider must turn the source into a 1 kHz tick',()=>{
    expect(dividerError(SOURCES.rc,8000)).toBe(0);expect(dividerError(SOURCES.xtal12,12000)).toBe(0);
    // A 12 MHz crystal left on ÷8000 ticks 1.5 kHz: the cook is a third short, trays raw.
    const v=judge(job('oven'),setup({source:'xtal12',divider:8000}));expect(v.tier).toBe(0);expect(v.trays[0].doneness).toBe('raw');expect(v.problems[0]).toMatch(/÷12000/);
    // An 8 MHz source on ÷16000 ticks at 500 Hz: the cook doubles, trays burn.
    expect(run(job('eggs'),setup({source:'rc',divider:16000}))[0].doneness).toBe('burnt');
  });
  it('integer division: a watch crystal is accurate but cannot make exactly 1 kHz',()=>{
    expect(bestDivider(SOURCES.watch)).toBe(32);expect(dividerError(SOURCES.watch,32)).toBeCloseTo(.024,3);
    for(const j of JOBS)expect(judge(j,setup({source:'watch',divider:32})).tier,j.id).toBe(0);
    expect(judge(job('eggs'),setup({source:'watch',divider:32})).problems[0]).toMatch(/no whole-number divider/);
  });
  it('error accumulates: fraction × cook time',()=>{
    const t=run(job('oven'),setup({source:'rc'}))[2];expect(t.seconds-600).toBeCloseTo(600*t.error,6);
    // RC at 70 °C runs about 1 % slow, so a 10-minute bake runs about 6 s long.
    expect(t.seconds-600).toBeGreaterThan(5);expect(t.doneness).toBe('burnt');
  });
  it('the RC drifts as the oven warms it: fine at first, tray 3 burns (the pastry replay)',()=>{
    const trays=run(job('pastry'),setup({source:'rc'}));expect(trays.map(t=>t.doneness)).toEqual(['golden','golden','burnt']);
    expect(judge(job('pastry'),setup({source:'rc'})).problems[0]).toMatch(/Tray 3/);
    expect(freqError(SOURCES.rc,70)).toBeLessThan(freqError(SOURCES.rc,35));
  });
  it('a resonator on this unit bakes the oven job but is not guaranteed over temperature',()=>{
    const v=judge(job('oven'),setup({source:'res8'}));expect(v.tier).toBe(1);expect(v.worst).toBeGreaterThan(job('oven').tol);
  });
  it('an external clock line past the running mixer picks up extra counts; routing it clear fixes it',()=>{
    const near=judge(job('pastry'),setup({source:'res8'}));expect(near.tier).toBe(0);expect(near.problems.join()).toMatch(/mixer/);
    expect(cookError(job('pastry'),setup({source:'res8'}),0)).toBeLessThan(-.01);
    expect(judge(job('pastry'),setup({source:'res8',clear:true})).tier).toBe(3);
    // The internal RC has no external clock line, so routing does not matter for it.
    expect(cookError(job('pastry'),setup({source:'rc'}),0)).toBe(0);
    expect(judge(job('pastry'),setup({source:'xtal12',divider:12000,clear:true})).tier).toBe(2);
  });
  it('worst case includes the whole tolerance and temperature range',()=>{
    expect(worstError(job('eggs'),setup({source:'rc'}))).toBeCloseTo(.0132,3);
    expect(worstError(job('oven'),setup({source:'xtal12',divider:12000}))).toBeLessThan(1e-4);
    expect(solutions(job('oven')).filter(s=>s.tier>=2).every(s=>s.setup.source==='xtal12')).toBe(true);
    expect(DIVIDERS).toContain(8000);
  });
});

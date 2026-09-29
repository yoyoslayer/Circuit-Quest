import {describe,it,expect} from 'vitest';
import {JOBS,DEVICES,RAILS,SOURCE,BREAKER,N,best,clone,evaluate,judge,probe,readings,solve,clampE,type Layout} from './logic';

const job1=JOBS[0],job2=JOBS[1],job3=JOBS[2];
const withE=(l:Layout,e:number)=>({...clone(l),e});

describe('depot circuit',()=>{
  it('solves a single closed loop by Ohm\'s law',()=>{
    const l:Layout={...clone(job1.start),ret:'heavy'},r=readings(l);
    const loop=SOURCE.rInt+.001+RAILS.heavy.r+.001+DEVICES.lamp.r+RAILS.heavy.r;
    expect(r.current).toBeCloseTo(12/loop,5);
    expect(r.devices[0].v).toBeCloseTo(12/loop*DEVICES.lamp.r,4);
  });
  it('an open gap has the full voltage across it and no current',()=>{
    const l=clone(job1.start),r=readings(l);
    expect(r.current).toBeCloseTo(0,6);expect(r.devices[0].i).toBeCloseTo(0,6);
    expect(probe(l,r,'return').v).toBeCloseTo(12,4);expect(probe(l,r,'return').i).toBe(0);
    // The lamp itself has nothing across it: its far side floats up to the top rail.
    expect(r.devices[0].v).toBeCloseTo(0,4);
  });
  it('charge is not used up: the current into a device equals the current out, and the source current comes back',()=>{
    const l:Layout={e:13.2,on:true,feed:'heavy',ret:'heavy',bays:[{device:'lamp',barrier:false},{device:'heater',barrier:true},{device:'motor',barrier:false}]},s=solve(l);
    expect(s.i.bar1).toBeCloseTo(s.i.dev1!,6);expect(s.i.bar3).toBeCloseTo(s.i.dev3!,6);
    expect(s.i.ret).toBeCloseTo(s.i.int!,6);expect(s.i.feed).toBeCloseTo(s.i.int!,6);
    expect(s.i.int).toBeCloseTo(s.i.dev1!+s.i.dev3!,6);
  });
  it('power balances: E·I equals the heat in every resistance',()=>{
    const l:Layout={e:14,on:true,feed:'thin',ret:'heavy',bays:[{device:'lamp',barrier:false},{device:'heater',barrier:false},{device:'motor',barrier:true}]},r=readings(l),v=r.sol.v;
    const heat=(a:number,b:number,R:number)=>(v[a]-v[b])**2/R;
    let sum=heat(N.EMF,N.TERM,SOURCE.rInt)+heat(N.T0,N.T[0],RAILS.thin.r)+heat(N.B[0],N.B0,RAILS.heavy.r);
    for(const d of r.devices)sum+=d.p;
    sum+=heat(N.TERM,N.T0,.001)+heat(N.T[0],N.D[0],.001)+heat(N.T[1],N.D[1],.001)+heat(N.T[0],N.T[1],.02)+heat(N.T[1],N.T[2],.02)+heat(N.B[1],N.B[0],.02)+heat(N.B[2],N.B[1],.02);
    expect(r.pSource).toBeCloseTo(sum,2);
  });
  it('the breaker trips on a short, and the short carries most of the surge',()=>{
    const ev=evaluate(job3.start);expect(ev.trip).toBe(true);
    expect(ev.surge!.current).toBeGreaterThan(20);
    const jumper=ev.surge!.devices.find(d=>d.kind==='jumper')!;expect(jumper.i/ev.surge!.current).toBeGreaterThan(.95);
    expect(ev.now.current).toBeCloseTo(0,6);
    expect(judge(job3,job3.start).problems[0]).toMatch(/Bay 2's crossover rail/);
  });
  it('switching on the motor with the heater still running trips the 4 A breaker',()=>{
    const l=clone(job2.start);l.bays[2].barrier=false;l.feed='heavy';l.e=13.2;
    const ev=evaluate(l);expect(ev.trip).toBe(true);expect(ev.surge!.current).toBeGreaterThan(BREAKER);
  });
});

describe('depot grades',()=>{
  it('job 1: the gap is explained, a thin rail sags the lamp, a heavy rail and a tuned source is elegant',()=>{
    expect(judge(job1,job1.start).problems[0]).toMatch(/return rail has a gap: 12 V across it/);
    const thin={...clone(job1.start),ret:'thin' as const};
    const v0=judge(job1,thin);expect(v0.tier).toBe(0);expect(v0.problems[0]).toMatch(/under its 11.5–12.5 V band/);
    expect(judge(job1,withE(thin,12.8)).tier).toBe(2);
    const heavy={...clone(job1.start),ret:'heavy' as const};
    expect(judge(job1,heavy).tier).toBe(2);expect(judge(job1,heavy).notes[0]).toMatch(/aim for 12 V/);
    expect(judge(job1,withE(heavy,12.4)).tier).toBe(3);
    // Too much source: the lamp is over its band.
    expect(judge(job1,withE(heavy,13.5)).problems[0]).toMatch(/over its/);
  });
  it('job 2: heater off, motor on; the thin feed works but runs hot; the heavy feed is elegant',()=>{
    const l=clone(job2.start);l.bays[1].barrier=true;l.bays[2].barrier=false;
    expect(judge(job2,l).tier).toBe(0);
    const thin=withE(l,14.3);expect(judge(job2,thin).tier).toBe(1);expect(judge(job2,thin).notes[0]).toMatch(/thin rail's 1.2 A rating/);
    const heavy={...withE(l,13.2),feed:'heavy' as const};expect(judge(job2,heavy).tier).toBe(3);
    // Leaving the heater on (and the motor blocked) never passes: the motor gets nothing.
    expect(judge(job2,{...clone(job2.start),feed:'heavy'}).problems.join(' ')).toMatch(/barrier blocks the motor/);
  });
  it('job 3: clearing the crossover rail and tuning the source is elegant',()=>{
    const l=clone(job3.start);l.bays[1].device=null;
    expect(judge(job3,l).tier).toBe(0);expect(judge(job3,withE(l,13.2)).tier).toBe(3);
  });
  it('the solver finds a clean, elegant answer for every job on the knob grid',()=>{
    for(const j of JOBS){const b=best(j);expect(judge(j,b.layout).tier,j.id).toBe(3);expect(clampE(b.layout.e)).toBeCloseTo(b.layout.e,9);
      expect(b.layout.feed).toBe('heavy');expect(b.layout.ret).toBe('heavy');}
    expect(best(job2).layout.bays[1].barrier).toBe(true);
  });
  it('the breaker off means no current and a plain explanation',()=>{
    const l={...clone(job1.start),ret:'heavy' as const,on:false};
    expect(readings(l).current).toBeCloseTo(0,6);expect(judge(job1,l).problems[0]).toMatch(/breaker is off/);
  });
});

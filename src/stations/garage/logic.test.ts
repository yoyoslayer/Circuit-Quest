import {describe,expect,it} from 'vitest';
import {JOBS,MOTOR,RUNNING,STALL,SPEC,SWITCH,PARTS,judge,shutdown,startDip,startTrace,flyChain,shorted,fewestParts,cheapest,allSetups,reliable,partCount,
  type Setup,type Fit} from './logic';

const job=(id:string)=>JOBS.find(j=>j.id===id)!;
const f=(part:Fit['part'],flipped=false):Fit=>({part,flipped});
const S=(s:Partial<Setup>={}):Setup=>({star:false,...s});
const diode=S({fly1:f('diode')}),dz=S({fly1:f('diode'),fly2:f('zener',true)}),tvs=S({switch:f('tvs')});

describe('robot garage: the shutdown kick',()=>{
  it('with no path, the coil drives the switch into breakdown (far past its abs max)',()=>{
    const t=shutdown(S());expect(t.avalanche).toBe(true);expect(t.peak).toBeGreaterThan(SWITCH.absMax);expect(t.peak).toBeGreaterThan(SWITCH.avalanche);
    expect(judge(job('kickback'),S()).fault).toBe('stop');
  });
  it('a flyback diode clamps the node about one diode drop above the supply',()=>{
    const t=shutdown(diode);expect(t.peak).toBeGreaterThan(MOTOR.V);expect(t.peak).toBeLessThan(MOTOR.V+1.5);expect(t.avalanche).toBe(false);
  });
  it('the diode decay matches the closed form: τ·ln((I0 + Vx/R)/(0.1·I0 + Vx/R)), Vx = E + Vf',()=>{
    const tau=MOTOR.L/MOTOR.R,vx=(MOTOR.emf+PARTS.diode.vf!)/MOTOR.R,expected=tau*Math.log((RUNNING+vx)/(SPEC.offFraction*RUNNING+vx));
    expect(shutdown(diode).offTime!).toBeCloseTo(expected,4);
  });
  it('a higher clamp empties the coil faster, at the price of a taller (still safe) spike',()=>{
    const d=shutdown(diode),z=shutdown(dz),t=shutdown(tvs);
    expect(z.offTime!).toBeLessThan(d.offTime!/3);expect(t.offTime!).toBeLessThan(d.offTime!/3);
    expect(z.peak).toBeGreaterThan(d.peak);expect(z.peak).toBeLessThan(SPEC.spikeReliable);expect(t.peak).toBeLessThan(SPEC.spikeReliable);
    // The diode + zener clamp sits at V + Vf + Vz.
    expect(z.peak).toBeCloseTo(MOTOR.V+PARTS.diode.vf!+PARTS.zener.vbr!,0);
  });
  it('a zener only clamps high in breakdown: fitted the diode way round it acts like a plain diode',()=>{
    expect(flyChain(S({fly1:f('diode'),fly2:f('zener')}))!.fwd).toBeCloseTo(1.4,6);
    expect(judge(job('stopline'),S({fly1:f('diode'),fly2:f('zener')})).fault).toBe('slow');
  });
  it('a backwards diode (or a lone zener in breakdown direction) is a dead short while the motor runs',()=>{
    expect(shorted(S({fly1:f('diode',true)}))).toBe(true);expect(shorted(S({fly1:f('zener',true)}))).toBe(true);
    expect(shorted(dz)).toBe(false);expect(judge(job('kickback'),S({fly1:f('diode',true)})).fault).toBe('short');
  });
  it('a backwards TVS across the switch conducts forwards: the motor never stops',()=>{
    const t=shutdown(S({switch:f('tvs',true)}));expect(t.offTime).toBeNull();expect(judge(job('kickback'),S({switch:f('tvs',true)})).fault).toBe('stuck');
  });
  it('the RC snubber and the bulk capacitor alone do not stop the reset (truthful guardrails)',()=>{
    expect(judge(job('kickback'),S({switch:f('snubber')})).fault).toBe('stop');
    const c=judge(job('kickback'),S({ctrl:f('cap')}));expect(c.fault).toBe('stop');expect(c.problems[0]).toMatch(/no path/);
    // The capacitor changes nothing at the switch node.
    expect(shutdown(S({ctrl:f('cap')})).peak).toBeCloseTo(shutdown(S()).peak,6);
  });
});

describe('robot garage: the start surge',()=>{
  it('the stall current through a shared ground wire sags the controller supply (I·R)',()=>{
    expect(startDip(job('kickback'),S())).toBeCloseTo(STALL*job('kickback').shared,6);
    expect(startDip(job('cargo'),S())).toBeGreaterThan(SPEC.dipReset);
  });
  it('a capacitor at the controller rides through part of it, but not a millisecond surge; a star ground fixes it',()=>{
    const bare=startDip(job('cargo'),S()),cap=startDip(job('cargo'),S({ctrl:f('cap')})),star=startDip(job('cargo'),S({star:true}));
    expect(cap).toBeLessThan(bare);expect(cap).toBeGreaterThan(SPEC.dipReset);expect(star).toBeLessThan(SPEC.dipReliable);
    expect(judge(job('cargo'),{...dz,ctrl:f('cap')}).fault).toBe('start');
    const t=startTrace(job('cargo'),S());expect(Math.min(...t)).toBeCloseTo(5-bare,6);
  });
  it('a reversed electrolytic is refused',()=>{expect(judge(job('cargo'),{...dz,ctrl:f('cap',true),star:true}).fault).toBe('cap');});
});

describe('robot garage: jobs and grades',()=>{
  it('job 1: a flyback diode alone is the elegant fix',()=>{
    const v=judge(job('kickback'),diode);expect(v.tier).toBe(3);expect(fewestParts(job('kickback'))).toBe(1);
  });
  it('job 2: the plain diode is too slow for the stop line; diode + zener meets it reliably',()=>{
    expect(judge(job('stopline'),diode).fault).toBe('slow');
    const v=judge(job('stopline'),dz);expect(v.tier).toBeGreaterThanOrEqual(2);expect(v.offTime!).toBeLessThan(job('stopline').stopSpec!);
    // One part (a TVS across the switch) also meets it: fewest parts is elegant.
    expect(judge(job('stopline'),tvs).tier).toBe(3);expect(v.tier).toBe(2);
  });
  it('job 3: the shared ground resets the controller at start; a star ground (no extra part) fixes it',()=>{
    expect(judge(job('cargo'),dz).fault).toBe('start');expect(judge(job('cargo'),{...dz,star:true}).tier).toBe(2);expect(judge(job('cargo'),{...tvs,star:true}).tier).toBe(3);
  });
  it('the solver: every job is solvable, the fewest-parts answer really is fewest, and the cheapest answer is reliable',()=>{
    const all=allSetups();expect(all.length).toBeGreaterThan(200);
    for(const j of JOBS){const n=fewestParts(j);expect(n).toBe(1);expect(all.some(s=>partCount(s)<n&&reliable(j,s))).toBe(false);
      const c=cheapest(j)!;expect(c).toBeDefined();expect(reliable(j,c.setup)).toBe(true);expect(judge(j,c.setup).tier).toBeGreaterThanOrEqual(2);}
    expect(cheapest(job('kickback'))!.cost).toBe(PARTS.diode.cost);
  });
});

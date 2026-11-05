import {describe,expect,it} from 'vitest';
import {JOBS,MOTOR,BRAKE,RUNNING,STALL,SPEC,SWITCH,PARTS,SCOPE_TEXT,judge,shutdown,startDip,startTrace,flyChain,shorted,fewestParts,cheapest,allSetups,reliable,partCount,orientation,coilRunning,
  type Setup,type Fit} from './logic';

const job=(id:string)=>JOBS.find(j=>j.id===id)!;
const f=(part:Fit['part'],flipped=false):Fit=>({part,flipped});
const S=(s:Partial<Setup>={}):Setup=>({star:false,...s});
const diode=S({fly:f('diode')}),dz=S({fly:f('clamp')}),tvs=S({switch:f('tvs')});
/** Anything that reads as naming the fix. */
const GIVES_FIX=/flyback diode across|Flip|flip it|backwards part|reset the FUSE|star ground|own ground wire|reroute|zener in breakdown|TVS\)/;

describe('robot garage: the shutdown kick',()=>{
  it('with no path, the coil drives the switch into breakdown (far past its abs max)',()=>{
    const t=shutdown(S());expect(t.avalanche).toBe(true);expect(t.peak).toBeGreaterThan(SWITCH.absMax);expect(t.peak).toBeGreaterThan(SWITCH.avalanche);
    expect(t.path).toBe('none');expect(judge(job('kickback'),S()).fault).toBe('stop');
  });
  it('a flyback diode clamps the node about one diode drop above the supply, and carries the current round the motor',()=>{
    const t=shutdown(diode);expect(t.peak).toBeGreaterThan(MOTOR.V);expect(t.peak).toBeLessThan(MOTOR.V+1.5);expect(t.avalanche).toBe(false);expect(t.path).toBe('fly');
  });
  it('the diode decay matches the closed form: τ·ln((I0 + Vx/R)/(0.1·I0 + Vx/R)), Vx = E + Vf',()=>{
    const tau=MOTOR.L/MOTOR.R,vx=(MOTOR.emf+PARTS.diode.vf!)/MOTOR.R,expected=tau*Math.log((RUNNING+vx)/(SPEC.offFraction*RUNNING+vx));
    expect(shutdown(diode).offTime!).toBeCloseTo(expected,4);
  });
  it('a higher clamp empties the coil faster, at the price of a taller (still safe) spike',()=>{
    const d=shutdown(diode),z=shutdown(dz),t=shutdown(tvs);
    expect(z.offTime!).toBeLessThan(d.offTime!/3);expect(t.offTime!).toBeLessThan(d.offTime!/3);
    expect(z.peak).toBeGreaterThan(d.peak);expect(z.peak).toBeLessThan(SPEC.spikeReliable);expect(t.peak).toBeLessThan(SPEC.spikeReliable);
    // The clamp (a diode and a 24 V zener back to back) sits at V + Vf + Vz.
    expect(z.peak).toBeCloseTo(MOTOR.V+PARTS.clamp.vf!,0);expect(PARTS.clamp.vf!).toBeCloseTo(24.7,6);
    expect(t.path).toBe('switch');
  });
  it('a clamp fitted backwards never conducts at either voltage: no short, but no path for the kick either',()=>{
    const back=S({fly:f('clamp',true)});expect(flyChain(back)!.fwd).toBeGreaterThan(SWITCH.avalanche);
    expect(shorted(back)).toBe(false);expect(judge(job('kickback'),back).fault).toBe('stop');
  });
  it('a backwards diode is a dead short while the motor runs',()=>{
    expect(shorted(S({fly:f('diode',true)}))).toBe(true);
    expect(shorted(dz)).toBe(false);expect(judge(job('kickback'),S({fly:f('diode',true)})).fault).toBe('short');
  });
  it('failure messages and the scope say why, never which part to fit',()=>{
    const setups=[S(),S({fly:f('diode',true)}),S({switch:f('tvs',true)}),S({ctrl:f('cap',true)}),S({switch:f('diode')}),S({fly:f('clamp',true)}),diode,S({fly:f('tvs')})];
    const all=setups.flatMap(s=>JOBS.flatMap(j=>judge(j,s).problems));
    for(const m of [...all,...Object.values(SCOPE_TEXT)])expect(m).not.toMatch(GIVES_FIX);
  });
  it('a backwards TVS across the switch conducts forwards: the motor never stops, and its current runs through the switch path',()=>{
    const t=shutdown(S({switch:f('tvs',true)}));expect(t.offTime).toBeNull();expect(judge(job('kickback'),S({switch:f('tvs',true)})).fault).toBe('stuck');
    // With a diode across the motor too, the node sits at 0.7 V: the diode is reverse-biased, the TVS carries it all.
    expect(shutdown(S({fly:f('diode'),switch:f('tvs',true)})).path).toBe('switch');
  });
  it('the RC snubber and the bulk capacitor alone do not stop the reset (truthful guardrails)',()=>{
    expect(judge(job('kickback'),S({switch:f('snubber')})).fault).toBe('stop');
    expect(judge(job('kickback'),S({fly:f('snubber')})).fault).toBe('stop');
    const c=judge(job('kickback'),S({ctrl:f('cap')}));expect(c.fault).toBe('stop');expect(c.problems[0]).toMatch(/no path/);
    // The capacitor changes nothing at the switch node.
    expect(shutdown(S({ctrl:f('cap')})).peak).toBeCloseTo(shutdown(S()).peak,6);
  });
});

describe('robot garage: where the part goes is a real choice',()=>{
  it('a diode across the switch, band at the node, never conducts as the node rises: still no path',()=>{
    const v=judge(job('kickback'),S({switch:f('diode')}));expect(v.fault).toBe('stop');expect(v.problems[0]).toMatch(/no path/);
  });
  it('turned round, the diode across the switch conducts forwards: the switch can never turn the motor off',()=>{
    expect(judge(job('kickback'),S({switch:f('diode',true)})).fault).toBe('stuck');expect(shorted(S({switch:f('diode',true)}))).toBe(false);
  });
  it('a unidirectional TVS across the motor is a plain diode one way round and a dead short the other',()=>{
    expect(judge(job('stopline'),S({fly:f('tvs')})).fault).toBe('slow');expect(judge(job('kickback'),S({fly:f('tvs')})).tier).toBe(3);
    expect(judge(job('kickback'),S({fly:f('tvs',true)})).fault).toBe('short');
  });
  it('the zener clamp turned round across the switch clamps the node near 25 V: another real fix',()=>{
    const v=judge(job('kickback'),S({switch:f('clamp',true)}));expect(v.tier).toBe(3);expect(v.spike).toBeGreaterThan(24);expect(v.spike).toBeLessThan(27);
    expect(judge(job('kickback'),S({switch:f('clamp')})).fault).toBe('stop');
  });
  it('the panel names the orientation physically',()=>{
    expect(orientation('fly',f('diode'))).toBe('band → +12 V');expect(orientation('fly',f('diode',true))).toBe('band → node');
    expect(orientation('switch',f('tvs'))).toBe('band → node');expect(orientation('switch',f('tvs',true))).toBe('band → ground');
    expect(orientation('ctrl',f('cap'))).toBe('+ → 5 V');expect(orientation('switch',f('snubber'))).toBe('');
  });
});

describe('robot garage: the brake coil (job 2)',()=>{
  const j=job('stopline'),spec=j.stopSpec!;
  it('the brake coil decays by the same closed form, much more slowly than it would with a high clamp',()=>{
    const tau=BRAKE.L/BRAKE.R,i0=coilRunning(BRAKE),vx=PARTS.diode.vf!/BRAKE.R,expected=tau*Math.log((i0+vx)/(SPEC.offFraction*i0+vx));
    expect(shutdown(diode,BRAKE).offTime!).toBeCloseTo(expected,4);
  });
  it('the plain diode misses the 2 ms grab; the clamp and the TVS meet it with margin (true ≥ 3× ratio)',()=>{
    const d=shutdown(diode,BRAKE).offTime!,c=shutdown(dz,BRAKE).offTime!,t=shutdown(tvs,BRAKE).offTime!;
    expect(d).toBeGreaterThan(spec);expect(spec).toBeGreaterThan(1.25*c);expect(c).toBeLessThan(.8*spec);expect(t).toBeLessThan(.8*spec);
    expect(d/c).toBeGreaterThanOrEqual(3);
    expect(judge(j,diode).fault).toBe('slow');expect(judge(j,diode).problems[0]).toMatch(/grabbed late/);
  });
});

describe('robot garage: the start surge',()=>{
  it('the stall current through a shared ground wire sags the controller supply (I·R)',()=>{
    expect(startDip(job('kickback'),S())).toBeCloseTo(STALL*job('kickback').shared,6);
    expect(startDip(job('cargo'),S())).toBeGreaterThan(SPEC.dipReset);
  });
  it('a capacitor at the controller barely dents an 80 ms spin-up surge; a star ground fixes it',()=>{
    const bare=startDip(job('cargo'),S()),cap=startDip(job('cargo'),S({ctrl:f('cap')})),star=startDip(job('cargo'),S({star:true}));
    expect(MOTOR.spinUp).toBeGreaterThanOrEqual(50e-3);
    expect(cap).toBeLessThan(bare);expect(cap).toBeGreaterThan(.9*bare);expect(cap).toBeGreaterThan(SPEC.dipReset);expect(star).toBeLessThan(SPEC.dipReliable);
    expect(judge(job('cargo'),{...dz,ctrl:f('cap')}).fault).toBe('start');
    const t=startTrace(job('cargo'),S());expect(Math.min(...t)).toBeCloseTo(5-bare,6);
  });
  it('a reversed electrolytic is refused',()=>{expect(judge(job('cargo'),{...dz,ctrl:f('cap',true),star:true}).fault).toBe('cap');});
});

describe('robot garage: jobs and grades',()=>{
  it('job 1: a flyback diode alone is the elegant fix',()=>{
    const v=judge(job('kickback'),diode);expect(v.tier).toBe(3);expect(fewestParts(job('kickback'))).toBe(1);
  });
  it('job 2: the plain diode is too slow for the brake; the zener clamp or a TVS meets it',()=>{
    const j=job('stopline');expect(judge(j,diode).fault).toBe('slow');
    const v=judge(j,dz);expect(v.tier).toBe(3);expect(v.offTime!).toBeLessThan(j.stopSpec!);
    expect(judge(j,tvs).tier).toBe(3);
    // Two parts where one does is reliable, not elegant.
    expect(judge(j,{...dz,switch:f('tvs')}).tier).toBe(2);
  });
  it('job 3 starts from a bare board: it needs a path for the kick AND its own ground for the controller',()=>{
    const j=job('cargo');expect(judge(j,S()).fault).toBe('stop');expect(judge(j,diode).fault).toBe('start');expect(judge(j,S({star:true})).fault).toBe('stop');
    expect(judge(j,{...diode,star:true}).tier).toBe(3);expect(judge(j,{...tvs,star:true}).tier).toBe(3);
  });
  it('the solver: every job is solvable, the fewest-parts answer really is fewest, and the cheapest answer is reliable',()=>{
    const all=allSetups();expect(all.length).toBe(51*3*2);
    for(const j of JOBS){const n=fewestParts(j);expect(n).toBe(1);expect(all.some(s=>partCount(s)<n&&reliable(j,s))).toBe(false);
      const c=cheapest(j)!;expect(c).toBeDefined();expect(reliable(j,c.setup)).toBe(true);expect(judge(j,c.setup).tier).toBeGreaterThanOrEqual(2);}
    expect(cheapest(job('kickback'))!.cost).toBe(PARTS.diode.cost);expect(cheapest(job('stopline'))!.cost).toBe(PARTS.clamp.cost);
  });
});

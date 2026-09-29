import {describe,expect,it} from 'vitest';
import {JOBS,MODULES,CIRCUIT,CART_SAFE,impedance,transfer,gain,dB,latchVolts,read,judge,solutions,cheapest,stepResponse,
  quarterWave,wavelength,antennaFactor,morse,decoded,type Setup} from './logic';

const job=(id:string)=>JOBS.find(j=>j.id===id)!;
const setup=(s:Partial<Setup>={}):Setup=>({rerouted:false,cartDistance:CART_SAFE,rod:'r75',vertical:true,...s});
const mag=(z:{re:number;im:number})=>Math.hypot(z.re,z.im);

describe('observatory circuit rules',()=>{
  it('an inductor\'s reactance grows with frequency, but steady DC only sees its winding resistance',()=>{
    const L=MODULES.L10m;
    expect(mag(impedance(L,10_000))).toBeGreaterThan(mag(impedance(L,1_000))*9);
    expect(mag(impedance(L,0))).toBe(L.dcr);
    // A capacitor is the other way round: open at DC, smaller impedance as f rises.
    expect(mag(impedance(MODULES.C1u,10_000))).toBeLessThan(mag(impedance(MODULES.C1u,1_000)));
  });
  it('a plain cable is a divider of the source and load resistances',()=>{
    expect(mag(transfer({},700))).toBeCloseTo(CIRCUIT.rl/(CIRCUIT.rs+CIRCUIT.rl),6);
    expect(gain({},9000)).toBeCloseTo(1,6);
  });
  it('the latch voltage: a series L keeps DC, a series R divides it, a series C blocks it',()=>{
    expect(latchVolts({series:'L10m',shunt:'C1u'})).toBeGreaterThanOrEqual(CIRCUIT.latchMin);
    expect(latchVolts({series:'R470',shunt:'C1u'})).toBeLessThan(CIRCUIT.latchMin);
    expect(latchVolts({series:'C10u'})).toBe(0);
    expect(latchVolts({shunt:'L10m'})).toBeLessThan(CIRCUIT.latchMin); // the coil shorts DC to ground
  });
  it('an LC low-pass passes the 700 Hz tone and cuts 9 kHz motor noise by more than 25 dB',()=>{
    const lc={series:'L10m',shunt:'C1u'} as const;
    expect(gain(lc,700)).toBeGreaterThan(.9);expect(dB(gain(lc,9000))).toBeLessThan(-25);
  });
  it('on switch-on, the series inductor\'s current ramps up with no jump, then carries steady DC',()=>{
    const s=stepResponse({series:'L10m',shunt:'C1u'}),end=s[s.length-1],steady=CIRCUIT.bias/(CIRCUIT.rs+CIRCUIT.rl+MODULES.L10m.dcr!);
    const peak=Math.max(...s.map(p=>p.i));expect(s[0].i).toBe(0);expect(s[1].i).toBeLessThan(peak*.2); // it can't jump: it ramps (and rings as the C charges)
    expect(end.i).toBeCloseTo(steady,3);expect(end.v).toBeCloseTo(latchVolts({series:'L10m',shunt:'C1u'}),1);
  });
  it('through a series capacitor the current jumps, then dies away: no steady DC',()=>{
    const s=stepResponse({series:'C1u'});
    expect(s[0].i).toBeGreaterThan(.015);expect(s[s.length-1].i).toBeLessThan(s[0].i*.05);expect(s[s.length-1].v).toBeLessThan(1);
  });
  it('every job has a reliable solution once the cart is moved away',()=>{
    for(const j of JOBS)expect(cheapest(j,{cartDistance:CART_SAFE}),j.id).toBeDefined();
  });
  it('job 1: motor noise buries the message until the cart moves and the line is filtered',()=>{
    const j=job('garble');
    expect(judge(j,setup({cartDistance:1})).tier).toBe(0);
    expect(judge(j,setup({cartDistance:9})).tier).toBe(0); // distance alone isn't enough
    expect(judge(j,setup({shunt:'C1u'})).tier).toBe(1);       // decodes, thin margin
    expect(judge(j,setup({shunt:'C1u',rerouted:true})).tier).toBe(3);
    const lc=judge(j,setup({series:'L10m',shunt:'C1u',rerouted:true}));expect(lc.tier).toBe(2);expect(lc.notes.join()).toMatch(/leaner filter/);
    expect(judge(j,setup({series:'C1u'})).problems.join()).toMatch(/high-pass/);
  });
  it('job 2: the latch drops out on an RC or series-C filter; the LC low-pass keeps it and the decode',()=>{
    const j=job('latch');
    expect(judge(j,setup({series:'R470',shunt:'C1u'})).problems.join()).toMatch(/latch dropped out.*470/);
    expect(judge(j,setup({series:'C1u'})).problems.join()).toMatch(/no steady DC/);
    expect(judge(j,setup({shunt:'C1u'})).tier).toBe(0);
    expect(judge(j,setup({shunt:'C10u'})).problems.join()).toMatch(/cuts the message too/);
    expect(judge(j,setup({series:'L10m',shunt:'C1u'})).tier).toBe(3);
    expect(solutions(j,{cartDistance:CART_SAFE}).every(s=>s.setup.series==='L10m'&&s.setup.shunt==='C1u')).toBe(true);
  });
  it('job 3: quarter-wave whips from c = fλ, and polarisation matters',()=>{
    expect(wavelength(100e6)).toBeCloseTo(3,1);expect(quarterWave(100e6)).toBeCloseTo(.75,2);expect(quarterWave(2.4e9)*100).toBeCloseTo(3.1,1);
    expect(antennaFactor('r75',true,100e6)).toBeGreaterThan(.95);expect(antennaFactor('r75',false,100e6)).toBeLessThan(.11);
    expect(antennaFactor('r3',true,100e6)).toBeLessThan(.01);
    const j=job('beacon'),lc={series:'L10m',shunt:'C1u'} as const;
    expect(judge(j,setup({...lc,rod:'r3'})).problems.join()).toMatch(/quarter wave/);
    expect(judge(j,setup({...lc,rod:'r75',vertical:false})).problems.join()).toMatch(/vertically polarised/);
    expect(judge(j,setup({...lc,rod:'r75'})).tier).toBe(3);
  });
  it('reads the scope spectrum: the filter shrinks the noise tones, not the signal',()=>{
    const r=read(job('garble'),setup({shunt:'C1u',rerouted:true}));
    expect(r.tones[0].signal).toBe(true);expect(r.tones[0].after).toBeGreaterThan(.9);
    for(const t of r.tones.slice(1))expect(t.after).toBeLessThan(t.before);
  });
  it('morse timing and the decoder readout',()=>{
    const m=morse('ET');expect(m.marks).toEqual([[0,1],[4,3]]);
    expect(decoded('CQ DE PIP',30,1)).toBe('CQ DE PIP');
    expect(decoded('CQ DE PIP',-10,1)).not.toBe('CQ DE PIP');
  });
});

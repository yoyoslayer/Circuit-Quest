import {describe,expect,it} from 'vitest';
import {JOBS,BANDS,BAND_IDS,LOSS,SPOTS,PADS,HATCH,TX,C_LIGHT,frequency,read,judge,bestRoute,solutions,leanest,legHits,crossing,lambdaText,freqText,
  type Setup,type Band} from './logic';

const job=(id:string)=>JOBS.find(j=>j.id===id)!;
const setup=(band:Band,s:Partial<Setup>={}):Setup=>({band,detector:BANDS[band].detector,power:1,hatchOpen:false,mirrors:[],pod:null,...s});

describe('spectrum delivery rules',()=>{
  it('every band obeys c = f λ, and the ribbon compresses as the frequency rises',()=>{
    for(const b of BAND_IDS)expect(frequency(b)*BANDS[b].lambda).toBeCloseTo(C_LIGHT,0);
    expect(BANDS.radio.lambda).toBeCloseTo(3,1);expect(BANDS.micro.lambda).toBeCloseTo(.125,3);
    const order=BAND_IDS.map(b=>frequency(b));expect([...order].sort((a,b)=>a-b)).toEqual(order);
    const cycles=BAND_IDS.map(b=>BANDS[b].cycles);expect([...cycles].sort((a,b)=>a-b)).toEqual(cycles);
    expect(lambdaText('radio')).toBe('3 m');expect(freqText('micro')).toBe('2.4 GHz');expect(lambdaText('nir')).toBe('850 nm');
  });
  it('materials treat bands differently: brick passes radio, glass stops thermal IR, metal stops all, mesh stops radio',()=>{
    expect(LOSS.brick.radio).toBeLessThan(LOSS.brick.micro);expect(LOSS.brick.vis).toBe(Infinity);
    expect(LOSS.glass.vis).toBeLessThan(3);expect(LOSS.glass.nir).toBeLessThan(3);expect(LOSS.glass.thermal).toBe(Infinity);
    for(const b of BAND_IDS)expect(LOSS.metal[b]).toBe(Infinity);
    expect(LOSS.mesh.radio).toBe(Infinity);expect(LOSS.mesh.micro).toBe(Infinity);expect(LOSS.mesh.vis).toBeLessThan(5);
    // Smoke scatters short wavelengths hardest.
    expect(LOSS.smoke.vis).toBeGreaterThan(LOSS.smoke.nir);expect(LOSS.smoke.nir).toBeGreaterThan(LOSS.smoke.thermal);
    // A 30 cm hatch is far below half of radio's 3 m wavelength: no radio through it.
    expect(LOSS.hatch.radio).toBe(Infinity);expect(LOSS.hatch.vis).toBe(0);
  });
  it('segment geometry: crossings, and mirror A lines up with the hatch and the lab pad',()=>{
    expect(crossing({x:0,z:0},{x:2,z:0},{x:1,z:-1},{x:1,z:1})).toBeCloseTo(.5);
    expect(crossing({x:0,z:0},{x:2,z:0},{x:3,z:-1},{x:3,z:1})).toBeUndefined();
    const hits=legHits(SPOTS.A,PADS.lab,'nir',true).map(h=>h.mat);expect(hits).toEqual(['hatch','glass']);
    const at=legHits(SPOTS.A,PADS.lab,'nir',true)[0].at;expect(at.x).toBeGreaterThan(HATCH.x0);expect(at.x).toBeLessThan(HATCH.x1);
    // The direct line to the lab hits the metal shutter, not the hatch.
    expect(legHits(TX,PADS.lab,'nir',true)[0].mat).toBe('metal');
  });
  it('a detector only responds to its own band',()=>{
    const v=judge(job('store'),setup('radio',{detector:'visdiode',pod:'store'}));
    expect(v.tier).toBe(0);expect(v.problems[0]).toContain('only responds');
  });
  it('job 1: light stops at the brick wall; radio gets through at 1 mW; microwave needs more power',()=>{
    const j=job('store');
    let v=judge(j,setup('vis',{pod:'store',power:100}));expect(v.tier).toBe(0);expect(v.problems[0]).toMatch(/^Brick wall/);
    expect(judge(j,setup('radio',{pod:'store'})).tier).toBe(3);
    v=judge(j,setup('micro',{pod:'store'}));expect(v.tier).toBe(1);
    v=judge(j,setup('micro',{pod:'store',power:10}));expect(v.tier).toBe(2);expect(v.notes[0]).toContain('Radio 100 MHz at 1 mW');
    // Radio at more power than needed is reliable but not elegant.
    expect(judge(j,setup('radio',{pod:'store',power:10})).tier).toBe(2);
    // The pod has to be on the storeroom pad.
    expect(judge(j,setup('radio',{pod:null})).problems[0]).toContain('pod');
  });
  it('job 2: metal stops everything until the hatch opens and a mirror turns the beam through it',()=>{
    const j=job('lab');
    expect(read(j,setup('radio',{pod:'lab',hatchOpen:true,power:100})).route.blocked?.mat).toBe('metal');
    expect(read(j,setup('nir',{pod:'lab',mirrors:['A']})).route.blocked?.mat).toBe('metal'); // hatch still shut
    let r=read(j,setup('nir',{pod:'lab',hatchOpen:true,mirrors:['A']}));expect(r.route.blocked).toBeUndefined();expect(r.route.spots).toEqual(['A']);
    expect(judge(j,setup('nir',{pod:'lab',hatchOpen:true,mirrors:['A']})).tier).toBe(3);
    // Thermal IR gets through the hatch but the glass behind it absorbs 10 µm.
    const t=judge(j,setup('thermal',{pod:'lab',hatchOpen:true,mirrors:['A'],power:100}));expect(t.tier).toBe(0);expect(t.problems[0]).toContain('absorbs 10 µm');
    // Sunlight swamps the green photodiode: it works, but not reliably at 1 mW.
    expect(judge(j,setup('vis',{pod:'lab',hatchOpen:true,mirrors:['A']})).tier).toBe(1);
    expect(judge(j,setup('vis',{pod:'lab',hatchOpen:true,mirrors:['A'],power:10})).tier).toBe(2);
    // A mirror on the wrong mark does not help.
    r=read(j,setup('nir',{pod:'lab',hatchOpen:true,mirrors:['B']}));expect(r.margin).toBe(-Infinity);
  });
  it('job 3: the mesh cage stops radio and microwave, smoke eats visible light, thermal IR gets through both',()=>{
    const j=job('quiet');
    for(const b of ['radio','micro'] as Band[])expect(judge(j,setup(b,{pod:'quiet',power:100})).problems[0]).toMatch(/^Mesh cage/);
    expect(judge(j,setup('thermal',{pod:'quiet'})).tier).toBe(3);
    const v=judge(j,setup('vis',{pod:'quiet',power:10}));expect(v.tier).toBe(0);expect(v.problems[0]).toContain('Smoke scatters');
    // Near IR can dodge the smoke with a mirror, but only reliably at more power.
    expect(bestRoute(j,{band:'nir',power:10,hatchOpen:false,mirrors:['A']}).spots).toEqual(['A']);
    expect(judge(j,setup('nir',{pod:'quiet',power:10,mirrors:['A']})).tier).toBe(2);
  });
  it('the solver: every job is solvable, and the leanest answers are the intended ones',()=>{
    expect(leanest(job('store'))?.hint).toBe('Radio 100 MHz at 1 mW');
    expect(leanest(job('lab'))?.hint).toBe('Near IR 850 nm at 1 mW with 1 mirror');
    expect(leanest(job('quiet'))?.hint).toBe('Thermal IR 10 µm at 1 mW');
    for(const j of JOBS)expect(solutions(j).length).toBeGreaterThan(0);
    // The lab can only be reached with the hatch open.
    expect(solutions(job('lab')).every(s=>s.setup.hatchOpen)).toBe(true);
  });
});

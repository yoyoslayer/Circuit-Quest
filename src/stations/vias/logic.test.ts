import {describe,expect,it} from 'vitest';
import {SHIFT,judge,solutions,cheapest,kindOf,ring,type Build,type Order} from './logic';

const order=(id:string)=>SHIFT.find(o=>o.id===id)!;
const build=(b:Partial<Build>):Build=>({pressed:true,plated:true,count:1,...b});

describe('via counter rules',()=>{
  it('names via kinds by the layers they join',()=>{
    expect(kindOf(1,4)).toBe('through');expect(kindOf(3,2)).toBe('buried');expect(kindOf(1,2)).toBe('micro');expect(kindOf(1,3)).toBe('blind');
  });
  it('every order in the shift has a reliable solution',()=>{
    for(const o of SHIFT)expect(cheapest(o),o.id).toBeDefined();
  });
  it('a plain through via works; the cheapest reliable one is elegant',()=>{
    const lamp=order('lamp'),best=cheapest(lamp)!;
    expect(judge(lamp,best.build).tier).toBe(3);
    expect(judge(lamp,build({from:1,to:4,drilledPressed:true,drill:'mech-0.30',pad:.6,finish:'open'})).tier).toBe(3);
  });
  it('rejects unplated barrels and thin annular rings',()=>{
    const lamp=order('lamp');
    expect(judge(lamp,build({from:1,to:4,drilledPressed:true,drill:'mech-0.30',pad:.6,plated:false})).problems.join()).toMatch(/plating/);
    // 0.45 pad on a 0.30 hole leaves a 0.075 mm ring.
    expect(ring(build({drill:'mech-0.30',pad:.45}))).toBe(.075);
    expect(judge(lamp,build({from:1,to:4,drilledPressed:true,drill:'mech-0.30',pad:.45})).problems.join()).toMatch(/Annular ring/);
  });
  it('buried vias must be drilled before the stack is pressed',()=>{
    const router=order('router');
    const late=judge(router,build({from:2,to:3,drilledPressed:true,drill:'mech-0.20',pad:.6,finish:'tented'}));
    expect(late.tier).toBe(0);expect(late.problems.join()).toMatch(/before lamination/);
    expect(judge(router,build({from:2,to:3,drilledPressed:false,drill:'mech-0.20',pad:.6,finish:'tented'})).tier).toBeGreaterThan(0);
  });
  it('microvias need the laser; mechanical bits cannot stop between L1 and L2',()=>{
    const bga=order('bga');
    expect(judge(bga,build({from:1,to:2,drilledPressed:true,drill:'mech-0.20',pad:.45})).problems.join()).toMatch(/laser-drilled/);
    expect(judge(bga,build({from:1,to:2,drilledPressed:true,drill:'laser-0.10',pad:.3})).tier).toBe(3);
  });
  it('a laser cannot drill through the whole board',()=>{
    expect(judge(order('lamp'),build({from:1,to:4,drilledPressed:true,drill:'laser-0.10',pad:.3})).problems.join()).toMatch(/laser only/);
  });
  it('via-in-pad needs filled and capped; covered vias cannot be left open',()=>{
    const qfn=order('qfn');
    expect(judge(qfn,build({from:1,to:4,drilledPressed:true,drill:'mech-0.30',pad:.6,finish:'plugged'})).problems.join()).toMatch(/filled and plated over/);
    expect(judge(qfn,build({from:1,to:4,drilledPressed:true,drill:'mech-0.30',pad:.6,finish:'filled-capped'})).tier).toBe(3);
    expect(judge(order('router'),build({from:2,to:3,drill:'mech-0.20',pad:.6,finish:'open'})).problems.join()).toMatch(/heatsink or shield/);
  });
  it('stitching needs the whole row, and an unneeded fill is reliable but not elegant',()=>{
    const stitch=order('stitch');
    expect(judge(stitch,build({from:1,to:4,drilledPressed:true,drill:'mech-0.30',pad:.6,finish:'tented',count:3})).problems.join()).toMatch(/6 stitching vias/);
    const fancy=judge(stitch,build({from:1,to:4,drilledPressed:true,drill:'mech-0.30',pad:.6,finish:'filled-capped',count:6}));
    expect(fancy.tier).toBe(2);expect(fancy.notes.join()).toMatch(/leaner process/);
    expect(judge(stitch,build({from:1,to:4,drilledPressed:true,drill:'mech-0.30',pad:.6,finish:'tented',count:6})).tier).toBe(3);
  });
  it('a narrow ring or deep hole works but is not reliable',()=>{
    // 0.45 pad on a 0.20 hole is a 0.125 ring (reliable); 0.30 pad on 0.10 laser is 0.10 (works on a micro).
    const lamp:Order=order('lamp');
    const v=judge(lamp,build({from:1,to:4,drilledPressed:true,drill:'mech-0.20',pad:.45}));
    expect(v.tier).toBe(2);
    expect(solutions(lamp).every(s=>s.build.pressed)).toBe(true);
  });
});

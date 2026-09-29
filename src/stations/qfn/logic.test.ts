import {describe,expect,it} from 'vitest';
import {BOARDS,REFERENCE,blank,check,cost,erase,footprint,partOf,pinCells,placeProblem,ratsnest,strokeNet,stepProblem,traceProblem,turn,viaProblem,netAt,type Design,type XY} from './logic';

const board=(id:string)=>BOARDS.find(b=>b.id===id)!;
const ref=(id:string):Design=>structuredClone(REFERENCE[id]);

describe('QFN layout rules',()=>{
  it('turns footprints in quarter steps',()=>{
    expect(turn([1,0],1)).toEqual([0,1]);expect(turn([1,0],2)).toEqual([-1,0]);expect(turn([1,0],3)).toEqual([0,-1]);
    const b=board('sensor'),j1=partOf(b,'J1');
    // Mouth down on the bottom edge: pin 1 on the left.
    expect(pinCells(j1,{at:[3,8],rot:3}).map(p=>p.cells[0])).toEqual([[2,8],[3,8],[4,8]]);
  });
  it('every board starts scrambled but legal: on the board, no overlaps, nothing routed',()=>{
    for(const b of BOARDS){const d=blank(b),r=check(b,d);
      for(const p of b.parts)expect(footprint(p,d.place[p.id]).every(([x,y])=>x>=0&&y>=0&&x<b.w&&y<b.h),`${b.id} ${p.id}`).toBe(true);
      expect(r.problems.some(p=>/overlap|hangs off/.test(p)),b.id).toBe(false);
      expect(r.tier).toBe(0);expect(r.nets.every(n=>!n.done)).toBe(true);
      expect(ratsnest(b,d).length).toBeGreaterThan(0);}
  });
  it('the explicit reference route for every board is legal, reliable and exactly par',()=>{
    for(const b of BOARDS){const d=ref(b.id),r=check(b,d);
      expect(r.problems,b.id).toEqual([]);expect(r.tier,`${b.id}: ${r.notes.join(' ')}`).toBe(3);expect(cost(d),b.id).toBe(b.par);
      expect(ratsnest(b,d)).toEqual([]);
      // Every track in it could have been drawn with the pen (built up in order).
      const built:Design={place:d.place,traces:[],vias:[]};
      for(const t of d.traces){for(const v of d.vias)if(!built.vias.some(x=>x.at===v.at)&&(netAt(b,built,1,v.at)||netAt(b,built,2,v.at)))if(!viaProblem(b,built,v.at).why)built.vias.push(v);
        expect(traceProblem(b,built,t),`${b.id} ${t.net} ${JSON.stringify(t.cells)}`).toBeUndefined();built.traces.push(t);}
      for(const v of d.vias)if(!built.vias.some(x=>x.at===v.at)){expect(viaProblem(b,built,v.at).why).toBeUndefined();built.vias.push(v);}
      expect(check(b,built).tier).toBe(3);}
  });
  it('one copper layer: a track can\'t enter another net\'s cell, and layer 2 is locked',()=>{
    const b=board('sensor'),d=ref('sensor');d.traces=d.traces.filter(t=>t.net!=='SIG');
    expect(stepProblem(b,d,1,'SIG',[3,7])).toMatch(/GND copper.*short/);
    expect(strokeNet(b,d,2,[9,4]).why).toMatch(/one copper layer/);
    expect(viaProblem(b,d,[9,5]).why).toMatch(/second copper layer/);
    // No routing under the QFN body; NC pins can't be joined.
    expect(stepProblem(b,d,1,'SIG',[4,6])).toMatch(/QFN body/);
    expect(stepProblem(b,d,1,'SIG',[5,6])).toMatch(/NC/);
  });
  it('a connector must sit on an edge with its mouth facing out',()=>{
    const b=board('sensor'),d=ref('sensor');
    const r=check(b,{...d,place:{...d.place,J1:{at:[10,1],rot:1}},traces:[]});
    expect(r.problems.join()).toMatch(/J1 must sit on a board edge/);
  });
  it('moving a part onto another net\'s copper or another part is refused',()=>{
    const b=board('sensor'),d=ref('sensor');
    expect(placeProblem(b,d,'R1',{at:[2,5],rot:0})).toMatch(/short/);
    expect(placeProblem(b,d,'R1',{at:[2,4],rot:0})).toMatch(/sit on C1/);
    expect(placeProblem(b,d,'R1',{at:[12,3],rot:0})).toMatch(/hang off/);
    expect(placeProblem(b,d,'U1',{at:[6,5],rot:0})).toMatch(/fixed/);
    expect(placeProblem(b,d,'R1',{at:[10,5],rot:0})).toBeUndefined();
  });
  it('decoupling: a cap far from its pins still works, but is not reliable',()=>{
    const b=board('mcu'),d=ref('mcu');
    // Move C2 to the far corner and wire it into the supply rails there.
    d.traces=d.traces.filter(t=>!(t.cells.some(c=>c[0]===9&&c[1]===5)));
    d.place.C2={at:[11,7],rot:1};
    d.traces.push({layer:1,net:'GND',cells:[[3,4],[3,5],[3,6],[3,7],[4,7],[5,7],[6,7],[7,7],[8,7],[9,7],[10,7],[10,8],[11,8]]});
    d.traces.push({layer:1,net:'GND',cells:[[8,5],[9,5],[10,5],[10,6],[10,7]]});
    d.traces.push({layer:1,net:'VDD',cells:[[9,4],[10,4],[11,4],[11,5],[11,6],[11,7]]});
    const r=check(b,d);expect(r.problems).toEqual([]);expect(r.tier).toBe(1);
    expect(r.notes.join()).toMatch(/C2's loop .* cells/);
  });
  it('a cap on the rails but down by the connector is not decoupling',()=>{
    // Same rails, same nets: only the loop to the chip's pins gets longer.
    const b=board('sensor'),d=ref('sensor');d.place.C1={at:[2,7],rot:0};
    const r=check(b,d);expect(r.problems).toEqual([]);expect(r.tier).toBe(1);expect(r.loops[0].loop).toBe(10);
  });
  it('the thermal pad needs its vias, and they may sit inside the pad',()=>{
    const b=board('driver'),d=ref('driver');
    d.vias=d.vias.filter(v=>!(v.at[0]===6&&v.at[1]===5));
    let r=check(b,d);expect(r.tier).toBe(1);expect(r.thermal).toEqual({vias:3,need:4});expect(r.notes.join()).toMatch(/thermal via/);
    expect(viaProblem(b,d,[6,5]).net).toBe('GND');
    d.vias.push({at:[6,5],net:'GND'});r=check(b,d);expect(r.tier).toBe(3);
  });
  it('vias: not inside small pads, not beside another net\'s pad, not onto other copper',()=>{
    const b=board('driver'),d=ref('driver');
    expect(viaProblem(b,d,[9,3]).why).toMatch(/small pad/);
    expect(viaProblem(b,d,[0,3]).why).toMatch(/already plated holes/);
    expect(viaProblem(b,d,[2,2]).why).toMatch(/on a track/);
    // A via on the VIN track right beside a QFN pin breaks clearance.
    const t={...d,vias:[...d.vias,{at:[5,1] as XY,net:'VIN'}]};expect(check(b,t).problems.join()).toMatch(/too close to U1.12/);
    // GND is on layer 2 under this VIN track.
    expect(viaProblem(b,d,[11,3]).why).toMatch(/GND copper is on the other layer/);
  });
  it('without a via the crossing is a short; layer 2 passes under the chip',()=>{
    const b=board('driver'),d=ref('driver');
    expect(stepProblem(b,d,1,'GND',[11,3])).toMatch(/VIN copper.*via/);
    expect(stepProblem(b,d,2,'GND',[8,4])).toBeUndefined();
  });
  it('erasing a cell splits the track and removes a via there',()=>{
    const b=board('driver'),d=ref('driver');
    expect(erase(d,1,[7,1])).toBe(true);
    const r=check(b,d);expect(r.nets.find(n=>n.net==='VIN')!.done).toBe(false);
    expect(ratsnest(b,d).some(l=>l.net==='VIN')).toBe(true);
    expect(erase(d,2,[10,2])).toBe(true);expect(d.vias.some(v=>v.at[0]===10&&v.at[1]===2)).toBe(false);
    expect(erase(d,1,[12,8])).toBe(false);
  });
  it('a longer valid route is reliable but not elegant',()=>{
    const b=board('sensor'),d=ref('sensor');
    d.traces.push({layer:1,net:'SIG',cells:[[9,7],[10,7],[11,7],[11,8]]});
    const r=check(b,d);expect(r.tier).toBe(2);expect(r.notes.join()).toMatch(/par is/);
  });
});

import {it,expect} from 'vitest';
import {Circuit,heatRate,type Lead,type Load} from './electrical';
const lead=(id:string,from:string,to:string,rating=3):Lead=>({id,from,to,rating,closed:true,heat:0,dead:false});
const load=(id:string,steady:number,kick=0):Load=>({id,steady,kick,enabled:true,state:'off',started:0});
it('requires both outgoing and returning conductors',()=>{const c=new Circuit([{id:'s',limit:5,tripped:false}],[lead('a','s','lamp')],[load('lamp',1)]);c.tick(.1);expect(c.loads[0].state).toBe('on');c.leads[0].returnClosed=false;c.tick(.1);expect(c.loads[0].state).toBe('off');});
it('sums splitter branches and trips the shared breaker',()=>{const c=new Circuit([{id:'s',limit:5,tripped:false}],[lead('a','s','split',10),lead('b','split','oven'),lead('c','split','fridge')],[load('oven',3),load('fridge',3)]);c.tick(.1);expect(c.draw.get('a')).toBe(6);expect(c.sources[0].tripped).toBe(true);expect(c.loads.every(l=>l.state==='brownout')).toBe(true);});
it('scorches thin cable even when source allows the current',()=>{const c=new Circuit([{id:'s',limit:10,tripped:false}],[lead('a','s','oven')],[load('oven',4)]);for(let i=0;i<70;i++)c.tick(.1);expect(c.leads[0].dead).toBe(true);expect(c.loads[0].state).not.toBe('on');expect(c.events.some(e=>e.kind==='scorch')).toBe(true);});
it('lift kick trips unless a charged capacitor is at the load end',()=>{for(const atLoad of [false,true]){const l=load('lift',3,9);l.capacitor={atLoad,charge:12};const c=new Circuit([{id:'s',limit:5,tripped:false}],[lead('a','s','lift')],[l]);for(let i=0;i<20;i++)c.tick(.1);expect(c.sources[0].tripped).toBe(!atLoad);}});
it('shorts trip; drying and resetting restores power',()=>{const e=lead('a','s','lamp');e.wet=true;const c=new Circuit([{id:'s',limit:5,tripped:false}],[e],[load('lamp',1)]);c.tick(.1);expect(c.events[0].kind).toBe('short');e.wet=false;c.resetBreaker('s');c.tick(.1);expect(c.loads[0].state).toBe('on');});
it('conveyor then capped lift fits 5 bars, reverse order trips',()=>{for(const reverse of [false,true]){const conveyor=load('conveyor',1.5,3),lift=load('lift',3,9);lift.capacitor={atLoad:true,charge:12};const later=reverse?conveyor:lift;later.enabled=false;const c=new Circuit([{id:'s',limit:5,tripped:false}],[lead('a','s','conveyor'),lead('b','s','lift')],[conveyor,lift]);for(let i=0;i<20;i++)c.tick(.1);later.enabled=true;
  // Run well past the 1 s kick and the recharge that follows, with the level's trickle charge while the
  // lift runs (lunch-runtime.ts sets chargeRate the same way before each tick): one tick proves nothing.
  for(let i=0;i<40&&!c.sources[0].tripped;i++){lift.capacitor.chargeRate=lift.state==='on'?.4:1;c.tick(.1);}
  expect(c.sources[0].tripped).toBe(reverse);if(!reverse)expect([conveyor.state,lift.state]).toEqual(['on','on']);}});
it('a capacitor recharges between lift starts only from a live supply, not while its breaker is tripped',()=>{const lift=load('lift',3,9);lift.capacitor={atLoad:true,charge:12};const c=new Circuit([{id:'s',limit:5,tripped:false}],[lead('a','s','lift')],[lift]);
  const cycle=()=>{lift.enabled=true;for(let i=0;i<20;i++)c.tick(.1);lift.enabled=false;for(let i=0;i<3;i++)c.tick(.1);};
  cycle();cycle();cycle();expect(c.sources[0].tripped).toBe(true);
  const flat=lift.capacitor.charge;for(let i=0;i<50;i++)c.tick(.1);expect(lift.capacitor.charge).toBe(flat);
  c.resetBreaker('s');for(let i=0;i<150;i++)c.tick(.1);expect(lift.capacitor.charge).toBe(12);cycle();expect(c.sources[0].tripped).toBe(false);});
it('an inline capacitor helps only when the lift is fed through it',()=>{
  for(const through of [true,false]){const lift=load('lift',3,9);lift.capacitor={node:'cap',atLoad:false,charge:12};
    const leads=through?[lead('a','s','cap',10),lead('cap-lead','cap','lift',10)]:[lead('a','s','lift',10),lead('cap-lead','cap','lift',10)];
    const c=new Circuit([{id:'s',limit:5,tripped:false}],leads,[lift]);for(let i=0;i<20;i++)c.tick(.1);
    expect(lift.capacitor.atLoad).toBe(through);expect(c.sources[0].tripped).toBe(!through);}
});
it('cyclic splitter wiring terminates',()=>{const c=new Circuit([{id:'s',limit:5,tripped:false}],[lead('a','s','x'),lead('b','x','y'),lead('c','y','x')],[]);expect(()=>c.tick(.1)).not.toThrow();});
it('heating is I-squared: 4 bars on a 3-bar cable heats at about 0.33/s and scorches in about 6 s',()=>{
  expect(heatRate(4,3)).toBeCloseTo(.334,2);expect(heatRate(6,3)).toBeCloseTo(1.29,2);expect(heatRate(2,3)).toBeLessThan(0);
  const c=new Circuit([{id:'s',limit:10,tripped:false}],[lead('a','s','oven')],[load('oven',4)]);let t=0;while(!c.leads[0].dead&&t<20){c.tick(.1);t+=.1;}expect(t).toBeGreaterThan(5.5);expect(t).toBeLessThan(6.5);});
it('a capacitor charges only by drawing real current through its feed',()=>{
  const lift=load('lift',3,9);lift.enabled=false;lift.capacitor={node:'cap',atLoad:false,charge:0};
  const c=new Circuit([{id:'s',limit:5,tripped:false}],[lead('a','s','cap',10),lead('cap-lead','cap','lift',10)],[lift]);
  for(let i=0;i<10;i++)c.tick(.1);
  expect(lift.capacitor.charge).toBeCloseTo(1,5);expect(c.draw.get('s')).toBeCloseTo(1,5);expect(c.draw.get('a')).toBeCloseTo(1,5);expect(lift.capacitor.charging).toBe(true);
  // Unfed, it neither charges nor draws.
  c.leads[0].closed=false;c.tick(.1);expect(lift.capacitor.charge).toBeCloseTo(1,5);expect(c.draw.get('s')??0).toBe(0);
  // Full, it stops drawing.
  c.leads[0].closed=true;for(let i=0;i<200;i++)c.tick(.1);expect(lift.capacitor.charge).toBe(12);expect(c.draw.get('s')??0).toBe(0);expect(lift.capacitor.charging).toBe(false);});
it('conveyor running, then the capped lift: the 0.4-bar recharge after the kick stays under 5',()=>{
  const conveyor=load('conveyor',1.5,3),lift=load('lift',3,9);lift.enabled=false;lift.capacitor={node:'cap',atLoad:false,charge:12,chargeRate:.4};
  const c=new Circuit([{id:'s',limit:5,tripped:false}],[lead('a','s','conveyor'),lead('b','s','cap',10),lead('cap-lead','cap','lift',10)],[conveyor,lift]);
  for(let i=0;i<20;i++)c.tick(.1);lift.enabled=true;let peak=0;
  for(let i=0;i<60;i++){c.tick(.1);peak=Math.max(peak,c.draw.get('s')??0);}
  expect(c.sources[0].tripped).toBe(false);expect(peak).toBeLessThanOrEqual(4.9+1e-9);expect(lift.capacitor.charge).toBeLessThan(12);expect(lift.capacitor.charge).toBeGreaterThan(6);});
it('a short browns out every load its supply fed, whatever order the leads are in (sim-2)',()=>{
  for(const wetFirst of [true,false]){const wet=lead('w','s','split',10);wet.wet=true;const rest=[lead('b','split','conveyor'),lead('c','s','lift')];
    const c=new Circuit([{id:'s',limit:5,tripped:false}],wetFirst?[wet,...rest]:[...rest,wet],[load('conveyor',1.5,3),load('lift',3,9)]);c.tick(.1);
    expect(c.sources[0].tripped).toBe(true);expect(c.events.filter(e=>e.kind==='short')).toHaveLength(1);
    expect(c.loads.map(l=>l.state)).toEqual(['brownout','brownout']);expect(c.draw.get('s')??0).toBe(0);}
});
it('a supply that shorts does not claim a node another live supply feeds',()=>{
  const wet=lead('w','a','split',10);wet.wet=true;
  const c=new Circuit([{id:'a',limit:5,tripped:false},{id:'b',limit:5,tripped:false}],[wet,lead('x','b','split',10),lead('y','split','fridge')],[load('fridge',2)]);c.tick(.1);
  expect(c.sources.map(s=>s.tripped)).toEqual([true,false]);expect(c.loads[0].state).toBe('on');expect(c.draw.get('b')).toBe(2);
});

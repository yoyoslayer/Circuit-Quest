import {expect,it} from 'vitest';
import type RAPIER from '@dimforge/rapier3d-compat';
// The render modules read location.search at load; give node a blank one before importing them.
(globalThis as {location?:unknown}).location??={search:''};
const {levels}=await import('./index'),{lobby,doorSlots,doorApproach,walksInto,workshopSpot}=await import('./lobby'),{clutter}=await import('./clutter');
const {prefabs}=await import('../props/prefabs');

// The hub puts job i at slot i (src/hub/lobby.ts), and Pip uses a door from its approach point.
const doors=levels.map((_,i)=>doorApproach(doorSlots(lobby.width,lobby.depth)[i]));
const ends=(lobby.clutter?.lanes??[]).flatMap(l=>[l.points[0],l.points[l.points.length-1]]);

it('every lobby door approach is the end of a clutter keep-out lane',()=>{
  for(const d of doors)expect(ends.some(([x,z])=>Math.hypot(x-d.x,z-d.z)<1e-6),`door at ${d.x},${d.z}`).toBe(true);
});
it('no clutter lands in front of a door, wherever Pip spawns',()=>{
  // No fixtures: the lane test does not depend on them (the game also drops props that hit a wall or desk).
  const world={forEachCollider:()=>{}} as unknown as RAPIER.World;
  for(const spawn of [lobby.spawn,...doors]){
    const out=clutter(world,{...lobby,spawn,npcs:lobby.npcs??[]},lobby.clutter!);expect(out.length).toBeGreaterThan(40);
    for(const d of doors)for(const p of out)expect(Math.hypot(p.x-d.x,p.z-d.z),`${p.kind} at ${p.x},${p.z} by door ${d.x},${d.z}`).toBeGreaterThan(1.9);
  }
});
it('the doors and the Workshop arch follow the walls of the bigger room (review 6)',()=>{
  expect([lobby.width,lobby.depth]).toEqual([34,24]);
  const sl=doorSlots(lobby.width,lobby.depth).slice(0,levels.length);
  for(const s of sl){
    if(s.wall==='back'){expect(s.z).toBe(-lobby.depth/2);expect(Math.abs(s.x)).toBeLessThan(lobby.width/2-1.5);}
    else if(s.wall==='side'){expect(s.x).toBe(-lobby.width/2);expect(Math.abs(s.z)).toBeLessThan(lobby.depth/2-1.5);}
  }
  // Neighbouring doors on one wall are far enough apart that their 1.9 m approach keep-outs don't merge into a wall of nothing.
  const back=sl.filter(s=>s.wall==='back').map(s=>s.x);for(let i=1;i<back.length;i++)expect(back[i]-back[i-1]).toBeGreaterThanOrEqual(3.3);
  const w=workshopSpot(lobby.width,lobby.depth);expect(ends.some(([x,z])=>Math.hypot(x-w.x,z-w.z)<1e-6)).toBe(true);
});
it('every hand-placed prop stands inside the room, clear of the shell walls',()=>{
  // Shell walls are 25 cm thick and centred on the room edge: a prop's footprint must stay inside the inner face.
  for(const p of lobby.props){const [w,,d]=prefabs[p.kind].size,turned=Math.abs(Math.sin(p.rotation??0))>.5,hx=(turned?d:w)/2,hz=(turned?w:d)/2;
    expect(Math.abs(p.x)+hx,`${p.kind} @${p.x},${p.z}`).toBeLessThan(lobby.width/2-.125);expect(Math.abs(p.z)+hz,`${p.kind} @${p.x},${p.z}`).toBeLessThan(lobby.depth/2-.125);}
});
it('the walk-in trigger wants Pip heading into the wall, not along it',()=>{
  // heading = atan2(x,z): pi faces -z (the back wall), -pi/2 faces -x (the left wall).
  expect(walksInto(true,Math.PI)).toBe(true);expect(walksInto(true,Math.PI-.6)).toBe(true);
  expect(walksInto(true,Math.PI/2)).toBe(false);expect(walksInto(true,Math.PI-.9)).toBe(false);expect(walksInto(true,0)).toBe(false);
  expect(walksInto(false,-Math.PI/2)).toBe(true);expect(walksInto(false,Math.PI)).toBe(false);expect(walksInto(false,Math.PI/2)).toBe(false);
});

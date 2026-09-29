import {describe,it,expect} from 'vitest';
import {Rope,detour,clear,pathLength,strainColor,segmentDistance,type Point} from './cable';
const pillar={id:'p',minX:-1,maxX:1,minZ:-1,maxZ:1};
describe('rope geometry',()=>{
  it('wraps a pillar without passing through it',()=>{const path=detour({x:-4,z:0},{x:4,z:0},[pillar]);expect(path.length).toBeGreaterThan(2);path.slice(1).forEach((p,i)=>expect(clear(path[i],p,[pillar])).toBe(true));expect(pathLength(path)).toBeGreaterThan(8);});
  it('unwraps when line of sight returns',()=>{const r=new Rope({x:-4,z:0},5);r.update({x:4,z:0},[pillar]);expect(r.bends.length).toBeGreaterThan(0);r.update({x:-4,z:4},[pillar]);expect(r.bends).toHaveLength(0);});
  it('stores energy only beyond its finite length and pulls toward last bend',()=>{const r=new Rope({x:0,z:0},5);r.update({x:7,z:0},[]);expect(r.pull({x:7,z:0}).x).toBeLessThan(0);expect(r.release()).toBe(240);expect(r.energy).toBe(0);});
  it('uses four readable strain bands',()=>expect([.6,.75,.9,1].map(strainColor)).toEqual(['#f5f1dc','#ffd451','#ff922f','#f34e56']));
  it('wraps the corner it was dragged around, not the globally shortest one',()=>{
    const wall={id:'w',minX:-10,maxX:0,minZ:-.1,maxZ:.1},r=new Rope({x:-3,z:5},60);
    // Drag the end around the far (left) end of the wall in small steps.
    const path:Point[]=[];for(let x=-3;x>=-12;x-=.25)path.push({x,z:5});for(let z=5;z>=-5;z-=.25)path.push({x:-12,z});for(let x=-12;x<=-3;x+=.25)path.push({x,z:-5});
    for(const p of path)r.update(p,[wall]);
    expect(r.bends.every(b=>b.x< -9.9)).toBe(true);expect(r.bends.length).toBeGreaterThan(0);expect(r.length).toBeGreaterThan(17);
    // Walking back the same way unwraps it again.
    for(const p of [...path].reverse())r.update(p,[wall]);expect(r.bends).toHaveLength(0);
  });
  it('does not straighten through a wall just because a doorway lines up',()=>{
    // Two wall pieces with a door gap between x=-1..1; the rope is wrapped round the far wall end.
    const walls=[{id:'a',minX:-10,maxX:-1,minZ:0,maxZ:.3},{id:'b',minX:1,maxX:8,minZ:0,maxZ:.3}],r=new Rope({x:-13,z:3},60);
    for(let t=0;t<=1;t+=.02)r.update({x:10,z:1-t*4},walls);
    expect(r.bends.some(b=>b.x>7.9)).toBe(true);expect(r.length).toBeGreaterThan(24);
  });
  it('finds props touching a rope segment',()=>{expect(segmentDistance({x:1,z:.2},{x:0,z:0},{x:3,z:0})).toBeCloseTo(.2);});
});

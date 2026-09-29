import {describe,it,expect} from 'vitest';
import {Rope,detour,clear,pathLength,strainColor,segmentDistance} from './cable';
const pillar={id:'p',minX:-1,maxX:1,minZ:-1,maxZ:1};
describe('rope geometry',()=>{
  it('wraps a pillar without passing through it',()=>{const path=detour({x:-4,z:0},{x:4,z:0},[pillar]);expect(path.length).toBeGreaterThan(2);path.slice(1).forEach((p,i)=>expect(clear(path[i],p,[pillar])).toBe(true));expect(pathLength(path)).toBeGreaterThan(8);});
  it('unwraps when line of sight returns',()=>{const r=new Rope({x:-4,z:0},5);r.update({x:4,z:0},[pillar]);expect(r.bends.length).toBeGreaterThan(0);r.update({x:-4,z:4},[pillar]);expect(r.bends).toHaveLength(0);});
  it('stores energy only beyond its finite length and pulls toward last bend',()=>{const r=new Rope({x:0,z:0},5);r.update({x:7,z:0},[]);expect(r.pull({x:7,z:0}).x).toBeLessThan(0);expect(r.release()).toBe(72);expect(r.energy).toBe(0);});
  it('uses four readable strain bands',()=>expect([.6,.75,.9,1].map(strainColor)).toEqual(['#f5f1dc','#ffd451','#ff922f','#f34e56']));
  it('finds props touching a rope segment',()=>{expect(segmentDistance({x:1,z:.2},{x:0,z:0},{x:3,z:0})).toBeCloseTo(.2);});
});

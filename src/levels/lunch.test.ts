import {describe,it,expect} from 'vitest';
// The render modules read location.search at load; give node a blank one before importing them.
(globalThis as {location?:unknown}).location??={search:''};
const {lunch}=await import('./lunch'),{lunchDressingObstacles}=await import('./lunch-dressing');

// Review 6: Lunch Rush grows to 36 × 24 m while the job (supplies, kitchen, lift) stays put.
describe('lunch room (36 × 24 m)',()=>{
  const hw=lunch.width/2,hd=lunch.depth/2;
  it('is the bigger shell',()=>{expect([lunch.width,lunch.depth]).toEqual([36,24]);});
  it('keeps the job where it was, so the cable distances are unchanged',()=>{
    expect(lunch.spawn).toEqual({x:-10,z:5});expect(lunch.anchor).toEqual({x:-13,z:7});expect(lunch.target).toEqual({x:12,z:-6});expect(lunch.length).toBe(27);
    for(const [id,x,z] of [['wedge',-3,7],['mop',2,8],['bridge-1',7,8],['tray',-2,-7]] as const){const p=lunch.props.find(q=>q.id===id)!;expect([p.x,p.z]).toEqual([x,z]);}
  });
  it('puts every prop inside the walls',()=>{
    for(const p of lunch.props){expect(Math.abs(p.x)).toBeLessThan(hw-.3);expect(Math.abs(p.z)).toBeLessThan(hd-.3);}
  });
  it('moves the wall-huggers out with the walls, inside the new shell',()=>{
    const o=Object.fromEntries(lunchDressingObstacles(lunch.width,lunch.depth).map(b=>[b.id,b]));
    for(const b of Object.values(o)){expect(b.minX).toBeGreaterThan(-hw);expect(b.maxX).toBeLessThan(hw);expect(b.minZ).toBeGreaterThan(-hd);expect(b.maxZ).toBeLessThan(hd);}
    // The rack hugs the left wall, the vending line the front edge, the back counters the back wall.
    expect(o.rack.minX+hw).toBeLessThan(.6);expect(hd-o.vending.maxZ).toBeLessThan(.6);expect(o['back-counter-west'].minZ+hd).toBeLessThan(.3);
    // At the old 33 × 20 m size they land where decor.ts put them.
    expect(lunchDressingObstacles(33,20).find(b=>b.id==='rack')).toEqual({id:'rack',minX:-16.35,maxX:-15.5,minZ:2.9,maxZ:6.7});
  });
});

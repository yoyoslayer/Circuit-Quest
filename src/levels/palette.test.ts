import {describe,expect,it} from 'vitest';
import type {PropKind} from '../props/prefabs';
// The render modules read location.search at load; give node a blank one before importing them.
(globalThis as {location?:unknown}).location??={search:''};
const {levels}=await import('./index'),{lobby}=await import('./lobby'),{palette,nearJobYellow,deltaE}=await import('./clutter');
const {prefabs}=await import('../props/prefabs'),{BLOBC}=await import('../render/kit');

// Job yellow (#ffc94d / #ffc629) is the colour of "the thing the job is about" (DR-45): only job items
// (anything with an id) and the grab cue wear it. Reels, splitters, plugs and the other cable shapes
// mean "job item" too, so a room only has them as job items (R5-101, R5-104, R5-158).
const CABLE_SHAPES:PropKind[]=['reel','splitter','plug','dolly','bridge','wedge','strip','coupler'];
const JOB_KINDS=new Set<PropKind>([...CABLE_SHAPES,'supply']);
// The Big Meeting's chairs still use CHAIRC (meeting.ts, owned by another fix batch): see fixlog/colour.md.
const KNOWN:Record<string,string[]>={meeting:['chair','beanbag']};
const rooms=[...levels,lobby];

describe('job colour language',()=>{
  it('no decor prefab defaults to job yellow',()=>{
    for(const [kind,p] of Object.entries(prefabs) as [PropKind,{color:string}][])if(!JOB_KINDS.has(kind))expect(nearJobYellow(p.color),kind).toBe(false);
  });
  it('no hand-placed decor prop is job yellow',()=>{
    for(const l of rooms)for(const p of l.props){if(p.id||KNOWN[l.id]?.includes(p.kind))continue;
      expect(nearJobYellow(p.color??prefabs[p.kind].color),`${l.id} ${p.kind} @${p.x},${p.z}`).toBe(false);}
  });
  it('cable-shaped props appear only as job items',()=>{
    for(const l of rooms)for(const p of l.props)if(CABLE_SHAPES.includes(p.kind))expect(p.id,`${l.id} ${p.kind} @${p.x},${p.z}`).toBeTruthy();
  });
  it('clutter draws cartons from kraft, cabinets from neutrals, and never job yellow',()=>{
    for(const l of rooms){if(!l.clutter)continue;const pal=palette(l.clutter);
      for(const [family,list] of Object.entries(pal))for(const c of list)expect(nearJobYellow(c),`${l.id} ${family} ${c}`).toBe(false);
      for(const c of pal.box)expect(['#c98f5a','#d7a56d','#e0b47a','#b9875a']).toContain(c);
      // Fabric never wears a coworker's colour, so a beanbag doesn't read as a blob.
      for(const c of pal.fabric)for(const b of BLOBC)expect(deltaE(c,b),`${l.id} fabric ${c} vs ${b}`).toBeGreaterThanOrEqual(15);}
  });
  it('prints each room fabric (for the fix log)',()=>{for(const l of rooms)if(l.clutter)console.log(l.id,JSON.stringify(palette(l.clutter).fabric));});
  it('the colour distance is sane',()=>{
    expect(deltaE('#ffc94d','#ffc94d')).toBe(0);expect(nearJobYellow('#ffd84d')).toBe(true);expect(nearJobYellow('#c98f5a')).toBe(false);
  });
});

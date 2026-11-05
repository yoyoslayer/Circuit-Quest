// R5-164: how far short the single reel stops walking, and whether a sprint still seats it.
// Optional LEN=22.4 overrides the reel length before the run (via __game.rope.maxLength).
import {launch} from '../cap.mjs';
const g=await launch('meeting');await g.advance(.3);
const route=async(pts,r=.5)=>{for(const [x,z] of pts)await g.walk(x,z,r);};
if(process.env.LEN)await g.page.evaluate(l=>{const q=window.__game;q.rope.maxLength=l;q.level.length=l;},+process.env.LEN);
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE');
await route([[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');await route([[-8,-5],[-1,-1.5],[6,-1.2]]);
const d=s=>Math.hypot(s.player.x-12.3,s.player.z+2.25).toFixed(2);
await g.advance(2,['KeyD']);let s=await g.snap();console.log('walk 2s',d(s),s.rope.strain.toFixed(3));
await g.advance(1);s=await g.snap();console.log('stand 1s',d(s),s.rope.strain.toFixed(3),await g.page.evaluate(()=>document.querySelector('.prompt-pill')?.textContent));
await g.advance(1.5,['KeyD','ShiftLeft']);s=await g.snap();console.log('sprint',d(s),s.rope.strain.toFixed(3),await g.page.evaluate(()=>window.__game.canSeat()));
await g.key('KeyF',.2);s=await g.snap();console.log('connected',s.connected??(await g.page.evaluate(()=>window.__game.connected)));
await g.close();

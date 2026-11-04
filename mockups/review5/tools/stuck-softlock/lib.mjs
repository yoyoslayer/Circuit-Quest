import {launch} from '../cap.mjs';
export {launch};
export const item=(s,id)=>s.items.find(i=>i.id===id);
export const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// Aim: walk to a point just behind `from` on the line from->aim, then to `from`, so the heading faces aim.
export async function face(g,from,aim){const dx=aim[0]-from[0],dz=aim[1]-from[1],l=Math.hypot(dx,dz)||1;
  await g.walk(from[0]-dx/l*.8,from[1]-dz/l*.8,.25,15);await g.walk(from[0],from[1],.2,10);}
export async function grab(g,id,stand){if(stand)await g.walk(stand[0],stand[1],.4,20);let s=await g.snap();
  if(s.held!==id){await g.key('KeyE');s=await g.snap();}return s.held===id;}
// Try to get it back: walk near its current spot (several approach sides) and press E.
export async function retrieve(g,id){let s=await g.snap();const p=item(s,id).pos;const tries=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[.9,.9],[-.9,-.9],[.9,-.9],[-.9,.9]];
  for(const [ox,oz] of tries){const r=await g.walk(p.x+ox,p.z+oz,.35,15);s=await g.snap();const pl=s.player;
    if(d2(pl,p)<1.6){await g.key('KeyE');s=await g.snap();if(s.held===id)return {ok:true,from:[+pl.x.toFixed(2),+pl.z.toFixed(2)],dist:+d2(pl,p).toFixed(2)};
      if(s.held){await g.key('KeyE');}}}
  s=await g.snap();return {ok:false,closest:+d2(s.player,p).toFixed(2),player:s.player};}
export const fmt=p=>p?`(${p.x.toFixed(2)},${p.y.toFixed(2)},${p.z.toFixed(2)})`:'-';

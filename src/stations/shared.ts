// Small helpers every station uses for the moments around the bench: the job-done confetti and
// the walking hint in the room.
import type * as T from 'three';
import type {Game} from '../game';
import type {Prompt} from './types';

type Spot={x:number;y:number;z:number};
/** A job-done confetti pop. At the bench it goes off behind and above the far edge of the table,
 *  small, so nothing flies through the close camera or hangs over the readouts; in the room it goes
 *  off where asked. */
export function cheer(game:Game,st:{table:T.Vector3;stand:{x:number;z:number}},color:string,at?:Spot,count=24){
  if(game.atBench||!at){
    const dx=st.table.x-st.stand.x,dz=st.table.z-st.stand.z,l=Math.hypot(dx,dz)||1;
    game.burst({x:st.table.x+dx/l*1.8,y:st.table.y+1.4,z:st.table.z+dz/l*1.8},color,Math.min(count,12),'confetti');return;}
  game.burst(at,color,count,'confetti');
}

/** In the room, when Pip holds nothing and stands next to nothing she could grab, the prompt says
 *  where the current step is instead of staying empty (the yellow arrow marks the spot). Clutter in
 *  reach keeps its own grab prompt, so nothing stops her picking it up. */
export function walkHint(game:Game,text:string|undefined):Prompt|null{
  if(!text||game.atBench||game.held||game.holdingPlug||game.nearest())return null;
  return {key:'WASD',text};
}

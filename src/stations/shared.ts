// Small helpers every station uses for the moments around the bench: the job-done confetti and
// the walking hint in the room.
import * as T from 'three';
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

/** A bench milestone (a sign-off, ship, log or send, R5-093/094): the two-note milestone chime (or
 *  nothing, when this step finishes the job, because the win fanfare plays then), a short hitstop
 *  and the confetti pop. */
export function signOff(game:Game,st:{table:T.Vector3;stand:{x:number;z:number}},color:string,last:boolean,at?:Spot,count=24){
  if(!last)game.audio.milestone();game.freeze(.05);cheer(game,st,color,at,count);
}

/** A bench fault (a trip, a pop, a failed verdict, R5-094/095): a short hitstop and a quick coral
 *  flash of the screen edge, kept under 120 ms so the part being taught stays readable. */
export function fault(game:Game,hold=.07){game.freeze(hold);game.flash('#ff7a6b',.22);}

/** Walking hints for the key pill: retired (the job card and the arrow carry them). */
export function walkHint(_game:Game,_text:string|undefined):Prompt|null{
  // The job card and the yellow arrow already say where to go; the key pill is kept for actions.
  return null;
}

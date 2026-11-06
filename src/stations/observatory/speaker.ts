// The decoder speaker's level, as a dead man's switch. The bench's update() doesn't run while the game
// is paused (or blurred, or won), and this chain doesn't pass through the engine's master gain, so each
// frame only holds the speaker up for a moment: when the frames stop it falls silent on its own.
type Param=Pick<AudioParam,'cancelScheduledValues'|'setTargetAtTime'>;
/** Heads for full level now if live (silence if not), and back to silence `hold` s later unless the
 *  next frame renews it (cancelling drops only that pending fall; the rise already running stays). */
export function holdLevel(p:Param,live:boolean,t:number,hold:number,tau=.05){
  p.cancelScheduledValues(t);p.setTargetAtTime(live?1:0,t,tau);if(live)p.setTargetAtTime(0,t+hold,tau);
}

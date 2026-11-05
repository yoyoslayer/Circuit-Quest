// An opt-in inverse-time ("thermal") breaker for a single source, used by Big Meeting's power strip.
// Real thermal-magnetic breakers carry a small overload for a while and only trip once it has
// heated them (minutes at 1.1x, by UL 489 / IEC 60898 curves), and trip at once only on a big fault.
// DR-36: the dwell is compressed to about two seconds at 1.1x as game tuning, so the player can see
// the strip sit past its line before it clacks. Sources without this keep the Circuit's instant trip
// (Lunch's carts are electronic cut-outs and rely on it).
/** Heat at which the breaker trips (about 2.4 s at 1.1x the limit). */
export const THERMAL_TRIP=.5;
/** Above this multiple of the limit the magnetic part trips in the same tick. */
export const THERMAL_INSTANT=3;
/** One step of the breaker's heat: overload heats it as (I/limit)^2-1 per second; under the limit it cools. */
export function thermalStep(heat:number,amps:number,limit:number,dt:number){
  const r=amps/limit;return r>1?heat+(r*r-1)*dt:Math.max(0,heat-dt*.5);
}
/** Seconds a steady overload of `amps` takes to trip from cold (Infinity at or under the limit). */
export function tripSeconds(amps:number,limit:number){const r=amps/limit;return r<=1?Infinity:r>=THERMAL_INSTANT?0:THERMAL_TRIP/(r*r-1);}

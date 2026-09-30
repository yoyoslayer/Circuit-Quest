/** A distance-driven gait. During stance a foot moves backwards by exactly the
 * distance the body travels; during swing it clears the floor and returns ahead.
 * Units match Pip's model, not screen pixels or elapsed render frames. */
export const CYCLE_DISTANCE=1.2,STANCE=.58;
export function footAt(distance:number,side:number){
  const phase=((distance/CYCLE_DISTANCE+side*.5)%1+1)%1;
  const reach=CYCLE_DISTANCE*STANCE/2;
  if(phase<STANCE)return {z:reach-phase*CYCLE_DISTANCE,y:0,stance:true};
  const t=(phase-STANCE)/(1-STANCE),smooth=t*t*(3-2*t);
  return {z:-reach+2*reach*smooth,y:Math.sin(t*Math.PI)*.18,stance:false};
}
/** Two equal bones bend towards +z, with a guarded reach for jumps/landings. */
export function kneeAt(hip:{y:number;z:number},foot:{y:number;z:number},length=.34){
  const dy=foot.y-hip.y,dz=foot.z-hip.z,d=Math.max(.001,Math.hypot(dy,dz));
  const bend=Math.sqrt(Math.max(0,length*length-Math.min(d,length*2)**2/4));
  return {y:(hip.y+foot.y)/2+dz/d*bend,z:(hip.z+foot.z)/2-dy/d*bend};
}

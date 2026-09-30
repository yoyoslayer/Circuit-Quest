import type {PropKind} from './prefabs';
export interface BoxShape {size:[number,number,number];at:[number,number,number];yaw?:number}
/** Furniture must leave its visible gaps empty: a solid desk-sized box catches
 * chairs and loose objects in invisible space and makes them tip or spin. */
export function furnitureShapes(kind:PropKind):BoxShape[]|undefined{
  if(kind==='mop')return [{size:[.55,.06,.32],at:[0,-.705,0]},{size:[.05,1.4,.05],at:[0,.02,0]}];
  if(kind==='desk')return [
    {size:[1.6,.07,.85],at:[0,.44,0]},
    ...[-1,1].map(s=>({size:[.06,.88,.7225],at:[s*.72,-.035,0]} as BoxShape)),
    {size:[.3,.45,.612],at:[.448,-.225,0]},
  ];
  if(kind==='chair')return [
    {size:[.55,.1,.55],at:[0,.005,0]},
    {size:[.55,.5,.1],at:[0,.305,-.24]},
    {size:[.06,.4,.06],at:[0,-.215,0]},
    ...Array.from({length:5},(_,i)=>{const a=i/5*Math.PI*2;return {size:[.32,.04,.05],at:[Math.cos(a)*.15,-.425,Math.sin(a)*.15],yaw:-a} as BoxShape;}),
  ];
  if(kind==='monitor')return [
    {size:[.63,.384,.05],at:[0,.05,-.04]},
    {size:[.06,.168,.06],at:[0,-.14,-.05]},
    {size:[.3,.03,.15],at:[0,-.225,-.03]},
  ];
}

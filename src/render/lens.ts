import * as T from 'three';
/** Lens choices (vertical degrees): Close, Standard, Wide. Wider lenses bring the camera closer so
 *  the room stays framed with a little more of it in view: perspective reads stronger and Pip stays
 *  big on screen. */
export const FOVS=[32,42,54] as const;
export type Lens=typeof FOVS[number];
export const LENS_NAMES=['Close','Standard','Wide'] as const;
/** Camera distance for a lens, relative to the 30° lens the zooms and bench views were tuned for. */
export const lensScale=(fov:number)=>Math.tan(T.MathUtils.degToRad(15))/Math.tan(T.MathUtils.degToRad(fov/2))*(1+(fov-30)/110);

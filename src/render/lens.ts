import * as T from 'three';
/** Lens choices (vertical degrees): Close, Standard, Wide. Wider lenses bring the camera closer so
 *  the room stays framed with a little more of it in view: perspective reads stronger and Pip stays
 *  big on screen. */
export const FOVS=[32,42,54] as const;
export type Lens=typeof FOVS[number];
export const LENS_NAMES=['Close','Standard','Wide'] as const;
/** Camera distance for a lens, relative to the 30° lens the zooms and bench views were tuned for.
 *  Walking around, wider lenses also show a little more of the room; at a bench (`exact`) the
 *  framing stays exactly as tuned so every control stays the same size on screen. */
// Walking framing per lens (R5-264): Close is ~15% tighter than Standard and Wide shows ~25% more room,
// on top of keeping the frame width (the old 1+(fov-30)/110 made the three nearly identical).
const FRAME:Record<number,number>={32:.94,42:1.11,54:1.39};
export const lensScale=(fov:number,exact=false)=>Math.tan(T.MathUtils.degToRad(15))/Math.tan(T.MathUtils.degToRad(fov/2))*(exact?1:FRAME[fov]??1+(fov-30)/110);

import type {PropSpec} from '../props/prefabs';
import type {Obstacle,Point} from '../sim/cable';
export type LevelId='playground'|'meeting'|'lunch';
/** name/number/tagline appear only on the intro card; nothing in play needs reading. */
export interface Level {id:LevelId;name:string;number:string;tagline:string;badge:string;next?:LevelId;deadline?:number;width:number;depth:number;spawn:Point;anchor:Point;target:Point;length:number;obstacles:Obstacle[];props:PropSpec[];npcs:Point[]}

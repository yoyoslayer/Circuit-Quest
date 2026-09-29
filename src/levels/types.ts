import type {PropSpec} from '../props/prefabs';
import type {Obstacle,Point} from '../sim/cable';
export interface Level {id:'playground'|'meeting'|'lunch';width:number;depth:number;spawn:Point;anchor:Point;target:Point;length:number;obstacles:Obstacle[];props:PropSpec[];npcs:Point[]}

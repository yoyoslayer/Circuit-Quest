// A station is a job played at a bench inside a walkable room (docs/EXPANSION_PLAN.md).
// Pip walks up and presses E; the camera eases onto the tabletop and the station takes the
// pointer and keys. The station's rules live in a pure module next to it (unit-tested); the
// station class only draws them and turns clicks into act() calls. Tests drive act() directly.
import type * as T from 'three';
import type {Game} from '../game';
import type {Point} from '../sim/cable';

export type StationId='vias'|'archive'|'waterworks'|'observatory'|'garage';
export interface StationStep {text:string;done:()=>boolean;
  /** Where the world marker points for this step (defaults to the bench). */
  at?:()=>Point|undefined}
export interface StationJob {goal:string;steps:StationStep[];bonuses:{text:string;ok:()=>boolean}[]}
export interface Prompt {key:string;text:string}
export interface Pointer {kind:'down'|'move'|'up';ray:T.Raycaster;button:number}
/** decor.ts helpers handed to a station so it can dress its own room (floors, windows, walls). */
export interface RoomKit {
  floor(x0:number,x1:number,z0:number,z1:number,map:T.Texture,tile?:number,y?:number):T.Mesh;
  backWindows(skip?:(x:number)=>boolean,shaftOpacity?:number):void;
  interiorWall(o:{id:string;minX:number;maxX:number;minZ:number;maxZ:number},upper?:string,lower?:string,h?:number):void;
  back:T.Group;side:T.Group;
}
/** Grade limits for this station's result card (time in s, mistakes, process cost). */
export interface Limits {time:number;damage:number;cost:number}

export interface Station {
  readonly job:StationJob;
  /** Camera at the bench, relative to the tabletop centre: distance, pitch, and the height of the
   *  point it looks at. */
  readonly view:{distance:number;pitch:number;lookY:number};
  readonly limits:Limits;
  /** Where Pip stands to work (world), and the tabletop centre (world). */
  readonly stand:Point;readonly table:T.Vector3;readonly facing:number;
  /** Pip is at the bench; opens or closes the station's panels. */
  setActive(active:boolean):void;
  /** A clicked or keyed action ("drill", "pad" 0.45…). Returns false if it did nothing. */
  act(name:string,arg?:unknown):boolean;
  pointer(e:Pointer):void;
  key(code:string):boolean;
  update(dt:number):void;
  prompt(atBench:boolean):Prompt|null;
  /** Dress the room around the bench (called by decor.ts before props and coworkers exist). */
  dress(kit:RoomKit):{lightUp?:()=>void};
  /** A prop was set down in the room (the station may take it, e.g. a crate onto the counter). */
  dropped?(prop:Game['props'][number]):void;
  complete():boolean;
  /** Mistakes and process cost for the result card (on top of broken props). */
  score():{mistakes:number;cost:number};
  snapshot():unknown;
}

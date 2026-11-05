import type {PropSpec} from '../props/prefabs';
import type {Obstacle,Point} from '../sim/cable';
import type {Accessory,Mood} from '../render/actors';
import type {StationId} from '../stations/types';
import type {ClutterOptions} from './clutter';
/** A coworker: seated at a desk in the office unless standing; optional look and facing. */
export interface NpcSpot {x:number;z:number;standing?:boolean;color?:string;acc?:Accessory[];mood?:Mood;yaw?:number;chef?:boolean}
export type LevelId='playground'|'meeting'|'lunch'|'lobby'|'qfn'|'observatory'|'arcade'|'arcade-rush'|'garage'|'spectrum';
/** name/number/tagline appear only on the intro card; nothing in play needs reading. */
export interface Level {id:LevelId;name:string;number:string;tagline:string;badge:string;next?:LevelId;deadline?:number;
  /** Where the machine's on/off switch is (E); it only runs once powered and switched on. */
  switchAt?:Point;
  /** Station jobs are played at a bench (src/stations). */
  station?:StationId;
  /** A station's mains lead (R5-079): the bench is dead until Pip drags this cable off its reel by the
   *  bench and seats it in the wall socket at `target`. Stations without it have no cable at all.
   *  `route` is the clean walk from the reel's plug to the socket (kept clear of clutter, used by specs). */
  stationCable?:{anchor:Point;length:number;target:Point;route:[number,number][];
    /** Where the loose plug rests at the start (defaults to 0.7 m off the reel on both axes). */
    plug?:Point};
  /** The HQ lobby (src/hub): doors to every job, no job of its own. */
  hub?:boolean;
  /** The lobby door stays locked until this job has a best result (e.g. rush after the story shift). */
  requires?:LevelId;
  /** A bonus job (Rush): not one of the lobby's required steps, and never suggested as "next". */
  optional?:boolean;
  /** Closed-off spaces Pip can't enter (x/z boxes). A job item that ends up inside one is sent home,
   *  like one stranded on tall furniture, so it can never be lost for good. */
  sealed?:{minX:number;maxX:number;minZ:number;maxZ:number}[];
  /** Extra props laid out at load time around the room's fixtures (src/levels/clutter.ts). */
  clutter?:ClutterOptions;width:number;depth:number;spawn:Point;anchor:Point;target:Point;length:number;obstacles:Obstacle[];props:PropSpec[];npcs:NpcSpot[]}

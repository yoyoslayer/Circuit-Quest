import type {PropSpec} from '../props/prefabs';
import type {Obstacle,Point} from '../sim/cable';
import type {Accessory,Mood} from '../render/actors';
import type {StationId} from '../stations/types';
/** A coworker: seated at a desk in the office unless standing; optional look and facing. */
export interface NpcSpot {x:number;z:number;standing?:boolean;color?:string;acc?:Accessory[];mood?:Mood;yaw?:number;chef?:boolean}
export type LevelId='playground'|'meeting'|'lunch'|'vias'|'vias-rush'|'lobby'|'qfn'|'archive'|'waterworks'|'observatory'|'arcade'|'garage'|'clockwork'|'depot'|'spectrum';
/** name/number/tagline appear only on the intro card; nothing in play needs reading. */
export interface Level {id:LevelId;name:string;number:string;tagline:string;badge:string;next?:LevelId;deadline?:number;
  /** Where the machine's on/off switch is (E); it only runs once powered and switched on. */
  switchAt?:Point;
  /** Station jobs are played at a bench (src/stations); they have no cable of their own. */
  station?:StationId;
  /** The HQ lobby (src/hub): doors to every job, no job of its own. */
  hub?:boolean;
  /** The lobby door stays locked until this job has a best result (e.g. rush after the story shift). */
  requires?:LevelId;width:number;depth:number;spawn:Point;anchor:Point;target:Point;length:number;obstacles:Obstacle[];props:PropSpec[];npcs:NpcSpot[]}

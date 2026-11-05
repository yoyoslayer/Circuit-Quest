import type {Grade} from '../sim/grade';
import type {Level,LevelId} from '../levels/types';
/** Best result per job. Each stat keeps its own best; `grade` is the best overall grade. */
export interface Best {grade:Grade;time:number;damage:number;cost:number;
  /** Bonus stars ever earned, as a bitmask (bit i = bonus i). Kept across runs. */
  stars?:number;
  /** Earned in one run, never synthesized from separate personal bests. */
  crewGold?:boolean}
const KEY='circuit-crew:best:v1',AUTOSTART='circuit-crew:autostart';
// Storage can be missing or throw (private windows, blocked site data); the game never depends on it.
function read():Partial<Record<LevelId,Best>>{try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw)??{}:{};}catch{return {};}}
function write(all:Partial<Record<LevelId,Best>>){try{localStorage.setItem(KEY,JSON.stringify(all));}catch{/* ignore */}}
export const bestFor=(id:LevelId):Best|undefined=>read()[id];
/** Merges a finished run into the record; returns the stored best and whether the grade improved. */
export function record(id:LevelId,run:Best){
  const all=read(),old=all[id];
  const best:Best=old?{grade:run.grade<old.grade?run.grade:old.grade,time:Math.min(old.time,run.time),damage:Math.min(old.damage,run.damage),cost:Math.min(old.cost,run.cost),stars:(old.stars??0)|(run.stars??0),crewGold:!!old.crewGold||!!run.crewGold}:run;
  all[id]=best;write(all);
  // Any better stat or a new star counts as an improvement (the card's star and bell), not only the grade.
  const improved=!old||!!run.crewGold&&!old.crewGold||run.grade<old.grade||run.time<old.time||run.damage<old.damage||run.cost<old.cost||((run.stars??0)&~(old.stars??0))!==0;
  return {best,old,improved,first:!old};
}
/** A job with `requires` stays locked until that job has a B or better (a C run doesn't open Rush). */
export function isLocked(l:Level){if(!l.requires)return false;const b=bestFor(l.requires);return !b||b.grade>'B';}
/** First job without a result; otherwise the last one (everything done). */
/** Bonus jobs (Rush, or anything unlocked by another job) are optional: not required, not "next". */
export const isOptional=(l:Level)=>l.optional??!!l.requires;
export function nextUnfinished(levels:Level[]){const all=read();return levels.find(l=>!isOptional(l)&&!all[l.id])??levels[levels.length-1];}
/** Restart and "next job" reload the page; this flag skips the intro once after that reload. */
export function flagAutostart(id:LevelId){try{sessionStorage.setItem(AUTOSTART,id);}catch{/* ignore */}}
export function takeAutostart(id:LevelId){try{const v=sessionStorage.getItem(AUTOSTART);sessionStorage.removeItem(AUTOSTART);return v===id;}catch{return false;}}

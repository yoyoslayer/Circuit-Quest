import type {Grade} from '../sim/grade';
import type {Level,LevelId} from '../levels/types';
/** Best result per job. Each stat keeps its own best; `grade` is the best overall grade. */
export interface Best {grade:Grade;time:number;damage:number;cost:number;
  /** Bonus stars ever earned, as a bitmask (bit i = bonus i). Kept across runs. */
  stars?:number;
  /** Earned in one run, never synthesized from separate personal bests. */
  crewGold?:boolean;served?:number}
const KEY='circuit-crew:best:v1',AUTOSTART='circuit-crew:autostart',FROM='circuit-crew:from';
type Records=Partial<Record<LevelId,Best>>;
// Storage can be missing or throw (private windows, blocked site data); the game never depends on it.
// The parsed record is cached per storage object (the HUD asks every frame); write() and another tab's
// write (the storage event) refresh it.
let cache:{store:Storage|undefined;all:Records}|undefined;
const storage=()=>{try{return localStorage;}catch{return undefined;}};
function read():Records{const store=storage();if(cache&&cache.store===store)return cache.all;
  let all:Records={};try{const raw=store?.getItem(KEY);all=raw?JSON.parse(raw)??{}:{};}catch{/* unreadable: start empty */}
  cache={store,all};return all;}
function write(all:Records){cache={store:storage(),all};try{localStorage.setItem(KEY,JSON.stringify(all));}catch{/* ignore */}}
if(typeof addEventListener==='function')addEventListener('storage',e=>{if(e.key===KEY||e.key===null)cache=undefined;});
export const bestFor=(id:LevelId):Best|undefined=>read()[id];
/** Merges a finished run into the record; returns the stored best and whether the grade improved. */
export function record(id:LevelId,run:Best){
  // A Rush shift always runs its clock out, so its time says nothing about how well it went: served counts instead.
  const all={...read()},old=all[id],rush=run.served!==undefined;
  const best:Best=old?{grade:run.grade<old.grade?run.grade:old.grade,time:rush?old.time:Math.min(old.time,run.time),damage:Math.min(old.damage,run.damage),cost:Math.min(old.cost,run.cost),stars:(old.stars??0)|(run.stars??0),crewGold:!!old.crewGold||!!run.crewGold,served:Math.max(old.served??0,run.served??0)}:run;
  all[id]=best;write(all);
  // Any better stat or a new star counts as an improvement (the card's star and bell), not only the grade.
  const improved=!old||(run.served??0)>(old.served??0)||!!run.crewGold&&!old.crewGold||run.grade<old.grade||!rush&&run.time<old.time||run.damage<old.damage||run.cost<old.cost||((run.stars??0)&~(old.stars??0))!==0;
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
/** sessionStorage: the job Pip is coming back to HQ from, so the lobby puts him at its door (R5-235).
 *  Set when he walks through a door and again whenever a job hands back to HQ, so it is never a door from two jobs ago. */
export function markReturn(id:LevelId){try{sessionStorage.setItem(FROM,id);}catch{/* storage unavailable */}}
export function takeReturn(){try{const v=sessionStorage.getItem(FROM);sessionStorage.removeItem(FROM);return v;}catch{return null;}}
/** A job loaded some other way than through its door (next job, the Jobs board, a URL) drops a key left by another one. */
export function dropStaleReturn(id:LevelId){try{const v=sessionStorage.getItem(FROM);if(v!==null&&v!==id)sessionStorage.removeItem(FROM);}catch{/* storage unavailable */}}

/** Campaign rewards use actual earned records; optional shifts never block completion. */
export function campaignProgress(levels:Level[]) {
  const required=levels.filter(l=>!isOptional(l));
  return {allJobs:required.length>0&&required.every(l=>!!bestFor(l.id)),
    goldJobs:required.filter(l=>bestFor(l.id)?.crewGold).length,
    stars:levels.reduce((n,l)=>n+[0,1,2].filter(i=>((bestFor(l.id)?.stars??0)&(1<<i))!==0).length,0)};
}

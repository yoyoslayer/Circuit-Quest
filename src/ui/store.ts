import type {Grade} from '../sim/grade';
import type {Level,LevelId} from '../levels/types';
/** Best result per job. Each stat keeps its own best; `grade` is the best overall grade. */
export interface Best {grade:Grade;time:number;damage:number;cost:number}
const KEY='circuit-crew:best:v1',AUTOSTART='circuit-crew:autostart';
// Storage can be missing or throw (private windows, blocked site data); the game never depends on it.
function read():Partial<Record<LevelId,Best>>{try{const raw=localStorage.getItem(KEY);return raw?JSON.parse(raw)??{}:{};}catch{return {};}}
function write(all:Partial<Record<LevelId,Best>>){try{localStorage.setItem(KEY,JSON.stringify(all));}catch{/* ignore */}}
export const bestFor=(id:LevelId):Best|undefined=>read()[id];
/** Merges a finished run into the record; returns the stored best and whether the grade improved. */
export function record(id:LevelId,run:Best){
  const all=read(),old=all[id];
  const best:Best=old?{grade:run.grade<old.grade?run.grade:old.grade,time:Math.min(old.time,run.time),damage:Math.min(old.damage,run.damage),cost:Math.min(old.cost,run.cost)}:run;
  all[id]=best;write(all);
  return {best,improved:!old||run.grade<old.grade,first:!old};
}
/** First job without a result; otherwise the last one (everything done). */
export function nextUnfinished(levels:Level[]){const all=read();return levels.find(l=>!all[l.id])??levels[levels.length-1];}
/** Restart and "next job" reload the page; this flag skips the intro once after that reload. */
export function flagAutostart(id:LevelId){try{sessionStorage.setItem(AUTOSTART,id);}catch{/* ignore */}}
export function takeAutostart(id:LevelId){try{const v=sessionStorage.getItem(AUTOSTART);sessionStorage.removeItem(AUTOSTART);return v===id;}catch{return false;}}

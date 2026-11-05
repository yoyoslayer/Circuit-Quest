export type Grade = 'A'|'B'|'C'|'D';
export interface Limits {time:number;damage:number;cost:number}
export function grade(time:number,damage:number,cost:number,limits:Limits={time:120,damage:10,cost:300}) {
  const rank=(value:number,limit:number):Grade=>value<=limit?'A':value<=limit*2?'B':value<=limit*3?'C':'D';
  const parts=[rank(time,limits.time),rank(damage,limits.damage),rank(cost,limits.cost)];
  return {parts,overall:[...parts].sort()[0]};
}

/** Rush measures completed work; idle, damage-free shifts cannot earn a top grade.
 * Ordinary jobs retain the best-of-three rule. */
export function gradeRush(served:number,damage:number,cost:number) {
  const work:Grade=served>=10?'A':served>=6?'B':served>=3?'C':'D';
  const regular=grade(0,damage,cost,{time:1,damage:3,cost:24});
  const overall:Grade=damage>6&&work<'D'?String.fromCharCode(work.charCodeAt(0)+1) as Grade:work;
  return {parts:[work,regular.parts[1],regular.parts[2]],overall};
}
export const crewGold=(parts:Grade[],stars:number)=>parts.length===3&&parts.every(p=>p==='A')&&(stars&7)===7;

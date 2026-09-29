export type Grade = 'A'|'B'|'C'|'D';
export interface Limits {time:number;damage:number;cost:number}
export function grade(time:number,damage:number,cost:number,limits:Limits={time:120,damage:10,cost:300}) {
  const rank=(value:number,limit:number):Grade=>value<=limit?'A':value<=limit*2?'B':value<=limit*3?'C':'D';
  const parts=[rank(time,limits.time),rank(damage,limits.damage),rank(cost,limits.cost)];
  return {parts,overall:[...parts].sort()[0]};
}

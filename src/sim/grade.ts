export type Grade = 'A'|'B'|'C'|'D';
export function grade(time:number,damage:number,cost:number) {
  const rank=(value:number,limit:number):Grade=>value<=limit?'A':value<=limit*2?'B':value<=limit*3?'C':'D';
  const parts=[rank(time,120),rank(damage,10),rank(cost,300)];
  return {parts,overall:[...parts].sort()[0]};
}

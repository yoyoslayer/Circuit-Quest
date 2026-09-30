/** Magnification is constant for a given row count. Every allowed pad fits
 * without overlapping the next pad or extending beyond the cutaway edge. */
export function sectionLayout(count:number,width=1.2){
  const n=Math.max(1,Math.min(8,Math.round(count))),pitch=width/n;
  return {scale:Math.min(.8,pitch/.66),xs:Array.from({length:n},(_,k)=>(k-(n-1)/2)*pitch)};
}

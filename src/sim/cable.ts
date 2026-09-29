export interface Point {x:number;z:number}
export interface Obstacle {id:string;minX:number;maxX:number;minZ:number;maxZ:number}
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.z-b.z);
export const pathLength=(p:Point[])=>p.slice(1).reduce((n,b,i)=>n+distance(p[i],b),0);
export function segmentHits(a:Point,b:Point,r:Obstacle):boolean {
  let lo=0,hi=1;
  for(const [p,d,min,max] of [[a.x,b.x-a.x,r.minX,r.maxX],[a.z,b.z-a.z,r.minZ,r.maxZ]]){
    if(Math.abs(d)<1e-8){if(p<=min||p>=max)return false;}
    else {const t1=(min-p)/d,t2=(max-p)/d;lo=Math.max(lo,Math.min(t1,t2));hi=Math.min(hi,Math.max(t1,t2));if(lo>=hi)return false;}
  }
  return hi>1e-5&&lo<1-1e-5;
}
export function clear(a:Point,b:Point,obstacles:Obstacle[]){return !obstacles.some(o=>segmentHits(a,b,o));}
// Visibility graph supplies the shortest collision-free detour when a segment
// crosses a corner. Existing bends stay until their neighbours have line of sight.
export function detour(a:Point,b:Point,obstacles:Obstacle[]):Point[]{
  if(clear(a,b,obstacles))return [a,b];
  const e=.065,vertices=[a,b,...obstacles.flatMap(o=>[
    {x:o.minX-e,z:o.minZ-e},{x:o.maxX+e,z:o.minZ-e},
    {x:o.maxX+e,z:o.maxZ+e},{x:o.minX-e,z:o.maxZ+e}
  ])];
  const dist=vertices.map(()=>Infinity),prev=vertices.map(()=>-1),done=new Set<number>();dist[0]=0;
  for(let count=0;count<vertices.length;count++){
    let u=-1;for(let i=0;i<vertices.length;i++)if(!done.has(i)&&(u<0||dist[i]<dist[u]))u=i;
    if(u<0||!Number.isFinite(dist[u]))break;if(u===1)break;done.add(u);
    for(let v=0;v<vertices.length;v++)if(!done.has(v)&&clear(vertices[u],vertices[v],obstacles)){
      const d=dist[u]+distance(vertices[u],vertices[v]);if(d<dist[v]){dist[v]=d;prev[v]=u;}
    }
  }
  if(prev[1]<0)return [a,b];
  const result:Point[]=[];for(let i=1;i>=0;i=prev[i])result.unshift(vertices[i]);return result;
}
export class Rope {
  bends:Point[]=[];length=0;strain=0;energy=0;
  constructor(public anchor:Point,public maxLength:number){}
  update(end:Point,obstacles:Obstacle[]){
    let points=[this.anchor,...this.bends,end];
    for(let i=1;i<points.length-1;){if(clear(points[i-1],points[i+1],obstacles)){points.splice(i,1);i=Math.max(1,i-1);}else i++;}
    const routed=[points[0]];
    for(let i=1;i<points.length;i++)routed.push(...detour(points[i-1],points[i],obstacles).slice(1));
    this.bends=routed.slice(1,-1);this.length=pathLength(routed);this.strain=this.length/this.maxLength;
    this.energy=Math.max(0,this.length-this.maxLength)**2*18;
    return routed;
  }
  pull(end:Point):Point {
    const p=this.bends.at(-1)??this.anchor,d=Math.max(.01,distance(p,end)),force=Math.min(35,Math.max(0,this.length-this.maxLength)*16);
    return {x:(p.x-end.x)/d*force,z:(p.z-end.z)/d*force};
  }
  release(){const energy=this.energy;this.energy=0;return energy;}
}
export const strainColor=(ratio:number)=>ratio<.7?'#f5f1dc':ratio<.85?'#ffd451':ratio<.97?'#ff922f':'#f34e56';
export function segmentDistance(p:Point,a:Point,b:Point){
  const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
  return distance(p,{x:a.x+t*dx,z:a.z+t*dz});
}

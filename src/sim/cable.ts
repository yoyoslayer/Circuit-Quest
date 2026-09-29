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
const corners=(o:Obstacle,e=.065):Point[]=>[{x:o.minX-e,z:o.minZ-e},{x:o.maxX+e,z:o.minZ-e},{x:o.maxX+e,z:o.maxZ+e},{x:o.minX-e,z:o.maxZ+e}];
const cross=(o:Point,a:Point,b:Point)=>(a.x-o.x)*(b.z-o.z)-(a.z-o.z)*(b.x-o.x);
function inTriangle(p:Point,a:Point,b:Point,c:Point){const d1=cross(a,b,p),d2=cross(b,c,p),d3=cross(c,a,p);return !((d1<0||d2<0||d3<0)&&(d1>0||d2>0||d3>0));}
function strictlyInside(p:Point,a:Point,b:Point,c:Point){const d1=cross(a,b,p),d2=cross(b,c,p),d3=cross(c,a,p),t=1e-7;return (d1>t&&d2>t&&d3>t)||(d1< -t&&d2< -t&&d3< -t);}
/** A bend can come off only if straightening the rope sweeps across nothing. */
export function canUnwrap(a:Point,bend:Point,c:Point,obstacles:Obstacle[]){return clear(a,c,obstacles)&&!obstacles.some(o=>corners(o).some(k=>distance(k,bend)>1e-6&&strictlyInside(k,a,bend,c)));}
/** The corner a rope segment pivoting at `pivot` first touches while its end moves from `from` to `to`. */
export function sweptCorner(pivot:Point,from:Point,to:Point,obstacles:Obstacle[]):Point|undefined{
  if(Math.abs(cross(pivot,from,to))<1e-9)return undefined;
  const base=Math.atan2(from.z-pivot.z,from.x-pivot.x);let best:Point|undefined,bestAngle=Infinity;
  for(const o of obstacles)for(const c of corners(o)){
    if(distance(c,pivot)<1e-6||!inTriangle(c,pivot,from,to)||!clear(pivot,c,obstacles))continue;
    const a=Math.abs(Math.atan2(Math.sin(Math.atan2(c.z-pivot.z,c.x-pivot.x)-base),Math.cos(Math.atan2(c.z-pivot.z,c.x-pivot.x)-base)));
    if(a<bestAngle){bestAngle=a;best=c;}
  }
  return best;
}
export class Rope {
  bends:Point[]=[];length=0;strain=0;energy=0;lastEnd?:Point;
  constructor(public anchor:Point,public maxLength:number){}
  // Bends wrap the corner the moving end actually swept past, so a cable dragged down
  // one corridor never jumps through a door on the other side of a wall.
  update(end:Point,obstacles:Obstacle[]){
    const points=[this.anchor,...this.bends,end];
    for(let i=1;i<points.length-1;){if(canUnwrap(points[i-1],points[i],points[i+1],obstacles)){points.splice(i,1);i=Math.max(1,i-1);}else i++;}
    const routed=[points[0]];
    for(let i=1;i<points.length-1;i++)routed.push(...detour(points[i-1],points[i],obstacles).slice(1));
    let pivot=routed[routed.length-1],from=this.lastEnd??end;
    for(let k=0;k<8&&!clear(pivot,end,obstacles);k++){
      const corner=sweptCorner(pivot,from,end,obstacles);
      if(!corner){routed.push(...detour(pivot,end,obstacles).slice(1,-1));break;}
      routed.push(corner);pivot=corner;
    }
    routed.push(end);this.lastEnd={x:end.x,z:end.z};
    this.bends=routed.slice(1,-1);this.length=pathLength(routed);this.strain=this.length/this.maxLength;
    // Elastic energy is what the slingshot throws: a sprint can stretch the rope ~0.85 m past its length.
    this.energy=Math.max(0,this.length-this.maxLength)**2*60;
    return routed;
  }
  /** Swap which end is anchored (e.g. the player picks up the other plug). */
  flip(anchor:Point){this.anchor=anchor;this.bends.reverse();this.lastEnd=undefined;}
  reset(anchor:Point,maxLength=this.maxLength){this.anchor=anchor;this.maxLength=maxLength;this.bends=[];this.lastEnd=undefined;}
  pull(end:Point):Point {
    const p=this.bends.at(-1)??this.anchor,d=Math.max(.01,distance(p,end)),force=Math.min(35,Math.max(0,this.length-this.maxLength)*8);
    return {x:(p.x-end.x)/d*force,z:(p.z-end.z)/d*force};
  }
  release(){const energy=this.energy;this.energy=0;return energy;}
}
export const strainColor=(ratio:number)=>ratio<.7?'#f5f1dc':ratio<.85?'#ffd451':ratio<.97?'#ff922f':'#f34e56';
export function segmentDistance(p:Point,a:Point,b:Point){
  const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
  return distance(p,{x:a.x+t*dx,z:a.z+t*dz});
}

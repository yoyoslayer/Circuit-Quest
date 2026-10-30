// Room clutter: the "hundreds of props" a floor needs (AGENTS rule 3), laid out at load time.
// Themed clusters (a desk pod, a crate stack, a lounge corner, a parts cart...) are tried on a
// jittered grid over the floor. A cluster goes in only if every prop in it clears the room's fixed
// colliders (walls, benches, fixtures: tested with the same contact query as the layout audit),
// every prop already placed, the coworkers, Pip's spawn and the keep-out lanes a level declares (the
// routes people, robots and cables travel). A seeded generator keeps every load the same.
import RAPIER from '@dimforge/rapier3d-compat';
import {prefabs,type PropKind,type PropSpec} from '../props/prefabs';
import type {Point} from '../sim/cable';

export type Recipe='crates'|'pod'|'lounge'|'bins'|'cones'|'cart'|'shelf'|'cooler'|'reading'|'parts'|'plants'|'cabinets'|'box'|'litter'|'cone'|'bin';
/** A keep-out lane: everything stays more than `r` metres from the segment a→b. */
export interface Lane {a:Point;b:Point;r:number}
export interface ClutterOptions {
  seed:number;recipes:Recipe[];
  /** Grid spacing between cluster anchors (m), and how far anchors keep from the outer walls. */
  step?:number;margin?:number;
  /** Lanes kept clear, as polylines with a half-width. */
  lanes?:{points:[number,number][];r:number}[];
  /** Colour sets the clusters draw from. */
  colors?:string[];
  /** Upper bound on the props added. */
  max?:number;
  /** A second, finer pass of small things (a lone crate, litter, a cone) that fills the gaps. */
  fill?:Recipe[];fillStep?:number;
  /** The fill pass stays within this many metres of the outer walls (storage along the edges). */
  fillBand?:number;
}
interface Item {kind:PropKind;dx:number;dz:number;y?:number;rot?:number;color?:string;variant?:number}
type Rng=()=>number;
const pick=<V>(r:Rng,a:readonly V[])=>a[Math.floor(r()*a.length)];
/** Cluster recipes in local metres; each is turned to a random quarter-turn when placed. */
const RECIPES:Record<Recipe,(r:Rng,c:string[])=>Item[]>={
  crates:(r,c)=>{const n=2+Math.floor(r()*2),out:Item[]=[];for(let i=0;i<n;i++)out.push({kind:'box',dx:i*.78-(n-1)*.39,dz:(r()-.5)*.12,rot:(r()-.5)*.3,color:pick(r,c)});
    out.push({kind:'box',dx:out[0].dx+.05,dz:out[0].dz,y:.95,rot:(r()-.5)*.6,color:pick(r,c)});return out;},
  pod:(r,c)=>[{kind:'desk',dx:0,dz:0,variant:Math.floor(r()*5)},{kind:'monitor',dx:0,dz:-.17,y:1.2,variant:Math.floor(r()*7)},{kind:'chair',dx:.1,dz:.85,color:pick(r,c)},
    {kind:'mug',dx:.55,dz:0,y:1.08,color:pick(r,c)},{kind:'paper',dx:-.4,dz:.05,y:.99}],
  lounge:(r,c)=>[{kind:'beanbag',dx:-.55,dz:0,color:pick(r,c)},{kind:'beanbag',dx:.55,dz:.15,color:pick(r,c)},{kind:'plant',dx:0,dz:-.75},{kind:'paper',dx:.1,dz:.65}],
  bins:(r,c)=>[{kind:'bin',dx:0,dz:0},{kind:'paper',dx:.45,dz:.1},{kind:'paper',dx:-.35,dz:.35},{kind:'mug',dx:.3,dz:-.35,color:pick(r,c)}],
  cones:(r,c)=>[{kind:'cone',dx:-.4,dz:0},{kind:'cone',dx:.35,dz:.25},{kind:'box',dx:0,dz:-.65,color:pick(r,c)}],
  cart:(r,c)=>[{kind:'cart',dx:0,dz:0,color:pick(r,c)},{kind:'box',dx:-.25,dz:0,y:1.0,color:pick(r,c)},{kind:'paper',dx:.3,dz:.05,y:.7}],
  shelf:(r,c)=>[{kind:'bookshelf',dx:0,dz:0,color:pick(r,c)},{kind:'box',dx:.55,dz:.65,color:pick(r,c)},{kind:'bin',dx:-.75,dz:.6}],
  cooler:(r,c)=>[{kind:'cooler',dx:0,dz:0},{kind:'mug',dx:.5,dz:.1,color:pick(r,c)},{kind:'plant',dx:-.7,dz:0}],
  reading:(r,c)=>[{kind:'lamp',dx:-.6,dz:-.1},{kind:'beanbag',dx:.25,dz:0,color:pick(r,c)},{kind:'paper',dx:.3,dz:.6}],
  parts:(r,c)=>[{kind:'reel',dx:-.35,dz:0,color:pick(r,c)},{kind:'cone',dx:.4,dz:-.2},{kind:'splitter',dx:.35,dz:.4},{kind:'box',dx:-.3,dz:.8,color:pick(r,c)}],
  plants:()=>[{kind:'plant',dx:-.38,dz:0},{kind:'plant',dx:.38,dz:.12}],
  cabinets:(r,c)=>[{kind:'cabinet',dx:-.38,dz:0,color:pick(r,c)},{kind:'cabinet',dx:.38,dz:0,color:pick(r,c)},{kind:'box',dx:-.38,dz:0,y:1.9,color:pick(r,c)}],
  box:(r,c)=>[{kind:'box',dx:0,dz:0,rot:(r()-.5)*.8,color:pick(r,c)}],
  litter:(r,c)=>[{kind:'paper',dx:0,dz:0,rot:r()*3},{kind:'paper',dx:.3,dz:.2,rot:r()*3},{kind:'mug',dx:-.25,dz:.15,color:pick(r,c)}],
  cone:()=>[{kind:'cone',dx:0,dz:0}],
  bin:()=>[{kind:'bin',dx:0,dz:0},{kind:'paper',dx:.35,dz:0,rot:1}],
};
const FLOOR=['#c98f5a','#d7a56d','#e0b47a'];
function rng(seed:number):Rng{let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const segDist=(p:Point,a:Point,b:Point)=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l)):0;return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};
/** Half the footprint diagonal of a prop (m). */
const reach=(k:PropKind)=>{const [w,,d]=prefabs[k].size;return Math.hypot(w,d)/2;};

/** Props to add to a level so its floor reads as a busy, lived-in room. */
export function clutter(world:RAPIER.World,level:{width:number;depth:number;spawn:Point;props:PropSpec[];npcs:Point[]},o:ClutterOptions):PropSpec[]{
  const r=rng(o.seed),step=o.step??2.3,margin=o.margin??1.1,colors=o.colors??FLOOR,max=o.max??160;
  const fixed:RAPIER.Collider[]=[];world.forEachCollider(c=>{if(c.parent()?.isFixed())fixed.push(c);});
  const lanes:Lane[]=(o.lanes??[]).flatMap(l=>l.points.slice(1).map((p,i)=>({a:{x:l.points[i][0],z:l.points[i][1]},b:{x:p[0],z:p[1]},r:l.r})));
  const placed:{x:number;z:number;rad:number;stack:boolean}[]=level.props.map(p=>({x:p.x,z:p.z,rad:reach(p.kind),stack:(p.y??0)>.5}));
  const out:PropSpec[]=[],still={x:0,y:0,z:0,w:1};
  // Does a prop of this kind, standing on the floor here and turned by `rot`, clear every fixed collider?
  const clearOfFixtures=(kind:PropKind,x:number,z:number,rot:number,y?:number)=>{const [w,h,d]=prefabs[kind].size,shape=new RAPIER.Cuboid(w/2+.04,h/2,d/2+.04),q={x:0,y:Math.sin(rot/2),z:0,w:Math.cos(rot/2)};
    return fixed.every(f=>{const k=shape.contactShape({x,y:y??h/2+.03,z},q,f.shape,f.translation(),f.rotation(),.02);return !k||k.distance>.01;});};
  const xs=level.width/2-margin,zs=level.depth/2-margin;
  const band=o.fillBand??2.4;
  for(const [recipes,st,edge] of [[o.recipes,step,false],[o.fill??[],o.fillStep??step*.55,true]] as [Recipe[],number,boolean][])if(recipes.length)
  for(let gz=-zs;gz<=zs+1e-6&&out.length<max;gz+=st)for(let gx=-xs;gx<=xs+1e-6&&out.length<max;gx+=st){
    if(edge&&Math.abs(gx)<level.width/2-band&&Math.abs(gz)<level.depth/2-band)continue;
    const ax=gx+(r()-.5)*st*.45,az=gz+(r()-.5)*st*.45,turn=Math.floor(r()*4)*Math.PI/2,c=Math.cos(turn),s=Math.sin(turn);
    const items=RECIPES[pick(r,recipes)](r,colors).map(it=>({...it,x:ax+it.dx*c+it.dz*s,z:az-it.dx*s+it.dz*c,rotation:(it.rot??0)+turn}));
    const ok=items.every(it=>{const rad=reach(it.kind);
      if(Math.abs(it.x)>level.width/2-.45-rad*.6||Math.abs(it.z)>level.depth/2-.45-rad*.6)return false;
      if(Math.hypot(it.x-level.spawn.x,it.z-level.spawn.z)<rad+1.1)return false;
      if(level.npcs.some(n=>Math.hypot(it.x-n.x,it.z-n.z)<rad+.75))return false;
      if(lanes.some(l=>segDist(it,l.a,l.b)<l.r+rad*.7))return false;
      // Stacked items ride on the item below (no floor space of their own), but must clear fixtures too.
      if(it.y&&it.y>.5)return clearOfFixtures(it.kind,it.x,it.z,it.rotation,it.y);
      if(placed.some(p=>!p.stack&&Math.hypot(it.x-p.x,it.z-p.z)<rad+p.rad*.85+.05))return false;
      return clearOfFixtures(it.kind,it.x,it.z,it.rotation);});
    if(!ok)continue;
    for(const it of items){const spec:PropSpec={kind:it.kind,x:+it.x.toFixed(2),z:+it.z.toFixed(2),rotation:+it.rotation.toFixed(3)};if(it.y)spec.y=it.y;if(it.color)spec.color=it.color;if(it.variant!==undefined)spec.variant=it.variant;
      out.push(spec);placed.push({x:it.x,z:it.z,rad:reach(it.kind),stack:(it.y??0)>.5});}
  }
  return out;
}

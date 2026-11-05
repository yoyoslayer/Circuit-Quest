// Room clutter: the "hundreds of props" a floor needs (AGENTS rule 3), laid out at load time.
// Themed clusters (a desk pod, a crate stack, a lounge corner, a parts cart...) are tried on a
// jittered grid over the floor. A cluster goes in only if every prop in it clears the room's fixed
// colliders (walls, benches, fixtures: tested with the same contact query as the layout audit),
// every prop already placed, the coworkers, Pip's spawn and the keep-out lanes a level declares (the
// routes people, robots and cables travel, and the space in front of a room's showpieces). A seeded
// generator keeps every load the same.
import RAPIER from '@dimforge/rapier3d-compat';
import {prefabs,type PropKind,type PropSpec} from '../props/prefabs';
import type {Point} from '../sim/cable';
import {BLOBC} from '../render/kit';

export type Recipe='crates'|'pod'|'lounge'|'bins'|'cones'|'cart'|'shelf'|'cooler'|'reading'|'parts'|'plants'|'cabinets'|'box'|'litter'|'cone'|'bin';
/** A keep-out lane: everything stays more than `r` metres from the segment a→b. */
export interface Lane {a:Point;b:Point;r:number}
export type Family='box'|'cabinet'|'shelf'|'cart'|'fabric'|'small';
type Palette=Record<Family,string[]>;
export interface ClutterOptions {
  seed:number;recipes:Recipe[];
  /** Grid spacing between cluster anchors (m), and how far anchors keep from the outer walls. */
  step?:number;margin?:number;
  /** Lanes kept clear, as polylines with a half-width. */
  lanes?:{points:[number,number][];r:number}[];
  /** The level's accent colours. They dress fabric (chairs, beanbags) and mugs only: cartons are
   *  always kraft, cabinets and shelves office neutrals, carts grey-blue (DR-51/52). Anything close
   *  to job yellow is dropped, because yellow means "job item" (DR-45, R5-101). */
  colors?:string[];
  /** Per-family overrides (also filtered for job yellow), e.g. a fab bay's periwinkle carts. */
  families?:Partial<Record<Family,string[]>>;
  /** Upper bound on the props added. */
  max?:number;
  /** A second, finer pass of small things (a lone crate, litter, a cone) that fills the gaps. */
  fill?:Recipe[];fillStep?:number;
  /** The fill pass stays within this many metres of the outer walls (storage along the edges). */
  fillBand?:number;
  /** How far anchors wander off the grid (a fraction of the step), and the share of fill cells left
   *  empty at random, so the fill pass doesn't read as a ruled row (DR-67). Defaults .45 and 0. */
  jitter?:number;fillSkip?:number;
}
interface Item {kind:PropKind;dx:number;dz:number;y?:number;rot?:number;color?:string;variant?:number}
type Rng=()=>number;
const pick=<V>(r:Rng,a:readonly V[])=>a[Math.floor(r()*a.length)];
/** Cluster recipes in local metres; each is turned to a random quarter-turn when placed. */
const RECIPES:Record<Recipe,(r:Rng,c:Palette)=>Item[]>={
  crates:(r,c)=>{const n=2+Math.floor(r()*2),out:Item[]=[];for(let i=0;i<n;i++)out.push({kind:'box',dx:i*.78-(n-1)*.39,dz:(r()-.5)*.12,rot:(r()-.5)*.3,color:pick(r,c.box)});
    out.push({kind:'box',dx:out[0].dx+.05,dz:out[0].dz,y:.95,rot:(r()-.5)*.6,color:pick(r,c.box)});return out;},
  pod:(r,c)=>[{kind:'desk',dx:0,dz:0,variant:Math.floor(r()*5)},{kind:'monitor',dx:0,dz:-.17,y:1.2,variant:Math.floor(r()*7)},{kind:'chair',dx:.1,dz:.85,color:pick(r,c.fabric)},
    {kind:'mug',dx:.55,dz:0,y:1.08,color:pick(r,c.small)},{kind:'paper',dx:-.4,dz:.05,y:.99}],
  // (The paper lies clear of both beanbags: at dz .65 it touched one at audit .02.)
  lounge:(r,c)=>[{kind:'beanbag',dx:-.55,dz:0,color:pick(r,c.fabric)},{kind:'beanbag',dx:.55,dz:.15,color:pick(r,c.fabric)},{kind:'plant',dx:0,dz:-.75},{kind:'paper',dx:-.05,dz:.9}],
  bins:(r,c)=>[{kind:'bin',dx:0,dz:0},{kind:'paper',dx:.45,dz:.1},{kind:'paper',dx:-.35,dz:.35},{kind:'mug',dx:.3,dz:-.35,color:pick(r,c.small)}],
  cones:(r,c)=>[{kind:'cone',dx:-.4,dz:0},{kind:'cone',dx:.35,dz:.25},{kind:'box',dx:0,dz:-.65,color:pick(r,c.box)}],
  cart:(r,c)=>[{kind:'cart',dx:0,dz:0,color:pick(r,c.cart)},{kind:'box',dx:-.25,dz:0,y:1.0,color:pick(r,c.box)},{kind:'paper',dx:.3,dz:.05,y:.7}],
  shelf:(r,c)=>[{kind:'bookshelf',dx:0,dz:0,color:pick(r,c.shelf)},{kind:'box',dx:.55,dz:.65,color:pick(r,c.box)},{kind:'bin',dx:-.75,dz:.6}],
  cooler:(r,c)=>[{kind:'cooler',dx:0,dz:0},{kind:'mug',dx:.5,dz:.1,color:pick(r,c.small)},{kind:'plant',dx:-.7,dz:0}],
  reading:(r,c)=>[{kind:'lamp',dx:-.6,dz:-.1},{kind:'beanbag',dx:.25,dz:0,color:pick(r,c.fabric)},{kind:'paper',dx:.3,dz:.6}],
  // A spare-parts corner: cartons, a cone and a bin. No reels, splitters or plugs: those shapes mean
  // "job item", so only a level that uses them places them (R5-104).
  parts:(r,c)=>[{kind:'box',dx:-.35,dz:0,rot:.25,color:pick(r,c.box)},{kind:'cone',dx:.4,dz:-.2},{kind:'bin',dx:.4,dz:.45},{kind:'box',dx:-.3,dz:.8,rot:-.3,color:pick(r,c.box)}],
  plants:()=>[{kind:'plant',dx:-.38,dz:0},{kind:'plant',dx:.38,dz:.12}],
  // The carton rests on the cabinet's top trim (1.6 m + .02), not .02 inside it.
  cabinets:(r,c)=>[{kind:'cabinet',dx:-.38,dz:0,color:pick(r,c.cabinet)},{kind:'cabinet',dx:.38,dz:0,color:pick(r,c.cabinet)},{kind:'box',dx:-.38,dz:0,y:1.92,rot:.2,color:pick(r,c.box)}],
  box:(r,c)=>[{kind:'box',dx:0,dz:0,rot:(r()-.5)*.8,color:pick(r,c.box)}],
  litter:(r,c)=>[{kind:'paper',dx:0,dz:0,rot:r()*3},{kind:'paper',dx:.3,dz:.2,rot:r()*3},{kind:'mug',dx:-.25,dz:.15,color:pick(r,c.small)}],
  cone:()=>[{kind:'cone',dx:0,dz:0}],
  bin:()=>[{kind:'bin',dx:0,dz:0},{kind:'paper',dx:.35,dz:0,rot:1}],
};
const FLOOR=['#c98f5a','#d7a56d','#e0b47a'];
// Colour families (DR-51/52): kraft cartons, office-neutral cabinets and shelves, grey-blue carts.
const FAMILY:Record<Exclude<Family,'fabric'|'small'>,string[]>={box:[...FLOOR,'#b9875a'],cabinet:['#aab3c2','#c7ccd6','#dcdfe6'],shelf:['#c7ccd6','#b98552'],cart:['#5f8fa8','#9aa3b2']};
/** Fabric when a level gives no usable accents: saturated, but no coworker or job hue. */
const FABRIC=['#e5484d','#2f5fb8','#c4553b','#4f7d6a'];
const lab=(hex:string)=>{const n=parseInt(hex.slice(1),16),[R,G,B]=[n>>16,n>>8&255,n&255].map(v=>{v/=255;return v>.04045?((v+.055)/1.055)**2.4:v/12.92;});
  const f=(t:number)=>t>.008856?Math.cbrt(t):7.787*t+16/116,X=f((R*.4124+G*.3576+B*.1805)/.95047),Y=f(R*.2126+G*.7152+B*.0722),Z=f((R*.0193+G*.1192+B*.9505)/1.08883);
  return [116*Y-16,500*(X-Y),200*(Y-Z)];};
/** CIE76 colour difference between two #rrggbb colours. */
export const deltaE=(a:string,b:string)=>{const p=lab(a),q=lab(b);return Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2]);};
/** Job yellow: only job items and the grab cue wear it (R5-101). */
export const JOB_YELLOW=['#ffc94d','#ffc629'];
export const nearJobYellow=(hex:string)=>JOB_YELLOW.some(j=>deltaE(hex,j)<25);
/** The colours each family of clutter draws from in a level. */
export function palette(o:Pick<ClutterOptions,'colors'|'families'>):Palette{
  const keep=(a:string[])=>a.filter(c=>!nearJobYellow(c)),accents=keep(o.colors??[]),f=o.families??{};
  const fabric=accents.filter(c=>BLOBC.every(b=>deltaE(c,b)>=15));
  const pal:Palette={...FAMILY,fabric:fabric.length?fabric:FABRIC,small:accents.length?[...accents,'#f4efe6']:['#f4efe6','#e5484d','#3f7fd6','#6cc58a']};
  for(const k of Object.keys(f) as Family[]){const v=keep(f[k]??[]);if(v.length)pal[k]=v;}
  return pal;
}
function rng(seed:number):Rng{let s=seed>>>0||1;return ()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
const segDist=(p:Point,a:Point,b:Point)=>{const dx=b.x-a.x,dz=b.z-a.z,l=dx*dx+dz*dz,t=l?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/l)):0;return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);};
/** Half the footprint diagonal of a prop (m). */
const reach=(k:PropKind)=>{const [w,,d]=prefabs[k].size;return Math.hypot(w,d)/2;};

/** Props to add to a level so its floor reads as a busy, lived-in room. */
export function clutter(world:RAPIER.World,level:{width:number;depth:number;spawn:Point;props:PropSpec[];npcs:Point[]},o:ClutterOptions):PropSpec[]{
  const r=rng(o.seed),step=o.step??2.3,margin=o.margin??1.1,colors=palette(o),max=o.max??160,jitter=o.jitter??.45,skip=o.fillSkip??0;
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
    if(edge&&skip&&r()<skip)continue;
    const ax=gx+(r()-.5)*st*jitter,az=gz+(r()-.5)*st*jitter,turn=Math.floor(r()*4)*Math.PI/2,c=Math.cos(turn),s=Math.sin(turn);
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

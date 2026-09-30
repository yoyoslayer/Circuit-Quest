import * as T from 'three';
/** Real openings at the front section edge, rather than black rectangles laid
 * over solid slabs. Only the rear half remains so the barrel wall can be seen. */
export function sectionSlab(width:number,depth:number,height:number,holes:{x:number;r:number}[]){
  const shape=new T.Shape();shape.moveTo(-width/2,-depth/2);shape.lineTo(width/2,-depth/2);shape.lineTo(width/2,0);
  for(const h of [...holes].sort((a,b)=>b.x-a.x)){
    shape.lineTo(h.x+h.r,0);shape.absarc(h.x,0,h.r,0,-Math.PI,true);
  }
  shape.lineTo(-width/2,0);shape.closePath();
  const g=new T.ExtrudeGeometry(shape,{depth:height,bevelEnabled:false,curveSegments:16});g.rotateX(Math.PI/2);g.translate(0,height/2,0);g.userData.transient=true;return g;
}
/** The copper liner belongs inside the drilled opening. Putting it outside the
 * hole leaves the dielectric wall in front of it and hides the conductive path. */
export function sectionBarrel(radius:number,height:number){
  const g=new T.CylinderGeometry(Math.max(.001,radius-.003),Math.max(.001,radius-.003),height,32,1,true,Math.PI/2,Math.PI);
  g.userData.transient=true;return g;
}
export const CHOICES={
  layers:'Copper layers carry different nets. Through joins both outer faces; buried stays inside; a surface microvia reaches a nearby inner layer.',
  press:'Lamination seals the stack. An internal core must be drilled and plated while it is still accessible; outer-layer drilling can happen after pressing.',
  drill:'A mechanical bit makes a deep round hole. A laser removes a thin dielectric layer. This shop offers one-layer surface microvias; real fabrication processes vary.',
  plate:'A bare hole is insulating glass-fibre. Copper on its wall creates the electrical path. A sealed internal hole is inaccessible to the bath.',
  pad:'The annular ring is copper left around the hole: (pad diameter − hole diameter) / 2. A wider ring tolerates drill wander, but consumes routing space.',
  finish:'Tenting covers exposed copper with mask. Plugging obstructs the opening. Filling and capping makes a flat solderable surface for a via inside a component pad.',
  test:'Compare the section with the required layers, available space and component above it. House profile B is a game shop specification, not a universal manufacturing rule.',
} as const;

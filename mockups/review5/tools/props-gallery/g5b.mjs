// props-gallery pass 5: tumbled round props on box colliders (playground). Runtime-only prop moves in the page.
import {launch} from '../cap.mjs';
import {grab} from './hook.mjs';
const g=await launch('playground',{fullfx:true});await g.advance(1);await grab(g);
const kinds=['plant','cone','bin','beanbag','lamp','reel','mug','box'];
const res=await g.page.evaluate((kinds)=>{const G=window.__g,used=new Set(),out=[];let x=-6.2;
  for(const k of kinds){const p=G.props.find(q=>q.spec.kind===k&&!q.spec.id&&!used.has(q));if(!p){out.push(k+': none');continue;}used.add(p);
    const tipped=k!=='box';const s=Math.SQRT1_2;p.body.setTranslation({x,y:1.0,z:1.6},true);p.body.setRotation(tipped?{x:0,y:0,z:s,w:s}:{x:0,y:0,z:0,w:1},true);p.body.setLinvel({x:0,y:0,z:0},true);p.body.setAngvel({x:0,y:0,z:0},true);out.push(`${k}@${x.toFixed(1)}`);x+=1.05;}
  // a crate on top of a beanbag
  const bag=G.props.find(q=>q.spec.kind==='beanbag'&&!used.has(q)),crate=G.props.find(q=>q.spec.kind==='box'&&!used.has(q));
  if(bag&&crate){bag.body.setTranslation({x:-5,y:.32,z:3.2},true);bag.body.setRotation({x:0,y:0,z:0,w:1},true);crate.body.setTranslation({x:-5,y:1.0,z:3.2},true);crate.body.setRotation({x:0,y:0,z:0,w:1},true);out.push('crate on beanbag @-5,3.2');}
  return out;},kinds);
console.log(res);
await g.advance(3);
const pos=await g.page.evaluate(()=>window.__g.props.filter(p=>Math.abs(p.body.translation().z-1.6)<.6&&p.body.translation().x<2&&p.body.translation().x>-7).map(p=>({k:p.spec.kind,y:+p.body.translation().y.toFixed(3)})));console.log(JSON.stringify(pos));
await g.page.evaluate(()=>{const p=window.__g.player;p.setTranslation({x:-2.5,y:p.translation().y,z:3.6},true);});await g.advance(.5);
await g.zoom(-1500);
await g.orbit(0,-200);await g.shot('props-gallery-73-playground-tumbled-lowcam');
await g.orbit(-180,0);await g.shot('props-gallery-74-playground-tumbled-lowcam-side');
console.log(JSON.stringify(await g.close()));

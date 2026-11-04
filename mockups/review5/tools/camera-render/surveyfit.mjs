// Survey framing: project the room's floor corners (and wall tops) to NDC at 1440x900 and 390x844.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const levels=['lobby','playground','meeting','lunch','arcade','garage','qfn','observatory','spectrum'];
for(const [w,h] of [[1440,900],[390,844]])for(const level of levels){
  const g=await launch(level,{fullfx:false,width:w,height:h});await hook(g);await g.advance(.2);await g.survey();await g.page.waitForTimeout(1500);
  const r=await g.page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');const G=window.__game,c=G.view.camera,W=G.level.width/2,D=G.level.depth/2;c.updateMatrixWorld();
    const pts=[[-W,0,-D],[W,0,-D],[-W,0,D],[W,0,D],[-W,3,-D],[W,3,-D]].map(([x,y,z])=>new T.Vector3(x,y,z).project(c));
    const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y);const out=pts.filter(p=>Math.abs(p.x)>1||Math.abs(p.y)>1).length;
    return {minX:+Math.min(...xs).toFixed(2),maxX:+Math.max(...xs).toFixed(2),minY:+Math.min(...ys).toFixed(2),maxY:+Math.max(...ys).toFixed(2),cornersOff:out,widthFrac:+((Math.max(...xs)-Math.min(...xs))/2).toFixed(2)};});
  console.log(`${w}x${h}`,level.padEnd(12),JSON.stringify(r));await g.close();
}

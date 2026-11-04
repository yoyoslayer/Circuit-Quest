// Corner sweep: Pip near the back-left corner; 16 yaws x 2 zooms; count settled frames where an un-cut shell wall blocks Pip.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
for(const [level,x,z] of [['meeting',-14.5,-8],['playground',-8.3,-3.5],['garage',-9,-6],['lunch',-12,1.5],['observatory',-9,4]]){
  const g=await launch(level,{fullfx:true});await hook(g);await g.advance(.3);await g.walk(x,z,.5,30);
  const res=await g.page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js');const G=window.__game,cam=G.view.camera;const out=[];
    const walls=G.shellWalls.map(w=>{const m=[];w.group.traverse(o=>{if(o.isMesh)m.push(o);});return {w,m};});
    for(const zoom of [14,26])for(let k=0;k<16;k++){G.yaw=k/16*Math.PI*2;G.pitch=-.3;G.zoom=zoom;
      for(let f=0;f<240;f++)G.updateCamera(1/60); // settle camera + wall scales deterministically
      G.view.scene.updateMatrixWorld(true);const p=G.player.translation();let hit=null;
      for(const [i,{w,m}] of walls.entries()){if(w.group.scale.y<.5)continue;for(const y of [p.y-.6,p.y,p.y+.7]){const end=new T.Vector3(p.x,y,p.z),dir=end.clone().sub(cam.position);const d=dir.length();const rc=new T.Raycaster(cam.position.clone(),dir.normalize(),0,d);if(rc.intersectObjects(m,false).length){hit=i;break;}}if(hit!==null)break;}
      if(hit!==null)out.push({zoom,yaw:+G.yaw.toFixed(2),wall:hit===0?'back':'side',cam:[+cam.position.x.toFixed(1),+cam.position.z.toFixed(1)]});}
    return out;});
  console.log(level,'blocked by un-cut shell wall in',res.length,'of 32 settled views',JSON.stringify(res));
  if(res.length){await g.page.evaluate(([y,z])=>{const G=window.__game;G.yaw=y;G.pitch=-.3;G.zoom=z;},[res[0].yaw,res[0].zoom]);await g.advance(.1);await g.page.waitForTimeout(2200);await g.shot(`camera-render-${level}-12-corner-wall-up`);}
  console.log(await g.close());
}

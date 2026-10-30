// Small helpers every station uses for the moments around the bench: the job-done confetti and
// the walking hint in the room.
import * as T from 'three';
import {toon,cyl,sphere,part,group,canvasTex,INK} from '../render/kit';
import {hot} from '../render/actors';
import type {Game} from '../game';
import type {Prompt} from './types';

type Spot={x:number;y:number;z:number};
/** A job-done confetti pop. At the bench it goes off behind and above the far edge of the table,
 *  small, so nothing flies through the close camera or hangs over the readouts; in the room it goes
 *  off where asked. */
export function cheer(game:Game,st:{table:T.Vector3;stand:{x:number;z:number}},color:string,at?:Spot,count=24){
  if(game.atBench||!at){
    const dx=st.table.x-st.stand.x,dz=st.table.z-st.stand.z,l=Math.hypot(dx,dz)||1;
    game.burst({x:st.table.x+dx/l*1.8,y:st.table.y+1.4,z:st.table.z+dz/l*1.8},color,Math.min(count,12),'confetti');return;}
  game.burst(at,color,count,'confetti');
}

/** Walking hints for the key pill: retired (the job card and the arrow carry them). */
export function walkHint(_game:Game,_text:string|undefined):Prompt|null{
  // The job card and the yellow arrow already say where to go; the key pill is kept for actions.
  return null;
}

/** The one fuse/breaker reset control every bench uses (Arcade, Garage, Depot): a black holder
 *  with a red dome and a RESET plate. Tripped, the dome pops up and glows and a ring pulses round it.
 *  Call `set(tripped, time)` from the station's update. */
export function resetButton(parent:T.Object3D,x:number,y:number,z:number,scale=1,plate=true){
  const g=group(parent,x,y,z);g.scale.setScalar(scale);
  part(g,cyl(.085,.095,.05,24),toon(INK),0,.025,0);
  const dome=part(g,sphere(.068,18,10),toon('#e5484d'),0,.05,0);dome.scale.y=.6;
  const ring=part(g,new T.TorusGeometry(.11,.012,8,32),hot('#ff6b5a',1.4),0,.03,0,false);ring.rotation.x=-Math.PI/2;ring.visible=false;
  if(plate){const p=part(g,new T.PlaneGeometry(.2,.06),new T.MeshBasicMaterial({map:resetPlate(),transparent:true}),0,.052,.13,false);p.rotation.x=-Math.PI/2;p.userData.noAO=true;
    (p.material as T.Material).userData.outlineParameters={visible:false};}
  const calm=toon('#e5484d'),lit=hot('#ff5a4d',1.6);
  return {group:g,set(tripped:boolean,time:number){
    dome.material=tripped?lit:calm;dome.position.y=tripped?.075:.05;ring.visible=tripped;
    if(tripped){const k=1+.25*(.5+.5*Math.sin(time*6));ring.scale.setScalar(k);}}};
}
let plateTex:T.Texture|undefined;
function resetPlate(){return plateTex??=canvasTex(320,96,c=>{c.fillStyle='#fffaf0';c.beginPath();c.roundRect(4,4,312,88,22);c.fill();c.lineWidth=6;c.strokeStyle=INK;c.stroke();
  c.fillStyle='#d63a3f';c.font='700 56px "Fredoka Variable", "Fredoka", system-ui, sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('RESET',160,52);});}

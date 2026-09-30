import * as T from 'three';
import type {Game} from '../../game';
import {box,cyl,sphere,part,group,toon,DMETAL,INK} from '../../render/kit';
import {solid} from '../../levels/decor';
import {signPlate} from '../../render/labels';
import {CELLS,type Workcell} from './workflow';
export function equipment(game:Game,click:(obj:T.Object3D,act:string,arg?:unknown)=>void){
  const roots={} as Record<'press'|'drill'|'plate',T.Group>;
  for(const id of ['press','drill','plate'] as const){const t=CELLS[id].table,yaw=id==='plate'?-Math.PI/2:Math.PI/2,r=group(game.root,t.x,0,t.z,yaw);roots[id]=r;
    part(r,box(2.4,.12,1.6),toon('#c3ced0'),0,.94,0);for(const x of [-1,1])part(r,box(.13,.9,1.3),toon('#435564'),x,.45,0);
    solid(game,2.4,1,1.6,t.x,.5,t.z,yaw);
    signPlate(r,CELLS[id].label,0,.7,.82,2,{bg:'#233e48',fg:'#eef6f3'});
  }
  const press=roots.press,pressHead=group(press,0,1.8,0);
  for(const x of [-.95,.95])part(press,cyl(.075,.075,1.6,12),toon(DMETAL),x,1.7,-.55);
  part(pressHead,box(2.1,.24,1.25),toon('#437ca3'));
  part(press,box(2.1,.12,1.25),toon('#437ca3'),0,1.08,0);
  const lever=group(press,-.3,1.15,.8);part(lever,cyl(.035,.035,.3,10,'z'),toon(DMETAL),0,0,.1);const pressHandle=part(lever,sphere(.09),toon('#d3684f'),0,.05,.22);click(lever,'press');
  signPlate(press,'P / PRESS',.45,1.3,.7,.9,{bg:'#f4e8c8'});
  const drill=roots.drill,drillHead=group(drill,0,1.95,0);
  part(drill,box(.17,1.5,.18),toon(DMETAL),-.8,1.75,-.5);part(drillHead,box(.7,.34,.5),toon('#d5b366'));
  const spindle=group(drillHead,0,-.26,0);part(spindle,cyl(.032,.018,.4,12),toon('#bccad0'),0,-.07,0);
  const flute=new T.CatmullRomCurve3(Array.from({length:24},(_,i)=>new T.Vector3(Math.cos(i*.8)*.034,-.25+i*.016,Math.sin(i*.8)*.034)));
  part(spindle,new T.TubeGeometry(flute,32,.008,5,false),toon('#687d89'));
  const laserBeam=part(drillHead,cyl(.008,.008,.5,8),toon('#ed796c',{emissive:'#d15a4b',ei:1}),0,-.36,0,false);laserBeam.visible=false;click(drillHead,'drill');
  const drillHandle=part(drill,cyl(.13,.13,.05,16,'z'),toon('#ad6550'),-.3,1.15,1.02);click(drillHandle,'drill');
  signPlate(drill,'D / DRILL',0,1.9,.3,.7,{bg:'#e4c68b'});
  const bits:T.Mesh[]=[];
  for(const [i,id] of ['mech-0.30','mech-0.20','laser-0.10'].entries()){
    const tool=group(drill,-.75+i*.7,1.03,.54);
    part(tool,box(.5,.045,.25),toon(INK));const bit=part(tool,cyl([.04,.027,.065][i],i===2?.055:.012,.27,12),toon(i===2?'#bd5955':'#cad7d9'),0,.15,0);bit.userData.drill=id;bits.push(bit);
    signPlate(tool,['0.30 mm','0.20 mm','LASER'][i],0,.035,.14,.5,{bg:'#eef4f0'});click(tool,'bit',id);
  }
  const bath=roots.plate;
  part(bath,box(1.85,.5,1.05),toon('#5c8f98'),0,1.28,0);part(bath,box(1.7,.025,.9),toon('#53949e'),0,1.545,0);
  for(const x of [-.85,.85])part(bath,box(.08,.3,1),toon(DMETAL),x,1.68,0);
  const basket=group(bath,0,1.9,0);part(basket,box(1,.05,.6),toon('#526470'));for(const x of [-.45,.45])part(basket,box(.03,.32,.6),toon(DMETAL),x,.15,0);click(basket,'plate');
  const plateHandle=part(bath,sphere(.09),toon('#ad6550'),-.3,1.12,1.02);click(plateHandle,'plate');
  signPlate(bath,'L / LOWER BASKET',0,1.3,.57,1.7,{bg:'#bfdfd9'});
  const bubbles=Array.from({length:8},(_,i)=>part(bath,sphere(.035,8,6),toon('#b5ded8'),-.65+(i%4)*.42,1.57,-.28+Math.floor(i/4)*.5,false));
  return {pressHead,drillHead,spindle,laserBeam,basket,bubbles,bits,lever,pressHandle,drillHandle,plateHandle};
}

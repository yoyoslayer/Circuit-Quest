// Text plates for signs in the world: rounded card, ink border, Fredoka type that shrinks to fit.
import * as T from 'three';
import {canvasTex,part,INK} from './kit';

const cache=new Map<string,T.Texture>();
export function labelTexture(text:string,{bg='#fffaf0',fg=INK,w=256,h=80,border=true}:{bg?:string;fg?:string;w?:number;h?:number;border?:boolean}={}){
  const key=`${text}|${bg}|${fg}|${w}|${h}|${border}`;let t=cache.get(key);if(t)return t;
  t=canvasTex(w,h,c=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(22,h*.25));c.fill();if(border){c.lineWidth=6;c.strokeStyle=fg;c.stroke();}
    let size=Math.round(h*.46);const font=(n:number)=>`700 ${n}px "Fredoka Variable", "Fredoka", system-ui, sans-serif`;c.font=font(size);while(size>10&&c.measureText(text).width>w-30){size--;c.font=font(size);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);});
  cache.set(key,t);return t;
}
/** A flat sign facing +z in its parent's space; width in metres, height from the texture aspect. */
export function signPlate(parent:T.Object3D,text:string,x:number,y:number,z:number,width:number,opts:Parameters<typeof labelTexture>[1]={}){
  const w=opts.w??256,h=opts.h??80,m=new T.MeshBasicMaterial({map:labelTexture(text,opts),transparent:true});m.userData.outlineParameters={visible:false};
  const mesh=part(parent,new T.PlaneGeometry(width,width*h/w),m,x,y,z,false);mesh.userData.noAO=true;return mesh;
}

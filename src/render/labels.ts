// Text plates for signs in the world: rounded card, ink border, Fredoka type that shrinks to fit.
import * as T from 'three';
import {canvasTex,part,INK} from './kit';

const FACE='"Fredoka Variable", "Fredoka", system-ui, sans-serif';
const cache=new Map<string,{t:T.Texture;draw:(c:CanvasRenderingContext2D)=>void}>();
/** Redraws every cached plate into its own canvas (same size, same texture object). */
export function redrawLabels(){for(const {t,draw} of cache.values()){const c=(t.image as HTMLCanvasElement).getContext('2d');if(!c)continue;c.clearRect(0,0,c.canvas.width,c.canvas.height);draw(c);t.needsUpdate=true;}}
// A cold first visit builds the lobby before the Fredoka woff2 arrives (render-6): canvas text then
// falls back to system-ui and the cache kept it for the session. Ask for the face on the first plate
// and redraw every cached plate once it has loaded; plates drawn after that use it straight away.
let fontAsked=false;
function askFont(fonts:FontFaceSet|undefined=globalThis.document?.fonts){
  if(fontAsked||!fonts)return;fontAsked=true;const spec=`700 48px ${FACE}`;
  if(fonts.check(spec))return;fonts.load(spec).then(f=>{if(f.length)redrawLabels();},()=>{});
}
export function labelTexture(text:string,{bg='#fffaf0',fg=INK,w=256,h=80,border=true}:{bg?:string;fg?:string;w?:number;h?:number;border?:boolean}={}){
  const key=`${text}|${bg}|${fg}|${w}|${h}|${border}`;const hit=cache.get(key);if(hit)return hit.t;askFont();
  const draw=(c:CanvasRenderingContext2D)=>{c.fillStyle=bg;c.beginPath();c.roundRect(4,4,w-8,h-8,Math.min(22,h*.25));c.fill();if(border){c.lineWidth=6;c.strokeStyle=fg;c.stroke();}
    let size=Math.round(h*.46);const font=(n:number)=>`700 ${n}px ${FACE}`;c.font=font(size);while(size>10&&c.measureText(text).width>w-30){size--;c.font=font(size);}
    c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2+2);};
  const t=canvasTex(w,h,draw);cache.set(key,{t,draw});return t;
}
/** A flat sign facing +z in its parent's space; width in metres, height from the texture aspect. */
export function signPlate(parent:T.Object3D,text:string,x:number,y:number,z:number,width:number,opts:Parameters<typeof labelTexture>[1]={}){
  const w=opts.w??256,h=opts.h??80,m=new T.MeshBasicMaterial({map:labelTexture(text,opts),transparent:true});m.userData.outlineParameters={visible:false};
  const mesh=part(parent,new T.PlaneGeometry(width,width*h/w),m,x,y,z,false);mesh.userData.noAO=true;return mesh;
}

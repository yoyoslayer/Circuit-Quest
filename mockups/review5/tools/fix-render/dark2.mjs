// R5-141 numeric check: storeroom luma with no lid, darkness off vs on, and the corridor luma for scale.
// Also takes a survey shot with the dark box on and the lid hidden.
import {launch} from '../cap.mjs';
const g=await launch('lunch',{fullfx:true});await g.advance(.5);await g.survey();
const measure=amount=>g.page.evaluate(async a=>{const m=await import('/src/render/toon.ts');const G=window.__game;Object.assign(m.darkBox,{x:-16.6,y:-7.75,z:-10.2,w:0});m.darkness.amount=a;
  G.lunch.dark.visible=false;G.view.render();const R=G.view.renderer,gl=R.getContext(),c=G.view.camera;
  const T=await import('/node_modules/.vite/deps/three.js');const at=(x,y,z)=>{const v=new T.Vector3(x,y,z).project(c);const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight;const px=Math.round((v.x+1)/2*w),py=Math.round((v.y+1)/2*h);const p=new Uint8Array(4*25);gl.readPixels(px-2,py-2,5,5,gl.RGBA,gl.UNSIGNED_BYTE,p);let s=0;for(let i=0;i<25;i++)s+=.2126*p[i*4]+.7152*p[i*4+1]+.0722*p[i*4+2];return Math.round(s/25);};
  return {store:[at(-12,0,-6),at(-14,0,-3),at(-10,0,-8)],corridor:[at(-12,0,4),at(-3,0,4)]};},amount);
console.log('off',JSON.stringify(await measure(0)));console.log('on ',JSON.stringify(await measure(1)));
await g.shot('fix-render-lunch-store-dark-survey');await g.close();

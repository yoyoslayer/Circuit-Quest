import {launch} from '../cap.mjs';
const g=await launch('arcade',{fullfx:false});
const u=(await g.page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name))).filter(n=>/three/.test(n));
console.log(u.slice(0,20));
console.log(await g.page.evaluate(async(u)=>{const T=await import(u);window.__n=0;const o=T.WebGLRenderer.prototype.render;T.WebGLRenderer.prototype.render=function(s,c){window.__n++;window.__last=s;return o.call(this,s,c);};
  const O=T.Object3D.prototype.updateMatrixWorld;return typeof o;},u.find(x=>/deps\/three\.js/.test(x))));
await g.advance(.1);
console.log(await g.page.evaluate(()=>[window.__n,window.__last&&window.__last.type]));
console.log(await g.close());

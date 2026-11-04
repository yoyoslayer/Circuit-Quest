import {launch} from '../cap.mjs';
const g=await launch('observatory',{fullfx:true});
const ok=await g.page.evaluate(async()=>{const T=await import('/node_modules/.vite/deps/three.js?v=44662d17');window.__T=T;const R=T.WebGLRenderer.prototype.render;let k=0;T.WebGLRenderer.prototype.render=function(s,c){k++;window.__k=k;(window.__seen??=new Set()).add(s);return R.call(this,s,c);};
 const P=T.Object3D.prototype.updateMatrixWorld;T.Object3D.prototype.updateMatrixWorld=function(f){if(this.isScene)(window.__scenes??=new Set()).add(this);return P.call(this,f);};return Object.keys(T).length;});
console.log(ok);
await g.advance(.1);
const info=await g.page.evaluate(()=>({k:window.__k,seen:[...(window.__seen??[])].map(s=>s.type+':'+s.children.length),scenes:[...(window.__scenes??[])].map(s=>s.children.length)}));
console.log(JSON.stringify(info));
console.log(JSON.stringify(await g.close()));

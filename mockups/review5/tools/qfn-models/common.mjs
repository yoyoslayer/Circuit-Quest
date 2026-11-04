import {launch} from '../cap.mjs';
export const P='qfn-models';
export async function open(opts={}){
  const g=await launch('qfn',{fullfx:true,...opts});
  const u=(await g.page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name))).find(n=>/src\/game\.ts/.test(n));
  await g.page.evaluate(async(u)=>{const M=await import(u);const G=M.Game;const o=G.prototype.render;G.prototype.render=function(...a){window.__game=this;return o.apply(this,a);};window.__circuitCrew.drive.advance(.05);G.prototype.render=o;},u);
  g.tp=async(x,z,settle=1)=>{await g.page.evaluate(([x,z])=>{const p=window.__game.player;p.setTranslation({x,y:.8,z},true);p.setLinvel({x:0,y:0,z:0},true);},[x,z]);await g.advance(settle);};
  return g;
}

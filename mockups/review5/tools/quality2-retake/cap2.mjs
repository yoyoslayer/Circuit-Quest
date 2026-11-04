// Quality-2 launch: same as ../cap.mjs, but writes circuit-crew-quality='2' before load and exposes window.__game.
import {launch as base} from '../cap.mjs';
export const QK='circuit-crew-quality';
export async function hookGame(g){
  await g.page.evaluate(async()=>{const m=await import('/src/game.ts');const P=m.Game.prototype;if(!P.__hooked){const o=P.render;P.render=function(dt){window.__game=this;return o.call(this,dt);};P.__hooked=true;}});
  await g.advance(.05);
}
export async function q(g){return g.page.evaluate(()=>{const G=window.__game;return {stored:localStorage.getItem('circuit-crew-quality'),quality:G?.view?.getQuality?.(),dpr:G?.view?.renderer?.getPixelRatio?.(),ao:G?.view?.composer?.passes?.map(p=>p.constructor.name+':'+p.enabled).join(','),fps:+(G?.fps??0).toFixed(0),draw:G?.view?.renderer?.info?.render?.calls};});}
export async function launch2(level,opts={},quality='2'){
  const g=await base(level,{...opts,start:false});
  await g.page.evaluate(([k,v])=>{if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,v);},[QK,quality]);
  await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]',{timeout:120000});
  const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
  await hookGame(g);return g;
}

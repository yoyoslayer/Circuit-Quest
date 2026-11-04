// Grabs the live Game instance (read-only inspection) by wrapping Game.prototype.snapshot in the page.
export async function hook(g){
  return g.page.evaluate(async()=>{
    const mod=await import('/src/game.ts');const P=mod.Game.prototype;
    if(!P.__wrapped){const o=P.snapshot;P.snapshot=function(){window.__g=this;return o.call(this);};P.__wrapped=true;}
    window.__circuitCrew.snapshot();return !!window.__g;
  });
}

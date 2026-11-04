export const hud=g=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,prompt:document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace(/\n/g,' ')}));
export async function placeStrip(g){await g.walk(-8.6,-3.9,.4);await g.key('KeyE');for(const [x,z] of [[-8,-1.4],[6,-1.2],[11.2,-1.4]])await g.walk(x,z);await g.key('KeyE',.2);return g.snap();}
export async function route(g,pts,r=.5){let w;for(const [x,z] of pts){w=await g.walk(x,z,r);if(!w.arrived)console.log('STUCK toward',x,z,JSON.stringify(w.state.player));}return w;}

export const ui=g=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.innerText,pill:(()=>{const p=document.querySelector('.prompt-pill');return p&&!p.hidden?p.innerText.replace(/\n/g,' '):null})(),toast:(()=>{const t=document.querySelector('.station-toast');return t&&!t.hidden?t.innerText:null})()}));
export const route=async(g,pts,r=.5)=>{for(const [x,z] of pts){const w=await g.walk(x,z,r);if(!w.arrived)console.log('STUCK',x,z,JSON.stringify(w.state.player));}};
export async function job1(g){
  await g.walk(-6.4,6.4,.6);await g.key('KeyE');
  await route(g,[[-10.1,3],[-10.1,-2.2],[-10.1,-4.4],[-9.3,-5.5]]);await g.key('KeyE');
  await route(g,[[-10.1,-4.4],[-10.1,-2.2],[-6.4,1.2],[-6.3,3.6]]);await g.walk(-3.5,3.55,.4);await g.key('KeyE');
  await g.act('band','radio');await g.act('send');await g.key('KeyE');
}
// Bench map: plan metres -> screen px at 1440x900 bench view (fitted from shots 12/29).
export const mapPx=(x,z)=>{const u=(30+(x+11)*47.27)/1100,v=(28+(z+8)*47.27)/800;return [539+u*359.6,387.4+v*257];};
export async function job2setup(g){
  await route(g,[[-6.3,3.6],[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4]]);await g.walk(-9.3,-5.4,.5);await g.key('KeyE');
  await route(g,[[-10.1,-4.2],[-10.1,-1.4],[0,-1.4],[10.2,-1.4],[10.2,-4.6],[8.4,-5.6]]);await g.key('KeyE');
  await route(g,[[10.2,-4.4],[10.2,-1.8],[-.9,-1.8]]);await g.walk(-.9,-4.55,.3);await g.key('KeyE');
  await route(g,[[-.9,-1.6],[2.6,-.2]]);await g.key('KeyE');
  await route(g,[[1.5,1.2],[.6,4.2]]);await g.walk(-3.5,3.55,.4);await g.key('KeyE');await g.advance(1);
}

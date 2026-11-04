import {launch} from '../cap.mjs';
const log=(...a)=>console.log(...a);
const g=await launch('playground',{fullfx:true});
const B=s=>JSON.stringify(s.rope.bends.map(b=>[+b.x.toFixed(2),+b.z.toFixed(2)]));
const prompt=()=>g.page.evaluate(()=>[...document.querySelectorAll('*')].filter(e=>e.children.length===0&&/slingshot|Drop the plug|Plug in/.test(e.textContent)).map(e=>e.textContent).join('|'));
await g.advance(.5);await g.key('KeyF');
// Walk (no sprint) past the end of the reel along the clean route and keep walking into the limit.
for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]]){await g.walk(x,z,.4,10);}
let s=await g.advance(2,['KeyD']);log('walk into limit',s.rope.strain.toFixed(4),s.player.x.toFixed(2),s.player.z.toFixed(2),await prompt());
s=await g.advance(.6);log('stood .6s',s.rope.strain.toFixed(4),'over m',(s.rope.length-s.rope.maxLength).toFixed(3),await prompt());
await g.shot('cable-100-pg-standing-at-limit-prompt');
await g.page.keyboard.press('KeyQ');s=await g.advance(1/60);log('Q standing: fastest',s.fastestProp.toFixed(2),'holding',s.holdingPlug);
s=await g.advance(.4);await g.shot('cable-101-pg-standing-q-nothing');log('after .4 fastest',s.fastestProp.toFixed(2),'plug at',s.rope.length.toFixed(2));
// Spool readable from here at game camera? crop around the reel after orbiting it into view
await g.survey();await g.shot('cable-102-pg-survey-cable-taut');await g.survey();
// Pick plug back up and press plug into a crate: does the cable clip through?
await g.key('KeyF');s=await g.snap();log('re-pick',s.holdingPlug);
// walk to bookshelf next to socket (from shot 17) and press against it
const shelves=await g.page.evaluate(()=>window.__circuitCrew.props.filter(p=>p.spec.kind==='bookshelf').map(p=>({...p.body.translation()})));
log('bookshelves',JSON.stringify(shelves.map(p=>[+p.x.toFixed(2),+p.z.toFixed(2)])));
log(await g.close());

// Bench tags (R5-064), knob drag (R5-022) and the 68 µF readout (R5-115).
//   set BASE=http://localhost:4194 && node mockups/review5/tools/fix-observatory/04-bench.mjs
import {launch} from '../cap.mjs';
const g=await launch('observatory');
const tp=(x,z)=>g.page.evaluate(([x,z])=>{window.__game.player.setTranslation({x,y:1,z},true);},[x,z]);
await g.advance(.5);await tp(0,-1.4);await g.advance(.5);await g.key('KeyE',1.2);
await g.act('pick','C');await g.act('slot','shunt');await g.act('value',{slot:'shunt',value:1.5e-6});await g.advance(.3);
await g.shot('fix-observatory-40-bench-shuntC');await g.crop('fix-observatory-40c-tag',{x:560,y:480,width:420,height:200});
// Knob drag: find the shunt can on screen and drag 180 px.
const at=await g.page.evaluate(()=>{const g=window.__game,st=g.station,v=st.slotAt.shunt.clone();st.top.localToWorld(v);v.project(g.view.camera);const r=g.view.renderer.domElement.getBoundingClientRect();return {x:r.left+(v.x*.5+.5)*r.width,y:r.top+(-v.y*.5+.5)*r.height};});
const val=async()=>(await g.snap()).station.shunt.value;
await g.act('value',{slot:'shunt',value:1e-7});await g.advance(.1);
for(const px of [40,180]){await g.act('value',{slot:'shunt',value:1e-7});await g.page.mouse.move(at.x,at.y);await g.page.mouse.down();
  for(let k=1;k<=12;k++){await g.page.mouse.move(at.x+px*k/12,at.y);await g.page.waitForTimeout(70);}await g.page.mouse.up();console.log(`drag ${px} px ->`,await val());}
await g.act('pick','L');await g.act('slot','series');await g.act('value',{slot:'series',value:.01});await g.act('value',{slot:'shunt',value:1e-6});await g.advance(.3);
await g.shot('fix-observatory-41-bench-LC');await g.crop('fix-observatory-41c-tags',{x:440,y:470,width:560,height:220});
await g.act('slot','series');await g.act('value',{slot:'shunt',value:6.8e-5});await g.act('route');await g.advance(.5);
const s=(await g.snap()).station;console.log('68uF',s.reading.snr,s.reading.level.toFixed(2),s.decodedText);
await g.shot('fix-observatory-42-shunt68u');
console.log('errors',await g.close());

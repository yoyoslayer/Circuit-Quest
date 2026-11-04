import {launch2} from '../quality2-retake/cap2.mjs';
for(const lvl of ['garage','meeting']){for(const v of ['2','1','0']){const g=await launch2(lvl,{fullfx:true},v);await g.advance(1);const s=await g.snap();
 const q=await g.page.evaluate(()=>window.__game.view.getQuality());console.log(lvl,'q',q,'draws',s.drawCalls);
 if(lvl==='garage'&&v!=='0')await g.shot(`verify-gap2-quality2-retake-0${v}-garage-start-q${v}`);await g.close();}}

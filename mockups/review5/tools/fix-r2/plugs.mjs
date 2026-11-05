// R5-185: the carried cable end is a trailing socket; the Playground lamp inlet and the Meeting strip carry prongs.
import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});await g.advance(1);await g.zoom(-1500);
await g.key('KeyF',.3);await g.advance(.5);await g.crop('fix-r2-plug-carried',{x:420,y:120,width:600,height:660});
const t=await g.page.evaluate(()=>window.__game.level.target);await g.walk(t.x-2.2,t.z,.3);await g.walk(t.x-1.4,t.z,.2);await g.advance(.4);
await g.crop('fix-r2-plug-at-inlet',{x:420,y:120,width:600,height:660});await g.key('KeyF',.6);await g.walk(t.x-1.6,t.z+1.2,.3);await g.orbit(-300,0);await g.advance(.5);await g.shot('fix-r2-plug-seated');
console.log('connected',(await g.snap()).electrical,g.errors.filter(e=>!/Fredoka|403/.test(e)).join('|')||'no errors');await g.close();

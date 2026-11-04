// Verifier: walking strike, practice-wall plug, clean solve close-ups (plug, socket, switch, win).
import {launch} from '../cap.mjs';
const K='verify-playground-models';let s;
{const g=await launch('playground',{fullfx:true});await g.advance(.5);
 for(const [x,z] of [[3.6,5.3],[6.4,5.3],[4.4,4.4],[5.9,6.3],[4.4,6.2],[5.9,4.3],[3.6,5.0],[6.5,5.6]]){await g.walk(x,z,.25,6);}
 await g.advance(1.5);s=await g.snap();console.log('walk-only pinsDown',s.pinsDown,'t',s.time.toFixed(1),'holdingPlug',s.holdingPlug,'rope len',s.rope.length.toFixed(2));
 await g.shot(`${K}-10-walk-only-strike`);
 console.log('errors',JSON.stringify(await g.close()));}
{const g=await launch('playground',{fullfx:true});await g.advance(.5);await g.key('KeyF',.3);
 await g.zoom(-2000);await g.shot(`${K}-11-hold-plug-close`);await g.orbit(600,0);await g.shot(`${K}-12-hold-plug-side`);await g.orbit(-600,0);await g.zoom(2000);
 // practice wall: green socket at x=-3.6
 await g.walk(-5,-1);await g.walk(-3.6,-8.7,.3);s=await g.snap();console.log('at practice wall hold',s.holdingPlug,'strain',s.rope.strain.toFixed(2),'len',s.rope.length.toFixed(2));
 await g.zoom(-2000);await g.shot(`${K}-13-practice-wall-hold`);await g.key('KeyF',.4);s=await g.snap();console.log('after F at practice wall: holding',s.holdingPlug,'electrical',s.electrical);await g.shot(`${K}-14-practice-wall-after-F`);await g.zoom(2000);
 await g.key('KeyF',.3);s=await g.snap();console.log('re-grab',s.holdingPlug);
 await g.walk(-4,-4);await g.walk(5.8,-5.5);await g.zoom(-2000);await g.shot(`${K}-15-at-socket-close`);
 await g.key('KeyF',.4);await g.shot(`${K}-16-plugged-close`);await g.orbit(450,0);await g.shot(`${K}-17-plugged-close-o450`);await g.orbit(-900,0);await g.shot(`${K}-18-plugged-close-o-450`);await g.orbit(450,0);await g.zoom(2000);
 await g.walk(6.6,-5.9,.4);await g.zoom(-2000);await g.shot(`${K}-19-before-switch`);await g.key('KeyE',.1);s=await g.snap();console.log('switched',s.switchedOn,'won',s.won);
 await g.advance(1.6);await g.shot(`${K}-20-win-pushin`);
 console.log('errors',JSON.stringify(await g.close()));}

// Coffee steam close-up, sprint dust, Lunch storeroom lid orbits, meeting closet/lunch kitchen wall fades.
import {launch} from '../cap.mjs';
import {hook,occl} from './hook.mjs';
const S='mockups/review5/shots/';
{const g=await launch('meeting',{fullfx:true});await hook(g);await g.advance(.5);
 const c=(await g.snap()).items.find(i=>i.id==='coffee');console.log('coffee',JSON.stringify(c?.pos));
 await g.walk(-10,-5);await g.walk(-10,2.8);await g.zoom(-1500,.3);
 await g.page.evaluate(()=>{const G=window.__game;G.yaw=.6;G.pitch=-.3;});await g.advance(.1);
 for(let k=0;k<12;k++)await g.advance(.25);await g.page.waitForTimeout(1800);await g.shot('camera-render-me-50-coffee-steam-z9');
 // sprint dust
 await g.zoom(600,.3);await g.walk(-9,-5,.5);await g.page.evaluate(()=>{window.__game.yaw=1.4;});
 await g.advance(.9,['KeyW','ShiftLeft']);await g.page.screenshot({path:S+'camera-render-me-51-sprint-dust.png'});
 // server closet wall at low orbit (QA5): walk next to closet, orbit low behind
 await g.walk(-10,-5.5);await g.page.evaluate(()=>{const G=window.__game;G.yaw=-2.4;G.pitch=-.3;G.zoom=14;});await g.advance(.1);await g.page.waitForTimeout(2200);
 console.log('closet',JSON.stringify((await occl(g)).blocked));await g.shot('camera-render-me-52-closet-low-orbit');
 console.log(await g.close());}
{const g=await launch('lunch',{fullfx:true});await hook(g);await g.advance(.5);
 // storeroom lid from the game camera, then orbit and zoom
 await g.walk(-10,-1.5);await g.page.waitForTimeout(1500);await g.shot('camera-render-lu-53-storeroom-gamecam');
 await g.page.evaluate(()=>{const G=window.__game;G.yaw=-.9;G.pitch=-.3;G.zoom=12;});await g.advance(.1);await g.page.waitForTimeout(2200);await g.shot('camera-render-lu-54-storeroom-lid-low');
 await g.page.evaluate(()=>{const G=window.__game;G.yaw=2.2;G.pitch=-.3;G.zoom=12;});await g.advance(.1);await g.page.waitForTimeout(2200);await g.shot('camera-render-lu-55-storeroom-lid-back');
 // kitchen/corridor wall (LR7)
 await g.walk(-7.2,-.3);await g.page.evaluate(()=>{const G=window.__game;G.yaw=.14;G.pitch=-.3;G.zoom=12;});await g.advance(.1);await g.page.waitForTimeout(2200);
 console.log('lr7',JSON.stringify((await occl(g)).blocked));await g.shot('camera-render-lu-56-kitchen-wall-LR7');
 await g.walk(-2,-3.5);await g.page.evaluate(()=>{const G=window.__game;G.yaw=.14;G.pitch=-.3;G.zoom=12;});await g.advance(.1);await g.page.waitForTimeout(2200);
 console.log('kitchen in',JSON.stringify((await occl(g)).blocked));await g.shot('camera-render-lu-57-in-kitchen-low');
 console.log(await g.close());}

import {launch} from '../cap.mjs';import {hud,placeStrip,route} from './common.mjs';
const K='verify-meeting-play';const log=(...a)=>console.log(...a);
// Part 1: R mid-run
{const g=await launch('meeting',{fullfx:false});await g.advance(.3);await route(g,[[-8,-1.4],[0,-1.3]]);let s=await g.snap();log('before R t',s.time.toFixed(1));
 await g.page.keyboard.press('KeyR');await g.page.waitForTimeout(500);await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000});await g.page.waitForTimeout(1500);
 s=await g.page.evaluate(()=>window.__circuitCrew?.snapshot());log('after R',JSON.stringify({t:s?.time,running:s?.running,player:s?.player}));
 await g.shot(`${K}-30-after-R`);log('errors',JSON.stringify(await g.close()));}
// Part 2: phone survey
{const g=await launch('meeting',{fullfx:true,width:390,height:844});await g.advance(.3);await g.shot(`${K}-31-phone-start`);await g.survey();await g.shot(`${K}-32-phone-survey`);log('errors',JSON.stringify(await g.close()));}
// Part 3: coffee reel after connected; marker after placing
{const g=await launch('meeting',{fullfx:true});await g.advance(.3);await placeStrip(g);await g.advance(.3);await g.shot(`${K}-33-after-place-marker`);
 await route(g,[[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');await route(g,[[-8,-5],[-1,-1.5]]);await g.walk(6,-1.2);await g.advance(2,['KeyD']);await g.advance(1.5,['KeyD','ShiftLeft']);await g.key('KeyF',.3);
 let s=await g.snap();log('connected',JSON.stringify(s.strip),s.holdingPlug);
 await route(g,[[6,-1.2],[-8,-1.4],[-11,3.5]],.4);await g.walk(-12.2,4.4,.3);log('at coffee reel',JSON.stringify(await hud(g)));
 await g.key('KeyE',.3);s=await g.snap();log('after coffee',JSON.stringify({hp:s.holdingPlug,strip:s.strip,el:s.electrical,rope:s.rope.length}));
 await g.survey();await g.shot(`${K}-34-coffee-borrowed-after-connected`);await g.survey();
 log('errors',JSON.stringify(await g.close()));}

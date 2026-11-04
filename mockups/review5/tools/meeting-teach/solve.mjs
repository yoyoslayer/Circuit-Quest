import {launch} from '../cap.mjs';
const K='meeting-teach';
const g=await launch('meeting',{fullfx:true});
const route=async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK',x,z,JSON.stringify(res.state.player));}};
const S=async()=>{const s=await g.snap();return {t:+s.time.toFixed(1),held:s.held,hp:s.holdingPlug,el:s.electrical,strip:s.strip,placed:s.stripPlaced,won:s.won,sw:s.switchedOn,alarmed:s.alarmed,rope:s.rope};};
const hud=async()=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.textContent,prompt:document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.textContent}));
await g.advance(1);await g.shot(`${K}-01-start`);console.log('start',JSON.stringify(await hud()));
// strip
await g.walk(-8.6,-3.9,.4);await g.key('KeyE');console.log('grab',JSON.stringify(await hud()));
await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);console.log('atdoor',JSON.stringify(await hud()));await g.key('KeyE',.3);
await g.shot(`${K}-02-strip-placed`);console.log('placed',JSON.stringify(await S()),JSON.stringify(await hud()));
// reel + coupler + extension
await route([[6,-1.2],[-8,-1.4],[-10,-6.2]]);await g.key('KeyF');
await route([[-9,-6],[-9,5.3],[-3.3,5.5]],.3);console.log('cart',JSON.stringify(await hud()));
await g.key('KeyF');await g.key('KeyF');console.log('ext',JSON.stringify((await S()).rope));
await route([[-1,3],[-1,-1.5],[6,-1.2],[11.4,-1.4]]);console.log('before plug',JSON.stringify(await hud()));
await g.key('KeyF',.5);console.log('plugged',JSON.stringify(await S()),JSON.stringify(await hud()));
await g.shot(`${K}-03-plugged-gamecam`);
await g.zoom(-1500);await g.shot(`${K}-04-plugged-close`);
await g.orbit(-350,0);await g.shot(`${K}-05-plugged-close-orbit`);
await g.orbit(350,0);await g.zoom(700);
// go to the switch
await route([[12.3,-1.2],[12.3,-3.2]],.4);console.log('at switch',JSON.stringify(await hud()));await g.shot(`${K}-06-at-switch`);
await g.page.keyboard.press('KeyE');await g.advance(.15,[]);await g.shot(`${K}-07-trip-0.15s`);
await g.advance(1);await g.shot(`${K}-08-trip-1s`);console.log('trip',JSON.stringify(await S()),JSON.stringify(await hud()));
await g.orbit(600,0);await g.shot(`${K}-09-trip-orbit-toward-door`);await g.orbit(-600,0);
await g.survey();await g.shot(`${K}-10-trip-survey`);await g.key('Tab',1);
// reset without unplugging: retrip
await route([[12.3,-1.2]],.4);await g.walk(12.4,-1.15,.4);console.log('at strip',JSON.stringify(await hud()));
await g.key('KeyE',.1);await g.shot(`${K}-11-reset-while-overloaded`);console.log('retrip',JSON.stringify(await S()));
await g.advance(1);
// unplug heater
await g.walk(14.3,-.9,.4);console.log('near appl',JSON.stringify(await hud()));await g.shot(`${K}-12-near-appliance`);
await g.key('KeyE',.3);await g.shot(`${K}-13-unplugged`);console.log('unplug',JSON.stringify(await S()),JSON.stringify(await hud()));
await g.walk(12.4,-1.15,.4);await g.key('KeyE',.3);await g.shot(`${K}-14-reset-win`);console.log('win',JSON.stringify(await S()));
await g.advance(3);await g.shot(`${K}-15-win-card`);
console.log('errors',await g.close());

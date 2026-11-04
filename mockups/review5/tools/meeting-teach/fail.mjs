import {launch} from '../cap.mjs';
const K='meeting-teach';
const hud=g=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.textContent,prompt:document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.textContent}));
const mk=g=>async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK',x,z,JSON.stringify(res.state.player));}};
const st=async g=>{const s=await g.snap();return JSON.stringify({t:+s.time.toFixed(1),held:s.held,hp:s.holdingPlug,el:s.electrical,strip:s.strip,placed:s.stripPlaced,won:s.won,sw:s.switchedOn,conn:s.connected});};
const place=async(g,route)=>{await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE',.3);};
const coffee=async(g,route)=>{await route([[6,-1.2],[-8,-1.4],[-10,3.5]]);await g.walk(-12,4.5,.4);await g.key('KeyE');await route([[-9,5.3],[6.9,5.3],[8,-1.3],[11.4,-1.4]]);};
// A) idle hint dots on an open circuit
{const g=await launch('meeting',{fullfx:true});await g.advance(40);await g.zoom(-600);await g.shot(`${K}-20-idle-hint-dots`);console.log('A',await hud(g));console.log('A errors',await g.close());}
// B) projector switched on before the cable goes in: the trip happens at plug-in
{const g=await launch('meeting',{fullfx:true});const route=mk(g);await place(g,route);
 await route([[12.3,-1.2],[12.3,-3.2]],.4);console.log('B at switch unpowered',JSON.stringify(await hud(g)));await g.key('KeyE',.2);console.log('B switched',await st(g),JSON.stringify(await hud(g)));
 await coffee(g,route);console.log('B before plug',JSON.stringify(await hud(g)));await g.key('KeyF',.15);await g.shot(`${K}-21-plugin-trips-at-once`);console.log('B plugged',await st(g),JSON.stringify(await hud(g)));
 await g.advance(1.5);await g.page.addStyleTag({content:'#hud,.objective,.prompt-pill{visibility:hidden!important}'});await g.zoom(-1500);await g.shot(`${K}-22-tripped-close-nohud`);
 await g.crop(`${K}-23-crop-gauge-tripped`,{x:820,y:200,width:520,height:360});
 console.log('B errors',await g.close());}
// C) after plugging in, E at the strip picks it back up
{const g=await launch('meeting',{fullfx:true});const route=mk(g);await place(g,route);await coffee(g,route);await g.key('KeyF',.5);
 await g.zoom(-1500);await g.shot(`${K}-24-loaded-close-nohud-pre`);await g.crop(`${K}-25-crop-gauge-loaded`,{x:820,y:200,width:520,height:360});
 await g.zoom(1500);await g.zoom(-300);
 await g.shot(`${K}-26-loaded-gamecam`);console.log('C plugged',await st(g),JSON.stringify(await hud(g)));
 await g.key('KeyE',.3);console.log('C after E',await st(g),JSON.stringify(await hud(g)));await g.shot(`${K}-27-strip-picked-up-after-plugin`);
 // pre-emptive unplug path: put the strip back, unplug the heater first, then switch on: no trip
 await g.key('KeyE',.5);console.log('C put back',await st(g));
 await g.walk(14.6,-.9,.4);console.log('C near',JSON.stringify(await hud(g)));await g.key('KeyE',.3);
 await route([[12.3,-1.2],[12.3,-3.2]],.4);await g.key('KeyE',.5);console.log('C preempt',await st(g));
 console.log('C errors',await g.close());}

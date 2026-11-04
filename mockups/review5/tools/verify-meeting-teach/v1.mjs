import {launch} from '../cap.mjs';
const K='verify-meeting-teach';
const hud=g=>g.page.evaluate(()=>({card:document.querySelector('.objective .cur')?.textContent,prompt:document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.textContent}));
const mk=g=>async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('STUCK',x,z);}};
const st=async g=>{const s=await g.snap();return JSON.stringify({t:+s.time.toFixed(2),held:s.held,hp:s.holdingPlug,el:s.electrical,strip:s.strip,placed:s.stripPlaced,won:s.won,sw:s.switchedOn,conn:s.connected,dmg:s.damage});};
const place=async(g,route)=>{await g.walk(-8.6,-3.9,.4);await g.key('KeyE');await route([[-8,-1.4],[6,-1.2],[11.2,-1.4]]);await g.key('KeyE',.3);};
const coffee=async(g,route)=>{await route([[6,-1.2],[-8,-1.4],[-10,3.5]]);await g.walk(-12,4.5,.4);await g.key('KeyE');await route([[-9,5.3],[6.9,5.3],[8,-1.3],[11.4,-1.4]]);};
const which=process.argv[2]??'A';
if(which==='A'){const g=await launch('meeting',{fullfx:true});const route=mk(g);await place(g,route);await coffee(g,route);await g.key('KeyF',.5);
  console.log('plugged',await st(g),JSON.stringify(await hud(g)));
  await g.shot(`${K}-01-plugged-gamecam`);
  await g.zoom(-1500);await g.shot(`${K}-02-plugged-close`);
  await g.zoom(1500);await g.zoom(-300);
  await route([[12.3,-1.2],[12.3,-3.2]],.4);console.log('at switch',JSON.stringify(await hud(g)));
  await g.page.keyboard.press('KeyE');
  for(let i=0;i<8;i++){await g.advance(1/60);console.log('frame',i,await st(g));}
  await g.shot(`${K}-03-trip-0.13s`);
  await g.advance(1);console.log('trip+1',await st(g),JSON.stringify(await hud(g)));
  // check heater targeting from its front
  for(const [x,z] of [[15.15,-1.2],[14.6,-.9],[15.2,-1.0],[13.9,-1.15]]){await g.walk(x,z,.25);const s=await g.snap();console.log('near',x,z,JSON.stringify(s.player),JSON.stringify(await hud(g)));}
  // unplug kettle while tripped and crop gauge
  await g.walk(13.9,-1.15,.25);console.log('kettle?',JSON.stringify(await hud(g)));await g.key('KeyE',.3);console.log('unplug',await st(g));
  await g.page.addStyleTag({content:'#hud,.objective,.prompt-pill{visibility:hidden!important}'});
  await g.zoom(-1500);await g.shot(`${K}-04-unplugged-tripped-close-nohud`);
  await g.page.addStyleTag({content:'#hud,.objective,.prompt-pill{visibility:visible!important}'});
  await g.zoom(1500);await g.zoom(-300);
  await g.walk(12.4,-1.15,.4);console.log('at strip',JSON.stringify(await hud(g)));await g.key('KeyE',.3);console.log('reset',await st(g));
  await g.advance(3);await g.shot(`${K}-05-win-card`);
  console.log('errors',await g.close());}
if(which==='B'){const g=await launch('meeting',{fullfx:true});const route=mk(g);await place(g,route);await coffee(g,route);await g.key('KeyF',.5);
  // E at the strip after plug-in
  await g.walk(12.3,-1.5,.3);console.log('B near strip',JSON.stringify(await hud(g)),await st(g));
  await g.key('KeyE',.3);console.log('B after E',await st(g),JSON.stringify(await hud(g)));await g.shot(`${K}-06-strip-lifted`);
  await g.key('KeyE',.5);console.log('B put back',await st(g));
  // preempt: unplug heater, switch on: no trip
  for(const [x,z] of [[15.15,-1.2],[14.6,-.9],[15.2,-1.0]]){await g.walk(x,z,.2);const s=await g.snap();console.log("B near",x,z,JSON.stringify(s.player),JSON.stringify(await hud(g)));}
  await g.walk(15.2,-1.0,.2);console.log("B heater?",JSON.stringify(await hud(g)));await g.key('KeyE',.3);console.log('B unplug',await st(g));
  await route([[12.3,-1.2],[12.3,-3.2]],.4);await g.key('KeyE',.5);console.log('B preempt',await st(g));
  await g.advance(3);await g.shot(`${K}-07-preempt-win-card`);
  const txt=await g.page.evaluate(()=>document.querySelector('.result')?.textContent);console.log('B result',txt);
  console.log('errors',await g.close());}

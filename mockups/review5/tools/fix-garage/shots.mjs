// Garage fix verification shots. Dev server: npx.cmd vite --port 4192 --strictPort; then
//   BASE=http://127.0.0.1:4192 node mockups/review5/tools/fix-garage/shots.mjs
import {launch} from '../cap.mjs';
const K='fix-garage';
const g=await launch('garage',{fullfx:true});
const log=(...a)=>console.log(...a);
const st=async()=>(await g.snap()).station;
const prompt=()=>g.page.locator('.prompt-pill').innerText().catch(()=>'');
/** Fit a part the way round wanted (false = band at the socket's left end). */
const fit=async(part,slot,flipped=false)=>{await g.act('pick',part);if((await st()).trayFlip[part]!==flipped)await g.act('flip');await g.act('slot',slot);};
await g.advance(.5);
// Robot pad, chargers, decor robots (R5-244, R5-353).
await g.walk(5.2,-3.2,.5);await g.advance(.4);log('prompt near pad',await prompt());await g.shot(`${K}-01-pad`);
// Bench before the robot is on the stand (R5-267).
await g.walk(0,-1.55,.4);await g.advance(.2);log('prompt at bench, no robot',await prompt());
await g.walk(6.4,-4.2,.5);log('prompt at robot',await prompt());await g.key('KeyE');
await g.walk(3.4,-4,.5);await g.walk(2.5,-4.4,.5);await g.key('KeyE');await g.advance(.4);
await g.shot(`${K}-02-stand-harness`);
await g.walk(2.9,-4,.4);await g.walk(2.9,-1.1,.4);await g.walk(0,-1.55,.4);await g.key('KeyE');await g.advance(.6);
log('order',(await st()).order.join(','),'trayFlip',JSON.stringify((await st()).trayFlip));
await g.shot(`${K}-03-bench-start`);
// Holding the diode: every legal socket glows; the prompt names the keys of both (R5-037).
await g.act('pick','diode');await g.advance(.2);log('prompt holding diode',await prompt());await g.shot(`${K}-04-holding-diode`);
await g.act('slot','fly');await g.advance(.2);await g.shot(`${K}-05-diode-fitted`);
// Backwards across the motor: the fuse trips (R5-111).
if(!(await st()).slots.fly.flipped)await g.act('flip','fly');
await g.act('pulse');await g.advance(.3);log('prompt cooling',await prompt(),'mistakes',(await st()).mistakes,'spent',(await st()).spent);
await g.shot(`${K}-06-fuse-tripped`);
const p1=await g.page.locator('.station-panel').innerText();await g.advance(.8);const p2=await g.page.locator('.station-panel').innerText();
log('panel countdown changes',p1!==p2);
await g.advance(2);await g.act('flip','fly');
// Bead speed right before / after turn-off (R5-057): sample dot positions.
await g.act('pulse');await g.advance(.7);await g.shot(`${K}-07-diode-running`);await g.advance(.25);await g.shot(`${K}-08-diode-kick`);
await g.act('test');await g.advance(1.3);await g.shot(`${K}-09-test-lamps`);await g.advance(4);
// Job 2: the brake coil; a plain diode is too slow, the wheels coast (R5-055, R5-056).
await fit('diode','fly');await g.act('test');await g.advance(.75);log('slow test resetFlash',(await st()).resetFlash);await g.shot(`${K}-10-j2-slow-test`);await g.advance(4);
await g.act('pulse');await g.advance(2.2);await g.shot(`${K}-11-j2-slow-pulse-coast`);await g.advance(3);
await g.act('pick','diode');await g.act('pick','diode');await fit('tvs','switch');await g.act('pulse');await g.advance(2);await g.shot(`${K}-12-j2-tvs`);
await g.act('test');await g.advance(4.5);
// Job 3: long shared ground, warming in the start surge; then the star wire (R5-058, R5-270, R5-271).
await fit('diode','fly');await g.act('pulse');await g.advance(.25);await g.shot(`${K}-13-j3-start-surge`);await g.advance(1.5);
log('prompt j3 start',await prompt());await g.shot(`${K}-14-j3-start-scope`);
await g.act('ground');await g.act('pulse');await g.advance(2);await g.shot(`${K}-15-j3-star`);
// Stuck: a diode across the switch turned round (R5-057).
await fit('diode','switch',true);await g.act('pulse');await g.advance(1.8);log('stuck',(await st()).stuck,(await st()).motorOn);await g.shot(`${K}-16-j3-stuck`);
await g.act('slot','switch');await fit('diode','fly');await g.act('pulse');await g.advance(2);await g.act('test');await g.advance(.5);
await g.advance(1.5);log('prompt driving',await prompt());await g.shot(`${K}-17-driving`);
// Shelves at the dock (R5-299).
await g.walk(-6.6,-5.2,.5);await g.advance(4);await g.shot(`${K}-18-dock-shelves`);
log('errors',JSON.stringify(await g.close()));

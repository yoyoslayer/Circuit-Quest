// Checks and shots for the review 5 arcade fixes (R-arcade batch). Dev server first:
//   npx.cmd vite --port 4191 --strictPort ; BASE=http://127.0.0.1:4191 node mockups/review5/tools/fix-arcade/checks.mjs [name...]
import {launch} from '../cap.mjs';
const only=process.argv.slice(2),want=n=>!only.length||only.includes(n),out={};
const st=async g=>(await g.snap()).station;
const pick=s=>({index:s.index,job:s.job,powered:s.powered,tripped:s.tripped,soak:s.soak,soakDone:s.soakDone,mistakes:s.mistakes,trips:s.trips,spent:s.spent,chain:JSON.stringify(s.setup.chain),tier:s.verdict?.tier});
const toast=g=>g.page.evaluate(()=>{const t=document.querySelector('.station-toast');return t&&!t.hidden?t.textContent:null;});
const prompt=g=>g.page.evaluate(()=>document.querySelector('.prompt-pill')?.textContent??null);
async function toBench(g){
  await g.advance(.3);await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
  await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
}
const place=async(g,...ps)=>{for(const [k,p] of ps.entries())for(const v of p){await g.act('pick',v);await g.act('slot',k);}};

if(want('story')){// R5-027/028/034/036/052/053/193/256: story run with shots of each beat.
  const g=await launch('arcade');await toBench(g);const log=[];
  log.push(['prompt as found',await prompt(g)]);
  await g.act('power');await g.advance(.5);log.push(['pinball as found',pick(await st(g)),await toast(g)]);await g.shot('fix-arcade-01-pinball-asfound');
  // R5-010: a live swap via the last block.
  await g.act('slot','across');await place(g,[220]);await g.advance(2.8);
  await g.act('slot',0);log.push(['lift last block live',pick(await st(g)),await toast(g)]);await g.advance(.5);log.push(['after .5',pick(await st(g))]);
  await place(g,[470]);await g.act('power');await g.advance(.6);await g.act('slot',0);await place(g,[220]);await g.act('power');await g.advance(3.4);log.push(['sweep 470->220',pick(await st(g))]);
  await g.shot('fix-arcade-02-pinball-pass');await g.act('signoff');
  // Rhythm
  await g.act('flip');await place(g,[47]);await g.act('power');await g.advance(3.4);await g.act('signoff');
  // Claw as found: glare + scorch, then slow failure.
  await g.act('power');await g.advance(1.3);log.push(['claw 1.3s',pick(await st(g)),await toast(g)]);await g.shot('fix-arcade-03-claw-glare');
  await g.advance(4);await g.shot('fix-arcade-04-claw-scorch');await g.advance(5.5);log.push(['claw 10.8s',pick(await st(g)),await toast(g)]);
  await place(g,[470],[470]);await g.act('power');await g.advance(3.4);await g.act('signoff');
  // Handheld
  await g.act('slot',0);await place(g,[470],[470]);await g.act('power');await g.advance(3.4);await g.act('signoff');
  // Hopper: under band (amber MOTOR, PLAYS · LOW DRIVE), then the elegant 470.
  await place(g,[470],[470],[470]);await g.act('power');await g.advance(3.4);log.push(['hopper 1410',pick(await st(g)),await toast(g)]);await g.shot('fix-arcade-05-hopper-lowdrive');
  await g.act('power');await g.act('slot',2);await g.act('slot',1);await g.act('power');await g.advance(3.4);log.push(['hopper 470',pick(await st(g)),await toast(g)]);await g.shot('fix-arcade-06-hopper-pass');
  await g.act('signoff');await g.advance(1);const s=await g.snap();log.push(['end',s.won,pick(s.station)]);
  out.story={log,errors:await g.close()};}

if(want('led')){// R5-036/034: LED keeps its hue; LED LOAD bar races into the red before the pop.
  const g=await launch('arcade');await toBench(g);await g.act('slot','across');const log=[];
  await place(g,[220]);await g.act('power');await g.advance(1.5);await g.shot('fix-arcade-10-led-inband');
  await g.act('slot',0);await place(g,[100]);await g.act('power');await g.advance(1.5);await g.shot('fix-arcade-11-led-1_5x');
  await g.act('power');await g.act('slot',0);await place(g,[47]);await g.act('power');await g.advance(.12);await g.shot('fix-arcade-12-led-3x-before-pop');
  await g.advance(.6);log.push(['after pop',pick(await st(g)),await toast(g)]);await g.shot('fix-arcade-13-led-popped');
  out.led={log,errors:await g.close()};}

if(want('hopper-board')){// R5-053: the two loops on the hopper board.
  const g=await launch('arcade');await toBench(g);
  // Jump to the hopper by signing off the elegant chains.
  const fixes=[[[220]],[[47]],[[470],[470]],[[470],[470]]];
  await g.act('slot','across');await place(g,...fixes[0]);await g.act('power');await g.advance(3.3);await g.act('signoff');
  await g.act('flip');await place(g,...fixes[1]);await g.act('power');await g.advance(3.3);await g.act('signoff');
  await g.act('slot',0);await place(g,...fixes[2]);await g.act('power');await g.advance(3.3);await g.act('signoff');
  await g.act('slot',0);await place(g,...fixes[3]);await g.act('power');await g.advance(3.3);await g.act('signoff');
  await g.shot('fix-arcade-20-hopper-board-off');
  await place(g,[470]);await g.act('power');await g.advance(1.2);await g.shot('fix-arcade-21-hopper-board-live');
  await g.act('power');await g.act('slot',0);await place(g,[47]);await g.act('power');await g.advance(1.5);await g.shot('fix-arcade-22-hopper-pin-overload');
  out.hopper={s:pick(await st(g)),toast:await toast(g),errors:await g.close()};}

if(want('rush')){// R5-027/051/010/222/223: rush as-found looks are free; stories match; overtime.
  const g=await launch('arcade-rush');await toBench(g);const log=[];
  for(let k=0;k<3;k++){const s=await st(g);log.push(['job',s.job,(await g.snap()).station.reading?.level?.toFixed?.(2)]);
    await g.act('power');await g.advance(.9);log.push(['as found',pick(await st(g)),await toast(g)]);if(k===0)await g.shot('fix-arcade-30-rush-asfound');
    if(s.setup.across)await g.act('slot','across');for(const [i,p] of s.setup.chain.entries())for(const _ of p)await g.act('slot',i);
    if(s.setup.reversed)await g.act('flip');await place(g,...s.fix);if(!(await st(g)).powered)await g.act('power');
    for(let i=0;i<12&&!(await st(g)).soakDone;i++)await g.advance(.5);await g.act('signoff');log.push(['signed',pick(await st(g))]);}
  // R5-223: start a correct cabinet just before the bell.
  const t=(await g.snap()).time;await g.advance(178.6-t);const s=await st(g);
  if(s.setup.across)await g.act('slot','across');for(const [i,p] of s.setup.chain.entries())for(const _ of p)await g.act('slot',i);
  if(s.setup.reversed)await g.act('flip');await place(g,...s.fix);if(!(await st(g)).powered)await g.act('power');
  await g.advance(1.4);let snap=await g.snap();log.push(['at 180',+snap.time.toFixed(2),snap.won,snap.station.served.length,snap.station.soak]);
  await g.advance(1.5);snap=await g.snap();log.push(['after',+snap.time.toFixed(2),snap.won,snap.station.served.length]);
  await g.advance(2);await g.shot('fix-arcade-31-rush-result');
  out.rush={log,errors:await g.close()};}

if(want('room')){// R5-340 ribbon to the board; R5-296 poster, R5-319 handheld stand, R5-373 light count.
  const g=await launch('arcade');await toBench(g);await g.shot('fix-arcade-40-bench-ribbon');
  const lights=()=>g.page.evaluate(()=>{let n=0;window.__game.root.traverse(o=>{if(o.isPointLight)n++});window.__game.decorRoot.traverse(o=>{if(o.isPointLight&&!o.parent?.isScene)n+=0});return n;});
  const l0=await lights();
  await g.key('Escape',.6);await g.walk(2.6,-4.6,.4);await g.advance(.5);await g.shot('fix-arcade-41-back-wall');
  await g.walk(6.6,-4.8,.4);await g.advance(.5);await g.shot('fix-arcade-42-handheld');
  out.room={lights:l0,errors:await g.close()};}

console.log(JSON.stringify(out,null,1));

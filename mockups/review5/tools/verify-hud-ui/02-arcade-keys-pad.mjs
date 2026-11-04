import {launch} from '../cap.mjs';
const out={};
const fake=`window.__pad={id:'Fake pad',index:0,connected:true,mapping:'standard',timestamp:0,axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,touched:false,value:0}))};navigator.getGamepads=()=>[window.__pad,null,null,null];dispatchEvent(new Event('gamepadconnected'));`;
async function press(g,i){await g.page.evaluate(i=>{window.__pad.buttons[i].pressed=true;window.__pad.buttons[i].value=1;},i);await g.advance(.1);await g.page.evaluate(i=>{window.__pad.buttons[i].pressed=false;window.__pad.buttons[i].value=0;},i);await g.advance(.1);}
const pill=g=>g.page.evaluate(()=>document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' '));
async function toBench(g){await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
  await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);await g.key('KeyE',1);}
// A) pad at the bench
{const g=await launch('arcade',{fullfx:true});await g.page.evaluate(fake);await g.advance(.5);await toBench(g);
  let s=await g.snap();out.padStart={atBench:s.atBench,held:s.station.held,powered:s.station.powered,pill:await pill(g)};
  const st=()=>g.snap().then(s=>({atBench:s.atBench,held:s.station.held,powered:s.station.powered,setup:JSON.stringify(s.station.setup),y:+s.player.y.toFixed(2)}));
  out.padButtons={};
  for(const [n,i] of [['A',0],['Y',3],['B',1],['dUp',12],['dDown',13],['dLeft',14],['dRight',15],['LB',4],['RB',5],['RT',7]]){await press(g,i);out.padButtons[n]=await st();}
  await g.shot('verify-hud-ui-03d-pad-at-bench');
  await press(g,2);out.padButtons.X=await st();
  out.hudClass=await g.page.evaluate(()=>document.querySelector('[data-layer="hud"]').className);
  out.eA=await g.close();}
// B) keyboard leaks at the bench + P during cooling + R
{const g=await launch('arcade',{fullfx:true});await g.advance(.5);await toBench(g);
  let s=await g.snap();out.k0={atBench:s.atBench,survey:s.survey,y:s.player.y};
  await g.page.keyboard.press('Space');await g.advance(.15);s=await g.snap();out.kSpace={atBench:s.atBench,y:+s.player.y.toFixed(2),grounded:s.grounded};await g.advance(1);
  await g.page.keyboard.press('Tab');await g.advance(.3);s=await g.snap();out.kTab={atBench:s.atBench,survey:s.survey};
  await g.page.keyboard.press('KeyE');await g.advance(1.2);s=await g.snap();out.kStandAfterTab={atBench:s.atBench,survey:s.survey};await g.shot('verify-hud-ui-04d-stand-after-bench-tab');
  await g.page.keyboard.press('Tab');await g.advance(.3);await g.page.keyboard.press('KeyE');await g.advance(1);
  // P during cooling
  await g.page.keyboard.press('KeyP');await g.advance(.6);s=(await g.snap()).station;out.trip={powered:s.powered,live:s.live,tripped:s.tripped,cooling:s.cooling,pill:await pill(g)};
  await g.shot('verify-hud-ui-05d-arc-trip-pill');
  await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.advance(.2);s=(await g.snap()).station;out.fixed={tripped:s.tripped,powered:s.powered,pill:await pill(g)};
  await g.page.keyboard.press('KeyP');await g.advance(.2);s=(await g.snap()).station;out.afterP={powered:s.powered,live:s.live,tripped:s.tripped,pill:await pill(g)};
  await g.advance(6);s=(await g.snap()).station;out.afterP6s={powered:s.powered,live:s.live,tripped:s.tripped,pill:await pill(g)};
  await g.shot('verify-hud-ui-06d-arc-after-P-cooled');
  const nav=g.page.waitForNavigation({timeout:4000}).then(()=>true).catch(()=>false);
  await g.page.keyboard.press('KeyR');out.RreloadsAtBench=await nav;
  out.eB=await g.close();}
console.log(JSON.stringify(out,null,1));

import {launch} from '../cap.mjs';
const out={};
const hud=g=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText.replace(/\n+/g,' | '),pill:document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' '),
  panel:document.querySelector('.station-panel')?.hidden?null:document.querySelector('.station-panel')?.innerText.replace(/\n+/g,' | '),toast:document.querySelector('.station-toast')?.hidden?null:document.querySelector('.station-toast')?.innerText,
  words:(()=>{const els=['.objective','.prompt-pill','.station-panel','.station-toast','.bench-chip'].map(s=>document.querySelector(s)).filter(e=>e&&!e.hidden&&e.offsetParent!==null);return els.map(e=>e.innerText).join(' ').split(/\s+/).filter(Boolean).length;})()}));
async function toBench(g){await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
  await g.walk(-7.2,5.8);await g.walk(-5.5,6.4);await g.walk(1.2,-1.3,.5);await g.key('KeyE',.2);await g.walk(0,-1.55,.4);}
for(const [tag,w,h] of [['d',1440,900],['p',390,844]]){
  const g=await launch('arcade',{fullfx:true,width:w,height:h});
  await g.advance(1);await g.shot(`hud-ui-30${tag}-arc-start`);out[tag+'start']=await hud(g);
  await toBench(g);await g.advance(.2);await g.shot(`hud-ui-31${tag}-arc-at-bench-stand`);out[tag+'stand']=await hud(g);
  await g.key('KeyE',.8);await g.shot(`hud-ui-32${tag}-arc-bench`);out[tag+'bench']=await hud(g);
  await g.act('power');await g.advance(.8);await g.shot(`hud-ui-33${tag}-arc-bench-trip`);out[tag+'trip']=await hud(g);
  await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.advance(2.7);await g.advance(3.3);await g.shot(`hud-ui-34${tag}-arc-bench-pass`);out[tag+'pass']=await hud(g);
  if(tag==='d'){
    // keyboard conflicts at the bench
    let s=await g.snap();out.preKeys={atBench:s.atBench,survey:s.survey,player:s.player};
    await g.page.keyboard.press('Tab');await g.advance(.6);s=await g.snap();out.afterTab={atBench:s.atBench,survey:s.survey};await g.shot(`hud-ui-35d-arc-bench-after-tab`);
    await g.page.keyboard.press('Tab');await g.advance(.4);
    await g.page.keyboard.press('Space');await g.advance(.15);s=await g.snap();out.afterSpace={atBench:s.atBench,player:s.player,grounded:s.grounded};
    await g.advance(.8);
    await g.page.keyboard.press('KeyC');await g.advance(.5);await g.shot(`hud-ui-36d-arc-bench-after-C`);
    // R at bench: does it reload?
    const nav=g.page.waitForNavigation({timeout:3000}).then(()=>true).catch(()=>false);
    await g.page.keyboard.press('KeyR');out.RreloadsAtBench=await nav;
  }
  out[tag+'err']=await g.close();
}
console.log(JSON.stringify(out,null,1));

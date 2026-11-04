import {launch} from '../cap.mjs';
const out={};
for(const [tag,w,h] of [['d',1440,900],['p',390,844]]){
  const g=await launch('lobby',{fullfx:true,width:w,height:h,start:false});
  await g.advance(1);await g.shot(`hud-ui-01${tag}-title`);
  // words on title
  out[tag+'title']=await g.page.evaluate(()=>document.querySelector('.title-screen')?.innerText);
  await g.page.click('[data-ui="jobs"]');await g.advance(.6);await g.shot(`hud-ui-02${tag}-jobs`);
  await g.page.keyboard.press('Escape');await g.advance(.3);
  await g.page.getByRole('button',{name:'Start playing'}).click();await g.advance(1.2);
  await g.shot(`hud-ui-03${tag}-lobby-start`);
  out[tag+'prompt0']=await g.page.evaluate(()=>[document.querySelector('.objective')?.innerText,document.querySelector('.prompt-pill')?.hidden,document.querySelector('.prompt-pill')?.innerText]);
  await g.survey();await g.shot(`hud-ui-04${tag}-lobby-survey`);await g.survey();
  await g.walk(7.5,5.5,.5);await g.advance(.2);await g.shot(`hud-ui-05${tag}-workshop-prompt`);
  await g.key('KeyE',.4);await g.shot(`hud-ui-06${tag}-workshop-picker`);
  out[tag+'picker']=await g.page.evaluate(()=>document.querySelector('.workshop-picker')?.innerText);
  // keys while picker open
  const before=await g.snap();
  await g.page.keyboard.down('KeyW');await g.advance(.6,['KeyW']);await g.page.keyboard.up('KeyW');
  await g.page.keyboard.press('Tab');await g.advance(.5);
  const after=await g.snap();
  out[tag+'pickerkeys']={before:before.player,after:after.player,survey:after.survey,picker:await g.page.evaluate(()=>!!document.querySelector('.workshop-picker')&&!document.querySelector('.workshop-picker').hidden)};
  await g.shot(`hud-ui-07${tag}-picker-after-keys`);
  await g.page.keyboard.press('Escape');await g.advance(.4);
  out[tag+'afterEsc']=await g.page.evaluate(()=>({screen:document.body.dataset.screen,picker:!!document.querySelector('.workshop-picker:not([hidden])')}));
  await g.shot(`hud-ui-08${tag}-after-esc`);
  out[tag+'err']=await g.close();
}
console.log(JSON.stringify(out,null,1));

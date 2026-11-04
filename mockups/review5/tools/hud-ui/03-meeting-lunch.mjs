import {launch} from '../cap.mjs';
const out={};
const hud=g=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText.replace(/\n+/g,' | '),pill:document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' ')}));
for(const [tag,w,h] of [['d',1440,900],['p',390,844]]){
  const g=await launch('meeting',{fullfx:true,width:w,height:h});
  await g.advance(1);await g.shot(`hud-ui-20${tag}-meet-start`);out[tag+'mstart']=await hud(g);
  await g.survey();await g.shot(`hud-ui-21${tag}-meet-survey`);await g.survey();
  out[tag+'merr']=await g.close();
  const l=await launch('lunch',{fullfx:true,width:w,height:h});
  await l.advance(1);await l.shot(`hud-ui-22${tag}-lunch-start`);out[tag+'lstart']=await hud(l);
  await l.walk(-10,7.5,.3);await l.advance(.2);out[tag+'lreel']=await hud(l);await l.key('KeyF',.2);await l.walk(1,3,.45);await l.advance(.2);await l.shot(`hud-ui-23${tag}-lunch-drag-thick`);out[tag+'ldrag']=await hud(l);
  // let fridge spoil: advance in chunks
  for(let i=0;i<13;i++)await l.advance(10);
  await l.page.waitForTimeout(400);await l.shot(`hud-ui-24${tag}-lunch-pre-fail`);
  await l.advance(3);await l.page.waitForTimeout(2500);await l.shot(`hud-ui-25${tag}-lunch-fail`);
  out[tag+'fail']=await l.page.evaluate(()=>({screen:document.body.dataset.screen,failed:document.body.dataset.failed,txt:document.querySelector('.fail-screen')?.innerText.replace(/\n+/g,' | ')}));
  out[tag+'lerr']=await l.close();
}
console.log(JSON.stringify(out,null,1));

import {launch} from '../cap.mjs';
const out={};
const hud=g=>g.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText.replace(/\n+/g,' | '),pill:document.querySelector('.prompt-pill')?.hidden?null:document.querySelector('.prompt-pill')?.innerText.replace(/\n+/g,' ')}));
for(const [tag,w,h] of [['d',1440,900],['p',390,844]]){
  const g=await launch('playground',{fullfx:true,width:w,height:h});
  await g.advance(1);await g.shot(`hud-ui-10${tag}-pg-start`);out[tag+'start']=await hud(g);
  if(tag==='d'){const m=await g.page.evaluate(()=>{const c=window.__circuitCrew;return null;});}
  await g.key('KeyF',.3);out[tag+'holding']=await hud(g);
  await g.walk(-5,-1);await g.walk(-4,-4);await g.advance(.3);await g.shot(`hud-ui-11${tag}-pg-dragging`);out[tag+'drag']=await hud(g);
  // strain: walk far toward corner
  await g.walk(9,3.7);await g.advance(2.2,['KeyW','ShiftLeft']);await g.shot(`hud-ui-12${tag}-pg-strain`);out[tag+'strain']=await hud(g);out[tag+'strainval']=(await g.snap()).rope.strain;
  await g.key('KeyQ',.6);await g.shot(`hud-ui-13${tag}-pg-after-sling`);
  // pick plug again & go to socket
  const s=await g.snap();out[tag+'plugpos']=s.plug??s.rope;
  await g.page.keyboard.press('Escape');await g.advance(.4);await g.shot(`hud-ui-14${tag}-pause`);
  out[tag+'pause']=await g.page.evaluate(()=>document.querySelector('.pause-screen')?.innerText.replace(/\n+/g,' | '));
  await g.page.keyboard.press('Escape');await g.advance(.3);
  out[tag+'err']=await g.close();
}
// clean win at desktop + phone
for(const [tag,w,h] of [['d',1440,900],['p',390,844]]){
  const g=await launch('playground',{fullfx:true,width:w,height:h});
  await g.advance(.3);await g.key('KeyF',.1);await g.walk(-5,-1);await g.walk(-4,-4);await g.walk(5.8,-5.5);
  out[tag+'atsocket']=await hud(g);await g.shot(`hud-ui-15${tag}-pg-at-socket`);
  await g.key('KeyF',.3);out[tag+'plugged']=await hud(g);await g.shot(`hud-ui-16${tag}-pg-plugged`);
  await g.walk(6.6,-5.9,.4);out[tag+'atswitch']=await hud(g);
  await g.key('KeyE',.3);await g.advance(1.6);await g.shot(`hud-ui-17${tag}-pg-win-push`);
  await g.advance(1);await g.page.waitForTimeout(2500);await g.shot(`hud-ui-18${tag}-pg-result`);
  out[tag+'result']=await g.page.evaluate(()=>document.querySelector('.result-screen')?.innerText.replace(/\n+/g,' | '));
  out[tag+'err2']=await g.close();
}
console.log(JSON.stringify(out,null,1));

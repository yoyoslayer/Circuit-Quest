import {launch} from '../cap.mjs';
const out={};
const g=await launch('garage',{fullfx:true,query:'practice'});await g.advance(.8);await g.shot('hud-ui-70d-garage-practice-hud');
out.e=await g.close();
const r=await launch('arcade-rush',{fullfx:true});await r.advance(1);await r.shot('hud-ui-71d-rush-start');
out.rush=await r.page.evaluate(()=>({card:document.querySelector('.objective')?.innerText.replace(/\n+/g,' | '),panel:document.querySelector('.station-panel')?.innerText.replace(/\n+/g,' | '),clock:document.querySelector('#clock')?.innerText}));
out.e2=await r.close();
console.log(JSON.stringify(out,null,1));

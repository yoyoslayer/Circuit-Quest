// playground-play H: the job tag / title before Start for the playground.
import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true,start:false});await g.page.waitForTimeout(1500);
await g.shot('playground-play-62-job-tag');
console.log(JSON.stringify(await g.page.evaluate(()=>({screen:document.body.dataset.screen,text:document.querySelector(`.screen[data-screen="${document.body.dataset.screen}"]`)?.innerText.slice(0,400)}))));
console.log('errors',JSON.stringify(await g.close()));

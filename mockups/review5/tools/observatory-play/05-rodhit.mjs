import {launch} from '../cap.mjs';
const P='observatory-play-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
await g.advance(.5);await g.walk(0,-1.55,.4);await g.key('KeyE',.8);
const hits=[];
for(let y=380;y<=560;y+=5)for(let x=170;x<=380;x+=5){await g.page.mouse.move(x,y);const c=await g.page.evaluate(()=>document.body.style.cursor);if(c==='pointer')hits.push([x,y]);}
log('pointer hits in rack box',hits.length,JSON.stringify(hits));
// confirm what each is
const seen={};
for(const [x,y] of hits){await g.page.mouse.move(x,y);await g.advance(.05);const p=await g.page.evaluate(()=>document.querySelector('.prompt-pill:not([hidden])')?.innerText?.replace('\n',' '));seen[p]=(seen[p]||0)+1;}
log(JSON.stringify(seen));
// rack area total sample count
log('samples',((560-380)/5+1)*((380-170)/5+1));
await g.crop(P+'71-crop-rod-rack',{x:150,y:370,width:320,height:270});
await g.zoom(0);
log('errors',JSON.stringify(await g.close()));

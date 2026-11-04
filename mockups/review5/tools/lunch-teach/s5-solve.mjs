import {launch,W,R,brief,hudText,wedge,mop,takeThick,feedKitchen} from './lib.mjs';
const K='lunch-teach';const t0=Date.now();const trap=process.argv[2]==='trap';const P=trap?`${K}-T`:`${K}-S`;
const g=await launch('lunch',{fullfx:true});
const n=()=>g.page.evaluate(()=>[...document.querySelectorAll('.gauge')].map(e=>e.dataset.cart+':'+e.querySelector('.needle').style.transform));
await wedge(g);await mop(g);await takeThick(g);await feedKitchen(g);await brief(g,'kitchen');
await R(g,[[.3,-1.3],[.3,2.4]]);await W(g,-10.8,2,.4);await g.key('KeyF');
await R(g,[[.3,2.4],[.3,-1.3]]);await W(g,-3.8,-1.7,.4);await g.key('KeyF');await g.advance(.3);
await brief(g,'fridge');console.log('hud',await hudText(g),await n());await g.shot(`${P}-30-baking-fridge-on`);
const s0=await g.snap();await g.advance(Math.max(0,21-s0.lunch.job.bake));await brief(g,'baked');
await W(g,-2.4,-5.9);await g.key('KeyE');await W(g,.2,-5.8);await g.key('KeyE');await g.advance(.2);
await W(g,-6.5,-4.8);await g.key('KeyE');await W(g,-5.7,-3.3);await g.key('KeyE');
await R(g,[[-8.8,-5],[-11.2,-6.8]]);await g.zoom(-1200);await g.shot(`${P}-31-capcart-close-storeroom`);await g.zoom(1200);await g.key('KeyE');
await R(g,[[-8.8,-5],[-5,-5],[.3,-1.3],[.3,2.4],[10,1],[11.3,-4.4]]);await g.key('KeyE');await g.advance(.3);
await brief(g,'docked');console.log('hud',await hudText(g));await g.shot(`${P}-32-capcart-docked`);await g.zoom(-1200);await g.shot(`${P}-33-capcart-docked-close`);await g.zoom(1200);
for(const [bx,drop] of [[7,[-1.4,1.8]],[9,[1.5,.9]]]){await R(g,[[10,1],[bx,7.3]],.4);await g.key('KeyE');await W(g,drop[0],drop[1],.4);await g.key('KeyE');}
await R(g,[[10,1],[-9.8,3.5]]);await g.key('KeyF');
await R(g,[[.3,2.4],[.3,-1.3],[4.7,-4.8]]);await g.key('KeyF');
if(!trap){await g.key('KeyE');await g.advance(1.3);await brief(g,'conveyor on');console.log('hud',await hudText(g),await n());await g.shot(`${P}-34-conveyor-running`);}
await W(g,-3.8,-1.7,.4);await g.key('KeyF');
const cap=(await g.snap()).items.find(i=>i.id==='capacitor').pos;
await R(g,[[.3,-1.3],[.3,2.4],[10,1],[cap.x-.9,cap.z]]);await g.key('KeyF');await brief(g,'cap fed');
await W(g,11.8,-4.4,.45);console.log('hud before lift',await hudText(g));await g.key('KeyE',0);
await g.advance(.1);console.log('lift +0.1',await n());await g.shot(`${P}-35-lift-start-0.1s`);
await g.advance(.5);await brief(g,'lift +0.6');console.log(await n());await g.shot(`${P}-36-lift-start-0.6s`);
if(trap){
  // now the conveyor
  await R(g,[[10,1],[.3,2.4],[.3,-1.3],[4.7,-4.8]]);console.log('hud at conveyor',await hudText(g));await g.key('KeyE',0);await g.advance(.3);await brief(g,'trap conveyor on');console.log('hud',await hudText(g),await n());
  await g.shot(`${P}-37-trap-conveyor-trips`);
  await R(g,[[.3,-1.3],[.3,2.4],[-10,3.5],[-12,3.5]]);console.log(await brief(g,"at cart A").then(()=>""));await g.key('KeyE');await g.advance(.5);await brief(g,'trap after reset');console.log('hud',await hudText(g));await g.shot(`${P}-38-trap-reset-retrips`);
} else {
  await g.advance(3);await g.shot(`${P}-37-lift-rising`);await g.advance(13);const s=await brief(g,'end');console.log('hud',await hudText(g));
  await g.advance(2.5);await g.shot(`${P}-38-win`);await g.page.waitForTimeout(2500);await g.shot(`${P}-39-result-card`);
  console.log(await g.page.evaluate(()=>document.querySelector('.result-screen,[data-screen="result"]')?.innerText));
}
console.log('errors',JSON.stringify(await g.close()),'ms',Date.now()-t0);

// What quality does a fresh profile actually get? (no localStorage key)
import {launch} from '../cap.mjs';import {hookGame,q,launch2} from './cap2.mjs';
for(const [label,query] of [['fullfx-manual',{fullfx:true}],['manual-nofx',{fullfx:false}]]){
  const g=await launch('garage',query);await g.page.evaluate(()=>localStorage.removeItem('circuit-crew-quality'));await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');
  const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();await hookGame(g);
  console.log(label,'fresh',JSON.stringify(await q(g)));await g.close();
}
// real player URL (no manual), fresh profile
{const g=await launch('garage',{fullfx:false,start:false});await g.page.goto('http://127.0.0.1:4173/?level=garage');await g.page.evaluate(()=>localStorage.clear());await g.page.reload();await g.page.waitForSelector('body[data-ready="true"]');
 await hookGame(g).catch(()=>{});await g.page.waitForTimeout(800);await g.page.evaluate(async()=>{});
 console.log('player-url fresh',JSON.stringify(await q(g)));await g.close();}
for(const v of ['0','1','2']){const g=await launch2('garage',{fullfx:true},v);console.log('stored',v,JSON.stringify(await q(g)));await g.close();}

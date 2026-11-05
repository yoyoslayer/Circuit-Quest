// Debug: which prize box counts as knocked at rest, and where it was then.
import {launch} from '../cap.mjs';
const g=await launch('arcade',{fullfx:false,start:false});
const r=await g.page.evaluate(()=>{const G=window.__game,st=G.station;const log=[];const orig=st.updatePrizes.bind(st);
  st.updatePrizes=function(){const before=this.prizesDown;orig();if(this.prizesDown!==before)log.push({t:G.time,gone:[...this.prizeGone],pos:this.room.prizes.map(p=>p.body.translation())});};
  window.__log=log;return [...st.prizeGone];});
console.log('before start',JSON.stringify(r));
const b=g.page.getByRole('button',{name:'Start playing'});if(await b.count())await b.click();
await g.advance(2);console.log(JSON.stringify(await g.page.evaluate(()=>window.__log)));
await g.close();

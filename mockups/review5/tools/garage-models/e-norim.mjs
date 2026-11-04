import {launch} from '../cap.mjs';
const P='garage-models-';
const g=await launch('garage',{fullfx:true,query:'norim'});
await g.advance(.5);await g.shot(P+'80-start-norim');
await g.zoom(-2000);await g.walk(2,1);await g.walk(6.4,-3.4);await g.advance(.3);await g.shot(P+'81-robots-norim-zoom9');
// material census
const mats=await g.page.evaluate(()=>{const out={};const seen=new Set();
  // find three scene via canvas? not exposed; use THREE devtools hook
  const scenes=window.__THREE_DEVTOOLS__?'devtools':'none';return {scenes};});
console.log('MATS',JSON.stringify(mats));
console.log('ERR',JSON.stringify(await g.close()));

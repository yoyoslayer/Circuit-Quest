import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});
const urls=await g.page.evaluate(()=>performance.getEntriesByType('resource').map(e=>e.name).filter(n=>/three|kit\.ts|toon\.ts/.test(n)));
console.log(urls.join('\n'));
console.log(await g.close());

import {launch} from '../cap.mjs';
const g=await launch('meeting',{fullfx:false});
let s=await g.snap();console.log('t0',JSON.stringify(s.items.find(i=>i.id==='coupler').pos));
await g.advance(2);s=await g.snap();console.log('t2',JSON.stringify(s.items.find(i=>i.id==='coupler').pos),JSON.stringify(s.items.find(i=>i.id==='extension').pos));
console.log('errors',JSON.stringify(await g.close()));

import {launch} from '../cap.mjs';
const g=await launch('meeting',{fullfx:false});const a=await g.audit(.02);
const k=s=>s.replace(/ @.*/,'').replace(/-\d+$/,'');const c={};for(const o of a){const key=k(o.a)+' x '+k(o.b);(c[key]??=[]).push(o.a.split('@')[1]+' '+o.depth);}
for(const [kk,v] of Object.entries(c))console.log(kk,v.length,v.slice(0,4).join(' | '));
console.log(await g.close());

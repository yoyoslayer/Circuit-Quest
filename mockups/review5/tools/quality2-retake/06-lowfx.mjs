// Does a stored quality override ?lowfx / plain ?manual (which createRenderer sets to 0)?
import {launch2,q} from './cap2.mjs';
for(const [fx,query] of [[false,''],[false,'lowfx']]){const g=await launch2('garage',{fullfx:fx,query},'1');console.log('manual',fx?'fullfx':'', query,'stored 1 ->',JSON.stringify(await q(g)));await g.close();}

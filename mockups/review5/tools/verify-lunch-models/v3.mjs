import {launch} from '../cap.mjs';
import {hook} from '../lunch-models/hook.mjs';
const g=await launch('lunch',{fullfx:false});
await hook(g);await g.advance(.3);
console.log('dc lowfx',(await g.snap()).drawCalls);
const pos=await g.page.evaluate(()=>window.__g.props.map(p=>{const t=p.body.translation();return [t.x,t.z];}));
const W=33,D=20,cells={};for(const [x,z] of pos){const cx=Math.floor((x+W/2)/4),cz=Math.floor((z+D/2)/4);cells[cz+','+cx]=(cells[cz+','+cx]||0)+1;}
for(let cz=0;cz<5;cz++){let row='z'+(-10+cz*4)+'\t';for(let cx=0;cx<9;cx++)row+=(cells[cz+','+cx]||0)+'\t';console.log(row);}
console.log('errors',JSON.stringify(await g.close()));

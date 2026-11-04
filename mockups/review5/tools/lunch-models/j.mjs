// Supply cart A tipped by Pip walking past it.
import {launch} from '../cap.mjs';
import {hook} from './hook.mjs';
const P='lunch-models';
const g=await launch('lunch',{fullfx:true});
await hook(g);
const tilt=id=>g.page.evaluate(id=>{const p=window.__g.props.find(p=>p.spec.id===id);const q=p.body.rotation();return +(Math.acos(Math.max(-1,Math.min(1,1-2*(q.x*q.x+q.z*q.z))))*57.3).toFixed(1);},id);
await g.advance(.5);
await g.walk(-14.2,5,.4);console.log('tilt after 1',await tilt('supply-a'));
await g.walk(-12,1.6,.4);console.log('tilt after 2',await tilt('supply-a'));await g.advance(2);console.log('tilt settled',await tilt('supply-a'));
await g.shot(`${P}-99-cartA-tipped`);
await g.zoom(-2000);await g.shot(`${P}-99b-cartA-tipped-close`);
console.log('errors',JSON.stringify(await g.close()));

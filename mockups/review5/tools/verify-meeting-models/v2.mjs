import {launch} from '../cap.mjs';
const P='verify-meeting-models';
const g=await launch('meeting',{fullfx:true});
const au=await g.audit(.02);
const c={};for(const h of au){const k=h.a.split(' ')[0]+'/'+h.b.split(' ')[0];c[k]=(c[k]||0)+1;}console.log('audit-at-load',au.length,JSON.stringify(c));
await g.advance(.5);
// coffee corner
for(const [x,z] of [[-10,-1.5],[-10,3.6],[-11.8,3.8]])await g.walk(x,z,.4);
await g.shot(`${P}-10-coffee-default`);
await g.zoom(-2000);await g.shot(`${P}-11-coffee-zoom9`);
await g.advance(.6);await g.shot(`${P}-12-coffee-zoom9-later`);
// mail cart default zoom
await g.zoom(1200);
for(const [x,z] of [[-8,3.6],[-3.4,3.6]])await g.walk(x,z,.4);
await g.shot(`${P}-13-mailcart`);
// plant in decor box stack
await g.zoom(-2000);
for(const [x,z] of [[0,5.5],[6.8,5.4],[7.2,7.6]])await g.walk(x,z,.4);
await g.shot(`${P}-14-plant-stack`);
await g.orbit(700,0);await g.shot(`${P}-15-plant-stack-back`);
console.log('errors',JSON.stringify(await g.close()));

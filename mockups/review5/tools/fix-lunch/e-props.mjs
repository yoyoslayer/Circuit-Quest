// Fix-lunch check E: which solid props the Lunch cables can wrap, and where they stand.
import {launch} from '../cap.mjs';
const g=await launch('lunch');await g.advance(.5);
console.log(JSON.stringify(await g.ev(`const k=new Set(['desk','bookshelf','cabinet','sofa','printer','cooler','vending','cart','coolbox']);return window.__game.props.filter(p=>k.has(p.spec.kind)).map(p=>[p.spec.kind,p.spec.id??'',+p.body.translation().x.toFixed(2),+p.body.translation().z.toFixed(2)])`)));
await g.close();

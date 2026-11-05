// Lists decorRoot's children after the static merge (type, name, material traits).
import {launch} from '../cap.mjs';
const g=await launch(process.argv[2]??'meeting',{fullfx:true});await g.advance(.2);
console.log(JSON.stringify(await g.page.evaluate(()=>{const G=window.__game;return G.decorRoot.children.map(o=>{const m=o.material;return [o.type,o.name,m?.type,m?.vertexColors,m?.map?1:0,m?.transparent,m?.emissive?.getHex?.(),m?.defines&&Object.keys(m.defines).length,o.children.length];});})));
await g.close();

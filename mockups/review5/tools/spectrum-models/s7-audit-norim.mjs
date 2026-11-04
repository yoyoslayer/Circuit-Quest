import {start,K} from './lib.mjs';
import {writeFileSync} from 'node:fs';
// audit + norim + prop positions
const g=await start({query:'norim'});
const a2=await g.audit(.02);console.log('AUDIT .02 n',a2.length,JSON.stringify(a2).slice(0,3000));
const a4=await g.audit(.04);console.log('AUDIT .04 n',a4.length);
await g.advance(.5);
const s=await g.snap();
writeFileSync('mockups/review5/tools/spectrum-models/snap.json',JSON.stringify(s,null,1));
console.log('keys',Object.keys(s).join(','));console.log('fps',s.fps,'dc',s.drawCalls,'props',Array.isArray(s.props)?s.props.length:s.props);
await g.S('90','norim-start');
await g.survey();await g.S('91','norim-survey');await g.survey();
// light count via scene
console.log('errors',JSON.stringify(await g.close()));

// Quick check that capture works: node mockups/review5/tools/smoke.mjs [level]
import {launch} from './cap.mjs';
const level=process.argv[2]??'playground';const t0=Date.now();
const g=await launch(level);await g.advance(1.5);await g.shot(`_smoke-${level}`);
const s=await g.snap();console.log(level,'props',s.props,'drawCalls',s.drawCalls,'keys',Object.keys(s).join(','));
console.log('errors',JSON.stringify(await g.close()),'ms',Date.now()-t0);

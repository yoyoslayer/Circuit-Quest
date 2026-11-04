// node crop.mjs in.png out.png x y w h scale
import {chromium} from '@playwright/test';import {readFileSync} from 'node:fs';import {resolve} from 'node:path';
const [inp,out,x,y,w,h,s='3']=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:Math.round(w*s),height:Math.round(h*s)}});
const data='data:image/png;base64,'+readFileSync(inp).toString('base64');
await p.setContent(`<body style="margin:0;overflow:hidden"><div style="width:${w*s}px;height:${h*s}px;background:url(${data}) -${x*s}px -${y*s}px/${1440*s}px ${900*s}px;image-rendering:pixelated"></div></body>`);
await p.screenshot({path:out});await b.close();

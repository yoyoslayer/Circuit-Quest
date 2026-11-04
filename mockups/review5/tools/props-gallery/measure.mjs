import {chromium} from '@playwright/test';
const b=await chromium.launch();const p=await b.newPage();await p.goto('http://127.0.0.1:4173/mockups/review5/tools/props-gallery/measure.html');await p.waitForSelector('body[data-ready="true"]',{state:'attached'});
const m=await p.evaluate(()=>window.measure);for(const [k,v] of Object.entries(m))console.log(k.padEnd(10),JSON.stringify(v.size).padEnd(18),'visual',JSON.stringify(v.min),JSON.stringify(v.max),'over+',JSON.stringify(v.over),'under-',JSON.stringify(v.under),v.meshes,v.tris,v.mats.join());await b.close();

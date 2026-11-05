// Start and survey shots per room, plus median floor luma on a few floor crops (DR-54: 140-185).
// BASE=http://localhost:4211 node mockups/review5/tools/fix-colour2/shots.mjs <tag> [level...]
import {launch,SHOTS} from '../cap.mjs';
import {readFileSync} from 'node:fs';
const [tag='after',...rest]=process.argv.slice(2);
const levels=rest.length?rest:['meeting','playground','garage','lobby'];
const CROPS={lobby:[[960,330,1080,420],[600,330,680,370],[300,700,420,780]],garage:[[820,440,1000,520],[420,480,560,560],[860,620,1000,700]]};
async function luma(g,file,crops){
  const b64=readFileSync(file).toString('base64');
  return g.page.evaluate(async([b64,crops])=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);
    return crops.map(([x0,y0,x1,y1])=>{const d=x.getImageData(x0,y0,x1-x0,y1-y0).data,v=[];for(let i=0;i<d.length;i+=4)v.push(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2]);v.sort((a,b)=>a-b);return Math.round(v[v.length>>1]);});},[b64,crops]);
}
for(const lv of levels){
  const g=await launch(lv,{fullfx:true});await g.advance(1.2);
  await g.shot(`fix-colour2-${lv}-${tag}-start`);
  const lum=await luma(g,`${SHOTS}/fix-colour2-${lv}-${tag}-start.png`,CROPS[lv]??[]);
  await g.survey();await g.shot(`fix-colour2-${lv}-${tag}-survey`);
  console.log(lv,'floor luma',JSON.stringify(lum),g.errors.slice(0,3));
  await g.browser.close();
}

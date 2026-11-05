// Start and survey shots per room, plus median floor luma on a few floor crops (DR-54: 140-185).
// BASE=http://localhost:4205 node mockups/review5/tools/fix-colour/shots.mjs [level...]
import {launch,SHOTS} from '../cap.mjs';
import {readFileSync} from 'node:fs';
const levels=process.argv.slice(2).length?process.argv.slice(2):['lobby','lunch','arcade','garage','qfn','observatory','spectrum'];
// Floor crops [x0,y0,x1,y1] in the 1440x900 start frame, picked on open floor near Pip.
const CROPS={lobby:[[960,330,1080,420],[600,330,680,370],[300,700,420,780]],lunch:[[420,480,560,560],[900,420,1000,480],[1100,650,1250,720]],
  arcade:[[900,520,1050,600],[560,560,700,640]],garage:[[820,440,1000,520],[420,480,560,560],[860,620,1000,700]],
  qfn:[[560,560,700,640],[900,420,1000,480]],observatory:[[560,470,640,520],[1050,520,1250,580]],spectrum:[[1230,420,1330,480],[300,700,420,780]]};
async function luma(g,file,crops){
  const b64=readFileSync(file).toString('base64');
  return g.page.evaluate(async([b64,crops])=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();
    const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);
    return crops.map(([x0,y0,x1,y1])=>{const d=x.getImageData(x0,y0,x1-x0,y1-y0).data,v=[];for(let i=0;i<d.length;i+=4)v.push(.2126*d[i]+.7152*d[i+1]+.0722*d[i+2]);v.sort((a,b)=>a-b);return Math.round(v[v.length>>1]);});},[b64,crops]);
}
for(const lv of levels){
  const g=await launch(lv,{fullfx:true});await g.advance(1.2);
  await g.shot(`fix-colour-${lv}-start`);
  const lum=await luma(g,`${SHOTS}/fix-colour-${lv}-start.png`,CROPS[lv]??[]);
  await g.survey();await g.shot(`fix-colour-${lv}-survey`);
  console.log(lv,'floor luma',JSON.stringify(lum));
  await g.browser.close();
}

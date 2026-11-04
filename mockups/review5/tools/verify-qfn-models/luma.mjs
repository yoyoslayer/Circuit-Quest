import {chromium} from '@playwright/test';
import {readFileSync} from 'node:fs';
const b=await chromium.launch();const p=await b.newPage();
for(const f of ['qfn-models-01-start','verify-qfn-models-01-start','qfn-models-70-norim-start']){
  const data='data:image/png;base64,'+readFileSync(`mockups/review5/shots/${f}.png`).toString('base64');
  const r=await p.evaluate(async(d)=>{const im=new Image();im.src=d;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
    const med=(x0,y0,x1,y1)=>{const a=x.getImageData(x0,y0,x1-x0,y1-y0).data,v=[];for(let i=0;i<a.length;i+=4)v.push(.299*a[i]+.587*a[i+1]+.114*a[i+2]);v.sort((m,n)=>m-n);return Math.round(v[v.length>>1]);};
    return [med(560,560,700,640),med(900,420,1000,480),med(1040,560,1080,600),med(660,540,700,580),med(760,560,800,600)];},data);
  console.log(f,r);}
await b.close();

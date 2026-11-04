import {launch} from '../cap.mjs';
const P='p0check-spectrum-play';
for(const [w,h,tag] of [[390,844,'portrait'],[844,390,'landscape'],[932,430,'landscape-big']]){
  const g=await launch('spectrum',{fullfx:true,width:w,height:h});
  await g.advance(1);
  await g.walk(-3.5,3.55,.4);await g.key('KeyE',1.5);
  const s=await g.snap();console.log(tag,'atBench',s.atBench??JSON.stringify(s).slice(0,200));
  await g.shot(`${P}-${tag}-bench`);
  // probe clickables: scan canvas with mouse moves, record cursor pointer
  const hits=[];for(let y=Math.round(h*.3);y<h;y+=8)for(let x=2;x<w;x+=6){await g.page.mouse.move(x,y);const c=await g.page.evaluate(()=>document.body.style.cursor);if(c==='pointer')hits.push([x,y]);}
  const xs=hits.map(p=>p[0]);console.log(tag,'pointer hits',hits.length,'minx',Math.min(...xs),'maxx',Math.max(...xs));
  console.log(tag,'errors',await g.close());
}

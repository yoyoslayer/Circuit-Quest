import {launch} from '../cap.mjs';
const g=await launch('arcade-rush',{fullfx:false,start:false});
const out=await g.page.evaluate(async()=>{
  const L=await import('/src/stations/arcade/logic.ts');const {rng}=await import('/src/render/textures.ts');
  const r=rng(20261029),n=2000;const c={hot:0,hotTrip:0,hotPop:0,hotOk:0,trips:0,pops:0,tier1:0,back:0,backHi:0,dim:0,dimHalf:0,dimTier1:0,dimTier0:0,startEqFixBack:0};
  let fixHeatMax=0;const first=[];const fixes={};
  for(let i=0;i<n;i++){const j=L.rushJob(r,i),rd=L.read(j,j.start),v=L.judge(j,j.start),f=L.best(j);
    const fr=L.read(j,{chain:f,reversed:false});fixHeatMax=Math.max(fixHeatMax,fr.rHeat);fixes[JSON.stringify(f)]=(fixes[JSON.stringify(f)]||0)+1;
    if(rd.tripped)c.trips++;else if(rd.level>L.HOUSE.ledPop)c.pops++;
    if(v.tier===1)c.tier1++;
    if(j.story.startsWith('Too bright')){c.hot++;if(rd.tripped)c.hotTrip++;else if(rd.level>L.HOUSE.ledPop)c.hotPop++;else c.hotOk++;}
    if(j.start.reversed){c.back++;if(j.supply>5)c.backHi++;}
    if(j.story.startsWith('Barely')){c.dim++;if(rd.iLoad<j.band[0]/2)c.dimHalf++;if(v.tier===1)c.dimTier1++;if(v.tier===0)c.dimTier0++;}
    if(i<12)first.push(`${i}:${j.ask}|${j.story.slice(0,20)}|startI ${(rd.iLoad*1000).toFixed(1)} trip ${rd.tripped} tier ${v.tier}`);}
  // margin: among packed reliable-or-better-in-band chains, how many single blocks in band fail the margin?
  const r2=rng(77);let marginBind=0,jobsN=300;for(let i=0;i<jobsN;i++){const j=L.rushJob(r2,i);let bind=false;
    for(const ch of L.allChains()){const s={chain:ch,reversed:false},rd=L.read(j,s);const inBand=rd.iLoad>=j.band[0]&&rd.iLoad<=j.band[1];if(inBand&&rd.rHeat>L.HOUSE.margin){bind=true;break;}}if(bind)marginBind++;}
  const top=Object.entries(fixes).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>`${k} ${(v/n*100).toFixed(1)}%`);
  return {...c,frac:{trips:c.trips/n,pops:c.pops/n,tier1:c.tier1/n,back:c.back/n},fixHeatMax,distinctFixes:Object.keys(fixes).length,top,marginBindJobs:`${marginBind}/${jobsN}`,first};
});
console.log(JSON.stringify(out,null,1));console.log(await g.close());

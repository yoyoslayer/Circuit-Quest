import {launch} from '../cap.mjs';
const g=await launch('arcade-rush',{fullfx:false,start:false});
const out=await g.page.evaluate(async()=>{
  const L=await import('/src/stations/arcade/logic.ts');const {rng}=await import('/src/render/textures.ts');
  const r=rng(20261029);let tier1=0,back=0,n=2000;const fixes={},combos={};
  const seq=[];for(let i=0;i<n;i++){const j=L.rushJob(r,i);const v=L.judge(j,j.start);if(v.tier===1)tier1++;if(j.start.reversed)back++;
    const f=JSON.stringify(L.best(j));fixes[f]=(fixes[f]||0)+1;const key=`${j.supply}V vf${j.load.vf} ${j.band}`;combos[key]=f;if(i<12)seq.push(`${i}:${j.ask}|${v.tier}`);}
  // probability random packed single-or-two block chain is reliable / elegant, averaged
  const r2=rng(5);let rel=0,ele=0,tot=0;const opts=[[[47]],[[100]],[[220]],[[470]],...[47,100,220,470].flatMap(a=>[47,100,220,470].map(b=>[[a],[b]]))];
  for(let i=0;i<300;i++){const j=L.rushJob(r2,i);for(const c of opts){const chain=[...c.map(p=>[...p])];while(chain.length<3)chain.push([]);const t=L.judge(j,{chain,reversed:false}).tier;tot++;if(t>=2)rel++;if(t===3)ele++;}}
  // white vs blue same Vf; red vs green fix equality
  let same=0,diff=0;for(const s of [3.3,5,9,12])for(const b of [[.01,.02],[.008,.016],[.012,.02]]){const mk=c=>({id:'x',title:'x',cabinet:'x',supply:s,load:{kind:'led',color:c,vf:L.LED_VF[c],imax:.02},band:b,start:{chain:[[],[],[]],reversed:false},story:'',ask:''});
    const a=JSON.stringify(L.best(mk('red'))),c=JSON.stringify(L.best(mk('green')));if(a===c)same++;else diff++;}
  // dim start cases with tier1
  return {tier1Frac:tier1/n,backFrac:back/n,fixes,combos:Object.keys(combos).length,seq,relFrac:rel/tot,eleFrac:ele/tot,redGreenSame:same,redGreenDiff:diff};
});
console.log(JSON.stringify(out,null,1));console.log(await g.close());

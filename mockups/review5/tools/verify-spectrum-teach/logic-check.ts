import {JOBS,judge,read,BANDS,BAND_IDS,POWERS,legHits,TX,PADS,SPOTS,leanest,solutions,type Setup,type Band} from '../../../../src/stations/spectrum/logic';
const S=(job:number,band:Band,power:any,hatchOpen:boolean,mirrors:any[]=[],aim?:any):Setup=>({band,detector:BANDS[band].detector,power,hatchOpen,mirrors,pod:JOBS[job].pad,aim});
for(const [ji,j] of JOBS.entries()){console.log('== job',j.id,'leanest',leanest(j)?.hint);
  for(const b of BAND_IDS)for(const p of POWERS)for(const h of [false,true]){const v=judge(j,S(ji,b,p,h));if(p===1||b==='radio'||b==='micro')console.log(b,p,'hatch',h,'tier',v.tier,v.margin,(v.problems[0]??v.notes[0]??'').slice(0,90));}}
console.log('lab radio legs',JSON.stringify(legHits(TX,PADS.lab,'radio',true).map(h=>[h.mat,h.wall,h.at])));
console.log('quiet nir via A',JSON.stringify(judge(JOBS[2],S(2,'nir',1,false,['A']))));
console.log('quiet thermal',JSON.stringify(judge(JOBS[2],S(2,'thermal',1,false))));
console.log('store micro 10',JSON.stringify(judge(JOBS[0],S(0,'micro',10,false))));
console.log('lab vis A 1',JSON.stringify(judge(JOBS[1],S(1,'vis',1,true,['A']))));
console.log('lab vis A 10',JSON.stringify(judge(JOBS[1],S(1,'vis',10,true,['A']))));
console.log('lab nir A 1',JSON.stringify(judge(JOBS[1],S(1,'nir',1,true,['A']))));
console.log('quiet vis 100',JSON.stringify(judge(JOBS[2],S(2,'vis',100,false))));
console.log('A',SPOTS.A);

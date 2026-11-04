import {launch,item,d2,retrieve,fmt} from './lib.mjs';
const K='stuck-softlock';const g=await launch('arcade',{fullfx:true});const L=(...a)=>console.log(...a);const stand={x:0,z:-1.55};
try{
await g.advance(.5);let s;
await g.walk(-5.5,6.6);await g.walk(-7.2,5.8);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
for(const z0 of [5.5,4.5,6.5,3.5,7.2]){s=await g.snap();if(s.held!=='blocks'){const r=await retrieve(g,'blocks');if(!r.ok){L('lost',JSON.stringify(r));break;}}
  await g.walk(.6,z0+1.5,.3,20);await g.walk(.6,z0,.15,10);await g.key('KeyQ',.05);await g.advance(3);s=await g.snap();const p=item(s,'blocks').pos;
  L('from z',z0,'landed',fmt(p),'dStand',d2(p,stand).toFixed(2));
  if(d2(p,stand)<1.7&&p.y<.5){await g.walk(p.x,p.z+1.2,.3,15);s=await g.snap();L(' pip dStand',d2(s.player,stand).toFixed(2),'dTray',d2(s.player,p).toFixed(2));await g.key('KeyE');s=await g.snap();L(' E ->',s.held,'atBench',s.atBench);
    await g.shot(`${K}-08-arcade-tray-at-stand-E-sits`);if(s.atBench)await g.key('KeyE');
    // search for any spot that grabs it
    let got=false;for(let a=0;a<16&&!got;a++){const ang=a/16*Math.PI*2;for(const rr of [1.0,1.3,1.55]){const x=p.x+Math.sin(ang)*rr,z=p.z+Math.cos(ang)*rr;await g.walk(x,z,.15,8);s=await g.snap();if(d2(s.player,p)>1.6)continue;await g.key('KeyE');s=await g.snap();if(s.held==='blocks'){L(' grabbed from',fmt(s.player),'dStand',d2(s.player,stand).toFixed(2));got=true;break;}if(s.atBench)await g.key('KeyE');}}
    L(' got',got);break;}
}
}catch(e){L('ERR',e.message);}
L('errors',JSON.stringify(await g.close()));

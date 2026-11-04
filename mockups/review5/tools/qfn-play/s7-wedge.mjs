import {launch} from '../cap.mjs';import {txt,log} from './common.mjs';
const tries=[
  {name:'pnp-top',stand:[-6.4,-4.2],face:[-6.4,-5.0]},
  {name:'aoi-top',stand:[7.6,-4.6],face:[7.6,-5.4]},
  {name:'rack-gap',stand:[10.4,2.2],face:[10.4,1.4]},
  {name:'side-table',stand:[3.6,0.2],face:[3.2,-.6]},
  {name:'bench-top',stand:[-.3,.4],face:[-.3,-.4]},
];
for(const t of tries){
  const g=await launch('qfn',{fullfx:false});
  await g.advance(.2);await g.walk(-8.8,2.95,.5);await g.key('KeyE');
  // approach so heading points at the face point
  await g.walk(t.stand[0]+(t.stand[0]-t.face[0])*2,t.stand[1]+(t.stand[1]-t.face[1])*2,.5);
  await g.walk(t.stand[0],t.stand[1],.3);
  await g.key('KeyQ',.1);await g.advance(3);
  let s=await g.snap();let c=s.items[0].pos;log(t.name,'landed',[c.x,c.y,c.z].map(v=>+v.toFixed(2)),'ready',s.station.partsReady,await txt(g));
  await g.advance(8);s=await g.snap();c=s.items[0].pos;log(t.name,'after 8s',[c.x,c.y,c.z].map(v=>+v.toFixed(2)));
  await g.shot(`qfn-play-8${tries.indexOf(t)}-throw-${t.name}`);
  // can Pip get it back?
  const r=await g.walk(c.x+ (t.stand[0]-t.face[0])*1.2,c.z+(t.stand[1]-t.face[1])*1.2,.6,15);s=await g.snap();log(t.name,'reach walk',r.arrived,await txt(g));
  await g.close();
}

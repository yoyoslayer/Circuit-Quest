// Tuning helper for the chaos bonuses (dev only: it places Pip and hands him a prop through __game).
// node tune.mjs <level> <prop kind | id:theId> <tx> <tz> <d1,d2,…>   AXIS = side Pip throws from: z | nz | x | nx
//   e.g. AXIS=nz node tune.mjs spectrum cone 2.1 4.85 4,5,6,7
import {launch} from '../cap.mjs';
const [lv,pick,tx,tz,ds]=process.argv.slice(2);const axis=process.env.AXIS??'z';
const off={z:[0,1],nz:[0,-1],x:[1,0],nx:[-1,0]}[axis];
for(const d of ds.split(',').map(Number)){
  const g=await launch(lv,{fullfx:false});await g.advance(.3);
  await g.page.evaluate(([pick,tx,tz,d,ox,oz])=>{const G=window.__game,px=tx+ox*d,pz=tz+oz*d;
    G.player.setTranslation({x:px,y:.91,z:pz},true);G.player.setNextKinematicTranslation({x:px,y:.91,z:pz});G.heading=Math.atan2(-ox,-oz);
    const p=pick.startsWith('id:')?G.props.find(q=>q.spec.id===pick.slice(3)):G.props.filter(q=>q.spec.kind===pick&&!q.spec.id).sort((a,b)=>Math.hypot(a.spec.x-px,a.spec.z-pz)-Math.hypot(b.spec.x-px,b.spec.z-pz))[0];
    p.body.setTranslation({x:px-ox*.8,y:1.2,z:pz-oz*.8},true);G.held=p;},[pick,+tx,+tz,d,off[0],off[1]]);
  await g.advance(.4);
  await g.page.evaluate(()=>window.__game.action('throw'));
  await g.advance(3);
  const st=(await g.snap()).station;
  const res=await g.page.evaluate(()=>{const G=window.__game,t=G.station.room?.toaster?.body.translation(),c=G.props.find(q=>q.spec.id==='parts')?.body.translation();return {toaster:t&&[+t.x.toFixed(2),+t.y.toFixed(2),+t.z.toFixed(2)],crate:c&&[+c.x.toFixed(2),+c.y.toFixed(2),+c.z.toFixed(2)]};});
  console.log(lv,'d',d,JSON.stringify({prizesDown:st.prizesDown,tossed:st.tossed,partsReady:st.partsReady,toasterDown:st.toasterDown,...res}));
  if(process.env.SHOT)await g.shot(`fix-stationcable-tune-${lv}-${d}`);
  await g.close();
}

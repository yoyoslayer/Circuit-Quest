// Loads a station, idles a few seconds and prints the chaos-bonus state (nothing should be earned at rest).
import {launch} from '../cap.mjs';
for(const lv of process.argv.slice(2)){
  const g=await launch(lv,{fullfx:false});await g.advance(6);const s=await g.snap();
  const prizes=await g.page.evaluate(()=>window.__game.station.room?.prizes?.map(p=>{const t=p.body.translation();return [+(t.x-p.home.x).toFixed(3),+(t.y-p.home.y).toFixed(3),+(t.z-p.home.z).toFixed(3),p.body.isSleeping()];}));
  const st=s.station;console.log(lv,JSON.stringify({prizesDown:st.prizesDown,parcels:st.parcelsBowled,toaster:st.toasterDown,cartWall:st.cartWall,tossed:st.tossed,prizes}));
  await g.close();
}

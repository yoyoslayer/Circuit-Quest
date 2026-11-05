// Win shots for every room (R5-077): Pip and the payoff framed together left of the result card.
// Usage: BASE=http://localhost:4203 node mockups/review5/tools/fix-juice/wins.mjs [room ...]
// For each room it puts Pip where the clean route ends, forces the win (window.__game.win()), lets
// the push-in settle in real time, prints where Pip and the focus land in NDC, and saves a shot.
import {launch} from '../cap.mjs';
const rooms=process.argv.slice(2).length?process.argv.slice(2):['playground','meeting','lunch','garage','arcade','observatory','qfn','spectrum'];
for(const room of rooms){
  const g=await launch(room,{fullfx:true});await g.advance(.4);
  await g.page.evaluate(([room])=>{const G=window.__game,p=G.player;
    if(G.station){const s=G.station.stand;p.setTranslation({x:s.x,y:p.translation().y,z:s.z},true);
      // Garage: the robot has reached its dock.
      if(room==='garage'){const b=G.props.find(q=>q.spec.id==='robot');b.body.setTranslation({x:-8.1,y:.35,z:-5.6},true);G.station.update(0);}}
    else if(room==='meeting')p.setTranslation({x:10.6,y:p.translation().y,z:-6.6},true);
    else if(room==='playground'){const t=G.level.target;p.setTranslation({x:t.x-1.2,y:p.translation().y,z:t.z+1.4},true);}
    else if(room==='lunch')p.setTranslation({x:9.5,y:p.translation().y,z:-4.5},true);
  },[room]);
  await g.advance(.1);
  await g.page.evaluate(()=>window.__game.win());
  await g.page.waitForTimeout(3500);
  const ndc=await g.page.evaluate(()=>{const G=window.__game,c=G.view.camera,p=G.player.translation(),f=G.winFocus();
    const pr=(x,y,z)=>{const v=c.position.clone().set(x,y,z).project(c);return [+v.x.toFixed(2),+v.y.toFixed(2)];};
    return {pipFeet:pr(p.x,p.y-.78,p.z),pipHead:pr(p.x,p.y+.95,p.z),focus:pr(f.x,f.y,f.z),shot:G.winShot&&{d:G.winShot.distance,yaw:+G.winShot.yaw.toFixed(2)},hitstops:G.hitstops};});
  console.log(room,JSON.stringify(ndc));
  await g.shot(`fix-juice-win-${room}`);
  const errors=await g.close();if(errors.length)console.log('  errors',errors.slice(0,3));
}

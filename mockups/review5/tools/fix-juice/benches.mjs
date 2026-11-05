// Bench payoffs: the garage avalanche (R5-029) and robot head (R5-082), the arcade play-test framing
// and sign-off (R5-080). Usage: BASE=http://localhost:4203 node mockups/review5/tools/fix-juice/benches.mjs
import {launch} from '../cap.mjs';
{ const g=await launch('garage');await g.advance(.4);
  // The robot onto the stand, Pip to the bench.
  await g.page.evaluate(()=>{const G=window.__game,b=G.props.find(q=>q.spec.id==='robot');b.body.setTranslation({x:2.5,y:.6,z:-4.4},true);G.station.dropped(b);
    const p=G.player,s=G.station.stand;p.setTranslation({x:s.x,y:p.translation().y,z:s.z},true);});
  await g.advance(.2);await g.page.evaluate(()=>window.__game.enterBench());await g.advance(.5);
  await g.shot('fix-juice-garage-stand');
  await g.act('pulse');await g.advance(.86);await g.shot('fix-juice-garage-avalanche');
  console.log('garage',JSON.stringify((await g.snap()).station.capture?.fault));
  console.log('errors',(await g.close()).filter(e=>!e.includes('403')));
}
{ const g=await launch('arcade');await g.advance(.4);
  await g.page.evaluate(()=>{const G=window.__game,tray=G.props.find(q=>q.spec.id==='blocks');if(tray){G.station.dropped?.(tray);}
    const p=G.player,s=G.station.stand;p.setTranslation({x:s.x,y:p.translation().y,z:s.z},true);});
  await g.advance(.2);
  // Mark the tray delivered if dropping it in place didn't.
  await g.page.evaluate(()=>{const st=window.__game.station;if(!st.trayReady){st.trayReady=true;}window.__game.enterBench();});await g.advance(.3);
  for(const [n,a] of [['slot','across'],['pick',220],['slot',0],['power']])console.log(n,a,(await g.act(n,a)).ok);
  await g.advance(2.2);await g.shot('fix-juice-arcade-soak');
  await g.advance(1.5);console.log('soakDone',(await g.snap()).station.soakDone);
  console.log('signoff',(await g.act('signoff')).ok);await g.advance(.05);await g.shot('fix-juice-arcade-signoff');
  console.log('errors',(await g.close()).filter(e=>!e.includes('403')));
}

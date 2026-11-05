// Garage setUp from station-garage.spec, printing where the robot lands.
import {launch} from '../cap.mjs';
const g=await launch('garage',{fullfx:false});await g.advance(1);
await g.walk(6.4,-4.2,.5);await g.key('KeyE',.2);console.log('held',(await g.snap()).held);
for(const [x,z] of [[3.4,-4],[2.5,-4.4]]){const r=await g.walk(x,z,.5);console.log('walk',x,z,r.arrived,JSON.stringify(r.state.player));}
const bot=()=>g.page.evaluate(()=>{const b=window.__game.props.find(q=>q.spec.id==='robot').body.translation();return {x:+b.x.toFixed(2),y:+b.y.toFixed(2),z:+b.z.toFixed(2)};});
console.log('bot before drop',await bot());await g.key('KeyE',.3);console.log('bot after',await bot(),'onStand',(await g.snap()).station.onStand);
await g.close();

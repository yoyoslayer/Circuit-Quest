import {launch} from '../cap.mjs';
const g=await launch('playground',{fullfx:true});
const log=(...a)=>console.log(...a);
await g.advance(1);await g.shot('cable-01-pg-start');
await g.crop('cable-02-pg-start-reel-crop',{x:300,y:250,width:600,height:450});
await g.zoom(-1500);await g.shot('cable-03-pg-reel-close');
await g.zoom(1000);
await g.key('KeyF');let s=await g.snap();log('pick',s.holdingPlug,s.rope);
// walk clean route in small legs, capture at strain bands
const pts=[[-5,-1],[-4,-4],[5.8,-5.5]];let prev=[s.player.x,s.player.z];const marks=[[.5,'white'],[.72,'yellow'],[.86,'orange'],[.99,'red']];let mi=0;
for(const [x,z] of pts){const [px,pz]=prev;const n=Math.ceil(Math.hypot(x-px,z-pz)/.7);
  for(let i=1;i<=n;i++){const r=await g.walk(px+(x-px)*i/n,pz+(z-pz)*i/n,.35,4);s=r.state;
    while(mi<marks.length&&s.rope.strain>=marks[mi][0]){log('mark',marks[mi][1],s.rope.strain.toFixed(3),s.player.x.toFixed(2),s.player.z.toFixed(2),'bends',s.rope.bends.length);await g.shot(`cable-1${mi}-pg-strain-${marks[mi][1]}`);mi++;}
  }prev=[x,z];}
s=await g.snap();log('end',s.rope,s.player);
await g.shot('cable-15-pg-at-socket');
await g.zoom(-1500);await g.shot('cable-16-pg-at-socket-close');
await g.orbit(500,0);await g.shot('cable-17-pg-at-socket-close-orbit');
await g.zoom(1000);
await g.key('KeyF');s=await g.snap();log('plug',s.holdingPlug,s.rope.strain);
await g.walk(6.6,-5.9,.4);await g.key('KeyE');await g.advance(.3);s=await g.snap();log('won',s.won,s.time);
await g.shot('cable-18-pg-win');await g.advance(2);await g.shot('cable-19-pg-win-push');
log(await g.close());

import {launch} from '../cap.mjs';
const g=await launch('arcade',{fullfx:true});
await g.advance(.3);console.log('arcade start dc',(await g.snap()).drawCalls);
const W=async(pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('stuck',x,z);}};
await W([[-5.5,6.6],[-7.2,5.8]]);await W([[-8.3,4.4]],.3);await g.key('KeyE');
await W([[-7.2,5.8],[-5.5,6.4]]);await W([[1.2,-1.3]]);await g.key('KeyE',.2);
await W([[0,-1.55]],.4);await g.key('KeyE');await g.advance(1);
const s=await g.snap();console.log('atBench',s.atBench,'t',s.time.toFixed(1),'bench dc',s.drawCalls,'fps',s.fps);
console.log('errors',JSON.stringify(await g.close()));

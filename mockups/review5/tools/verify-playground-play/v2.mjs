import {launch} from '../cap.mjs';
import {hud,props,brief} from '../playground-play/lib.mjs';
const K='verify-playground-play';
const seg=(p,a,b)=>{const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz);};
const which=process.argv[2]??'all';
if(which==='all'||which==='a'){const g=await launch('playground',{fullfx:false});await g.advance(.3);
 for(const m of [.02,.01,.005])console.log('audit',m,JSON.stringify(await g.audit(m)));
 const ps=await props(g);const tg={x:7,z:-6};
 for(const a of [{x:-7,z:5},{x:-4.1,z:-7.8},{x:-1.4,z:-8}])console.log('near line from',JSON.stringify(a),JSON.stringify(ps.filter(p=>seg(p,a,tg)<.9&&!['paper','litter','mug'].includes(p.kind)).map(p=>[p.kind,p.x,p.z,+seg(p,a,tg).toFixed(2)])));
 console.log('shelves',JSON.stringify(ps.filter(p=>p.kind==='bookshelf')));
 console.log('beanbag/paper',JSON.stringify(ps.filter(p=>p.kind==='beanbag'||p.kind==='paper').map(p=>[p.kind,p.x,p.z])));
 await g.close();}
if(which==='all'||which==='b'){const g=await launch('playground',{fullfx:false});await g.advance(.3);
 await g.walk(6.6,-5.9,.4);console.log('at switch no plug',JSON.stringify(await hud(g)));
 await g.key('KeyE',.1);console.log('E1 sw',(await g.snap()).switchedOn,JSON.stringify(await hud(g)));
 await g.key('KeyE',.1);console.log('E2 sw',(await g.snap()).switchedOn);
 await g.key('KeyE',.1);console.log('E3 sw',(await g.snap()).switchedOn);
 await g.walk(-7,4.7,.4);await g.key('KeyF',.2);
 for(const [x,z] of [[-5,-1],[-4,-4],[5.8,-5.5]])await g.walk(x,z);
 await g.key('KeyF',.3);const s=await g.snap();console.log('plugged with switch pre-on -> won',s.won,s.electrical,'t',s.time.toFixed(2));
 await g.close();}
if(which==='all'||which==='c'){const g=await launch('playground',{fullfx:true});await g.advance(.3);
 await g.walk(3.3,5.3,.3);await g.advance(.5);console.log('before pins',JSON.stringify(brief(await g.snap())));
 await g.walk(4.9,5.3,.3);await g.walk(6.4,5.3,.3);await g.advance(2);const s=await g.snap();console.log('after walk-through (walk speed, no plug)',s.pinsDown);
 await g.shot(`${K}-05-pins-walked`);await g.close();}
if(which==='all'||which==='d'){const g=await launch('playground',{fullfx:false});await g.advance(.3);await g.key('KeyF',.2);
 for(const [x,z] of [[8,-3.4],[8.4,-3.6],[8.7,-3.7],[8.9,-3.8],[9.1,-3.9]]){await g.walk(x,z,.25,6);await g.advance(.05);const s=await g.snap();const h=await hud(g);console.log('pt',x,z,'strain',s.rope.strain.toFixed(3),'len',s.rope.length.toFixed(2),'bends',s.rope.bends.length,h.prompt,h.acts);
   if(s.rope.strain>.975&&s.rope.strain<1.005){const e=await g.page.evaluate(()=>0);await g.key('KeyQ',.05);const a=await g.snap();console.log('Q at',s.rope.strain.toFixed(3),'-> fastestProp',a.fastestProp.toFixed(2),'hold',a.holdingPlug);break;}}
 await g.close();}

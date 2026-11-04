import {launch} from '../cap.mjs';
const P='recheck-list-';const log=(...a)=>console.log(...a);
const g=await launch('meeting',{fullfx:true});
try{
await g.advance(.5);
await g.zoom(-1500);await g.orbit(0,-200);
for(let i=0;i<6;i++){await g.orbit(-125,0);await g.shot(P+`04h-closet-sweep-${(i+1)*125}`);}
await g.orbit(0,200);await g.shot(P+'04i-closet-sweep-750-highpitch');
await g.zoom(1500);await g.shot(P+'04j-closet-sweep-750-zoomout');
}catch(e){log('ERR',e.message);}
log('errors',JSON.stringify(await g.close()));

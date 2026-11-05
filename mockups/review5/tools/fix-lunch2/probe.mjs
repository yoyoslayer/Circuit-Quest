// Probe: the burn warning badge state after forcing a baked tray past BURN_WARNING.
import {launch} from '../cap.mjs';
const g=await launch('lunch',{fullfx:true});await g.advance(1);
await g.page.evaluate(()=>{const L=window.__game.lunch;L.circuit.leads.push({id:'shot-feed',from:'b',to:'kitchen',rating:10,closed:true,heat:0,dead:false});L.job.bake=20;L.job.tray='baked';L.job.ovenWait=62;});
await g.advance(1);
console.log(JSON.stringify(await g.page.evaluate(()=>{const L=window.__game.lunch,b=L.burnBadge;
  return {job:{tray:L.job.tray,wait:L.job.ovenWait},oven:L.powered('oven'),won:window.__game.won,vis:b.visible,pos:b.position,scale:b.scale.x,parent:b.parent?.type,op:b.material.opacity};})));
await g.close();

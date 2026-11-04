import {launch} from '../cap.mjs';
const P='meeting-models';
{const g=await launch('meeting',{fullfx:true,query:'norim'});await g.advance(1.5);await g.shot(`${P}-44-start-norim`);await g.zoom(-2000);await g.shot(`${P}-45-zoom-norim`);console.log('e1',JSON.stringify(await g.close()));}
const g=await launch('meeting',{fullfx:true});
await g.advance(.5);
const go=async (pts,r=.5)=>{for(const [x,z] of pts){const res=await g.walk(x,z,r);if(!res.arrived)console.log('stuck',x,z,JSON.stringify(res.state.player));}};
// clock and window above cabinet row; closet window straddle
await go([[-6,-1.4],[-3.1,-6.8]],.4);await g.shot(`${P}-46-clock-cabinets`);
await g.zoom(-2000);await g.shot(`${P}-47-clock-close`);
await g.orbit(0,-150);await g.shot(`${P}-48-clock-low`);await g.orbit(0,150);
// mail cart coupler crop at default zoom
await g.zoom(1200);await go([[-6,-1.4],[-6,3.2],[-3.4,3.4]],.4);await g.shot(`${P}-49-mailcart-default`);
// boardroom from behind (camera at back wall side)
await go([[-1,-1.4],[8,-1.3],[8.2,-6]],.4);await g.orbit(350,0);await g.shot(`${P}-50-boardroom-from-back`);
await g.zoom(-2000);await g.shot(`${P}-51-boardroom-back-close`);
await g.orbit(-350,0);
// vending back
await g.zoom(1200);await go([[8,-1.3],[-8,-1.4],[-12.8,.6]],.4);await g.orbit(350,0);await g.shot(`${P}-52-vending-back`);
await g.zoom(-2000);await g.shot(`${P}-53-vending-back-close`);
console.log('errors',JSON.stringify(await g.close()));

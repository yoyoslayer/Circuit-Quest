import {open,P} from './common.mjs';
const g=await open({query:'norim'});
await g.advance(1);await g.shot(`${P}-70-norim-start`);
await g.tp(-7.6,3.8,.8);await g.zoom(-2000,.8);await g.shot(`${P}-71-norim-stock-zoom9`);
await g.close();
const h=await open();
await h.advance(.5);
// window / wallpaper coplanar check, two frames apart while orbiting slowly
await h.tp(3.5,-5.2,.8);await h.zoom(-2000,.8);await h.orbit(0,-180);
await h.shot(`${P}-72-window-a`);await h.orbit(6,0,.1);await h.shot(`${P}-73-window-b`);
// STOCK sign edge-on and posters from the side
await h.tp(-9.6,0.2,.8);await h.orbit(-260,-120);await h.shot(`${P}-74-stock-sign-edge`);await h.orbit(260,120,.3);
// floor seam planks/tiles
await h.tp(-1.0,-4.0,.8);await h.orbit(0,250);await h.shot(`${P}-75-floor-seam-topdown`);await h.orbit(0,-250,.3);
// bookshelf in front of PnP from the PnP side
await h.tp(-5.2,-5.3,.8);await h.orbit(-500,0);await h.shot(`${P}-76-pnp-front-bookshelf`);await h.orbit(500,0,.3);
// default zoom game-camera crop of the room at start position again for luma
await h.zoom(2000,.6);await h.tp(-6.6,3.2,1);await h.shot(`${P}-77-gamecam-spawn`);
console.log('errors',JSON.stringify(await h.close()));

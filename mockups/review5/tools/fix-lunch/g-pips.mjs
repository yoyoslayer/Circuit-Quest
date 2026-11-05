// Fix-lunch check G: cart budget pips and HUD pips with cart B feeding the kitchen (4 bars).
import {launch} from '../cap.mjs';
const g=await launch('lunch');await g.advance(.5);
await g.ev(`const l=window.__game.lunch,c=l.cables.find(c=>c.id==='thick');c.ports=['b','kitchen'];return 0`);await g.advance(1);
await g.walk(-11,5.2,.4);await g.zoom(-500);console.log(JSON.stringify((await g.snap()).lunch.draw));await g.shot('fix-lunch-30-cart-pips');await g.close();

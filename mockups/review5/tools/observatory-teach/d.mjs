import {launch} from '../cap.mjs';
const K='observatory-teach';
const g=await launch('observatory',{fullfx:true});
const log=(...a)=>console.log(...a);
await g.advance(.5);
await g.walk(-2.6,-.4,.5);await g.advance(.6);
await g.zoom(-1500);await g.shot(`${K}-40-zoom9-rack-cart`);
await g.orbit(-260,0);await g.shot(`${K}-41-zoom9-rack-cart-orbit`);
await g.orbit(520,0);await g.shot(`${K}-42-zoom9-rack-bench-link`);
// the dome: is there a dome motor or shutter that the latch job refers to?
await g.walk(-5.2,-3.2,.5);await g.advance(.4);await g.orbit(-260,0);await g.shot(`${K}-43-zoom9-dome`);
await g.orbit(-260,60);await g.shot(`${K}-44-zoom9-dome-other`);
// Speaker/listen: can the player see what is heard? just state
const s=await g.snap();log('listening',s.station.listening,'snr',s.station.reading.snr);
await g.close().then(e=>log('errors',JSON.stringify(e)));

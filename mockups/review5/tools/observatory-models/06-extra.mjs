import {launch} from '../cap.mjs';
const P='observatory-models-';const log=(...a)=>console.log(...a);
const g=await launch('observatory',{fullfx:true});
await g.advance(.5);await g.zoom(-2000);
// Coworker standing on the dome platform, low angle from the front-right
await g.walk(-3.2,-2.0,.5);await g.orbit(-120,250);await g.shot(P+'60-dome-blob-low');
await g.crop(P+'60a-crop-blob-feet',{x:300,y:250,width:700,height:500});
// Rack plaque edge-on: camera to the left of the rack
await g.orbit(-420,0);await g.shot(P+'61-rack-plaque-edge');
await g.orbit(540,-250);
// Telescope from above (max pitch) near the dome
await g.walk(-5.4,-2.4,.5);await g.orbit(0,-600);await g.zoom(600);await g.shot(P+'62-dome-top');await g.orbit(-250,0);await g.shot(P+'62b-dome-top-left');
await g.orbit(250,600);await g.zoom(-2000);
// Rack-to-bench cable gap seen from the front
await g.walk(-2.6,-.6,.5);await g.shot(P+'63-rack-bench-gap');await g.orbit(200,0);await g.shot(P+'63b-rack-bench-gap-o');await g.orbit(-200,0);
log('errors',JSON.stringify(await g.close()));

// Spectrum fixes: close looks at the models and dressing (tower, pod, shelves, smoke, chart, stripes, cage).
// BASE=http://127.0.0.1:4195 node models.mjs
import {launch} from '../cap.mjs';
const g=await launch('spectrum');
const route=async pts=>{for(const [x,z] of pts){const r=await g.walk(x,z,.5);if(!r.arrived)throw new Error(`stuck to ${x},${z}`);}};
await g.advance(.5);
// Pod by its dock, close.
await g.walk(-6.4,6.6,.5);await g.zoom(-1200);await g.shot('fix-spectrum-m01-pod-dock');
// Stripes in front of the dock rug.
await g.zoom(500);await g.shot('fix-spectrum-m02-stripes-rug');
// Tower, close.
await route([[-1.4,3.9]]);await g.zoom(-1200);await g.shot('fix-spectrum-m03-tower');
await g.orbit(260,0);await g.shot('fix-spectrum-m04-tower-back');
// Smoke by the tea corner, with Pip in it.
await route([[1.4,3.6]]);await g.orbit(-260,0);await g.zoom(300);await g.shot('fix-spectrum-m05-smoke-pip');
// The storeroom shelves.
await route([[.4,.2],[-6.4,1.2],[-10.1,-2.2],[-10.1,-4.4],[-8.4,-6.2]]);await g.zoom(-600);await g.shot('fix-spectrum-m06-store-shelves');
// Behind the storeroom front wall from the hall: the caps and sign fade with the bricks.
await g.orbit(0,-120);await g.shot('fix-spectrum-m07-store-wall-fade');
// The chart on the left wall.
await route([[-10.1,-2.2],[-9.6,3.4]]);await g.orbit(-500,0);await g.shot('fix-spectrum-m08-chart');
// The cage, from the hall.
await route([[-6.4,1.2],[0,-1.4],[4.6,.6]]);await g.orbit(600,0);await g.zoom(-200);await g.shot('fix-spectrum-m09-cage');
// The lab side wall and door.
await route([[1,-1.8],[1.2,-2.4]]);await g.shot('fix-spectrum-m10-lab-side');
console.log('errors',JSON.stringify(await g.close()));

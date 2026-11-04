import {start} from './lib.mjs';
const g=await start();
await g.advance(.5);await g.zoom(-2000);
// POD DOCK sign seen from behind the dock (from -z side)
await g.walk(-6.4,3.9,.4);await g.look(-6.4,3.9,-6.4,6.5);await g.S('92','pod-dock-sign-from-behind');
// exhibits case close, high over the mirrors
await g.route([[-6.3,3.6],[-6.4,1.2],[-3.9,-1.4],[-2.2,-4.3]]);await g.walk(-1.9,-4.6,.3);
await g.look(-1.9,-4.6,-1.6,-7.35,180);await g.S('93','exhibits-case-close-high');
await g.look(-1.9,-4.6,.9,-7.78,-60);await g.S('94','ladder-desk');
// toaster + TEA sign from the hall side (behind the counter, -z side)
await g.route([[-.9,-1.6],[1.5,1.2]]);await g.walk(1.6,3.3,.4);await g.look(1.6,3.3,2.2,4.85,120);await g.S('95','toaster-close-high');
await g.look(1.6,3.3,2.4,6.2);await g.S('96','tea-sign-from-behind');
// quiet room sign from the back of hall (z<1.5)
await g.route([[.6,2.2],[4.5,-.6]]);await g.walk(7.4,0,.4);await g.look(7.4,0,7.45,3);await g.S('97','quiet-sign-from-hall-back');
// lab bookshelf from the hatch side
await g.walk(5.4,-2.4,.3);await g.look(5.4,-2.4,6.2,-4.5,150);await g.S('98','bookshelf-behind-hatch');
console.log('errors',JSON.stringify(await g.close()));

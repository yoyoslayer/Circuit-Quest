import {start} from './lib.mjs';
const g=await start();
await g.advance(.5);await g.zoom(-2000);
// a. spawn: pod and dock (pod at -6.4,5.2)
await g.look(-8,5.6,-6.4,5.2);await g.S(10,'pod-dock-close');
await g.walk(-6.4,6.4,.4);await g.look(-6.4,6.4,-6.4,5.2);await g.S(11,'pod-dock-front');
await g.look(-6.4,6.4,-6.4,5.2,-150);await g.S(12,'pod-dock-front-low');
// b. desk front + back
await g.route([[-6.3,3.6],[-4.6,3.9]]);await g.look(-4.6,3.9,-3.5,2.6);await g.S(13,'desk-front');
await g.route([[-6.4,1.2],[-3.8,1.2]]);await g.look(-3.8,1.2,-3.5,2.6);await g.S(14,'desk-back');
// c. tower
await g.walk(-1.4,1.4,.4);await g.look(-1.4,1.4,-.4,2.3);await g.S(15,'tower-close');
await g.look(-1.4,1.4,-.4,2.3,-150);await g.S(16,'tower-low');
// d. tea corner and smoke
await g.route([[.6,2.2],[1.6,3.4]]);await g.look(1.6,3.4,2.4,4.85);await g.S(17,'tea-smoke');
await g.route([[.6,4.2],[.6,6.0],[2.2,6.0]]);await g.look(2.2,6.0,2.4,4.85);await g.S(18,'tea-from-front');
await g.look(2.2,6.0,3.8,5.7);await g.S(19,'tea-coworker');
// e. quiet room from outside, then inside
await g.route([[.6,4.2],[1.5,1.2],[4.5,-.6]]);await g.walk(4.6,3.5,.5);await g.look(4.6,3.5,7.4,4.8);await g.S(20,'quiet-mesh-outside');
await g.route([[4.5,-.6],[10.2,.6],[10.2,2.8],[9.4,3.9],[8.6,4.2]]);await g.look(8.6,4.2,7.4,7.1);await g.S(21,'quiet-inside-desk');
await g.look(8.6,4.2,10.2,7);await g.S(22,'quiet-inside-chair-lamp');
await g.look(8.6,4.2,5.5,3);await g.S(23,'quiet-inside-mesh');
console.log('errors',JSON.stringify(await g.close()));

import {start} from './lib.mjs';
const g=await start();
await g.advance(.5);await g.zoom(-2000);
// side wall chart (left wall x=-11, chart around z 4.6)
await g.walk(-9.6,3.2,.4);await g.face(Math.PI/2+.25);await g.S(30,'sidewall-chart');
await g.face(Math.PI/2-.35);await g.S(31,'sidewall-posters');
// storeroom: in through the front-left doorway
await g.route([[-10.1,3],[-10.1,-2.2]]);await g.face(0);await g.S(32,'store-front-doorway');
await g.route([[-10.1,-4.4],[-8.6,-5.0]]);await g.face(.5);await g.S(33,'store-shelves');
await g.face(-Math.PI/2+.3);await g.S(34,'store-wooden-door-inside');
await g.face(Math.PI);await g.S(35,'store-inside-reverse');
// out, mirrors + exhibits + ladder
await g.route([[-10.1,-4.4],[-10.1,-1.4],[-3.9,-1.4],[-2.2,-4.3]]);await g.face(.35);await g.S(36,'mirrors-exhibits');
await g.face(-.5);await g.S(37,'exhibits-ladder');
await g.face(Math.PI*.75);await g.S(38,'mirrors-back');
await g.walk(-3.9,-5.0,.4);await g.face(-Math.PI/2+.2);await g.S(39,'wooden-door-outside');
// lab shutter + hatch
await g.route([[-1,-1.6],[4.4,-1.8],[4.6,-2.4]]);await g.face(-.3);await g.S(40,'lab-hatch');
await g.face(-.3,150);await g.S(41,'lab-hatch-high');
// lab inside
await g.route([[10.2,-1.4],[10.2,-4.6],[8.4,-5.6],[6.0,-5.0]]);await g.face(0.1);await g.S(42,'lab-benches');
await g.face(Math.PI);await g.S(43,'lab-shutter-inside');
await g.face(-Math.PI/2);await g.S(44,'lab-sidewall');
console.log('errors',JSON.stringify(await g.close()));

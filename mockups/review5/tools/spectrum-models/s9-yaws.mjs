import {start} from './lib.mjs';
const g=await start();
await g.advance(.5);
await g.walk(-1.5,0,.5);
for(const [n,Y,nm] of [['A0',.14,'yaw-back'],['A1',-Math.PI/2,'yaw-east'],['A2',Math.PI,'yaw-front'],['A3',Math.PI/2,'yaw-west']]){await g.face(Y);await g.S(n,'gamecam-'+nm);}
await g.face(-Math.PI/2);await g.survey();await g.S('A4','survey-east');await g.survey();
await g.face(Math.PI);await g.survey();await g.S('A5','survey-front');await g.survey();
// tower back + desk back closeups at zoom 9 from the lab side
await g.zoom(-2000);await g.walk(.6,1.2,.3);await g.look(.6,1.2,-.4,2.3);await g.S('A6','tower-from-back-z9');
await g.look(.6,1.2,-3.5,2.6,120);await g.S('A7','desk-top-from-tower-z9');
// coworkers close
await g.walk(3.0,4.0,.4);await g.zoom(-2000);await g.look(3.0,4.0,3.8,5.7);await g.S('A8','tea-coworker-z9');
console.log('errors',JSON.stringify(await g.close()));

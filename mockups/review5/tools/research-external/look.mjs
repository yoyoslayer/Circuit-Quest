import {launch} from '../cap.mjs';
const K='research-external';
// Arcade: start, survey, bench, fuse-trip failure, success
{const g=await launch('arcade',{fullfx:true});
await g.advance(1);await g.shot(`${K}-01-arcade-start`);
await g.survey();await g.shot(`${K}-02-arcade-survey`);await g.key('Tab',.8);
for(const [x,z] of [[-5.5,6.6],[-7.2,5.8]])await g.walk(x,z,.6);await g.walk(-8.3,4.4,.3);await g.key('KeyE');
for(const [x,z] of [[-7.2,5.8],[-5.5,6.4]])await g.walk(x,z,.6);
await g.walk(1.2,-1.3,.5);await g.key('KeyE',.3);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
await g.shot(`${K}-03-arcade-bench`);
await g.act('power');await g.advance(.6);await g.shot(`${K}-04-arcade-fuse-trip`);
await g.act('slot','across');await g.act('pick',220);await g.act('slot',0);await g.act('power');await g.advance(6);
await g.shot(`${K}-05-arcade-pinball-ok`);
console.log(JSON.stringify((await g.snap()).station?.verdict));
console.log('arcade errors',await g.close());}
// Garage: bench and kickback failure
{const g=await launch('garage',{fullfx:true});
await g.advance(1);await g.shot(`${K}-06-garage-start`);
await g.walk(6.4,-4.2,.5);await g.key('KeyE');for(const [x,z] of [[3.4,-4],[2.5,-4.4]])await g.walk(x,z,.5);await g.key('KeyE',.3);
for(const [x,z] of [[2.9,-4],[2.9,-1.1]])await g.walk(x,z,.5);await g.walk(0,-1.55,.4);await g.key('KeyE',1);
await g.shot(`${K}-07-garage-bench`);
await g.act('pulse');await g.advance(1);await g.shot(`${K}-08-garage-kickback-fail`);
console.log('garage errors',await g.close());}
// Spectrum bench
{const g=await launch('spectrum',{fullfx:true});
await g.advance(1);await g.shot(`${K}-09-spectrum-start`);
await g.walk(-6.3,3.6,.5);await g.walk(-3.5,3.55,.4);await g.key('KeyE',1.2);await g.shot(`${K}-10-spectrum-bench`);
console.log('spectrum errors',await g.close());}
// Meeting (first floor) start
{const g=await launch('meeting',{fullfx:true});
await g.advance(1);await g.shot(`${K}-11-meeting-start`);await g.zoom(-600);await g.shot(`${K}-12-meeting-zoom`);
console.log('meeting errors',await g.close());}

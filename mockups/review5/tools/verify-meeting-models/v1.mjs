import {launch} from '../cap.mjs';
const P='verify-meeting-models';
const g=await launch('meeting',{fullfx:true});
await g.advance(1);
let s=await g.snap();
const it=id=>s.items.find(i=>i.id===id)?.pos;
console.log('strip',JSON.stringify(it('strip')),'cart',JSON.stringify(it('mail-cart')),'reel',JSON.stringify(it('extension')),'coffee-reel',JSON.stringify(it('coffee-reel')),'placed',s.stripPlaced);
const au=await g.audit(.02);console.log('audit02',au.length);
await g.shot(`${P}-01-start`);
// pod chairs close
await g.walk(-8,-.6,.4);await g.zoom(-2000);await g.shot(`${P}-02-pod-close`);
await g.orbit(350,0);await g.shot(`${P}-03-pod-close-orbit`);
await g.orbit(-350,0);
// to boardroom door, strip not placed
for(const [x,z] of [[-8,-1.4],[6,-1.2],[11.6,-.9]])await g.walk(x,z,.5);
s=await g.snap();console.log('placed before',s.stripPlaced,JSON.stringify(s.player));
await g.shot(`${P}-04-door-before-strip`);
await g.zoom(2000);await g.zoom(-600);await g.shot(`${P}-05-door-default-zoom`);
// lounge beanbag reticle
await g.zoom(-2000);
for(const [x,z] of [[8.5,-.5],[8.5,3.8],[10.9,5.3]])await g.walk(x,z,.4);
await g.shot(`${P}-06-beanbag-reticle`);
await g.orbit(250,0);await g.shot(`${P}-07-beanbag-reticle-orbit`);
await g.orbit(250,0);await g.shot(`${P}-08-beanbag-reticle-orbit2`);
console.log('errors',JSON.stringify(await g.close()));

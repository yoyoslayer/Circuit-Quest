import {rt} from './rt.mjs';
const g=await rt('playground');
await g.wait(1500);await g.zoom(-1500);await g.wait(500);
// walk to open floor, then orbit so we see Pip side-on while walking +x... walking direction is screen-relative
const clip={x:420,y:120,width:600,height:620};
await g.page.keyboard.down('KeyS');await g.wait(900);
for(let i=0;i<6;i++){await g.shot(`characters-30-walk-toward-cam-${i}`,clip);await g.wait(60);}
await g.page.keyboard.up('KeyS');await g.wait(600);
// side-on walk: press D (screen right)
await g.page.keyboard.down('KeyD');await g.wait(700);
for(let i=0;i<6;i++){await g.shot(`characters-31-walk-side-${i}`,clip);await g.wait(60);}
await g.page.keyboard.down('ShiftLeft');await g.wait(700);
for(let i=0;i<6;i++){await g.shot(`characters-32-sprint-side-${i}`,clip);await g.wait(50);}
await g.page.keyboard.up('ShiftLeft');await g.page.keyboard.up('KeyD');await g.wait(400);
await g.page.keyboard.down('KeyA');await g.wait(500);await g.page.keyboard.press('Space');
for(let i=0;i<5;i++){await g.shot(`characters-33-jump-side-${i}`,clip);await g.wait(60);}
await g.page.keyboard.up('KeyA');await g.wait(800);
console.log(JSON.stringify(await g.snap().then(s=>({p:s.player,fps:s.fps}))));
console.log(await g.close());

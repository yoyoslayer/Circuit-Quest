import {launch,now} from './hook.mjs';
const g=await launch('lobby');await g.advance(.3);await g.drain('start');
const s=await g.snap();const rush=s.hub.doors.find(d=>d.id==='arcade-rush');console.log('rush locked',rush.locked);
await g.walk(rush.at.x,rush.at.z,.4);await g.advance(.2);await g.drain('walk');await g.page.keyboard.press('KeyE');await g.advance(.05);await now(g,'juice-audio-30-lobby-locked-door');await g.drain('E at LOCKED door');
await g.advance(.3);await g.shot('juice-audio-31-lobby-locked-0.3s');
const pg=s.hub.doors.find(d=>d.id==='playground');await g.walk(pg.at.x,pg.at.z,.4);await g.advance(.2);await g.drain('walk');
await g.page.keyboard.press('KeyE');await g.page.waitForTimeout(30);await g.drain('E at door (before reload)');
await g.page.waitForSelector('body[data-ready="true"]',{timeout:60000}).catch(()=>{});console.log('url',g.page.url());
console.log('errors',await g.close());

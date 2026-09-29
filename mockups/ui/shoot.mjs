// Re-shoot the mockups: node mockups/ui/shoot.mjs [page[:WxH[:out]] ...]
// With no args, shoots every deliverable. Freezes animations at rest via the .still class.
import {chromium} from '@playwright/test';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const all=['title','level-select','hud-meeting','hud-lunch','hud-phone:390x844','pause','result','fail'];
const jobs=process.argv.slice(2).length?process.argv.slice(2):all;
const browser=await chromium.launch();
for(const job of jobs){
  const [name,size='1440x900',out=name]=job.split(':');const [w,h]=size.split('x').map(Number);
  const page=await browser.newPage({viewport:{width:w,height:h}});
  await page.goto(pathToFileURL(path.join(dir,name+'.html')).href);
  await page.evaluate(()=>document.fonts.ready);
  await page.evaluate(()=>document.documentElement.classList.add('still'));
  await page.waitForTimeout(300);
  await page.screenshot({path:path.join(dir,out+'.png')});
  console.log('shot',out);await page.close();
}
await browser.close();

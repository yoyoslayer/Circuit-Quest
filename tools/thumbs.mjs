// Regenerates the job-board thumbnails (public/ui/thumb-*.jpg) from the live scenes.
// Needs a dev server on 4173: npm run dev -- --port 4173. Pass level ids to redo only those.
import {chromium} from '@playwright/test';
const browser=await chromium.launch({args:['--enable-webgl','--ignore-gpu-blocklist','--enable-gpu','--use-angle=d3d11']});
const page=await browser.newPage({viewport:{width:960,height:600}});
const all=['playground','meeting','lunch','vias','qfn','archive','waterworks','observatory','arcade','garage','clockwork','depot','spectrum'];
for(const level of process.argv.slice(2).length?process.argv.slice(2):all){
  await page.goto(`http://127.0.0.1:4173/?level=${level}&manual&fullfx`);await page.waitForSelector('body[data-ready="true"]');
  await page.getByRole('button',{name:'Start playing'}).click();await page.addStyleTag({content:'#hud{display:none!important}'});
  await page.keyboard.press('Tab');await page.waitForTimeout(2500);
  await page.screenshot({path:`public/ui/thumb-${level}.jpg`,type:'jpeg',quality:82,clip:{x:80,y:50,width:800,height:500}});
}
await browser.close();console.log('thumbnails written');

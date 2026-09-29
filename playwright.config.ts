import {defineConfig} from '@playwright/test';
// PW_PORT lets parallel worktrees each run their own dev server (default 4187).
const port=Number(process.env.PW_PORT??4187),url=`http://127.0.0.1:${port}`;
export default defineConfig({testDir:'tests',workers:1,use:{baseURL:url,viewport:{width:1440,height:900},launchOptions:{args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']}},webServer:{command:`npm run dev -- --port ${port} --strictPort`,url,reuseExistingServer:true},timeout:60000});

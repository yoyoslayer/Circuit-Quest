import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'tests',workers:1,use:{baseURL:'http://127.0.0.1:4187',viewport:{width:1440,height:900},launchOptions:{args:['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']}},webServer:{command:'npm run dev -- --port 4187',url:'http://127.0.0.1:4187',reuseExistingServer:true},timeout:60000});

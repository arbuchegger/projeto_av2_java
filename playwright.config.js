const {defineConfig}=require('@playwright/test');
const fs=require('node:fs');
module.exports=defineConfig({testDir:'./tests',testMatch:'**/*.spec.js',fullyParallel:false,workers:1,use:{baseURL:'http://127.0.0.1:3108',headless:true,launchOptions:fs.existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium',args:['--no-sandbox']}:{},viewport:{width:1440,height:1000}},webServer:{command:'node tools/e2e-server.cjs',port:3108,env:{PORT:'3108',DATA_DIR:'.e2e-data'},reuseExistingServer:false}});

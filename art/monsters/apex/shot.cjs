const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({viewport:{width:2000,height:1200}});
await p.goto('file://'+__dirname+'/sheet.html'); await p.waitForTimeout(400); await p.screenshot({path: __dirname+'/sheet.png', fullPage:true}); await b.close(); })();

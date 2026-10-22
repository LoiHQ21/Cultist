import {chromium} from '@playwright/test';
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync('public/assets/manifest.json'));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1280,height:960}});
const groups={statues:manifest.assets.filter(a=>a.kind==='image'&&a.id.startsWith('statue_')),characters:manifest.assets.filter(a=>a.path?.includes('/characters/')),objects:manifest.assets.filter(a=>a.path?.includes('/offerings/')),props:manifest.assets.filter(a=>a.path?.includes('/props/')||a.path?.includes('/ui/')),scenes:manifest.assets.filter(a=>a.path?.includes('/backgrounds/')||a.path?.includes('/endings/'))};
for(const [name,list]of Object.entries(groups)){
 await page.setContent(`<html><body style="margin:0;background:#343d35;color:#e7d7af;font:16px Georgia"><h1 style="margin:24px">The Last Offering · ${name}</h1><div style="display:grid;grid-template-columns:repeat(${name==='scenes'?2:name==='statues'?3:4},1fr);gap:16px;padding:16px">${list.map(a=>`<div style="padding:12px;background:#77745b;border:1px solid #a79a72"><div style="font-size:14px;margin-bottom:8px">${a.id} · ${a.width}×${a.height}</div><img src="http://localhost:5173${a.path}" style="width:100%;height:${name==='scenes'?300:name==='statues'?520:280}px;object-fit:contain" /></div>`).join('')}</div></body></html>`);
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 await page.screenshot({path:`test-results/art-${name}.png`,fullPage:true});
}
await browser.close();console.log('Five browser-rendered asset review sheets saved.');

import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const lab='https://ally-lab.pages.dev',forum='https://ally-community.pages.dev';
try{
 for(const [width,height] of [[360,800],[1280,720]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
   const page=await context.newPage();
   await page.goto(lab+'/#juegos',{waitUntil:'domcontentloaded'});
   await page.locator('#mast-quick-actions .ally-account-button').waitFor();
   await page.locator('#global-search-link').waitFor();
   assert.ok(await page.locator('.mast nav[aria-label="Principal"]').isVisible());
   const sizes=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(sizes.scroll<=sizes.width+2,'Desbordamiento en '+width+'px');
   await page.goto(lab+'/buscar?q=cyberpunk&scope=pc',{waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>document.querySelector('#search-status')?.textContent?.includes('resultados mostrados'),{},{timeout:25000});
   assert.ok(await page.locator('#search-results .global-result').count()>0,'Resultados de búsqueda');
   await page.goto(forum+'/',{waitUntil:'domcontentloaded'});
   await page.locator('header').first().waitFor();
   const forumSize=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(forumSize.scroll<=forumSize.width+2,'Desbordamiento foro '+width+'px');
   console.log('Navegador Chromium: '+width+'×'+height+' · navegación pública y buscador correctos.');
   await context.close();
 }
}finally{await browser.close();}

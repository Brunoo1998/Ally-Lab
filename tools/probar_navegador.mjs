import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const lab='https://ally-lab.pages.dev',forum='https://ally-community.pages.dev';
try{
 for(const [width,height] of [[360,800],[832,384],[1280,720]]){
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
   await page.goto(lab+'/#juego/cyberpunk-2077-rog-xbox-ally-x',{waitUntil:'domcontentloaded'});
   await page.locator('#game-title').waitFor();
   const favorite=page.locator('[data-favorite-game="cyberpunk-2077-rog-xbox-ally-x"]');
   await favorite.waitFor();
   await favorite.click();assert.equal(await favorite.getAttribute('aria-pressed'),'true');
   await page.reload({waitUntil:'domcontentloaded'});
   await favorite.waitFor();assert.equal(await favorite.getAttribute('aria-pressed'),'true');
   await favorite.click();assert.equal(await favorite.getAttribute('aria-pressed'),'false');
   await page.goto(lab+'/#simulador',{waitUntil:'domcontentloaded'});
   const model=page.locator('select[aria-label="Modelo de consola"]');
   await model.waitFor({timeout:25000});await model.selectOption('xbox');
   await page.locator('.fps-model-measured').waitFor();
   assert.match(await page.locator('.fps-model-measured').innerText(),/Mediciones publicadas/);
   await model.selectOption('xbox-x');
   for(const path of ['/ports','/news','/gratis','/emulacion']){
     await page.goto(lab+path,{waitUntil:'domcontentloaded'});
     await page.locator('#mast-quick-actions .ally-account-button').waitFor();
     assert.ok(await page.locator('.mast nav[aria-label="Principal"]').isVisible());
   }
   await page.goto(forum+'/',{waitUntil:'domcontentloaded'});
   await page.locator('header').first().waitFor();
   const forumSize=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(forumSize.scroll<=forumSize.width+2,'Desbordamiento foro '+width+'px');
   console.log('Navegador Chromium: '+width+'×'+height+' · navegación, favoritos locales, simulador, modelos, secciones públicas y buscador correctos.');
   await context.close();
 }
}finally{await browser.close();}

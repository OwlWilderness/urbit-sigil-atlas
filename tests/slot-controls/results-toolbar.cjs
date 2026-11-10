const {chromium}=require('/Users/tekh/.hermes/cache/scratch/pacfyl-names/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const browser=await chromium.launch({headless:true,executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});try{
 for(const width of [900,640,375]){
  const context=await browser.newContext({viewport:{width,height:1100}});
  await context.addInitScript(()=>{localStorage.setItem('sigil-atlas:mode',JSON.stringify('star'));localStorage.setItem('sigil-atlas:starInput',JSON.stringify(''));});
  try{
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8741/workshop.html');
   await page.waitForFunction(()=>document.querySelector('#planet-search-status').textContent.includes('Enter a star'));
   const geometry=await page.evaluate(()=>{
    const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
    return {heading:r('.matches-title'),status:r('#planet-search-status'),refresh:r('#find-planets'),search:r('#search'),actions:r('.workshop-actions'),results:r('#planet-results'),dock:r('.slot-dock'),filter:r('.workbench'),documentFits:document.documentElement.scrollWidth<=innerWidth+1};
   });
   assert(geometry.heading.bottom<=geometry.status.y,'Heading must precede status');
   assert(geometry.status.bottom<=geometry.actions.y,'Heading and Enter a star status must precede the toolbar');
   assert(Math.abs(geometry.refresh.bottom-geometry.search.bottom)<=2,'Refresh and Find a syllable input must share one line');
   assert(geometry.search.x>=geometry.refresh.right,'Refresh and input remain adjacent');
   assert(geometry.results.y>=geometry.actions.bottom,'Actual results stay below toolbar');
   assert(geometry.documentFits);assert(geometry.filter.x>=geometry.dock.right-2);
   for(const k of ['y','width','height','bottom'])assert(Math.abs(geometry.dock[k]-geometry.filter[k])<=2,'Equal adjacent panels: '+k);
   assert.equal(await page.locator('#search').count(),1);assert.equal(await page.locator('#shape').count(),1);assert.equal(await page.locator('#kind').count(),1);
   await page.locator('#search').fill('rad');const count=await page.locator('#count').textContent();assert(!count.startsWith('0 '));
   await page.locator('#search').fill('~rad');assert.equal(await page.locator('#count').textContent(),count);await page.locator('#reset').click();assert.equal(await page.locator('#search').inputValue(),'');
   await page.locator('#find-planets').click();assert((await page.locator('#planet-search-status').textContent()).includes('Enter a star'));
   await page.locator('input[name=mode][value=free]').check();await page.locator('#match-mode').selectOption('exact');
   for(const [i,s]of ['bot','myr','rad','ret'].entries())await page.locator(`[data-slot-input="${i}"]`).fill('~'+s);
   await page.waitForFunction(()=>document.querySelector('#planet-search-status').dataset.total==='1');
   await page.locator('#find-planets').click();await page.waitForFunction(()=>document.querySelector('#planet-search-status').dataset.total==='1');
   assert.equal(await page.getByRole('button',{name:'Validate preview',exact:true}).count(),0);assert.equal(await page.getByRole('button',{name:'Save composition',exact:true}).count(),0);
   assert.deepEqual(errors,[]);
   await page.locator('.matches-title').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(process.env.SLOT_EVIDENCE,`toolbar-${width}.png`)});
   console.log(JSON.stringify({width,geometry,actualMatches:1,searchFilterWorks:true,refreshWorks:true,pageErrors:errors}));
  }finally{await context.close();}
 }
 console.log('PASS results heading/status before shared Refresh + Find a syllable toolbar at900/640/375; unique working filters and actual candidate refresh; equal adjacent panels and no document overflow');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});

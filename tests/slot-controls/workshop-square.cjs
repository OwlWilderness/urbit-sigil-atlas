const {chromium}=require('/Users/tekh/.hermes/cache/scratch/pacfyl-names/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.SLOT_EVIDENCE, failures=[];
const measure=page=>page.evaluate(()=>{
 const r=e=>{if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom};};
 const row=document.querySelector('.workshop-composition'),dock=document.querySelector('.slot-dock'),filter=document.querySelector('.workbench'),palette=document.querySelector('.shape-panel');
 return {width:innerWidth,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,main:r(document.querySelector('main')),sidebar:!!document.querySelector('.sidebar'),position:getComputedStyle(dock).position,row:r(row),rowScroll:row.scrollWidth,rowClient:row.clientWidth,rowOverflow:getComputedStyle(row).overflowX,scrollLeft:row.scrollLeft,dock:r(dock),filter:r(filter),palette:r(palette),paletteSibling:palette.nextElementSibling===row,paletteInFilters:!!palette.closest('.workbench'),actions:r(document.querySelector('.workshop-actions')),matches:r(document.querySelector('.workshop-matches')),results:r(document.querySelector('#planet-results')),sources:[...palette.querySelectorAll('[data-shape-source]')].map(e=>({key:e.dataset.shapeSource,draggable:e.draggable,label:e.getAttribute('aria-label'),imageLoaded:e.querySelector('img').complete&&e.querySelector('img').naturalWidth>0,box:r(e),text:r(e.querySelector('span'))})),slots:[...document.querySelectorAll('[data-slot-column]')].map(c=>({box:r(c.querySelector('[data-slot]')),input:r(c.querySelector('[data-slot-input]')),eye:r(c.querySelector('.slot-enable')),art:r(c.querySelector('.slot-art img')),outside:!c.querySelector('[data-slot]').contains(c.querySelector('[data-slot-input]'))})),mini:{maps:document.querySelectorAll('.row-mini').length,box:r(document.querySelector('.row-mini')),cells:[...document.querySelectorAll('.mini-cell')].map(r),ops:[1,2,3].map(n=>r(document.querySelector(`[data-join-before="${n}"]`))),duplicates:document.querySelectorAll('.condition-group,[data-join-label],#search-expression img').length},controls:[...filter.querySelectorAll('input,select')].map(r)};
});
function check(m,label){
 const [a,b,c,d]=m.slots.map(s=>s.box),[ma,mb,mc,md]=m.mini.cells,[top,mid,bot]=m.mini.ops;
 const checks={sidebarAbsent:!m.sidebar,noEmptyColumn:m.main.x<40,noDocumentOverflow:m.scroll<=m.width&&m.body<=m.width,normalFlow:m.position==='static',adjacent:m.filter.x>=m.dock.right-2,topAligned:Math.abs(m.filter.y-m.dock.y)<=2,equalWidth:Math.abs(m.filter.width-m.dock.width)<=2,equalHeight:Math.abs(m.filter.height-m.dock.height)<=2,bottomAligned:Math.abs(m.filter.bottom-m.dock.bottom)<=2,native2x2:Math.abs(a.y-b.y)<2&&Math.abs(c.y-d.y)<2&&c.y>a.bottom&&Math.abs(a.x-c.x)<2,squareArt:m.slots.every(s=>Math.abs(s.box.width-s.box.height)<2&&(!s.art||Math.abs(s.art.width-s.art.height)<2)),externalControls:m.slots.every(s=>s.outside&&s.input.y>=s.box.bottom&&s.eye.y>=s.box.bottom&&s.input.x>=m.dock.x&&s.eye.right<=m.dock.right),paletteOutsideFilters:!m.paletteInFilters,paletteSibling:m.paletteSibling,paletteAboveBoth:m.palette.bottom<=Math.min(m.dock.y,m.filter.y),paletteSpansRow:Math.abs(m.palette.x-m.row.x)<=2&&Math.abs(m.palette.width-m.row.width)<=2,actionsBelowBoth:m.actions.y>=Math.max(m.dock.bottom,m.filter.bottom),actionsFullWidth:Math.abs(m.actions.width-m.row.width)<2,resultsAfterActions:m.matches.y>=m.actions.bottom,resultsFullWidth:m.results.width>=m.main.width-2,realSources:m.sources.length===12&&new Set(m.sources.map(s=>s.key)).size===12&&m.sources.every(s=>s.draggable&&s.label&&s.imageLoaded),labelsFit:m.sources.every(s=>s.text.x>=s.box.x&&s.text.right<=s.box.right&&s.text.bottom<=s.box.bottom),oneMini:m.mini.maps===1&&m.mini.cells.length===4&&m.mini.duplicates===0,miniOrder:Math.abs(ma.y-mb.y)<2&&Math.abs(mc.y-md.y)<2&&mc.y>ma.bottom&&ma.x===mc.x&&mb.x===md.x,topOperator:top.x>=ma.right&&top.right<=mb.x&&top.y>=ma.y&&top.bottom<=ma.bottom,bottomOperator:bot.x>=mc.right&&bot.right<=md.x&&bot.y>=mc.y&&bot.bottom<=mc.bottom,middleOperator:mid.y>=ma.bottom&&mid.bottom<=mc.y,miniFits:m.mini.box.x>=m.filter.x&&m.mini.box.right<=m.filter.right&&m.mini.box.bottom<=m.filter.bottom,filterControlsFit:m.controls.every(r=>r.x>=m.filter.x&&r.right<=m.filter.right&&r.bottom<=m.filter.bottom),rowOverflowContract:m.width===375?m.rowScroll>m.rowClient&&['auto','scroll'].includes(m.rowOverflow):m.rowScroll<=m.rowClient+1};
 for(const [name,ok] of Object.entries(checks))if(!ok)failures.push(`${label}: ${name}`);
 console.log(JSON.stringify({label,widthDelta:m.filter.width-m.dock.width,heightDelta:m.filter.height-m.dock.height,checks}));
}
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:1360,height:1100}}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8741/workshop.html');
 await page.locator('#match-mode').selectOption('exact');
 for(const [i,s] of ['rad','myr','bot','ret'].entries())await page.locator(`[data-slot-input="${i}"]`).fill(s);
 await page.waitForFunction(()=>document.querySelectorAll('.slot-art img').length===4&&[...document.querySelectorAll('.slot-art img,.shape-palette img')].every(i=>i.complete&&i.naturalWidth));
 for(const state of ['populated','sparse','blank']){
  if(state==='sparse'){await page.locator('[data-slot-enabled="1"]').uncheck();await page.locator('[data-slot-input="3"]').fill('');}
  if(state==='blank')await page.locator('#clear-slots').click();
  // Same page crosses 1100 in both directions; storage and DOM survive resize.
  for(const width of [1360,1100,1000,900,768,640,375,1101,1099,1360]){
   await page.setViewportSize({width,height:1100});await page.evaluate(()=>{scrollTo(0,0);document.querySelector('.workshop-composition').scrollLeft=0;});await page.waitForTimeout(70);
   const label=`${state}-${width}`,m=await measure(page);check(m,label);fs.writeFileSync(`${out}/${label}-geometry.json`,JSON.stringify(m,null,2));
   if([1360,900,640,375].includes(width)&&state==='populated'){
    await page.locator('.workshop-composition').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-20));await page.screenshot({path:`${out}/${label}-left.png`});
    if(width===375){await page.locator('.workshop-composition').evaluate(e=>e.scrollLeft=e.scrollWidth);const right=await measure(page);fs.writeFileSync(`${out}/${label}-right-geometry.json`,JSON.stringify(right,null,2));if(!(right.scrollLeft>0&&right.filter.right<=right.row.right+2))failures.push('narrow filter reachable by row scroll');await page.screenshot({path:`${out}/${label}-right.png`});}
   }
  }
 }
 if(process.argv[2]!=='layout'){
  // One focused interaction smoke; historical Boolean/API acceptance is reused.
  await page.setViewportSize({width:900,height:1100});await page.locator('[data-slot-enabled="1"]').check();await page.locator('#match-mode').selectOption('shape');
  const source=page.locator('[data-shape-source="circle"]'),before=await source.evaluate(e=>e.outerHTML);
  await source.evaluate(e=>e.addEventListener('dragstart',ev=>window.paletteDrag={trusted:ev.isTrusted,effect:ev.dataTransfer.effectAllowed}));
  const request=page.waitForRequest(r=>r.url().includes('/candidates?')&&new URL(r.url()).searchParams.get('shape0')==='circle');await source.dragTo(page.locator('[data-slot="0"]'));const sent=await request;
  assert.deepEqual(await page.evaluate(()=>window.paletteDrag),{trusted:true,effect:'copy'});assert.equal(new URL(sent.url()).searchParams.get('grouping'),'rows');assert.equal(await source.evaluate(e=>e.outerHTML),before);
  await page.waitForTimeout(150);const input=page.locator('[data-slot-input="0"]'),value=await input.inputValue();assert.ok(value);await page.locator('[data-slot-enabled="0"]').uncheck();assert.equal(await input.inputValue(),value);await page.locator('[data-slot-art="0"]').click();await page.locator('#clear-slot').click();assert.equal(await input.inputValue(),'');assert.equal(await page.locator('[data-slot-enabled="0"]').isChecked(),false);
  fs.writeFileSync(`${out}/interaction.json`,JSON.stringify({trustedDrag:await page.evaluate(()=>window.paletteDrag),query:sent.url(),sourceRetained:true,eyeRetainsValue:true,selectionClear:true},null,2));console.log('PASS focused native palette drag / eye text retention / selected clear');
 }
 assert.deepEqual(errors,[]);await context.close();
 }finally{await browser.close();}
 assert.deepEqual(failures,[],'Adjacent equal panels across resize, confined narrow row overflow');console.log('PASS 30 populated/sparse/blank same-page resize samples, preserved mini-map and square art');
})().catch(e=>{console.error(e);process.exitCode=1;});

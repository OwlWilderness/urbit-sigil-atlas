const {chromium}=require('/Users/tekh/.hermes/cache/scratch/pacfyl-names/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true});
 try {
  for(const touch of [false,true]){
   const context=await browser.newContext(touch?{viewport:{width:375,height:812},isMobile:true,hasTouch:true}:{viewport:{width:1360,height:1000}});
   const page=await context.newPage(),errors=[];page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8741/workshop.html');await page.locator('#match-mode').selectOption('exact');
   const field=i=>page.locator(`[data-slot-input="${i}"]`),box=i=>page.locator(`[data-slot="${i}"]`),copy=page.getByRole('button',{name:'Copy box 1',exact:true});
   await field(0).fill('bot');await page.locator('[data-slot-enabled="0"]').uncheck();
   for(const action of (touch?['tap']:['click','Enter','Space'])){
    await field(2).fill('rad');await page.locator('[data-slot-select="2"]').click();
    if(action==='tap')await copy.tap();else if(action==='click')await copy.click();else {await copy.focus();await page.keyboard.press(action);}
    assert.equal(await field(2).inputValue(),'bot',`${action} copies to selected target`);
    assert.equal(await box(2).getAttribute('data-syllable'),'bot');assert.equal(await field(0).inputValue(),'bot');assert.equal(await page.locator('[data-slot-enabled="0"]').isChecked(),false);
    assert.deepEqual(errors,[]);console.log(`PASS ${action}: selected target copied, source and flag unchanged, no pageerrors`);
   }
   if(!touch){
    // Observe the existing suppression window at dragend, without replacing the shared flag.
    await field(2).fill('rad');await page.locator('[data-slot-select="2"]').click();
    await copy.evaluate(el=>el.addEventListener('dragend',()=>{document.querySelector('[data-slot-select="2"]').click();el.click();},{once:true}));
    await copy.dragTo(box(0));assert.equal(await field(2).inputValue(),'rad','Immediate post-drag click remains suppressed');
    await page.waitForTimeout(150);await copy.click();assert.equal(await field(2).inputValue(),'bot','Copy resumes after existing 100ms suppression');assert.equal(await field(0).inputValue(),'bot');
    assert.deepEqual(errors,[]);console.log('PASS native drag shares suppression flag; immediate click suppressed, later click works');
   }
   await context.close();
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

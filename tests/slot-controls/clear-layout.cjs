const {chromium}=require('/Users/tekh/.hermes/cache/scratch/pacfyl-names/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true});try{
for(const mobile of [false,true]){
 const context=await browser.newContext(mobile?{viewport:{width:375,height:812},isMobile:true,hasTouch:true}:{viewport:{width:1360,height:1000}}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(7000);page.on('pageerror',e=>errors.push(e.message));
 const candidateURLs=[];page.on('request',r=>{if(r.url().includes('/candidates?'))candidateURLs.push(r.url());});
 // Delay real requests to exercise cancellation/late settlement, without synthesizing API data.
 await page.route('**/api/v1/candidates?*',async route=>{await new Promise(r=>setTimeout(r,350));await route.continue().catch(()=>{});});
 await page.route('**/api/v1/compose',async route=>{await new Promise(r=>setTimeout(r,350));await route.continue().catch(()=>{});});
 await page.goto('http://127.0.0.1:8741/workshop.html');await page.locator('#match-mode').selectOption('exact');
 const field=i=>page.locator(`[data-slot-input="${i}"]`),box=i=>page.locator(`[data-slot="${i}"]`),check=i=>page.locator(`[data-slot-enabled="${i}"]`),art=i=>page.locator(`[data-slot-art="${i}"]`),values=()=>page.locator('[data-slot]').evaluateAll(bs=>bs.map(b=>b.dataset.syllable));
 await field(0).fill('bot');await field(2).fill('rad');
 // Baseline artwork was the Copy control. Use its real hit target for the behavioral RED.
 await (await art(2).count()?art(2):page.locator('[data-slot-copy="2"]')).click();
 await page.locator('#clear-slot').click();
 assert.deepEqual(await values(),['bot','','',''],'Artwork selection then Clear selected must clear box 3 without copying rad into box 1');
 console.log('PASS artwork selection + Clear selected does not copy');
 await field(2).fill('rad');await field(0).focus();await page.locator('#clear-slot').click();assert.deepEqual(await values(),['','','rad',''],'Focus must direct Clear selected');
 await field(0).fill('bot');await field(2).fill('ra');await page.locator('#clear-slot').click();assert.equal(await field(2).inputValue(),'');assert.equal(await field(2).getAttribute('aria-invalid'),'false');assert.equal(await box(0).getAttribute('data-syllable'),'bot');
 await field(2).fill('rad');await field(2).focus();await page.keyboard.press('Meta+A');await page.keyboard.press('Backspace');assert.equal(await field(2).inputValue(),'');assert.equal(await box(2).getAttribute('data-syllable'),'');
 await field(2).fill('rad');const bounds=await box(2).boundingBox();await page.locator('[data-slot-clear="2"]').click();assert.deepEqual(await values(),['bot','','','']);assert.deepEqual(await box(2).boundingBox(),bounds,'Clear reserves artwork geometry');
 await field(2).fill('rad');await art(2).focus();await page.keyboard.press('Backspace');assert.deepEqual(await values(),['bot','','','']);await page.waitForTimeout(900);assert.deepEqual(await values(),['bot','','','']);await page.reload();await page.waitForTimeout(400);assert.deepEqual(await values(),['bot','','',''],'Individual/keyboard clear stays empty after async settlement and reload');
 await field(2).fill('rad');await check(2).uncheck();assert.deepEqual(await values(),['bot','','rad',''],'Toggling never copies');await page.locator('#clear-slot').click();assert.deepEqual(await values(),['bot','','',''],'Toggling targets its own box');
 console.log('PASS focus, invalid draft, text erasure, per-box and keyboard clearing; no mutation from toggle');
 await field(2).fill('rad');await page.locator('[data-slot-select="2"]').click();await page.locator('[data-slot-copy="0"]').click();assert.deepEqual(await values(),['bot','','bot','']);
 if(!mobile){await field(2).fill('rad');await art(0).dragTo(box(2));assert.deepEqual(await values(),['bot','','bot',''],'Native artwork drag COPY');await page.waitForTimeout(150);}
 console.log('PASS dedicated copy retains source'+(!mobile?'; native artwork drag COPY verified':''));
 await page.getByRole('radio',{name:'Filter by star',exact:true}).check();await page.locator('#star').fill('~sampel');await check(0).uncheck();
 for(const [i,s] of ['bot','myr','rad','ret'].entries())await field(i).fill(s);
 await page.waitForTimeout(1000);let query=new URL(candidateURLs.at(-1)).searchParams;assert.equal(query.get('star'),'~sampel');assert.equal(query.has('p0'),false);assert.equal(query.has('p2'),false);assert.equal(query.get('p1'),'myr');assert.equal(query.get('p3'),'ret');
 await page.locator('#match-mode').selectOption('shape');await page.waitForTimeout(1000);query=new URL(candidateURLs.at(-1)).searchParams;assert.equal(query.has('shape0'),false);assert.equal(query.has('shape2'),false);assert.ok(query.has('shape1')&&query.has('shape3'));await page.locator('#match-mode').selectOption('exact');
 const originalInput=await field(1).elementHandle();await field(1).fill('BAD');await check(3).uncheck();assert.equal(await field(1).inputValue(),'BAD');assert.equal(await originalInput.evaluate(el=>el===document.querySelector('[data-slot-input="1"]')),true);assert.equal(await page.locator('#save-composition').isDisabled(),true);await check(3).check();
 await page.locator('#clear-slots').click();
 const empty=async()=>{assert.deepEqual(await values(),['','','','']);for(let i=0;i<4;i++){assert.equal(await field(i).inputValue(),'');assert.equal(await field(i).getAttribute('placeholder'),'zod');assert.equal(await field(i).getAttribute('aria-invalid'),'false');assert.equal(await box(i).locator('.slot-art img').count(),0);assert.equal(await page.locator(`[data-slot-copy="${i}"]`).isDisabled(),true);}};
 await empty();await page.waitForTimeout(1400);await empty();await page.reload();await page.waitForTimeout(1000);await empty();
 assert.equal(await page.locator('#star').inputValue(),'~sampel');assert.equal(await page.getByRole('radio',{name:'Filter by star',exact:true}).isChecked(),true);assert.equal(await page.locator('#match-mode').inputValue(),'exact');assert.equal(await check(0).isChecked(),false);assert.equal(await check(2).isChecked(),false);
 assert.equal(await page.locator('#clear-slots').count(),1);assert.equal(await page.locator('button input,button button').count(),0);
 await check(0).focus();await page.keyboard.press('Space');assert.equal(await check(0).isChecked(),true);await page.keyboard.press('Space');assert.equal(await check(0).isChecked(),false);
 await page.evaluate(()=>scrollTo(0,1200));await page.waitForTimeout(150);
 const metrics=await page.evaluate(()=>{const rect=e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};return {viewport:innerWidth,height:innerHeight,scroll:document.documentElement.scrollWidth,body:document.body.scrollWidth,nav:rect(document.querySelector('.masthead')),dock:rect(document.querySelector('.slot-dock')),actions:[...document.querySelectorAll('.dock-actions button')].map(rect),columns:[...document.querySelectorAll('[data-slot-column]')].map(c=>{const b=c.querySelector('[data-slot]'),input=c.querySelector('[data-slot-input]'),toggle=c.querySelector('[data-slot-enabled]'),label=toggle.closest('label');const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');ctx.font=getComputedStyle(input).font;return {box:rect(b),input:rect(input),toggle:rect(label),outside:!b.contains(input)&&!b.contains(toggle),siblings:input.parentElement===label.parentElement,room:input.clientWidth-parseFloat(getComputedStyle(input).paddingLeft)-parseFloat(getComputedStyle(input).paddingRight),textWidth:ctx.measureText('zod').width,iconBorder:getComputedStyle(label.querySelector('.slot-enable-icon')).borderTopStyle,icon:getComputedStyle(label.querySelector('.slot-enable-icon'),'::after').content};})};});
 assert.ok(metrics.scroll<=metrics.viewport&&metrics.body<=metrics.viewport,JSON.stringify(metrics));assert.ok(metrics.dock.top>=metrics.nav.bottom-1);assert.ok(metrics.dock.bottom<metrics.height);
 for(const c of metrics.columns){assert.ok(c.outside&&c.siblings);assert.ok(c.input.top>=c.box.bottom&&c.toggle.top>=c.box.bottom);assert.ok(c.input.right<=c.toggle.left+1);assert.ok(Math.abs(c.input.top-c.toggle.top)<8);assert.ok(c.room>=c.textWidth);assert.ok(c.input.width<80);assert.ok(c.box.left>=0&&c.toggle.right<=metrics.viewport);}
 assert.equal(metrics.columns[0].icon,'""','Disabled search is an empty outlined checkbox, not an X');assert.equal(metrics.columns[0].iconBorder,'solid');assert.ok(metrics.columns[1].icon.includes('✓'));
 for(let i=0;i<4;i++){assert.equal(await page.getByRole('checkbox',{name:`Use box ${i+1} in search`,exact:true}).count(),1);assert.match(await check(i).locator('..').getAttribute('title'),/ignore but keep value/);assert.equal(await page.getByRole('button',{name:`Clear box ${i+1}`,exact:true}).getAttribute('title'),`Clear box ${i+1}`);}
 assert.equal(await page.locator('[data-slot-clear] svg[aria-hidden="true"]').count(),4,'Clear uses distinct decorative eraser/trash icons');assert.doesNotMatch(await page.locator('.slots').innerText(),/×/);
 for(const r of metrics.actions)assert.ok(r.top>=metrics.nav.bottom&&r.bottom<metrics.height);
 assert.doesNotMatch(await page.locator('.slots').innerText(),/Search/);assert.deepEqual(errors,[]);
 require('node:fs').writeFileSync(process.env.SLOT_EVIDENCE+`/${mobile?'mobile':'desktop'}-geometry.json`,JSON.stringify(metrics,null,2));
 await page.screenshot({path:process.env.SLOT_EVIDENCE+`/${mobile?'mobile':'desktop'}.png`});
 for(const [i,s] of ['bot','myr','rad','ret'].entries())await field(i).fill(s);
 await page.waitForFunction(()=>[...document.querySelectorAll('.slot-art img')].length===4&&[...document.querySelectorAll('.slot-art img')].every(i=>i.complete&&i.naturalWidth>0));
 await page.screenshot({path:process.env.SLOT_EVIDENCE+`/${mobile?'mobile':'desktop'}-populated.png`});
 console.log('PASS '+(mobile?'mobile375':'desktop1360')+' empty persistence, preferences, outside-row geometry, zod width, native checkbox Space, stable drafts, exact/family masks, no pageerrors');
 await context.close();
}
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

const {chromium}=require('/Users/tekh/.hermes/cache/scratch/pacfyl-names/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const out=process.env.SLOT_EVIDENCE;
(async()=>{
 const browser=await chromium.launch({executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:900,height:1100}}),page=await context.newPage(),errors=[],requests=[],responses=[],consoleErrors=[];
  page.setDefaultTimeout(7000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
  page.on('request',r=>{if(r.url().includes('/candidates?'))requests.push(r.url());});
  page.on('response',r=>{if(r.url().includes('/candidates?'))responses.push({url:r.url(),status:r.status()});});
  const legacy='[ "or", "and", "or" ]';
  await context.addInitScript(({legacy})=>{if(!sessionStorage.getItem('either-seeded')){localStorage.setItem('sigil-atlas:joins',legacy);sessionStorage.setItem('either-seeded','1');}},{legacy});
  const field=i=>page.locator(`[data-slot-input="${i}"]`),eye=i=>page.locator(`[data-slot-enabled="${i}"]`),join=i=>page.locator(`[data-join-before="${i}"]`),middle=join(2);
  const values=()=>page.locator('[data-slot-input]').evaluateAll(es=>es.map(e=>e.value));
  const stored=key=>page.evaluate(k=>localStorage.getItem('sigil-atlas:'+k),key);
  async function send(){const pending=page.waitForRequest(r=>r.url().includes('/candidates?'));await page.locator('#find-planets').click();const q=new URL((await pending).url()).searchParams;assert.equal(q.get('grouping'),'rows');assert.equal(q.get('offset'),'0');return q;}
  await page.goto('http://127.0.0.1:8741/workshop.html');
  await page.waitForFunction(()=>document.querySelector('#backend-status').dataset.online==='true');
  assert.equal(await middle.isDisabled(),true);
  await page.locator('#match-mode').selectOption('exact');await field(0).fill('rad');
  assert.equal(await middle.isDisabled(),false,'One included pattern must enable placement selection');
  assert.deepEqual(await middle.locator('option').evaluateAll(es=>es.map(e=>[e.value,e.textContent])),[['and','AND'],['or','OR'],['and-either','AND ↕'],['or-either','OR ↕']]);
  assert.match(await middle.getAttribute('title'),/each pair in either half.*without moving or shuffling slots/);
  assert.match(await middle.getAttribute('aria-label'),/each pair in either half/);
  assert.equal(await stored('pairPlacement'),'"fixed"');
  console.log('PASS tracer: single-pattern centre enabled, validated default, four options and accessible explanation');
  const stable=await middle.elementHandle();
  await middle.focus();await page.keyboard.press('o');await page.keyboard.press('Tab');
  assert.equal(await middle.inputValue(),'or','Native keyboard type-ahead selects OR');
  await middle.selectOption('or-either');
  let q=await send();assert.equal(q.get('pairPlacement'),'either');assert.equal(q.get('p0'),'rad');assert.equal(q.has('join2'),false);assert.equal(await join(1).isDisabled(),true);assert.equal(await join(3).isDisabled(),true);
  await field(1).fill('dev');await join(1).selectOption('or');
  q=await send();assert.equal(q.get('join1'),'or');assert.equal(q.get('p1'),'dev');assert.equal(q.has('join2'),false);
  await field(2).fill('bot');await field(3).fill('ret');await join(3).selectOption('or');
  const identity=await page.locator('#compose-name').textContent(),original=await values();
  for(const choice of ['and','or','and-either','or-either']){
   await middle.focus();await middle.selectOption(choice);q=await send();
   assert.equal(q.get('pairPlacement'),choice.endsWith('-either')?'either':null);
   assert.equal(q.get('join2'),choice.startsWith('or')?'or':null);
   assert.equal(q.get('join1'),'or');assert.equal(q.get('join3'),'or');
   assert.deepEqual(await values(),original);assert.equal(await page.locator('#compose-name').textContent(),identity);
   assert.deepEqual(JSON.parse(await stored('rowJoins')),['or',choice.startsWith('or')?'or':'and','or']);
   assert.equal(await stored('pairPlacement'),JSON.stringify(choice.endsWith('-either')?'either':'fixed'));
   assert.equal(await stable.evaluate(e=>e===document.querySelector('[data-join-before="2"]')),true);
  }
  await middle.focus();await middle.selectOption('and-either');assert.equal(await middle.evaluate(e=>e===document.activeElement),true);
  assert.match(await page.locator('#search-expression').getAttribute('aria-label'),/in either half AND .*in either half/);
  // Invalid drafts stay visible and cannot acquire save authority on placement changes.
  await field(2).fill('BAD');await middle.selectOption('or-either');assert.equal(await field(2).inputValue(),'BAD');assert.equal(await field(2).getAttribute('aria-invalid'),'true');assert.equal(await page.locator('#save-composition').isDisabled(),true);await field(2).fill('bot');
  await eye(2).uncheck();await field(3).fill('');q=await send();assert.equal(q.has('p2'),false);assert.equal(q.has('p3'),false);assert.equal(q.has('join2'),false);assert.equal(q.has('join3'),false);assert.equal(await middle.isDisabled(),false);
  await eye(0).uncheck();await eye(1).uncheck();q=await send();assert.equal(await middle.isDisabled(),true);for(let i=0;i<4;i++){assert.equal(q.has('p'+i),false);assert.equal(q.has('shape'+i),false);}assert.equal(q.has('join2'),false);assert.equal(q.get('pairPlacement'),'either');
  await eye(2).check();q=await send();assert.equal(await middle.isDisabled(),false);assert.equal(q.get('p2'),'bot');assert.equal(q.has('join2'),false);
  await middle.selectOption('or');q=await send();assert.equal(q.has('pairPlacement'),false,'Fixed reset omits placement parameter');
  await middle.selectOption('and-either');await page.locator('#match-mode').selectOption('shape');q=await send();assert.equal(q.get('shape2'),await page.locator('[data-slot="2"]').getAttribute('data-shape'));assert.equal(q.has('p2'),false);assert.equal(q.has('join2'),false);
  await page.getByRole('radio',{name:'Filter by star',exact:true}).check();await page.locator('#star').fill('~pacfyl');q=await send();assert.equal(q.get('star'),'~pacfyl');assert.equal(q.get('pairPlacement'),'either');
  console.log('PASS actual exact/shape requests, two-pattern AND/OR, internal joins, empty/ignored patterns, native keyboard, fixed reset and draft/save preservation');
  const beforeReload={values:await values(),mask:await page.locator('[data-slot-enabled]').evaluateAll(es=>es.map(e=>e.checked)),joins:await stored('rowJoins')};
  await page.reload();assert.equal(await middle.inputValue(),'and-either');assert.deepEqual(await values(),beforeReload.values);assert.deepEqual(await page.locator('[data-slot-enabled]').evaluateAll(es=>es.map(e=>e.checked)),beforeReload.mask);assert.equal(await stored('rowJoins'),beforeReload.joins);assert.equal(await stored('joins'),legacy);assert.equal(await page.locator('#match-mode').inputValue(),'shape');assert.equal(await page.locator('#star').inputValue(),'~pacfyl');
  // Validation of independent storage never interprets either as a row join.
  for(const invalid of ['EITHER',null,[],{placement:'either'}]){
   await page.evaluate(v=>localStorage.setItem('sigil-atlas:pairPlacement',JSON.stringify(v)),invalid);await page.reload();assert.equal(await middle.inputValue(),'and');assert.equal(await stored('rowJoins'),beforeReload.joins);assert.equal(await stored('joins'),legacy);
  }
  await page.evaluate(()=>{localStorage.setItem('sigil-atlas:rowJoins',JSON.stringify(['or','and-either','or']));localStorage.setItem('sigil-atlas:pairPlacement','"either"');});await page.reload();assert.equal(await middle.inputValue(),'and-either');assert.equal(await join(1).inputValue(),'and');assert.equal(await join(3).inputValue(),'and');assert.equal(await stored('joins'),legacy);
  await middle.selectOption('or-either');assert.deepEqual(JSON.parse(await stored('rowJoins')),['and','or','and']);await page.reload();assert.equal(await middle.inputValue(),'or-either');assert.equal(await middle.locator('option').count(),4,'Runtime options added once per stable select');
  console.log('PASS separate validated placement and strict rowJoins persistence/reload; legacy joins bytes unchanged');
  // Representative either-state screenshots; geometry child independently measures all accepted widths/states.
  await eye(0).check();await eye(1).check();await field(3).fill('ret');await page.locator('#match-mode').selectOption('exact');
  for(const width of [900,640]){await page.setViewportSize({width,height:1100});await page.waitForFunction(()=>[...document.querySelectorAll('.slot-art img,.row-mini img')].every(i=>i.complete&&i.naturalWidth));await page.locator('.workshop-composition').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-20));await page.screenshot({path:`${out}/either-${width}.png`});}
  await page.locator('[data-slot-art="2"]').click();await page.locator('#clear-slot').click();assert.equal(await field(2).inputValue(),'');await page.locator('#clear-slots').click();assert.deepEqual(await values(),['','','','']);assert.equal(await middle.isDisabled(),true);await page.reload();assert.deepEqual(await values(),['','','','']);assert.equal(await middle.inputValue(),'or-either');assert.equal(await stored('joins'),legacy);
  assert.equal(await page.getByRole('button',{name:/^Copy box/}).count(),0);assert.equal(await page.locator('[data-slot-copy][hidden]').count(),4);
  await page.waitForTimeout(500);assert.deepEqual(errors,[]);
  fs.writeFileSync(`${out}/network.json`,JSON.stringify({requests,responses,consoleErrors,pageErrors:errors,interpretation:'HTTP rejection is recorded as old-runtime integration status, never a JavaScript exception or successful either-half results proof.'},null,2));
  console.log('PASS selection/clear/empty reload, hidden Copy, no JavaScript exceptions; real HTTP status distribution '+JSON.stringify(responses.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{})));
  await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

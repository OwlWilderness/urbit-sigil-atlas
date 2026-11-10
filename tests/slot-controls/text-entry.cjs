const assert=require('node:assert/strict');
const {chromium}=require('/Users/tekh/.hermes/cache/scratch/pacfyl-names/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'});
 try{
  const context=await browser.newContext({viewport:{width:900,height:1100}}),page=await context.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8741/workshop.html');
  assert.equal(await page.locator('#star').inputValue(),'','Star must start empty, not seeded');
  assert.equal(await page.locator('#star').getAttribute('placeholder'),'~pacfyl');
  assert.equal(await page.getByRole('button',{name:'Validate preview',exact:true}).count(),0);
  assert.equal(await page.getByRole('button',{name:'Save composition',exact:true}).count(),0);
  assert.equal(await page.locator('#find-planets').isVisible(),true);
  const field=i=>page.locator(`[data-slot-input="${i}"]`);
  const waitTotal=()=>page.waitForFunction(()=>document.querySelector('#planet-search-status').dataset.total==='1');
  await page.locator('#match-mode').selectOption('exact');
  for(const [i,s]of ['bot','myr','rad','ret'].entries())await field(i).fill('~'+s);
  await waitTotal();
  assert.deepEqual(await page.locator('[data-slot]').evaluateAll(es=>es.map(e=>e.dataset.syllable)),['bot','myr','rad','ret']);
  assert.equal(await field(0).getAttribute('aria-invalid'),'false');
  for(const [i,s]of ['bot','myr','rad','ret'].entries())await field(i).fill(s);
  await waitTotal();
  await page.locator('input[name=mode][value=star]').check();
  await page.waitForFunction(()=>document.querySelector('#planet-search-status').textContent.includes('Enter a star'));
  assert.equal(await page.locator('#star').inputValue(),'');
  for(const value of ['pacfyl','~pacfyl']){
   const response=page.waitForResponse(r=>{const u=new URL(r.url());return u.pathname==='/api/v1/candidates'&&u.searchParams.get('star')==='~pacfyl'&&r.status()===200;});
   await page.locator('#star').fill(value);await response;await waitTotal();
   assert.equal(await page.locator('#star').inputValue(),value);
  }
  await page.reload();assert.equal(await page.locator('#star').inputValue(),'~pacfyl');await waitTotal();
  await field(0).fill('~~bot');assert.equal(await field(0).getAttribute('aria-invalid'),'true');assert.equal(await page.locator('[data-slot="0"]').getAttribute('data-syllable'),'bot');
  await field(0).fill('~bot');assert.equal(await field(0).getAttribute('aria-invalid'),'false');
  const invalid=page.waitForResponse(r=>new URL(r.url()).searchParams.get('star')==='~pacfly'&&r.status()===400);
  await page.locator('#star').fill('pacfly');await invalid;assert.equal(await page.locator('#star').inputValue(),'pacfly','Never silently repair syllable order');
  await page.locator('#star').fill('');await page.reload();assert.equal(await page.locator('#star').inputValue(),'');
  await page.goto('http://127.0.0.1:8741/prefixes.html');await page.locator('#search').fill('rad');const count=await page.locator('#count').textContent();assert(!count.startsWith('0 '));
  await page.locator('#search').fill('~rad');assert.equal(await page.locator('#count').textContent(),count);
  assert.deepEqual(errors,[]);await context.close();
  for(const legacy of ['~pacfyl','~marzod']){
   const c=await browser.newContext();await c.addInitScript(v=>localStorage.setItem('sigil-atlas:star',JSON.stringify(v)),legacy);
   const p=await c.newPage();await p.goto('http://127.0.0.1:8741/workshop.html');assert.equal(await p.locator('#star').inputValue(),legacy==='~pacfyl'?'':legacy);await c.close();
  }
  console.log('PASS optional single tilde in all syllable entries and catalogue search; bare/prefixed star uses canonical API; empty placeholder, seed migration, preserved explicit star, empty reload, strict invalid inputs; validate/save hidden, refresh retained; no JS errors');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});

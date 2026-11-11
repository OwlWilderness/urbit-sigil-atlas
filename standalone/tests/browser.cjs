'use strict';
const {chromium}=require(process.env.SIGFORMEL_PLAYWRIGHT_ROOT||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'evidence/browser');fs.mkdirSync(OUT,{recursive:true});
const ORIGIN='https://sigformel.quantumtekh.com',events=[],errors=[],blocked=[];
async function bridge(route){const req=route.request(),url=new URL(req.url());if(url.origin!==ORIGIN){blocked.push(url.origin);return route.abort();}const headers={...req.headers(),host:'sigformel.quantumtekh.com'};delete headers['accept-encoding'];delete headers['content-length'];const body=req.postDataBuffer();if(body)headers['content-length']=body.length;
 const result=await new Promise((resolve,reject)=>{const r=http.request({hostname:'127.0.0.1',port:18742,path:url.pathname+url.search,method:req.method(),headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));});r.on('error',reject);r.end(body);});
 events.push({path:url.pathname+url.search,method:req.method(),status:result.status});delete result.headers['transfer-encoding'];delete result.headers.connection;await route.fulfill(result);
}
async function watch(context){await context.route('**/*',bridge);context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});});}
async function main(){const browser=await chromium.launch({executablePath:process.env.SIGFORMEL_BROWSER_EXECUTABLE,headless:true,args:['--no-proxy-server']});try{
 const a=await browser.newContext({viewport:{width:1440,height:1000}}),b=await browser.newContext({viewport:{width:390,height:844}});await watch(a);await watch(b);const page=await a.newPage();
 await page.goto(ORIGIN+'/workshop.html');await page.waitForFunction(()=>document.querySelector('#backend-status').dataset.online==='true');
 assert.match(await page.title(),/Sigformel/);assert.match(await page.locator('#saved-compositions').innerText(),/unavailable.*private|private.*browser/i);
 // Native pointer-based HTML5 drag from full-width palette to actual assembly.
 await page.locator('[data-shape-source="circle"]').dragTo(page.locator('[data-slot-art="0"]'));
 await page.waitForFunction(()=>document.querySelector('[data-slot="0"]').dataset.syllable!=='');
 assert(await page.locator('[data-slot="0"]').getAttribute('data-syllable'));
 await page.waitForFunction(()=>Number(document.querySelector('#planet-search-status').dataset.total)>0);
 const geometry=[];async function measure(label){const m=await page.evaluate(()=>{const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom,right:r.right}};return {viewport:innerWidth,document:document.documentElement.scrollWidth,palette:rect('.shape-panel'),assembly:rect('.slot-dock'),filters:rect('.workbench'),row:rect('.workshop-composition'),actions:rect('.workshop-actions'),refresh:rect('#find-planets'),search:rect('#search'),glyphs:[...document.querySelectorAll('.slot-art img')].map(i=>({width:i.width,height:i.height}))};});assert(m.document<=m.viewport+1,JSON.stringify(m));assert(Math.abs(m.assembly.y-m.filters.y)<1);assert(Math.abs(m.assembly.bottom-m.filters.bottom)<1);assert(m.filters.x>m.assembly.x);assert(m.palette.bottom<=m.row.y);assert(m.actions.y>=m.row.bottom);assert(Math.abs(m.refresh.y-m.search.y)<25);for(const g of m.glyphs)assert(Math.abs(g.width-g.height)<1);geometry.push({label,...m});}
 await measure('desktop-shape-drag');await page.screenshot({path:path.join(OUT,'desktop-shape.png'),fullPage:true});
 // Exact fixture, actual same-origin compose and moving-pair search.
 await page.selectOption('#match-mode','exact');for(const [i,s]of ['rad','dev','bot','myr'].entries()){await page.locator(`[data-slot-input="${i}"]`).fill(s);await page.locator(`[data-slot-input="${i}"]`).press('Tab');}
 await page.selectOption('[data-join-before="2"]','and-either');await page.locator('#find-planets').click();
 await page.waitForFunction(()=>document.querySelector('#planet-search-status').dataset.total==='2');
 assert.deepEqual(await page.locator('#planet-results code').allTextContents(),['~botmyr-raddev','~raddev-botmyr']);
 assert(events.some(e=>e.path==='/api/v1/compose'&&e.method==='POST'&&e.status===200),'real browser same-origin compose');
 await page.screenshot({path:path.join(OUT,'desktop-exact.png'),fullPage:true});
 for(const width of [900,600,390,1100,1440]){await page.setViewportSize({width,height:1000});await measure('populated-'+width);if(width===390){await page.screenshot({path:path.join(OUT,'narrow-left.png'),fullPage:true});await page.locator('.workshop-composition').evaluate(e=>e.scrollLeft=e.scrollWidth);await page.screenshot({path:path.join(OUT,'narrow-right.png'),fullPage:true});}}
 // Separate fresh context has no slots, favorites or preference leakage.
 const other=await b.newPage();await other.goto(ORIGIN+'/workshop.html');await other.waitForFunction(()=>document.querySelector('#backend-status').dataset.online==='true');assert.deepEqual(await other.locator('[data-slot-input]').evaluateAll(es=>es.map(e=>e.value)),['','','','']);
 await page.reload();await page.waitForFunction(()=>document.querySelector('#planet-search-status').dataset.total==='2');assert.equal(await page.locator('[data-slot-input="0"]').inputValue(),'rad');assert.equal(await page.locator('[data-join-before="2"]').inputValue(),'and-either');
 await page.goto(ORIGIN+'/index.html');await page.locator('[data-favorite="prefix-rad"]').click();await page.goto(ORIGIN+'/shortlist.html');assert.equal(await page.locator('.glyph-card:not([hidden])').count(),1);await page.reload();assert.equal(await page.locator('.glyph-card:not([hidden])').count(),1);
 await other.goto(ORIGIN+'/shortlist.html');assert.equal(await other.locator('.glyph-card:not([hidden])').count(),0);
 // All six actual pages, dialogs and authentic locally loaded glyphs.
 for(const name of ['index','prefixes','suffixes','shortlist','workshop','api']){await page.goto(ORIGIN+'/'+name+'.html');assert.match(await page.title(),/Sigformel/);assert.equal(await page.locator('.main-nav a').count(),6);}
 await page.goto(ORIGIN+'/workshop.html');await page.locator('#clear-slots').click();await page.setViewportSize({width:390,height:844});await measure('blank-narrow');await page.screenshot({path:path.join(OUT,'blank-narrow.png'),fullPage:true});
 assert.equal(blocked.length,0);assert.equal(events.filter(e=>e.path.startsWith('/api/v1/compositions')).length,0,'no shared records requests');assert.deepEqual(errors,[]);
 const result={pass:true,transport:'Test-only HTTPS-origin Playwright route bridge to real loopback Nginx18742; not public DNS/TLS acceptance',contexts:2,geometry,nativePaletteDrag:true,exactEitherNames:['~botmyr-raddev','~raddev-botmyr'],storageIsolation:true,reloadPersistence:true,errors,blocked,requests:events,hashes:{}};for(const file of ['site/app.js','site/workshop.js','site/workshop.css','site/styles.css',...['index','prefixes','suffixes','shortlist','workshop','api'].map(n=>'site/'+n+'.html')])result.hashes[file]=crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex');fs.writeFileSync(path.join(OUT,'receipt.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({pass:true,contexts:2,measurements:geometry.length,requests:events.length,errors,blocked}));await a.close();await b.close();
 }finally{await browser.close();}}
main().catch(e=>{fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({error:e.stack,errors,blocked,events},null,2));console.error(e);process.exitCode=1;});

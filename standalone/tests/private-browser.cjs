'use strict';
// Test-only safe loopback origins. Never navigate a private or production URL.
const {chromium}=require(process.env.SIGFORMEL_PLAYWRIGHT_ROOT||'playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'evidence/private-browser');fs.mkdirSync(OUT,{recursive:true});
const green=JSON.parse(fs.readFileSync(path.join(ROOT,'evidence/private-green.json')));assert(green.pass);
const modes=[{label:'private',test:'http://127.0.0.1:18081',host:'web.sigformel-web.public.dappnode.private:8088',origin:'http://web.sigformel-web.public.dappnode.private:8088'},{label:'public',test:'http://127.0.0.1:18082',host:'sigformel.quantumtekh.com',origin:'https://sigformel.quantumtekh.com'}];
const events=[],errors=[],blocked=[],checks=[];
async function bridge(route){const req=route.request(),url=new URL(req.url()),mode=modes.find(m=>url.origin===m.test);if(!mode){blocked.push(url.origin);return route.abort();}
 const headers={...req.headers(),host:mode.host};if(headers.origin){assert.equal(headers.origin,mode.test);headers.origin=mode.origin;}
 delete headers['accept-encoding'];delete headers['content-length'];const body=req.postDataBuffer();if(body)headers['content-length']=body.length;
 const result=await new Promise((resolve,reject)=>{const r=http.request({hostname:'127.0.0.1',port:green.port,path:url.pathname+url.search,method:req.method(),headers},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks)}));});r.on('error',reject);r.end(body);});
 events.push({mode:mode.label,path:url.pathname+url.search,method:req.method(),status:result.status});delete result.headers['transfer-encoding'];delete result.headers.connection;await route.fulfill(result);
}
async function main(){const browser=await chromium.launch({executablePath:process.env.SIGFORMEL_BROWSER_EXECUTABLE,headless:true,args:['--no-proxy-server']});try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}});await context.route('**/*',bridge);context.on('page',p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});});const page=await context.newPage();
 for(const [i,mode] of modes.entries()){
  await page.goto(mode.test+'/workshop.html');await page.waitForFunction(()=>document.querySelector('#backend-status').dataset.online==='true');
  assert.deepEqual(await page.locator('[data-slot-input]').evaluateAll(es=>es.map(e=>e.value)),['','','',''],'fresh other origin preferences empty');
  await page.selectOption('#match-mode','exact');for(const [slot,s]of ['rad','dev','bot','myr'].entries()){await page.locator(`[data-slot-input="${slot}"]`).fill(s);await page.locator(`[data-slot-input="${slot}"]`).press('Tab');}
  await page.selectOption('[data-join-before="2"]','and-either');await page.locator('#find-planets').click();await page.waitForFunction(()=>document.querySelector('#planet-search-status').dataset.total==='2');
  assert.deepEqual(await page.locator('#planet-results code').allTextContents(),['~botmyr-raddev','~raddev-botmyr']);
  assert(events.some(e=>e.mode===mode.label&&e.path==='/api/v1/compose'&&e.method==='POST'&&e.status===200));
  // Give each origin a different persisted match preference.
  if(i===1)await page.selectOption('#match-mode','shape');
  for(const width of [1440,390]){await page.setViewportSize({width,height:width===390?844:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:path.join(OUT,mode.label+'-'+width+'.png'),fullPage:true});}
  await page.reload();await page.waitForFunction(()=>document.querySelector('#backend-status').dataset.online==='true');assert.equal(await page.locator('[data-slot-input="0"]').inputValue(),'rad');assert.equal(await page.locator('#match-mode').inputValue(),i===0?'exact':'shape');
  for(const name of ['index','prefixes','suffixes','shortlist','workshop','api']){await page.goto(mode.test+'/'+name+'.html');assert.match(await page.title(),/Sigformel/);assert.equal(await page.locator('.main-nav a').count(),6);}
  await page.locator('a[href="licenses.html"]').first().click();assert.match(await page.locator('body').innerText(),/MIT/);await page.locator('a[href="LICENSE.txt"]').first().click();assert.match(await page.locator('body').innerText(),/Permission is hereby granted/);await page.screenshot({path:path.join(OUT,mode.label+'-license-narrow.png'),fullPage:true});
  checks.push({mode:mode.label,navigation:true,search:true,compose:true,preferenceReload:true,desktopNarrow:true,licenseClick:true});
 }
 // Same browser context, return to private: public preference did not overwrite it.
 await page.goto(modes[0].test+'/workshop.html');await page.waitForFunction(()=>document.querySelector('#backend-status').dataset.online==='true');assert.equal(await page.locator('#match-mode').inputValue(),'exact');
 assert.deepEqual(errors,[]);assert.deepEqual(blocked,[]);assert.equal(events.filter(e=>e.path.startsWith('/api/v1/compositions')).length,0);
 const result={pass:true,profile:process.env.HERMES_HOME||null,imageId:green.imageId,testSha256:crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'),transport:'Isolated loopback browser origins mapped by test-only bridge to literal deployment header pairs at real image loopback Nginx; no private/public production navigation, DNS, TLS, VPN or connector proof',checks,originSeparatedPreferences:true,errors,blocked,requests:events};fs.writeFileSync(path.join(OUT,'receipt.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({pass:true,checks,requests:events.length,originSeparatedPreferences:true}));await context.close();
 }finally{await browser.close();}}
main().catch(e=>{fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({error:e.stack,errors,blocked,events},null,2));console.error(e);process.exitCode=1;});

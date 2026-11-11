'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const root=path.resolve(__dirname,'../..');
async function fixture(t){
 const dataDir=await fs.mkdtemp(path.join(os.homedir(),'.hermes/cache/scratch/atlas-api-'));
 let server;
 t.after(async()=>{if(server?.listening)await new Promise(r=>server.close(r));await fs.rm(dataDir,{recursive:true,force:true})});
 const siteDir=path.join(dataDir,'fixture-site'); await fs.mkdir(siteDir); await fs.writeFile(path.join(siteDir,'index.html'),'<!doctype html>fixture');
 const {createServer}=require('../index.cjs'); server=createServer({dataDir:path.join(dataDir,'records'),siteDir});
 const start=async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));return `http://127.0.0.1:${server.address().port}`};
 let base=await start();
 return {dataDir:path.join(dataDir,'records'), get base(){return base}, async restart(){await new Promise(r=>server.close(r));server=createServer({dataDir:path.join(dataDir,'records'),siteDir});base=await start()},async request(route,body,headers={}){const res=await fetch(base+route,{method:body===undefined?'GET':'POST',headers:body===undefined?headers:{'Content-Type':'application/json',Origin:base,...headers},body:body===undefined?undefined:JSON.stringify(body)});return {status:res.status,body:await res.json(),headers:res.headers}}};
}
test('health and glyph atlas exact filters over real HTTP',async t=>{
 const f=await fixture(t); const h=await f.request('/api/v1/health'); assert.equal(h.status,200);assert.equal(h.body.ok,true);
 const all=await f.request('/api/v1/glyphs'); assert.equal(all.body.total,512);
 const shapes=await f.request('/api/v1/shapes');assert.equal(shapes.body.items.length,12);
 const subset=await f.request('/api/v1/glyphs?kind=prefix&shape=circle&q=rad');assert.ok(subset.body.items.every(g=>g.kind==='prefix'&&g.shape==='circle'&&g.syllable.includes('rad')));
 assert.equal((await f.request('/api/v1/glyphs?kind=PREFIX')).status,400);
});
test('compose preserves exact glyphs and distinguishes free versus star eligibility',async t=>{
 const f=await fixture(t);const input={syllables:['bot','myr','rad','ret'],mode:'star',star:'~pacfyl'};
 const c=await f.request('/api/v1/compose',input);assert.equal(c.status,200);assert.deepEqual(c.body,{...input,name:'~botmyr-radret',id:'1082103209',kind:'planet',canonical:true,parent:'~pacfyl',eligible:true});
 const other=await f.request('/api/v1/compose',{...input,star:'~sampel'});assert.equal(other.status,200);assert.equal(other.body.eligible,false);assert.equal(other.body.name,c.body.name);
 const free=await f.request('/api/v1/compose',{syllables:['doz','zod','doz','zod'],mode:'free'});assert.equal(free.status,200);assert.equal(free.body.name,'~dozzod-dozzod');assert.equal(free.body.canonical,false);assert.equal(free.body.eligible,true);
 for(const bad of [{...input,star:'pacfyl'},{...input,star:'~PACFYL'},{...input,star:'~zod'},{...input,syllables:['bot','myr','rad']},{...input,syllables:['myr','bot','rad','ret']},{...input,mode:'spawn'},{...input,extra:true}]) assert.equal((await f.request('/api/v1/compose',bad)).status,400);
});
test('planet discovery exhausts canonical catalogs and applies distinct ending and exact AND filters',async t=>{
 const f=await fixture(t);
 const all=await f.request('/api/v1/planets?star=~pacfyl&limit=100');assert.equal(all.status,200);assert.equal(all.body.total,65535);assert.equal(all.body.items.length,100);assert.equal(all.body.availabilityChecked,false);assert.ok(all.body.items.every(p=>p.parent==='~pacfyl'));
 const match=await f.request('/api/v1/planets?star=~pacfyl&syllables=bot,rad&p0=bot&p1=myr&p2=rad&p3=ret');assert.equal(match.body.total,1);assert.equal(match.body.items[0].name,'~botmyr-radret');
 const patterns=await f.request('/api/v1/planets?star=~pacfyl&endings=it,yr,oc,ef&minMatches=3&limit=100');assert.equal(patterns.body.total,21);assert.ok(patterns.body.items.every(p=>new Set(p.syllables.map(s=>s.slice(1)).filter(s=>['it','yr','oc','ef'].includes(s))).size>=3));
 const page=await f.request('/api/v1/planets?star=~pacfyl&offset=10&limit=3');assert.deepEqual(page.body.items,all.body.items.slice(10,13));
 const other=await f.request('/api/v1/planets?star=~sampel&limit=1');assert.equal(other.body.total,65535);assert.equal(other.body.items[0].parent,'~sampel');
 for(const q of ['', 'star=pacfyl','star=~zod','star=~pacfyl&syllables=RAD','star=~pacfyl&p0=myr','star=~pacfyl&endings=it,it','star=~pacfyl&minMatches=1','star=~pacfyl&limit=101','star=~pacfyl&offset=-1','star=~pacfyl&oops=x'])assert.equal((await f.request('/api/v1/planets?'+q)).status,400,q);
});
test('saved compositions use private atomic JSON records and survive server restart',async t=>{
 const oldMask=process.umask(0);t.after(()=>process.umask(oldMask));
 const f=await fixture(t);const input={syllables:['bot','myr','rad','ret'],mode:'star',star:'~pacfyl',label:'Exact saved name'};
 const saved=await f.request('/api/v1/compositions',input);assert.equal(saved.status,201);assert.match(saved.body.item.id,/^[a-f0-9-]{36}$/);assert.equal(saved.body.item.name,'~botmyr-radret');assert.equal(saved.body.item.label,input.label);assert.ok(Date.parse(saved.body.item.createdAt));
 const free=await f.request('/api/v1/compositions',{syllables:['doz','zod','doz','zod'],mode:'free'});assert.equal(free.status,201);assert.equal(free.body.item.mode,'free');assert.equal(free.body.item.canonical,false);
 assert.equal((await f.request('/api/v1/compositions',{...input,star:'~sampel'})).status,409);
 const disk=await fs.readdir(f.dataDir);assert.equal(disk.length,2);assert.ok(disk.every(n=>/^[a-f0-9-]{36}\.json$/.test(n)));assert.equal((await fs.stat(f.dataDir)).mode&0o777,0o700);for(const n of disk)assert.equal((await fs.stat(path.join(f.dataDir,n))).mode&0o777,0o600);
 await f.restart();const read=await f.request('/api/v1/compositions');assert.equal(read.body.total,2);assert.deepEqual(read.body.items.find(i=>i.id===saved.body.item.id),saved.body.item);
});
test('Host validation rejects DNS rebinding before API access',async t=>{
 const f=await fixture(t);const r=await new Promise((resolve,reject)=>{const req=require('node:http').get(f.base+'/api/v1/health',{headers:{Host:'attacker.invalid'}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(text)}))});req.on('error',reject)});assert.equal(r.status,403);assert.equal(r.body.error.code,'UNSAFE_HOST');
});
test('POST requires exact local origin and JSON content type without CORS',async t=>{
 const f=await fixture(t);const input={syllables:['bot','myr','rad','ret'],mode:'free'};
 for(const headers of [{Origin:'https://attacker.invalid'},{Origin:''},{'Content-Type':'text/plain'},{'Sec-Fetch-Site':'cross-site'}]){const r=await f.request('/api/v1/compose',input,headers);assert.ok([403,415].includes(r.status));assert.equal(r.headers.get('access-control-allow-origin'),null)}
 assert.equal((await f.request('/api/v1/compose',input)).status,200);
});
test('untrusted bodies are bounded and malformed JSON produces structured errors',async t=>{
 const f=await fixture(t);
 for(const [body,status] of [['{',400],['x'.repeat(9000),413]]){const r=await fetch(f.base+'/api/v1/compose',{method:'POST',headers:{Origin:f.base,'Content-Type':'application/json'},body});assert.equal(r.status,status);assert.equal(typeof (await r.json()).error.code,'string')}
});
test('static serving handles MIME and refuses traversal, dotfiles and symlink escape',async t=>{
 const f=await fixture(t);const siteDir=path.join(path.dirname(f.dataDir),'fixture-site');await fs.writeFile(path.join(siteDir,'glyph.svg'),'<svg xmlns="http://www.w3.org/2000/svg"/>');await fs.writeFile(path.join(siteDir,'.secret'),'secret');await fs.symlink(__filename,path.join(siteDir,'escape.txt'));
 const index=await fetch(f.base+'/');assert.equal(index.status,200);assert.match(index.headers.get('content-type'),/text\/html/);assert.match(await index.text(),/fixture/);
 const svg=await fetch(f.base+'/glyph.svg');assert.equal(svg.status,200);assert.match(svg.headers.get('content-type'),/image\/svg\+xml/);
 for(const route of ['/..%2findex.cjs','/%2e%2e%2findex.cjs','/.secret','/escape.txt','/api/v1/unknown','/%00']){const r=await fetch(f.base+route);assert.ok([400,404].includes(r.status),route);assert.equal(typeof(await r.json()).error.code,'string')}
});
test('configuration refuses public storage overlap and query schemas reject unknown keys',async t=>{
 const f=await fixture(t);const siteDir=path.join(path.dirname(f.dataDir),'fixture-site');
 assert.throws(()=>require('../index.cjs').createServer({dataDir:path.join(siteDir,'records'),siteDir}),/overlap/);
 for(const route of ['/api/v1/glyphs?kind=prefix&kind=suffix','/api/v1/glyphs?bogus=1','/api/v1/shapes?bogus=1','/api/v1/compositions?bogus=1'])assert.equal((await f.request(route)).status,400);
 const denied=await f.request('/api/v1/compositions',{syllables:['bot','myr','rad','ret'],mode:'free'},{Origin:'https://attacker.invalid'});assert.equal(denied.status,403);assert.equal((await f.request('/api/v1/compositions')).body.total,0);
});
module.exports={fixture};

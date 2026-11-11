'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
async function fixture(t){
 const dir=await fs.mkdtemp(path.join(os.homedir(),'.hermes/cache/scratch/atlas-rows-'));
 const dataDir=path.join(dir,'records'),server=require('../index.cjs').createServer({dataDir});
 t.after(async()=>{if(server.listening)await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {dataDir,async get(query=''){const r=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/candidates?${query}`);return {status:r.status,body:await r.json()}}};
}
test('opt-in rows combines each row before combining the rows, unlike legacy precedence',async t=>{
 const f=await fixture(t),query='p0=rad&p1=ret&p2=bot&p3=myr&join1=or&join2=and&join3=or';
 const r=await f.get('grouping=rows&'+query+'&limit=3');
 assert.equal(r.status,200,'valid opt-in grouped query must reach candidate search');
 // (A OR B) AND (C OR D): independent Cartesian product of two unions.
 assert.equal(r.body.total,(256+256-1)**2);
 const legacy=await f.get(query+'&limit=3');
 assert.equal(legacy.status,200);assert.notEqual(r.body.total,legacy.body.total);
});

const ob=require('urbit-ob');
const glyphs=require('../data/glyphs.json');
const domains=['prefix','suffix','prefix','suffix'].map(kind=>glyphs.filter(g=>g.kind===kind).map(g=>g.syllable).sort());
const shapeOf=(s,i)=>glyphs.find(g=>g.kind===(i%2?'suffix':'prefix')&&g.syllable===s).shape;
function oracle(query,groups,range=domains){
 const p=new URLSearchParams(query);let total=0;
 for(let selection=1;selection<2**groups.length;selection++){
  const required=new Set();let n=0;
  groups.forEach((group,i)=>{if(selection&(1<<i)){n++;group.forEach(slot=>required.add(slot))}});
  const sets=range.map((values,i)=>values.filter(s=>!required.has(i)||((!p.has('p'+i)||p.get('p'+i)===s)&&(!p.has('shape'+i)||p.get('shape'+i)===shapeOf(s,i)))));
  const product=sets.reduce((a,s)=>a*s.length,1);
  const excluded=sets[0].includes('doz')&&sets[1].includes('zod')?sets[2].length*sets[3].length:0;
  total+=(n%2?1:-1)*(product-excluded);
 }
 return total;
}
function rankOf(tuple,query,groups){
 let rank=0;
 for(let i=0;i<4;i++)rank+=oracle(query,groups,domains.map((values,j)=>j<i?[tuple[j]]:j===i?values.filter(s=>s<tuple[i]):values));
 return rank;
}
function matches(tuple,query,groups){
 const p=new URLSearchParams(query);
 return groups.some(group=>group.every(i=>(!p.has('p'+i)||p.get('p'+i)===tuple[i])&&(!p.has('shape'+i)||p.get('shape'+i)===shapeOf(tuple[i],i))));
}
function checkPage(body,query,groups,offset,limit,total){
 assert.equal(body.total,total,query);assert.equal(body.offset,offset);assert.equal(body.limit,limit);
 assert.equal(body.availabilityChecked,false);assert.equal(body.items.length,Math.max(0,Math.min(limit,total-offset)));
 assert.equal(new Set(body.items.map(r=>r.name)).size,body.items.length);
 body.items.forEach((r,i)=>{
  assert.ok(matches(r.syllables,query,groups),r.name);assert.equal(rankOf(r.syllables,query,groups),offset+i,r.name);
  assert.equal(ob.patp(r.id),r.name);assert.equal(ob.patp2dec(r.name),r.id);assert.equal(ob.clan(r.name),'planet');assert.equal(ob.sein(r.name),r.parent);
 });
}

// Explicit rectangle groups below are independent of the production parser.
test('all eight row operator triplets have independent totals and lexical first/high/final/overlap pages',async t=>{
 const f=await fixture(t);
 const groupsByBits=[[[0,1,2,3]],[[0,2,3],[1,2,3]],[[0,1],[2,3]],[[0],[1],[2,3]],[[0,1,2],[0,1,3]],[[0,2],[0,3],[1,2],[1,3]],[[0,1],[2],[3]],[[0],[1],[2],[3]]];
 for(let bits=0;bits<8;bits++){
  let query='grouping=rows&p0=rad&p1=ret&p2=bot&p3=myr';
  for(let n=1;n<=3;n++)query+='&join'+n+'='+(bits&(1<<(n-1))?'or':'and');
  const groups=groupsByBits[bits],total=oracle(query,groups);
  for(const offset of [...new Set([0,Math.floor(total/2),Math.max(0,total-3),total])]){
   const r=await f.get(query+'&offset='+offset+'&limit=5');assert.equal(r.status,200,query);
   checkPage(r.body,query,groups,offset,5,total);
  }
  const a=await f.get(query+'&offset=0&limit=3'),b=await f.get(query+'&offset=1&limit=3');
  assert.deepEqual(a.body.items.slice(1),b.body.items.slice(0,a.body.items.length-1));
 }
 const query='grouping=rows&p0=rad&p1=ret&p2=bot&p3=myr&join1=or&join3=or',groups=groupsByBits[5];
 const tuple=['rad','ret','bot','myr'],offset=rankOf(tuple,query,groups);
 const r=await f.get(query+'&offset='+offset+'&limit=2');assert.deepEqual(r.body.items[0].syllables,tuple);
 checkPage(r.body,query,groups,offset,2,oracle(query,groups));
 assert.deepEqual((await f.get(query+'&offset=9007199254740991')).body.items,[]);
});
test('empty/one-leaf rows, local exact-family conflicts and canonical zero-word exclusions remain precise',async t=>{
 const f=await fixture(t),conflict=glyphs.find(g=>g.kind==='prefix'&&g.shape!==shapeOf('bot',0)).shape;
 const cases=[['',[[]]],['p0=rad',[[0]]],['p1=ret',[[1]]],['p2=bot',[[2]]],['shape3=circle',[[3]]],['p0=rad&p2=bot',[[0,2]]],['p1=ret&p3=myr&join2=or',[[1],[3]]],['p0=rad&p1=ret&join1=or',[[0],[1]]],['p2=bot&p3=myr&join3=or',[[2],[3]]],['p0=doz&p1=zod',[[0,1]]],['p0=doz&p1=zod&p2=bot&join2=or',[[0,1],[2]]],['p0=doz&p1=ret',[[0,1]]],['p0=bot&shape0='+conflict,[[0]]],['p0=bot&shape0='+conflict+'&shape2=circle&join2=or',[[0],[2]]],['p0=bot&shape0='+shapeOf('bot',0)+'&shape2=circle&join2=or',[[0],[2]]],['shape0=circle&shape1=square&shape2=leaf-up&shape3=circle&join1=or&join3=or',[[0,2],[0,3],[1,2],[1,3]]]];
 for(const [q,groups] of cases){
  const query='grouping=rows&'+q,total=oracle(query,groups);
  for(const offset of [0,Math.max(0,total-2)]){
   const r=await f.get(query+'&offset='+offset+'&limit=2');assert.equal(r.status,200,query);checkPage(r.body,query,groups,offset,2,total);
  }
  if(!q)assert.equal(total,4294901760);
 }
 // Opt-in all-AND and default absence must be byte-equivalent JSON responses.
 for(const q of ['','p0=rad&p2=bot','p0=rad&p1=ret&p2=bot&p3=myr&join1=and&join2=and&join3=and'])assert.deepEqual((await f.get('grouping=rows&'+q)).body,(await f.get(q)).body);
 await assert.rejects(fs.stat(f.dataDir),{code:'ENOENT'});
});
test('strict grouping and row operator validation rejects unknown, duplicate and dangling inputs',async t=>{
 const f=await fixture(t);
 const bad=['grouping=','grouping=linear','grouping=ROWS','grouping=%20rows','grouping=rows&grouping=rows','grouping=rows&grouping=linear'];
 const dangling=['join1=or','join2=and','join3=or','p0=rad&join1=and','p1=ret&join1=or','p2=bot&join3=or','p3=myr&join3=and','p0=rad&p1=ret&join2=or','p2=bot&p3=myr&join2=and','p0=rad&p2=bot&join1=or','p0=rad&p2=bot&join3=or','p0=rad&join0=and','p0=rad&join4=or','unknown=rows'];
 bad.push(...dangling.map(q=>'grouping=rows&'+q));
 for(let n=1;n<=3;n++)for(const value of ['','OR','AND','xor','or%20','%20or','null','1'])bad.push('grouping=rows&p0=rad&p1=ret&p2=bot&p3=myr&join'+n+'='+value);
 for(let n=1;n<=3;n++)bad.push('grouping=rows&p0=rad&p1=ret&p2=bot&p3=myr&join'+n+'=and&join'+n+'=or');
 for(const query of bad){const r=await f.get(query);assert.equal(r.status,400,query);assert.equal(r.body.error.code,'INVALID_INPUT')}
});
test('selected star fences the complete grouped expression using independent urbit-ob enumeration',async t=>{
 const f=await fixture(t),star='~pacfyl',base=Number(ob.patp2dec(star)),rows=[];
 for(let n=1;n<65536;n++){
  const id=String(base+n*65536),name=ob.patp(id);rows.push({name,id,syllables:name.slice(1).replace('-','').match(/.{3}/g),parent:ob.sein(name)});
 }
 const a=shapeOf('bot',0),b=shapeOf('myr',1),c=shapeOf('rad',2),d=shapeOf('ret',3);
 const cases=[['shape0='+a+'&shape1='+b+'&shape2='+c+'&shape3='+d+'&join1=or&join3=or',s=>(shapeOf(s[0],0)===a||shapeOf(s[1],1)===b)&&(shapeOf(s[2],2)===c||shapeOf(s[3],3)===d)],['p0=bot&p1=myr&p2=rad&p3=ret&join2=or',s=>(s[0]==='bot'&&s[1]==='myr')||(s[2]==='rad'&&s[3]==='ret')],['p1=myr&p2=rad&join2=or',s=>s[1]==='myr'||s[2]==='rad']];
 for(const [q,predicate] of cases){
  const expected=rows.filter(r=>predicate(r.syllables));assert.ok(expected.length>0);
  for(const offset of [0,Math.floor(expected.length/2),Math.max(0,expected.length-3),expected.length]){
   const r=await f.get('grouping=rows&'+q+'&star='+star+'&offset='+offset+'&limit=100');
   assert.equal(r.status,200);assert.equal(r.body.star,star);assert.equal(r.body.total,expected.length);assert.equal(r.body.availabilityChecked,false);
   assert.deepEqual(r.body.items,expected.slice(offset,offset+100));assert.ok(r.body.items.every(r=>r.parent===star));
  }
 }
});

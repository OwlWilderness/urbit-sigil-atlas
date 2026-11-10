'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const ob=require('urbit-ob');
const glyphs=require('../data/glyphs.json');
async function fixture(t){
 const dir=await fs.mkdtemp(path.join(os.homedir(),'.hermes/cache/scratch/atlas-boolean-'));
 const dataDir=path.join(dir,'records'),server=require('../index.cjs').createServer({dataDir});
 t.after(async()=>{if(server.listening)await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {dataDir,async get(query=''){const r=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/candidates?${query}`);return {status:r.status,body:await r.json()}}};
}
test('inclusive OR skips omitted boxes and counts overlap once',async t=>{
 const f=await fixture(t),r=await f.get('p0=rad&p2=bot&join2=or&limit=3');
 assert.equal(r.status,200,'valid OR between active slots must reach candidate search');
 // Two Cartesian slabs minus their shared slab. rad is not the excluded doz prefix.
 const expected=256**3+(256**3-256)-256**2;
 assert.equal(r.body.total,expected);
 assert.equal(new Set(r.body.items.map(row=>row.name)).size,3);
 assert.ok(r.body.items.every(row=>row.syllables[0]==='rad'||row.syllables[2]==='bot'));
});

// Independent inclusion/exclusion oracle over Cartesian rectangles, not the
// production truth-mask suffix DP. Explicit groups are test inputs, not parsed
// by the production connector algorithm. Restricted domains give lexical ranks.
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
test('global mixed precedence, family intersections and high/final lexical ranks match independent union oracle',async t=>{
 const f=await fixture(t);
 const conflict=glyphs.find(g=>g.kind==='prefix'&&g.shape!==shapeOf('bot',0)).shape;
 const cases=[
  ['p0=rad&p2=bot&join2=or',[[0],[2]]],
  ['p0=rad&p1=ret&p2=bot&p3=myr&join2=or',[[0,1],[2,3]]],
  ['p0=rad&p1=ret&p2=bot&join1=or',[[0],[1,2]]],
  ['shape0=circle&shape1=square&shape2=circle&shape3=leaf-up&join1=or&join3=or',[[0],[1,2],[3]]],
  ['p0=bot&shape0='+shapeOf('bot',0)+'&shape2=circle&join2=or',[[0],[2]]],
  ['p0=bot&shape0='+conflict+'&p2=rad&join2=or',[[0],[2]]],
  ['p0=doz&p1=zod&p2=rad&p3=ret&join2=or',[[0,1],[2,3]]],
  ['p1=zod&p3=ret&join3=or',[[1],[3]]],
 ];
 // Every AND/OR sequence over four active exact slots, including all-AND.
 for(let bits=0;bits<8;bits++){
  let query='p0=rad&p1=ret&p2=bot&p3=myr';const groups=[[0]];
  for(let i=1;i<4;i++){const or=Boolean(bits&(1<<(i-1)));query+='&join'+i+'='+(or?'or':'and');if(or)groups.push([]);groups.at(-1).push(i)}
  cases.push([query,groups]);
 }
 for(const [query,groups] of cases){
  const total=oracle(query,groups);
  for(const offset of [...new Set([0,Math.floor(total/2),Math.max(0,total-3),total])]){
   const r=await f.get(query+'&offset='+offset+'&limit=5');assert.equal(r.status,200,query);assert.equal(r.body.star,null);
   checkPage(r.body,query,groups,offset,5,total);
  }
 }
 const query='p0=rad&p2=bot&join2=or',groups=[[0],[2]],tuple=['rad','ret','bot','myr'];
 const offset=rankOf(tuple,query,groups),r=await f.get(query+'&offset='+offset+'&limit=3');
 assert.deepEqual(r.body.items[0].syllables,tuple);checkPage(r.body,query,groups,offset,3,oracle(query,groups));
 const a=await f.get(query+'&offset=30&limit=10'),b=await f.get(query+'&offset=35&limit=10');
 assert.deepEqual(a.body.items.slice(5),b.body.items.slice(0,5));
 assert.deepEqual((await f.get(query+'&offset=9007199254740991')).body.items,[]);
});
test('no predicates, one predicate, defaults and false local intersections retain precise semantics',async t=>{
 const f=await fixture(t);
 for(const [query,groups] of [['',[[]]],['p2=rad',[[2]]],['shape3=circle',[[3]]],['p0=rad&p2=bot',[[0,2]]],['p0=rad&p2=bot&join2=and',[[0,2]]],['p0=doz&p1=zod',[[0,1]]]]){
  const r=await f.get(query+'&limit=2');assert.equal(r.status,200);const total=oracle(query,groups);
  checkPage(r.body,query,groups,0,2,total);
  if(!query)assert.equal(r.body.total,4294901760);
 }
 const conflict=glyphs.find(g=>g.kind==='prefix'&&g.shape!==shapeOf('bot',0)).shape;
 const r=await f.get('p0=bot&shape0='+conflict);assert.equal(r.status,200);assert.equal(r.body.total,0);assert.deepEqual(r.body.items,[]);
 await assert.rejects(fs.stat(f.dataDir),{code:'ENOENT'});
});
test('selected spawning star constrains every OR branch and keeps independent numeric-ID order',async t=>{
 const f=await fixture(t),star='~pacfyl',base=Number(ob.patp2dec(star));
 const rows=[];
 for(let n=1;n<65536;n++){
  const id=String(base+n*65536),name=ob.patp(id),syllables=name.slice(1).replace('-','').match(/.{3}/g);
  rows.push({name,id,syllables,parent:ob.sein(name)});
 }
 const cases=[
  ['p0=bot&p2=rad&join2=or',s=>s[0]==='bot'||s[2]==='rad'],
  ['p0=bot&p1=myr&shape2='+shapeOf('rad',2)+'&p3=ret&join2=or',s=>(s[0]==='bot'&&s[1]==='myr')||(shapeOf(s[2],2)===shapeOf('rad',2)&&s[3]==='ret')],
 ];
 for(const [query,predicate] of cases){
  const expected=rows.filter(r=>predicate(r.syllables));
  assert.ok(expected.some(r=>r.syllables[0]!=='bot'),'right branch is independently live');
  for(const offset of [0,Math.max(0,expected.length-3),expected.length]){
   const r=await f.get(query+'&star='+star+'&offset='+offset+'&limit=100');
   assert.equal(r.status,200);assert.equal(r.body.star,star);assert.equal(r.body.total,expected.length);
   assert.deepEqual(r.body.items,expected.slice(offset,offset+100));assert.ok(r.body.items.every(r=>r.parent===star));
  }
 }
});
test('operators require a predicate-bearing destination and an earlier active slot, with exact spelling',async t=>{
 const f=await fixture(t);
 for(const query of ['join1=and','join2=or','join3=or','p2=bot&join2=and','p0=rad&join2=or','p0=rad&p2=bot&join1=or','p0=rad&p2=bot&join3=and','p0=rad&join0=and','p0=rad&p2=bot&join4=or',...['','OR','AND','xor','%20or','or%20','null','1'].map(v=>'p0=rad&p2=bot&join2='+v),'p0=rad&p2=bot&join2=or&join2=or','p0=rad&p2=bot&join2=and&join2=or']){
  const r=await f.get(query);assert.equal(r.status,400,query);assert.equal(r.body.error.code,'INVALID_INPUT',query);
 }
});

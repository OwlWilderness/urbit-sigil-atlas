'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
async function fixture(t){
 const server=require('../index.cjs').createServer();
 t.after(async()=>{if(server.listening)await new Promise(r=>server.close(r))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return async query=>{const r=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/candidates?${query}`);return {status:r.status,body:await r.json()}};
}
test('either-half tracer: distinct exact pairs AND matches original and swapped only',async t=>{
 const get=await fixture(t);
 const r=await get('grouping=rows&pairPlacement=either&p0=rad&p1=dev&p2=bot&p3=myr');
 assert.equal(r.status,200,'valid either-half query must reach candidate matching');
 assert.equal(r.body.total,2);
 assert.deepEqual(r.body.items.map(r=>r.name),['~botmyr-raddev','~raddev-botmyr']);
 assert.equal(r.body.availabilityChecked,false);
});

const ob=require('urbit-ob');
const glyphs=require('../data/glyphs.json');
const domains=['prefix','suffix','prefix','suffix'].map(kind=>glyphs.filter(g=>g.kind===kind).map(g=>g.syllable).sort());
const shapes=new Map(glyphs.map(g=>[g.kind+':'+g.syllable,g.shape]));
const shapeOf=(s,i)=>shapes.get((i%2?'suffix:':'prefix:')+s);
const moving='grouping=rows&pairPlacement=either&';
// Independent semantic oracle: direct Boolean evaluation of complete two-cell
// patterns, no production DNF/truth-bit helpers, counting DP or API-generated rows.
function semantics(q){
 const p=new URLSearchParams(q),present=[0,1].filter(row=>[2*row,2*row+1].some(i=>p.has('p'+i)||p.has('shape'+i)));
 function half(pair,row){
  const leaves=[2*row,2*row+1].filter(i=>p.has('p'+i)||p.has('shape'+i));
  const values=leaves.map(i=>(!p.has('p'+i)||p.get('p'+i)===pair[i%2])&&(!p.has('shape'+i)||p.get('shape'+i)===shapeOf(pair[i%2],i)));
  return p.get(row?'join3':'join1')==='or'?values.some(Boolean):values.every(Boolean);
 }
 function combine(top,bottom){
  const values=present.map(row=>half(top,row)||half(bottom,row));
  return !values.length|| (p.get('join2')==='or'?values.some(Boolean):values.every(Boolean));
 }
 return {present,half,combine,p};
}
// Finite pair histogram: enumerate ONLY 65,536 possible two-syllable halves,
// independently classify each pattern, and multiply 2x2 Boolean categories.
// Global four-slot names are never enumerated by this oracle or the server.
function globalTotal(q,range=domains){
 const s=semantics(q);
 const hist=(a,b,top)=>{
  const counts=[[0,0],[0,0]];
  for(const x of a)for(const y of b){
   if(top&&x==='doz'&&y==='zod')continue;
   const pair=[x,y];counts[Number(s.half(pair,0))][Number(s.half(pair,1))]++;
  }
  return counts;
 };
 const top=hist(range[0],range[1],true),bottom=hist(range[2],range[3],false);
 let total=0;
 for(let a=0;a<2;a++)for(let b=0;b<2;b++)for(let c=0;c<2;c++)for(let d=0;d<2;d++){
  const matches=s.present.map(row=>row?(b||d):(a||c));
  if(!matches.length||(s.p.get('join2')==='or'?matches.some(Boolean):matches.every(Boolean)))total+=top[a][b]*bottom[c][d];
 }
 return total;
}
function rank(tuple,q){
 let n=0;
 for(let i=0;i<4;i++)n+=globalTotal(q,domains.map((values,j)=>j<i?[tuple[j]]:j===i?values.filter(s=>s<tuple[i]):values));
 return n;
}
function check(body,q,offset,limit,total){
 assert.equal(body.total,total,q);assert.equal(body.offset,offset);assert.equal(body.limit,limit);assert.equal(body.availabilityChecked,false);
 assert.equal(body.items.length,Math.max(0,Math.min(limit,total-offset)));assert.equal(new Set(body.items.map(r=>r.name)).size,body.items.length);
 body.items.forEach((r,i)=>{
  assert.ok(semantics(q).combine(r.syllables.slice(0,2),r.syllables.slice(2)),r.name);
  assert.equal(rank(r.syllables,q),offset+i,r.name);assert.equal(ob.patp(r.id),r.name);assert.equal(ob.patp2dec(r.name),r.id);
  assert.equal(ob.clan(r.name),'planet');assert.equal(ob.sein(r.name),r.parent);
 });
}
test('either-half global independent pair oracle: eight operators, high/final/overlap pages and shape intersections',async t=>{
 const get=await fixture(t),cases=[];
 for(let bits=0;bits<8;bits++)cases.push('p0=rad&p1=dev&p2=bot&p3=myr'+[1,2,3].map(n=>'&join'+n+'='+(bits&(1<<(n-1))?'or':'and')).join(''));
 cases.push('p0=rad&p1=dev','p2=rad&p3=dev','p0=rad&p1=dev&p2=rad&p3=dev','p0=rad&p1=dev&p2=rad','p0=doz&p1=zod','p0=doz&p1=zod&p2=rad&p3=dev','p0=doz&p1=dev','p3=dev','',
 'shape0=circle&shape1=square&shape2=leaf-up&shape3=circle&join1=or&join3=or',
 'p0=rad&shape0='+shapeOf('rad',0)+'&shape1=circle&join1=or',
 'p0=rad&shape0='+glyphs.find(g=>g.kind==='prefix'&&g.shape!==shapeOf('rad',0)).shape+'&p2=bot&join2=or');
 for(const q of cases){
  const total=globalTotal(q);
  for(const offset of [...new Set([0,Math.floor(total/2),Math.max(0,total-2),total])]){
   const r=await get(moving+q+'&offset='+offset+'&limit=2');assert.equal(r.status,200,q);check(r.body,q,offset,2,total);
  }
 }
 const q='p0=rad&p1=dev&join1=or',a=await get(moving+q+'&limit=3'),b=await get(moving+q+'&offset=1&limit=3');
 assert.deepEqual(a.body.items.slice(1),b.body.items.slice(0,2));
 assert.deepEqual((await get(moving+q+'&offset=9007199254740991')).body.items,[]);
 const pair=await get(moving+'p0=rad&p1=dev');
 for(const q of ['p2=rad&p3=dev','p0=rad&p1=dev&p2=rad&p3=dev','p0=rad&p1=dev&p2=rad'])assert.deepEqual((await get(moving+q)).body,pair.body,'single/repeated/overlapping pattern may share the same half');
 assert.equal((await get(moving+'p0=doz&p1=zod')).body.total,65535,'zero pair can occur only in bottom half');
 assert.equal((await get(moving+'p0=doz&p1=zod&p2=rad&p3=dev')).body.total,1);
});
test('either-half keeps AND leaves in one half while permitting internal OR and overlapping patterns',async t=>{
 const get=await fixture(t),tuple=['rad','myr','bot','dev'];
 const excluded='p0=rad&p1=dev&p2=bot&p3=myr&join3=or';
 // Both AND leaves occur in the name but in different halves. No other
 // pattern can repair the absent complete first pattern.
 assert.equal(semantics(excluded).combine(tuple.slice(0,2),tuple.slice(2)),false);
 const next=await get(moving+excluded+'&offset='+rank(tuple,excluded)+'&limit=1');
 assert.ok(!next.body.items.some(r=>r.name==='~radmyr-botdev'));
 const included=excluded+'&join1=or';
 assert.equal(semantics(included).combine(tuple.slice(0,2),tuple.slice(2)),true);
 assert.deepEqual((await get(moving+included+'&offset='+rank(tuple,included)+'&limit=1')).body.items[0].syllables,tuple);
});
test('fixed default compatibility and strict pairPlacement validation preserve legacy and row contracts',async t=>{
 const get=await fixture(t);
 for(const q of ['','p0=rad','p0=rad&p1=dev&p2=bot&p3=myr','shape0=circle&shape2=square&join2=or']){
  assert.deepEqual((await get('grouping=rows&'+q)).body,(await get('grouping=rows&pairPlacement=fixed&'+q)).body);
 }
 const bad=['pairPlacement=either','pairPlacement=fixed','pairPlacement=','grouping=&pairPlacement=either','grouping=legacy&pairPlacement=either'];
 for(const value of ['','EITHER','Fixed','both','either%20','%20either','null'])bad.push('grouping=rows&pairPlacement='+value);
 bad.push('grouping=rows&pairPlacement=either&pairPlacement=either','grouping=rows&pairPlacement=fixed&pairPlacement=either');
 for(const q of ['join2=or','p0=rad&join2=and','p2=bot&join3=or','p1=rad','p2=dev','p0=','shape1=unknown','p0=rad&p1=dev&join1=and-either','p0=rad&p2=bot&join2=or-either','p0=rad&p2=bot&join2=OR'])bad.push(moving+q);
 for(const q of bad){const r=await get(q);assert.equal(r.status,400,q);assert.equal(r.body.error.code,'INVALID_INPUT')}
});
test('finite independent star oracle: all sixteen shape masks and eight join triplets, exact pairs, star fence and pages',async t=>{
 const get=await fixture(t),star='~pacfyl',base=Number(ob.patp2dec(star)),rows=[];
 for(let n=1;n<65536;n++){
  const id=String(base+n*65536),name=ob.patp(id);rows.push({name,id,syllables:name.slice(1).replace('-','').match(/.{3}/g),parent:ob.sein(name)});
 }
 const cases=['p0=bot&p1=myr&p2=rad&p3=ret','p0=rad&p1=ret','p2=rad&p3=ret','p0=rad&p1=ret&p2=rad','p0=rad&p1=ret&p2=bot&p3=myr&join3=or','p0=doz&p1=zod'];
 const shapeQuery=mask=>[0,1,2,3].filter(i=>mask&(1<<i)).map(i=>'shape'+i+'='+['circle','square','leaf-up','circle'][i]).join('&');
 for(let mask=0;mask<16;mask++)cases.push(shapeQuery(mask));
 for(let bits=0;bits<8;bits++)cases.push(shapeQuery(15)+[1,2,3].map(n=>'&join'+n+'='+(bits&(1<<(n-1))?'or':'and')).join(''));
 for(const [caseIndex,q] of cases.entries()){
  const s=semantics(q),expected=rows.filter(r=>s.combine(r.syllables.slice(0,2),r.syllables.slice(2)));
  const offsets=caseIndex<6?[0,Math.floor(expected.length/2),Math.max(0,expected.length-2),expected.length]:[0];
  for(const offset of [...new Set(offsets)]){
   const r=await get(moving+q+'&star='+star+'&offset='+offset+'&limit=100');assert.equal(r.status,200,q);
   assert.equal(r.body.star,star);assert.equal(r.body.total,expected.length,q);assert.equal(r.body.availabilityChecked,false);
   assert.deepEqual(r.body.items,expected.slice(offset,offset+100));assert.ok(r.body.items.every(r=>r.parent===star));
  }
 }
});

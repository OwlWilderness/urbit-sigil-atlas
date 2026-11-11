'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const ob=require('urbit-ob');
async function fixture(t){
 const dir=await fs.mkdtemp(path.join(os.homedir(),'.hermes/cache/scratch/atlas-candidates-'));
 const dataDir=path.join(dir,'records');
 const server=require('../index.cjs').createServer({dataDir});
 t.after(async()=>{if(server.listening)await new Promise(r=>server.close(r));await fs.rm(dir,{recursive:true,force:true})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 return {dataDir,async get(query=''){const response=await fetch(`http://127.0.0.1:${server.address().port}/api/v1/candidates${query?'?'+query:''}`);return {status:response.status,body:await response.json()}}};
}
const glyphs=require('../data/glyphs.json');
const shapeOf=(s,i)=>glyphs.find(g=>g.kind===(i%2?'suffix':'prefix')&&g.syllable===s).shape;
test('shape families and exact syllables combine with AND globally and in two star catalogs',async t=>{
 const f=await fixture(t),syllables=['bot','myr','rad','ret'];
 const exact=new URLSearchParams(syllables.map((s,i)=>['p'+i,s])).toString();
 for(const [extra,total] of [['',1],['&star=~pacfyl',1],['&star=~sampel',0]]){const r=await f.get(exact+extra);assert.equal(r.status,200);assert.equal(r.body.total,total);if(total){assert.equal(r.body.items[0].name,'~botmyr-radret');validRows(r.body.items)}}
 const sets=['prefix','suffix','prefix','suffix'].map(kind=>glyphs.filter(g=>g.kind===kind));
 const combinations=[...new Set(glyphs.map(g=>g.shape))].map(shape=>[shape,shape,shape,shape]);
 combinations.push(syllables.map(shapeOf));
 for(const shapes of combinations){
  const slots=sets.map((gs,i)=>gs.filter(g=>g.shape===shapes[i]).map(g=>g.syllable).sort());
  let pairs=slots[0].length*slots[1].length;if(slots[0].includes('doz')&&slots[1].includes('zod'))pairs--;
  const expected=pairs*slots[2].length*slots[3].length;
  const query=new URLSearchParams(shapes.map((s,i)=>['shape'+i,s])).toString();
  const result=await f.get(query+'&limit=3');assert.equal(result.status,200);assert.equal(result.body.total,expected);validRows(result.body.items);
  for(const row of result.body.items)assert.deepEqual(row.syllables.map(shapeOf),shapes);
  const tail=await f.get(query+`&offset=${Math.max(0,expected-2)}&limit=3`);assert.equal(tail.body.items.length,Math.min(expected,2));validRows(tail.body.items);
 }
 const shapes=syllables.map(shapeOf),query=new URLSearchParams(shapes.map((s,i)=>['shape'+i,s])).toString();
 const global=await f.get(query+'&limit=100');assert.ok(global.body.total>1);
 for(const star of ['~pacfyl','~sampel']){
  const expected=[];const base=Number(ob.patp2dec(star));
  for(let n=1;n<65536;n++){const name=ob.patp(String(base+n*65536)),ss=name.slice(1).replace('-','').match(/.{3}/g);if(ss.every((s,i)=>shapeOf(s,i)===shapes[i]))expected.push(name)}
  const r=await f.get(query+'&star='+star+'&limit=100');assert.equal(r.status,200);assert.equal(r.body.total,expected.length);assert.deepEqual(r.body.items.map(p=>p.name),expected.slice(0,100));assert.equal(r.body.star,star);validRows(r.body.items);assert.ok(r.body.items.every(p=>p.parent===star&&p.syllables.every((s,i)=>shapeOf(s,i)===shapes[i])));
  // Exact and shape constraints are ANDed, never overridden.
  const one=await f.get(query+'&'+exact+'&star='+star);assert.equal(one.body.total,star==='~pacfyl'?1:0);
 }
 assert.equal((await f.get(exact+'&shape0='+shapeOf('doz',0))).body.total,0);
 assert.equal((await f.get('p0=doz&p1=zod')).body.total,0);
 assert.equal((await f.get('p0=doz&p1=zod&p2=rad&p3=ret')).body.total,0);
 // Real decode/encode boundary evidence for the high-word exclusion in co.js/ob.js.
 for(const tail of ['dozzod','doznec','fipfes','radret']){const padded='~dozzod-'+tail;assert.notEqual(ob.patp(ob.patp2dec(padded)),padded);assert.notEqual(ob.clan(padded),'planet')}
 for(const name of ['~doznec-dozzod','~doznec-fipfes','~fipfes-fipfes']){assert.equal(ob.patp(ob.patp2dec(name)),name);assert.equal(ob.clan(name),'planet')}
 console.log('GLOBAL_PLANET_COUNT='+String(2**32-2**16));
});
test('candidate input refuses blanks, noncanonical identifiers, duplicate and unknown parameters',async t=>{
 const f=await fixture(t);
 for(const q of ['star=','star=pacfyl','star=~PACFYL','star=~zod','star=~dozzod','p0=','p0=myr','p1=bot','p2=RAD','p3=%20ret','shape0=','shape1=CIRCLE','shape2=bogus','shape3=circle&shape3=square','p0=bot&p0=bot','star=~pacfyl&star=~pacfyl','unknown=1','offset=','offset=-1','offset=01','offset=1.1','offset=9007199254740992','limit=','limit=0','limit=101','limit=01']){const r=await f.get(q);assert.equal(r.status,400,q);assert.equal(r.body.error.code,'INVALID_INPUT',q)}
});
test('specific glyph metadata and SVG preserve exact trusted asset bytes and reject aliases',async t=>{
 const f=await fixture(t),basePath='/api/v1/glyphs';
 // The fixture's server uses the verified project static root; no user data is read.
 const server=require('../index.cjs').createServer({dataDir:f.dataDir});
 t.after(async()=>{if(server.listening)await new Promise(r=>server.close(r))});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const [kind,syllable] of [['prefix','rad'],['suffix','ret']]){
  const r=await fetch(base+`${basePath}/${kind}/${syllable}`);assert.equal(r.status,200);const value=await r.json();
  const glyph=glyphs.find(g=>g.kind===kind&&g.syllable===syllable);
  assert.deepEqual({kind:value.kind,syllable:value.syllable,shape:value.shape},glyph);
  for(const [key,detail] of [['full','default'],['silhouette','none']]){
   const asset=`/assets/glyphs/${kind}-${syllable}-${detail}.svg`,original=await fs.readFile(path.join(__dirname,'../../site',asset));
   assert.equal(value.assets[key],asset);assert.equal(value.svg[key],original.toString('utf8'));
   const response=await fetch(base+`${basePath}/${kind}/${syllable}/svg?detail=${detail}`);assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^image\/svg\+xml/);assert.equal(response.headers.get('x-content-type-options'),'nosniff');
   const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual(bytes,original);
   const hash=b=>require('node:crypto').createHash('sha256').update(b).digest('hex');assert.equal(hash(bytes),hash(original));
   if(detail==='default')assert.deepEqual(Buffer.from(await (await fetch(base+`${basePath}/${kind}/${syllable}/svg`)).arrayBuffer()),original);
  }
 }
 for(const [route,status] of [['PREFIX/rad',400],['prefix/ret',404],['suffix/rad',404],['prefix/RAD',404],['prefix/%72ad',400],['prefix/rad?detail=none',400],['prefix/rad/svg?detail=',400],['prefix/rad/svg?detail=default&detail=none',400],['prefix/rad/svg?unknown=1',400],['prefix/rad/svg?detail=../../index.cjs',400],['prefix/..%2findex.cjs/svg',400],['prefix/%00/svg',400]]){const r=await fetch(base+basePath+'/'+route);assert.equal(r.status,status,route);assert.equal(typeof(await r.json()).error.code,'string')}
});
function validRows(rows){for(const row of rows){assert.equal(ob.isValidPatp(row.name),true);assert.equal(ob.patp2dec(row.name),row.id);assert.equal(ob.patp(row.id),row.name);assert.equal(ob.clan(row.name),'planet');assert.equal(ob.sein(row.name),row.parent);assert.deepEqual(row.syllables,row.name.slice(1).replace('-','').match(/.{3}/g))}}
test('global namespace is counted without catalog allocation, with stable direct pagination',async t=>{
 const f=await fixture(t),r=await f.get();assert.equal(r.status,200);
 assert.equal(r.body.star,null);assert.equal(r.body.total,2**32-2**16);assert.equal(r.body.offset,0);assert.equal(r.body.limit,50);assert.equal(r.body.items.length,50);assert.equal(r.body.availabilityChecked,false);validRows(r.body.items);
 const second=await f.get('offset=50&limit=50');assert.equal(second.status,200);validRows(second.body.items);assert.equal(new Set([...r.body.items,...second.body.items].map(p=>p.name)).size,100);
 const overlap=await f.get('offset=45&limit=10');assert.deepEqual(overlap.body.items,[...r.body.items.slice(45),...second.body.items.slice(0,5)]);
 const last=await f.get(`offset=${r.body.total-2}&limit=100`);assert.equal(last.body.items.length,2);validRows(last.body.items);
 assert.deepEqual((await f.get(`offset=${r.body.total}&limit=1`)).body.items,[]);
 assert.deepEqual((await f.get('offset=9007199254740991&limit=1')).body.items,[]);
 await assert.rejects(fs.stat(f.dataDir),{code:'ENOENT'});
});

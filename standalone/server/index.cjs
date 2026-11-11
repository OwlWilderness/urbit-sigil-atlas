'use strict';
const http=require('node:http');
const path=require('node:path');
const fs=require('node:fs');
const glyphs=require('./data/glyphs.json');
const shapeIds=[...new Set(glyphs.map(g=>g.shape))];
function fail(status,message,code='INVALID_INPUT'){const e=new Error(message);e.status=status;e.code=code;throw e;}
function json(res,status,value){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(JSON.stringify(value));}
const ob=require('urbit-ob');
const tables={prefix:new Set(glyphs.filter(g=>g.kind==='prefix').map(g=>g.syllable)),suffix:new Set(glyphs.filter(g=>g.kind==='suffix').map(g=>g.syllable))};
function validStar(star){
 if(typeof star!=='string'||!/^~[a-z]{6}$/.test(star)||!ob.isValidPatp(star)||ob.patp(ob.patp2dec(star))!==star||ob.clan(star)!=='star')fail(400,'star must be an exact canonical star');return star;
}
async function body(req){let chunks=[],size=0;for await(const c of req){size+=c.length;if(size>8192)fail(413,'JSON body exceeds 8192 bytes','BODY_TOO_LARGE');chunks.push(c)}try{return JSON.parse(Buffer.concat(chunks).toString('utf8'))}catch{fail(400,'Malformed JSON')}}
function compose(input,save=false){
 if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'Expected an object');
 const allowed=save?['syllables','mode','star','label']:['syllables','mode','star'];
 if(Object.keys(input).some(k=>!allowed.includes(k)))fail(400,'Unknown composition field');
 const {syllables,mode}=input;
 if(!Array.isArray(syllables)||syllables.length!==4||syllables.some((s,i)=>!tables[i%2?'suffix':'prefix'].has(s)))fail(400,'Four exact prefix/suffix/prefix/suffix syllables required');
 if(!['free','star'].includes(mode))fail(400,'mode must be free or star');
 if(mode==='free'&&input.star!==undefined&&input.star!==null)fail(400,'Free mode must not specify a star');
 const star=mode==='star'?validStar(input.star):null;
 if(save&&input.label!==undefined&&(typeof input.label!=='string'||input.label.length>120||/[\x00-\x1f\x7f]/.test(input.label)))fail(400,'label must be at most 120 printable characters');
 const name=`~${syllables[0]}${syllables[1]}-${syllables[2]}${syllables[3]}`;
 let canonical=false,id=null,kind=null,parent=null;
 if(ob.isValidPatp(name)){const decoded=ob.patp2dec(name);canonical=ob.patp(decoded)===name;if(canonical){id=decoded;kind=ob.clan(name);parent=ob.sein(name)}}
 return {name,id,kind,canonical,parent,mode,star,eligible:mode==='free'||(canonical&&kind==='planet'&&parent===star),syllables};
}
function onlyParams(params,allowed){for(const key of params.keys())if(!allowed.includes(key)||params.getAll(key).length!==1)fail(400,'Unknown or duplicate query parameter');}
function integer(value,fallback,min,max){if(value===null)return fallback;if(!/^(0|[1-9][0-9]*)$/.test(value)||!Number.isSafeInteger(Number(value))||Number(value)<min||Number(value)>max)fail(400,'Invalid integer filter');return Number(value)}
function planetFilters(p){
 onlyParams(p,['star','syllables','endings','minMatches','offset','limit','p0','p1','p2','p3']);
 const star=validStar(p.get('star'));
 const list=(key,valid)=>{if(!p.has(key))return [];const a=p.get(key).split(',');if(a.length>16||new Set(a).size!==a.length||a.some(s=>!valid(s)))fail(400,'Invalid '+key);return a};
 const syllables=list('syllables',s=>tables.prefix.has(s)||tables.suffix.has(s));
 const endingSet=new Set(glyphs.map(g=>g.syllable.slice(1)));
 const endings=list('endings',s=>/^[a-z]{2}$/.test(s)&&endingSet.has(s));
 const minMatches=integer(p.get('minMatches'),endings.length,1,endings.length);
 if(p.has('minMatches')&&!endings.length)fail(400,'minMatches requires endings');
 const positions=Array.from({length:4},(_,i)=>{const s=p.get('p'+i);if(s!==null&&!tables[i%2?'suffix':'prefix'].has(s))fail(400,'Invalid position syllable');return s});
 return {star,syllables,endings,minMatches,positions,offset:integer(p.get('offset'),0,0,Number.MAX_SAFE_INTEGER),limit:integer(p.get('limit'),50,1,100)};
}
function catalog(star){
 const base=Number(ob.patp2dec(star)),rows=[];
 for(let n=1;n<65536;n++){
  const id=String(base+65536*n),name=ob.patp(id),parent=ob.sein(name);
  if(parent!==star||ob.clan(name)!=='planet'||ob.patp2dec(name)!==id||ob.patp(ob.patp2dec(name))!==name)throw Error('Invalid generated planet');
  rows.push({name,id,syllables:name.slice(1).replace('-','').match(/.{3}/g),parent});
 }
 return rows;
}
// Global order is lexical by the four syllable slots, not by decoded point ID.
const positionalGlyphs=['prefix','suffix','prefix','suffix'].map(kind=>glyphs.filter(g=>g.kind===kind).sort((a,b)=>a.syllable<b.syllable?-1:a.syllable>b.syllable?1:0));
for(const entries of positionalGlyphs)if(entries.length!==256||new Set(entries.map(g=>g.syllable)).size!==256)throw Error('Invalid positional glyph table');
function candidateRow(syllables){
 const name=`~${syllables[0]}${syllables[1]}-${syllables[2]}${syllables[3]}`,id=ob.patp2dec(name),parent=ob.sein(name);
 if(!ob.isValidPatp(name)||ob.patp(id)!==name||ob.clan(name)!=='planet'||ob.sein(ob.patp(id))!==parent)throw Error('Invalid generated candidate');
 return {name,id,syllables,parent};
}
function candidateFilters(p){
 onlyParams(p,['star','offset','limit','p0','p1','p2','p3','shape0','shape1','shape2','shape3','join1','join2','join3','grouping','pairPlacement']);
 if(p.has('grouping')&&p.get('grouping')!=='rows')fail(400,'Invalid grouping');
 if(p.has('pairPlacement')&&(p.get('grouping')!=='rows'||!['fixed','either'].includes(p.get('pairPlacement'))))fail(400,'Invalid pair placement');
 const either=p.get('pairPlacement')==='either';
 const star=p.has('star')?validStar(p.get('star')):null;
 const active=Array.from({length:4},(_,i)=>p.has('p'+i)||p.has('shape'+i));
 let groups=[];
 if(p.get('grouping')==='rows'){
  const top=active[0]||active[1],bottom=active[2]||active[3];
  const applicable=[active[0]&&active[1],top&&bottom,active[2]&&active[3]];
  for(let n=1;n<=3;n++){
   const join=p.get('join'+n);
   if(join!==null&&(!['and','or'].includes(join)||!applicable[n-1]))fail(400,'Invalid or dangling row operator');
  }
  // A moving pattern has separate occurrence bits in each physical half.
  // Compile each internal join BEFORE allowing either placement: AND leaves
  // must never split across halves. Source-leaf bits preserve local filters.
  const row=(a,b,join)=>{
   const placed=shift=>{
    const bits=[a,b].filter(i=>active[i]).map(i=>1<<(i+shift));
    return bits.length===2&&join!=='or'?[bits[0]|bits[1]]:bits;
   };
   return either?[...placed(0),...placed(4)]:placed(0);
  };
  const a=row(0,1,p.get('join1')),b=row(2,3,p.get('join3'));
  groups=!top&&!bottom?[0]:!top?b:!bottom?a:p.get('join2')==='or'?[...a,...b]:a.flatMap(x=>b.map(y=>x|y));
 }else{
  // Legacy: a connector belongs to its destination; AND precedes OR.
  let group=0,hasPrevious=false;
  for(let i=0;i<4;i++){
   const join=p.get('join'+i);
   if(join!==null&&(!['and','or'].includes(join)||!active[i]||!hasPrevious))fail(400,'Invalid or dangling positional operator');
   if(!active[i])continue;
   if(join==='or'){groups.push(group);group=0}
   group|=1<<i;hasPrevious=true;
  }
  groups.push(group); // The empty expression is unconstrained, not false.
 }
 const slots=positionalGlyphs.map((entries,i)=>{
  const syllable=p.get('p'+i),shape=p.get('shape'+i);
  if(syllable!==null&&!tables[i%2?'suffix':'prefix'].has(syllable))fail(400,'Invalid position syllable');
  if(shape!==null&&!shapeIds.includes(shape))fail(400,'Unknown shape');
  return entries.filter(g=>(syllable===null||g.syllable===syllable)&&(shape===null||g.shape===shape)).map(g=>g.syllable);
 });
 return {star,slots,active,either,groups:[...new Set(groups)],offset:integer(p.get('offset'),0,0,Number.MAX_SAFE_INTEGER),limit:integer(p.get('limit'),50,1,100)};
}
function satisfiesGroups(groups,truth){return groups.some(group=>(truth&group)===group)}
// Shared by global counting/unranking and selected-star filtering. Each source
// predicate keeps its prefix/suffix kind, even when its pattern changes half.
function predicateChoices(f){
 const allowed=f.slots.map(slot=>new Set(slot));
 return positionalGlyphs.map((entries,pos)=>entries.map(g=>{
  let bit=0;
  for(let source=0;source<4;source++){
   if(f.active[source]&&(f.either?source%2===pos%2:source===pos)&&allowed[source].has(g.syllable))bit|=1<<(source+(f.either&&pos>=2?4:0));
  }
  return {syllable:g.syllable,bit};
 }));
}
function booleanCandidates(f){
 // The Cartesian shortcut requires positional predicates, not moving patterns.
 if(!f.either&&f.groups.length===1)return globalCandidates(f.slots,f.offset,f.limit);
 const choices=predicateChoices(f);
 // At most 4 positions x 256 occurrence masks x 2 leading-word states. Each
 // suffix count ranges over 256 symbols, never over identities/rectangles.
 const memo=new Map();
 function countSuffix(pos,truth,leadingDoz){
  if(pos===4)return satisfiesGroups(f.groups,truth)?1:0;
  const key=`${pos}:${truth}:${Number(leadingDoz)}`;
  if(memo.has(key))return memo.get(key);
  let count=0;
  for(const c of choices[pos]){
   if(pos===1&&leadingDoz&&c.syllable==='zod')continue;
   count+=countSuffix(pos+1,truth|c.bit,pos===0&&c.syllable==='doz');
  }
  memo.set(key,count);return count;
 }
 const total=countSuffix(0,0,false),items=[];
 for(let rank=f.offset;rank<total&&items.length<f.limit;rank++){
  let remaining=rank,truth=0,leadingDoz=false;const syllables=[];
  for(let pos=0;pos<4;pos++){
   for(const c of choices[pos]){
    if(pos===1&&leadingDoz&&c.syllable==='zod')continue;
    const nextLeading=pos===0&&c.syllable==='doz',nextTruth=truth|c.bit;
    const count=countSuffix(pos+1,nextTruth,nextLeading);
    if(remaining>=count){remaining-=count;continue}
    syllables.push(c.syllable);truth=nextTruth;leadingDoz=nextLeading;break;
   }
  }
  items.push(candidateRow(syllables));
 }
 return {total,items};
}
function globalCandidates(slots,offset,limit){
 // co.js packs syllables into two 16-bit words. ob.js permutes only the
 // [2^16,2^32) range; zero high word is a padded short name, never a planet.
 // At most 65,535 leading pairs are retained, never the planet namespace.
 const pairs=[];
 for(const a of slots[0])for(const b of slots[1])if(a!=='doz'||b!=='zod')pairs.push([a,b]);
 const stride=slots[2].length*slots[3].length,total=pairs.length*stride,items=[];
 for(let rank=offset;rank<total&&items.length<limit;rank++){
  const pair=pairs[Math.floor(rank/stride)],tail=rank%stride;
  items.push(candidateRow([...pair,slots[2][Math.floor(tail/slots[3].length)],slots[3][tail%slots[3].length]]));
 }
 return {total,items};
}
const {randomUUID}=require('node:crypto');
function privateDir(dir,create){
 const absolute=path.resolve(dir);let current=path.parse(absolute).root;
 for(const part of absolute.slice(current.length).split(path.sep).filter(Boolean)){
 current=path.join(current,part);try{const s=fs.lstatSync(current);if(s.isSymbolicLink()||!s.isDirectory())throw Error('Unsafe data directory')}catch(e){if(e.code!=='ENOENT')throw e;if(!create)return false;fs.mkdirSync(current,{mode:0o700})}
 }
 if((fs.statSync(absolute).mode&0o777)!==0o700)throw Error('Data directory must have mode 0700');return true;
}
function saveRecord(dataDir,composition,label){
 privateDir(dataDir,true);
 const item={...composition,id:randomUUID(),label:label??'',createdAt:new Date().toISOString()};
 const temp=path.join(dataDir,randomUUID()+'.tmp.json'),dest=path.join(dataDir,item.id+'.json');let fd;
 try{fd=fs.openSync(temp,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);fs.writeFileSync(fd,JSON.stringify(item,null,2)+'\n');fs.fsyncSync(fd);fs.closeSync(fd);fd=undefined;fs.renameSync(temp,dest);const d=fs.openSync(dataDir,'r');try{fs.fsyncSync(d)}finally{fs.closeSync(d)}}
 finally{if(fd!==undefined)fs.closeSync(fd);if(fs.existsSync(temp))fs.unlinkSync(temp)}
 return item;
}
function readRecords(dataDir){
 if(!privateDir(dataDir,false))return [];
 return fs.readdirSync(dataDir).filter(n=>/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.json$/.test(n)).map(n=>{
 const fd=fs.openSync(path.join(dataDir,n),fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{const stat=fs.fstatSync(fd);if(!stat.isFile()||stat.size>16384||(stat.mode&0o777)!==0o600)throw Error('Unsafe record');const item=JSON.parse(fs.readFileSync(fd,'utf8'));if(item.id+'.json'!==n||!item.createdAt)throw Error('Invalid record');return item}finally{fs.closeSync(fd)}
 }).sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.id.localeCompare(b.id));
}
function requestSafety(req){
 const port=req.socket.localPort,host=req.headers.host;
 if(![`127.0.0.1:${port}`,`localhost:${port}`].includes(host)||(req.socket.remoteAddress!=='127.0.0.1'&&req.socket.remoteAddress!=='::ffff:127.0.0.1'&&req.socket.remoteAddress!=='::1'))fail(403,'Only the exact local host and port are accepted','UNSAFE_HOST');
 if(req.method==='POST'){
 if(req.headers.origin!==`http://${host}`||req.headers['sec-fetch-site']==='cross-site')fail(403,'Exact same-origin Origin is required','CSRF_REJECTED');
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']||''))fail(415,'application/json is required','UNSUPPORTED_MEDIA_TYPE');
 if(req.headers['content-encoding']&&req.headers['content-encoding']!=='identity')fail(415,'Encoded request bodies are not supported','UNSUPPORTED_MEDIA_TYPE');
 }
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};
function staticFile(req,res,siteDir,pathname){
 const relative=pathname==='/'?'index.html':pathname.slice(1);
 if(relative.split('/').some(p=>!p||p.startsWith('.'))||relative.includes('\\')||relative.includes('\x00'))fail(404,'File not found','NOT_FOUND');
 const base=fs.realpathSync(siteDir),target=path.resolve(base,relative);
 if(!target.startsWith(base+path.sep))fail(404,'File not found','NOT_FOUND');
 let cursor=base;for(const part of relative.split('/')){cursor=path.join(cursor,part);const st=fs.lstatSync(cursor);if(st.isSymbolicLink())fail(404,'File not found','NOT_FOUND')}
 const type=mime[path.extname(target).toLowerCase()];if(!type)fail(404,'File not found','NOT_FOUND');
 const fd=fs.openSync(target,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
 try{const stat=fs.fstatSync(fd);if(!stat.isFile())fail(404,'File not found','NOT_FOUND');const data=req.method==='HEAD'?null:fs.readFileSync(fd);res.writeHead(200,{'Content-Type':type,'Content-Length':stat.size,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-cache'});res.end(data)}finally{fs.closeSync(fd)}
}
function glyphAsset(siteDir,kind,syllable,detail){
 // Call only after exact table membership and detail validation.
 const base=fs.realpathSync(siteDir);let target=base;
 try{
  for(const part of ['assets','glyphs',`${kind}-${syllable}-${detail}.svg`]){target=path.join(target,part);if(fs.lstatSync(target).isSymbolicLink())fail(404,'Glyph asset not found','NOT_FOUND')}
  const fd=fs.openSync(target,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);
  try{if(!fs.fstatSync(fd).isFile())fail(404,'Glyph asset not found','NOT_FOUND');return fs.readFileSync(fd)}finally{fs.closeSync(fd)}
 }catch(e){if(['ENOENT','ENOTDIR','ELOOP'].includes(e.code))fail(404,'Glyph asset not found','NOT_FOUND');throw e}
}
function createServer({dataDir=path.resolve(__dirname,'../var'),siteDir=path.resolve(__dirname,'../site')}={}){
 dataDir=path.resolve(dataDir);siteDir=path.resolve(siteDir);
 const effectiveSite=fs.existsSync(siteDir)?fs.realpathSync(siteDir):siteDir;
 const effectiveData=fs.existsSync(dataDir)?fs.realpathSync(dataDir):dataDir;
 if(effectiveData===effectiveSite||effectiveData.startsWith(effectiveSite+path.sep)||effectiveSite.startsWith(effectiveData+path.sep))throw Error('dataDir and siteDir must not overlap');
 const catalogs=new Map();
 function starCatalog(star){
  let rows=catalogs.get(star);
  if(!rows){rows=catalog(star);if(catalogs.size>=2)catalogs.delete(catalogs.keys().next().value)}
  else catalogs.delete(star);
  catalogs.set(star,rows);return rows;
 }
 return http.createServer(async(req,res)=>{try{
 requestSafety(req);
 if(!req.url.startsWith('/')||req.url.startsWith('//')||req.url.length>4096)fail(400,'Invalid request target');
 let pathname;try{pathname=decodeURIComponent(req.url.split('?')[0])}catch{fail(400,'Invalid URL encoding')}
 if(pathname.includes('\x00')||pathname.includes('\\')||pathname.split('/').includes('..'))fail(400,'Invalid path');
 const u=new URL(req.url,'http://localhost');
 const querySchemas={'/api/v1/health':[],'/api/v1/shapes':[],'/api/v1/glyphs':['kind','shape','q'],'/api/v1/compose':[],'/api/v1/compositions':[]};
 if(Object.hasOwn(querySchemas,u.pathname))onlyParams(u.searchParams,querySchemas[u.pathname]);
 if(req.method==='GET'&&u.pathname==='/api/v1/health')return json(res,200,{ok:true,localOnly:true,authority:false});
 if(req.method==='GET'&&u.pathname==='/api/v1/shapes')return json(res,200,{items:shapeIds.map(id=>({id,label:id.replace(/[-_]/g,' ')}))});
 if(req.method==='GET'&&u.pathname==='/api/v1/glyphs'){
 const kind=u.searchParams.get('kind'),shape=u.searchParams.get('shape'),q=u.searchParams.get('q');
 if(kind!==null&&!['prefix','suffix'].includes(kind))fail(400,'Unknown glyph kind');
 if(shape!==null&&!shapeIds.includes(shape))fail(400,'Unknown shape');
 if(q!==null&&(q.length>40||!/^[a-z]*$/.test(q)))fail(400,'Search must be lowercase syllable letters');
 const items=glyphs.filter(g=>(kind===null||g.kind===kind)&&(shape===null||g.shape===shape)&&(q===null||g.syllable.includes(q)));
 return json(res,200,{items,total:items.length});
 }
 if(req.method==='GET'&&pathname.startsWith('/api/v1/glyphs/')){
 if(req.url.split('?')[0]!==pathname)fail(400,'Glyph paths must use exact identifiers');
 const parts=pathname.split('/');
 if(parts.length!==6&&!(parts.length===7&&parts[6]==='svg'))fail(404,'Glyph route not found','NOT_FOUND');
 const kind=parts[4],syllable=parts[5],raw=parts.length===7;
 if(!['prefix','suffix'].includes(kind))fail(400,'Unknown glyph kind');
 onlyParams(u.searchParams,raw?['detail']:[]);
 const detail=u.searchParams.get('detail')??'default';
 if(raw&&!['default','none'].includes(detail))fail(400,'detail must be default or none');
 const glyph=glyphs.find(g=>g.kind===kind&&g.syllable===syllable);
 if(!glyph)fail(404,'Glyph not found','NOT_FOUND');
 if(raw){const bytes=glyphAsset(siteDir,kind,syllable,detail);res.writeHead(200,{'Content-Type':'image/svg+xml; charset=utf-8','Content-Length':bytes.length,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});return res.end(bytes)}
 const asset=d=>`/assets/glyphs/${kind}-${syllable}-${d}.svg`;
 return json(res,200,{...glyph,assets:{full:asset('default'),silhouette:asset('none')},svg:{full:glyphAsset(siteDir,kind,syllable,'default').toString('utf8'),silhouette:glyphAsset(siteDir,kind,syllable,'none').toString('utf8')}});
 }
 if(req.method==='GET'&&u.pathname==='/api/v1/candidates'){
 const f=candidateFilters(u.searchParams);
 let result;
 if(f.star===null)result=booleanCandidates(f);
 else{
  const bits=predicateChoices(f).map(choices=>new Map(choices.map(c=>[c.syllable,c.bit])));
  const matches=starCatalog(f.star).filter(row=>{
   const truth=row.syllables.reduce((mask,s,i)=>mask|bits[i].get(s),0);
   return satisfiesGroups(f.groups,truth);
  });
  result={total:matches.length,items:matches.slice(f.offset,f.offset+f.limit)};
 }
 return json(res,200,{star:f.star,...result,offset:f.offset,limit:f.limit,availabilityChecked:false});
 }
 if(req.method==='GET'&&u.pathname==='/api/v1/planets'){
 const f=planetFilters(u.searchParams);
 const rows=starCatalog(f.star);
 const matches=rows.filter(p=>f.syllables.every(s=>p.syllables.includes(s))&&f.positions.every((s,i)=>s===null||p.syllables[i]===s)&&f.endings.filter(e=>p.syllables.some(s=>s.slice(1)===e)).length>=f.minMatches);
 return json(res,200,{star:f.star,total:matches.length,offset:f.offset,limit:f.limit,items:matches.slice(f.offset,f.offset+f.limit),availabilityChecked:false});
 }
 if(u.pathname==='/api/v1/compositions'){
 if(req.method==='GET'){const items=readRecords(dataDir);return json(res,200,{items,total:items.length})}
 if(req.method==='POST'){const input=await body(req),c=compose(input,true);if(!c.eligible)fail(409,'Composition is not a canonical planet of this star','INELIGIBLE_COMPOSITION');return json(res,201,{item:saveRecord(dataDir,c,input.label)})}
 }
 if(req.method==='POST'&&u.pathname==='/api/v1/compose')return json(res,200,compose(await body(req)));
 if(!pathname.startsWith('/api/')&&['GET','HEAD'].includes(req.method)){
 try{return staticFile(req,res,siteDir,pathname)}catch(e){if(['ENOENT','ENOTDIR','ELOOP'].includes(e.code))fail(404,'File not found','NOT_FOUND');throw e}
 }
 fail(404,'Route not found','NOT_FOUND');
 }catch(e){json(res,e.status||500,{error:{code:e.status?e.code:'INTERNAL_ERROR',message:e.status?e.message:'Internal server error'}})}});
}
module.exports={createServer};
if(require.main===module){const port=Number(process.env.PORT||8741);if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid PORT');createServer({dataDir:process.env.DATA_DIR||undefined}).listen(port,'127.0.0.1',()=>console.log(`Urbit glyph atlas: http://127.0.0.1:${port}`));}

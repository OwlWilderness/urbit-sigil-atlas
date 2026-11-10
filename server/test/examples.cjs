'use strict';
// Isolated documentation capture: never connects to the running workshop.
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
const crypto=require('node:crypto');
const {createServer}=require('../index.cjs');
async function main(){
 const scratch=await fs.mkdtemp(path.join(os.homedir(),'.hermes/cache/scratch/atlas-examples-'));
 const out=path.resolve(__dirname,'../../docs/api-examples');
 const server=createServer({dataDir:path.join(scratch,'records')});
 try{
  await fs.mkdir(out,{recursive:true});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`,manifest=[];
  const input={syllables:['bot','myr','rad','ret'],mode:'star',star:'~pacfyl'};
  async function capture(label,route,{body,status=200,crossSite=false}={}){
   const method=body===undefined?'GET':'POST',headers=body===undefined?{}:{'Content-Type':'application/json',Origin:base,...(crossSite?{'Sec-Fetch-Site':'cross-site'}:{})};
   const response=await fetch(base+route,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
   assert.equal(response.status,status,label);const bytes=Buffer.from(await response.arrayBuffer());
   const svg=response.headers.get('content-type').startsWith('image/svg+xml');
   const filename=label+(svg?'.svg':'.json');
   if(!svg)JSON.parse(bytes.toString('utf8'));
   await fs.writeFile(path.join(out,filename),bytes);
   const curl=`curl -sS${method==='POST'?` -X POST -H 'Origin: http://127.0.0.1:8741'${crossSite?" -H 'Sec-Fetch-Site: cross-site'":''} -H 'Content-Type: application/json' --data '${JSON.stringify(body)}'`:''} 'http://127.0.0.1:8741${route}'`;
   manifest.push({label,method,route,requestBody:body??null,requestOrigin:method==='POST'?base:null,crossSite,status:response.status,contentType:response.headers.get('content-type'),file:filename,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),curl});
   return svg?bytes:JSON.parse(bytes.toString('utf8'));
  }
  await capture('health','/api/v1/health');await capture('shapes','/api/v1/shapes');
  await capture('glyph-list-rad','/api/v1/glyphs?kind=prefix&q=rad');
  await capture('glyph-prefix-rad','/api/v1/glyphs/prefix/rad');
  await capture('glyph-rad-default','/api/v1/glyphs/prefix/rad/svg');
  await capture('glyph-rad-none','/api/v1/glyphs/prefix/rad/svg?detail=none');
  await capture('compose-star','/api/v1/compose',{body:input});
  await capture('compose-free','/api/v1/compose',{body:{syllables:['doz','zod','doz','zod'],mode:'free'}});
  await capture('compose-mismatch','/api/v1/compose',{body:{...input,star:'~sampel'}});
  await capture('saved-star','/api/v1/compositions',{body:{...input,label:'Isolated documentation demo'},status:201});
  await capture('saved-free','/api/v1/compositions',{body:{syllables:['doz','zod','doz','zod'],mode:'free',label:'Isolated creative demo'},status:201});
  const list=await capture('saved-list','/api/v1/compositions');assert.equal(list.total,2);
  await capture('planets','/api/v1/planets?star=~pacfyl&p0=bot&p1=myr&p2=rad&p3=ret&limit=2');
  await capture('candidates-global','/api/v1/candidates?limit=2');
  await capture('candidates-second-page','/api/v1/candidates?offset=2&limit=2');
  const shapes='shape0=circle&shape1=circle&shape2=circle&shape3=circle';
  await capture('candidates-shapes','/api/v1/candidates?'+shapes+'&limit=2');
  await capture('candidates-shapes-star','/api/v1/candidates?'+shapes+'&star=~pacfyl&limit=2');
  for(const [label,extra] of [['global',''],['pacfyl','&star=~pacfyl'],['sampel','&star=~sampel']])await capture('candidates-exact-'+label,'/api/v1/candidates?p0=bot&p1=myr&p2=rad&p3=ret'+extra);
  await capture('candidates-mixed-global','/api/v1/candidates?p0=rad&p1=ret&p2=bot&p3=myr&join2=or&limit=2');
  await capture('candidates-or-star','/api/v1/candidates?p0=bot&p2=rad&join2=or&star=~pacfyl&limit=2');
  const rowQuery='p0=rad&p1=ret&p2=bot&p3=myr&join1=or&join2=and&join3=or';
  const grouped=await capture('candidates-rows-global','/api/v1/candidates?grouping=rows&'+rowQuery+'&limit=2');
  const linear=await capture('candidates-rows-legacy-comparison','/api/v1/candidates?'+rowQuery+'&limit=2');
  assert.equal(grouped.total,(256+256-1)**2);assert.notEqual(grouped.total,linear.total);
  await capture('candidates-rows-star','/api/v1/candidates?grouping=rows&shape0=circle&shape1=square&shape2=circle&shape3=leaf-up&join1=or&join3=or&star=~pacfyl&limit=2');
  await capture('candidates-rows-one-leaf','/api/v1/candidates?grouping=rows&p1=ret&limit=2');
  await capture('error-row-dangling-operator','/api/v1/candidates?grouping=rows&p0=rad&p2=bot&join1=or',{status:400});
  await capture('error-grouping','/api/v1/candidates?grouping=linear',{status:400});
  await capture('error-dangling-operator','/api/v1/candidates?p0=rad&join2=or',{status:400});
  await capture('error-candidate','/api/v1/candidates?shape0=CIRCLE',{status:400});
  await capture('error-blank-star','/api/v1/candidates?star=',{status:400});
  await capture('error-glyph-kind','/api/v1/glyphs/PREFIX/rad',{status:400});
  await capture('error-glyph-position','/api/v1/glyphs/suffix/rad',{status:404});
  await capture('error-glyph-detail','/api/v1/glyphs/prefix/rad/svg?detail=unknown',{status:400});
  await capture('error-compose','/api/v1/compose',{body:{...input,star:'pacfyl'},status:400});
  await capture('error-save-mismatch','/api/v1/compositions',{body:{...input,star:'~sampel'},status:409});
  await capture('error-origin','/api/v1/compose',{body:input,crossSite:true,status:403});
  await capture('error-planets-star-required','/api/v1/planets',{status:400});
  await capture('error-query','/api/v1/health?unknown=1',{status:400});
  await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({notice:'Actual isolated loopback captures. Saved UUIDs and timestamps are demo records, not user records. Curl examples use default port 8741; captured requests used the ephemeral origin shown below.',capturedOrigin:base,items:manifest},null,2)+'\n');
  const sections=['# Actual isolated API examples','', 'Every response below was captured from a disposable loopback server. UUIDs/timestamps belong only to demo records. Curl commands replay against the documented default port; the capture used an ephemeral port. No user records were loaded. Raw response files and hashes are in [manifest.json](manifest.json).',''];
  for(const entry of manifest){sections.push('## '+entry.label,'','```sh',entry.curl,'```','',`HTTP ${entry.status}; \`${entry.contentType}\`. [Exact response](${entry.file}).`,'');if(entry.file.endsWith('.json')){sections.push('```json',JSON.stringify(JSON.parse(await fs.readFile(path.join(out,entry.file),'utf8')),null,2),'```','')}}
  await fs.writeFile(path.join(out,'README.md'),sections.join('\n'));
  for(const entry of manifest){const bytes=await fs.readFile(path.join(out,entry.file));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256)}
  console.log('EXAMPLES_CAPTURED='+manifest.length);console.log('DEMO_RECORDS_READ_BACK='+list.total);
 }finally{if(server.listening)await new Promise(r=>server.close(r));await fs.rm(scratch,{recursive:true,force:true})}
}
main().catch(e=>{console.error(e);process.exitCode=1});

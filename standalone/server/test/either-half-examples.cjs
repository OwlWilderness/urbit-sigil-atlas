'use strict';
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const root=path.resolve(__dirname,'../..'),dest=path.join(root,'docs/api-examples');
const sha=b=>createHash('sha256').update(b).digest('hex');
async function main(){
 const server=require('../index.cjs').createServer();
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`,items=[];
 const base='grouping=rows&',pair='p0=rad&p1=dev&p2=bot&p3=myr';
 const scenarios=[
  ['fixed',base+'pairPlacement=fixed&'+pair,200],
  ['swapped',base+'pairPlacement=either&'+pair,200],
  ['single-bottom-pattern',base+'pairPlacement=either&p2=rad&p3=dev&limit=2',200],
  ['overlap',base+'pairPlacement=either&p0=rad&p1=dev&p2=rad&limit=2',200],
  ['star',base+'pairPlacement=either&p0=bot&p1=myr&p2=rad&p3=ret&star=~pacfyl',200],
  ['zero-word',base+'pairPlacement=either&p0=doz&p1=zod&limit=2',200],
  ['invalid',base+'pairPlacement=&p0=rad',400]
 ];
 const md=['# Actual either-half API captures','','Independent additive captures; original corpus and manifest are retained unchanged. Each response came from an ephemeral loopback server imported from the current production backend. GET only; no user data or saved records read/written. Curl commands target the usual local port; the manifest records the actual ephemeral origin.',''];
 try{
  for(const [name,query,status] of scenarios){
   const label='either-half-'+name,route='/api/v1/candidates?'+query,file=label+'.json';
   const response=await fetch(origin+route),bytes=Buffer.from(await response.arrayBuffer());
   assert.equal(response.status,status);const value=JSON.parse(bytes);
   if(status===200)assert.equal(value.availabilityChecked,false);
   await fs.writeFile(path.join(dest,file),bytes,{flag:'wx'});
   assert.equal(sha(await fs.readFile(path.join(dest,file))),sha(bytes));
   const curl=`curl -sS 'http://127.0.0.1:8741${route}'`;
   items.push({label,method:'GET',route,status:response.status,contentType:response.headers.get('content-type'),file,sha256:sha(bytes),curl});
   md.push('## '+label,'','```sh',curl,'```','',`HTTP ${response.status}; ${response.headers.get('content-type')}`,'','```json',JSON.stringify(value),'```','');
   console.log(`${label}: status=${response.status} total=${value.total??'n/a'} items=${value.items?.length??0}`);
  }
  const manifest={notice:'Actual additive captures; no historical responses overwritten.',capturedOrigin:origin,count:items.length,items};
  await fs.writeFile(path.join(dest,'either-half-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
  await fs.writeFile(path.join(dest,'either-half-README.md'),md.join('\n'),{flag:'wx'});
  const back=JSON.parse(await fs.readFile(path.join(dest,'either-half-manifest.json'),'utf8'));
  assert.equal(back.count,scenarios.length);for(const e of back.items)assert.equal(sha(await fs.readFile(path.join(dest,e.file))),e.sha256);
  console.log('EXAMPLES_CAPTURED='+items.length);
 }finally{await new Promise(r=>server.close(r))}
}
main().catch(e=>{console.error(e);process.exitCode=1});

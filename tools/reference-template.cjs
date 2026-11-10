const fs=require('fs'),path=require('path'),crypto=require('crypto');
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
module.exports=({root,site})=>{
 const input=path.join(root,'docs/api.md');if(!fs.existsSync(input))return '';
 const destination=path.join(site,'reference');fs.mkdirSync(destination,{recursive:true});
 const reference=fs.readFileSync(input,'utf8');fs.writeFileSync(path.join(destination,'api.txt'),reference);
 const sampleRoot=path.join(root,'docs/api-examples');let examples='';
 function copySamples(dir,relative=''){
  for(const name of fs.readdirSync(dir).sort()){
   const src=path.join(dir,name),rel=relative?relative+'/'+name:name,stat=fs.lstatSync(src);
   if(stat.isSymbolicLink())throw Error('Symlink in API examples');
   if(stat.isDirectory()){copySamples(src,rel);continue;}
   if(!stat.isFile()||!['.json','.svg','.txt'].includes(path.extname(name)))continue;
   const dest=path.join(destination,'examples',rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(src,dest);
  }
 }
 if(fs.existsSync(sampleRoot)){
  copySamples(sampleRoot);
  const readme=path.join(sampleRoot,'README.md');if(fs.existsSync(readme))fs.copyFileSync(readme,path.join(destination,'examples','README.txt'));
  const manifest={items:['manifest.json','either-half-manifest.json'].filter(name=>fs.existsSync(path.join(sampleRoot,name))).flatMap(name=>JSON.parse(fs.readFileSync(path.join(sampleRoot,name),'utf8')).items)};
  for(const item of manifest.items){
   if(!/^[a-z0-9-]+\.(json|svg)$/.test(item.file)||!/^[a-z0-9-]+$/.test(item.label))throw Error('Invalid example name');
   const bytes=fs.readFileSync(path.join(sampleRoot,item.file));if(crypto.createHash('sha256').update(bytes).digest('hex')!==item.sha256)throw Error('Example response hash mismatch');
   const url='reference/examples/'+encodeURIComponent(item.file),body=item.file.endsWith('.json')?JSON.stringify(JSON.parse(bytes),null,2):bytes.toString('utf8');
   examples+='<details class="api-example" id="example-'+item.label+'"><summary>'+escape(item.method+' '+item.route)+' · '+escape(item.label)+'</summary><h3>Request</h3><pre>'+escape(item.curl)+'</pre>'+(item.requestBody==null?'':'<h3>JSON request body</h3><pre>'+escape(JSON.stringify(item.requestBody,null,2))+'</pre>')+'<h3>Captured response</h3><p>HTTP '+escape(item.status)+' · '+escape(item.contentType)+'</p>'+(item.file.endsWith('.svg')?'<img src="'+url+'" width="128" height="128" alt="Captured original glyph response">':'')+'<pre>'+escape(body)+'</pre><a href="'+url+'">Open exact captured response</a></details>';
  }
 }
 return '<section class="api-docs expanded-reference"><h2>Complete requests and responses</h2><p>Endpoint contracts, request bodies, headers, query parameters, captured responses and error cases. Demo record UUIDs and timestamps come from an isolated server, not your saved compositions.</p><p><a href="reference/api.txt">Complete API reference</a> · <a href="reference/examples/README.txt">All executable examples with responses</a></p><details class="api-example"><summary>Read the full endpoint reference</summary><pre class="reference-text">'+escape(reference)+'</pre></details>'+(examples?'<h2>Captured request / response examples</h2>'+examples:'')+'</section>';
};

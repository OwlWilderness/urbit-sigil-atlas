'use strict';
const http=require('node:http'),path=require('node:path');
const {Worker}=require('node:worker_threads');
// Exact deployment origins, not suffix matches or forwarded identities.
const ORIGINS=new Map([
 ['sigformel.quantumtekh.com','https://sigformel.quantumtekh.com'],
 ['web.sigformel-web.public.dappnode.private:8088','http://web.sigformel-web.public.dappnode.private:8088']
]);
function reply(res,status,message){if(res.destroyed||res.writableEnded)return;res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(status===503?{'Retry-After':'2'}:{})});res.end(JSON.stringify({error:{code:'PUBLIC_BOUNDARY',message}}));}
async function createGateway({corePort=8741,deadlineMs=30000}={}){
 let worker,inflight=0,searches=0,ready=false,disposing=false,generation=0;
 const pending=new Set();
 async function start(){const epoch=++generation;worker=new Worker(path.join(__dirname,'core-worker.cjs'),{workerData:{port:corePort},resourceLimits:{maxOldGenerationSizeMb:256}});worker.on('error',()=>{if(!disposing&&epoch===generation)server.emit('coreFailure');});worker.on('exit',()=>{if(!disposing&&epoch===generation)server.emit('coreFailure');});await new Promise((resolve,reject)=>{worker.once('message',()=>{ready=true;resolve();});worker.once('error',reject);worker.once('exit',()=>reject(Error('Core exited before readiness')));});}
 const server=http.createServer(async(req,res)=>{
  const occurrences=name=>req.rawHeaders.filter((v,i)=>i%2===0&&v.toLowerCase()===name).length;
  const origin=ORIGINS.get(req.headers.host);
  if(occurrences('host')!==1||origin===undefined)return reply(res,421,'Exact configured Host required');
  if(occurrences('origin')>1)return reply(res,403,'Ambiguous Origin');
  if(req.headers.origin!==undefined&&req.headers.origin!==origin)return reply(res,403,'Exact same-origin Origin required');
  // Nginx overwrites this header; untrusted direct loopback callers cannot gain
  // access by supplying it because both targets must independently be canonical.
  const raw=req.headers['x-sigformel-target']||req.url;
  const canonical=v=>typeof v==='string'&&v.length<=4096&&/^\/api\/v1\/[a-z/]+(?:\?[^\r\n#]*)?$/.test(v)&&!v.split('?')[0].includes('//');
  if(!canonical(raw)||!canonical(req.url)||raw!==req.url)return reply(res,404,'Unknown public route');
  const route=req.url.split('?')[0];
  const read=/^\/api\/v1\/(health|shapes|glyphs(?:\/(prefix|suffix)\/[a-z]{3}(?:\/svg)?)?|candidates|planets)$/.test(route);
  if(!(read&&req.method==='GET')&&!(route==='/api/v1/compose'&&req.method==='POST'))return reply(res,404,'Unknown public route');
  if(req.method==='POST'){
   if(occurrences('origin')!==1||req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')return reply(res,403,'Same-origin compose required');
   if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(req.headers['content-type']||'')||!['identity',undefined].includes(req.headers['content-encoding']))return reply(res,415,'Unencoded application/json required');
  }
  if(route==='/api/v1/health'&&req.url===route){res.writeHead(ready?200:503,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(JSON.stringify({ok:ready,public:true,authority:false,records:false}));}
  const search=['/api/v1/candidates','/api/v1/planets'].includes(route);
  if(!ready||inflight>=5||(search&&searches>=1))return reply(res,503,'Search capacity busy; retry shortly');
  inflight++;if(search)searches++;
  let released=false;const release=()=>{if(released)return;released=true;inflight--;if(search)searches--;};
  let bytes=0,chunks=[];
  try{for await(const chunk of req){bytes+=chunk.length;if(bytes>8192){release();return reply(res,413,'Body exceeds 8192 bytes');}chunks.push(chunk);}}catch{release();return;}
  if(req.method!=='POST'&&bytes){release();return reply(res,400,'GET body not supported');}
  const headers={host:`127.0.0.1:${corePort}`,connection:'close',...(req.method==='POST'?{origin:`http://127.0.0.1:${corePort}`,'content-type':'application/json','content-length':bytes}:{})};
  const upstream=http.request({host:'127.0.0.1',port:corePort,path:req.url,method:req.method,headers},incoming=>{res.writeHead(incoming.statusCode,incoming.headers);incoming.pipe(res);incoming.once('end',settle);incoming.once('error',()=>{reply(res,502,'Core response failed');settle();});});
  const timer=setTimeout(async()=>{if(!pending.has(upstream))return;ready=false;for(const p of pending)p.destroy();pending.clear();reply(res,504,'Computation deadline exceeded');generation++;await worker.terminate();if(!disposing)try{await start();}catch{server.emit('coreFailure');}},deadlineMs);timer.unref();
  function settle(){clearTimeout(timer);pending.delete(upstream);release();}
  pending.add(upstream);upstream.on('error',()=>{reply(res,503,'Computation unavailable');settle();});upstream.end(Buffer.concat(chunks));
 });
 server.requestTimeout=10000;server.headersTimeout=10000;server.keepAliveTimeout=5000;server.maxConnections=32;
 server.dispose=async()=>{disposing=true;ready=false;generation++;for(const p of pending)p.destroy();await worker.terminate();};
 await start();return server;
}
module.exports={createGateway};
if(require.main===module)(async()=>{const server=await createGateway();server.on('coreFailure',()=>process.exit(1));server.listen(8742,'127.0.0.1');for(const signal of ['SIGTERM','SIGINT'])process.on(signal,async()=>{server.closeAllConnections();server.close();await server.dispose();process.exit(0);});})().catch(()=>process.exit(1));

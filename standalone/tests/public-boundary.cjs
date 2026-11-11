'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),http=require('node:http');
const {createServer}=require('../server/index.cjs');
const publicHost='sigformel.quantumtekh.com';
// Baseline behavioral RED uses real original core; GREEN selects new boundary.
async function fixture(t){const server=process.env.BASELINE?createServer({dataDir:'/nonexistent-sigformel-records'}):await require('../runtime/gateway.cjs').createGateway({corePort:18749});await new Promise(r=>server.listen(0,'127.0.0.1',r));t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));if(server.dispose)await server.dispose();});return (path,method='GET',headers={},body='')=>new Promise((resolve,reject)=>{const port=server.address().port;const req=http.request({host:'127.0.0.1',port,path,method,headers:{host:process.env.BASELINE?`127.0.0.1:${port}`:publicHost,...headers}},r=>{let text='';r.on('data',c=>text+=c);r.on('end',()=>resolve({status:r.statusCode,text,headers:r.headers}));});req.on('error',reject);req.end(body);});}
test('shared records refused before the original storage entry point',async t=>{const get=await fixture(t);assert.equal((await get('/api/v1/compositions')).status,404);assert.equal((await get('/api/v1/health')).status,200);});

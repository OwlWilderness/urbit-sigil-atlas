'use strict';
// This thread alone hosts the unchanged loopback-only core. No records route
// is admitted by its parent; no persistent data directory is supplied/mounted.
const {parentPort,workerData}=require('node:worker_threads');
const server=require('../server/index.cjs').createServer({dataDir:'/records-unavailable'});
server.listen(workerData.port,'127.0.0.1',()=>parentPort.postMessage('ready'));

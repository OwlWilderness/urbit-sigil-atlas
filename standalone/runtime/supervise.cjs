'use strict';
const {spawn}=require('node:child_process');
const children=[spawn(process.execPath,['/app/runtime/gateway.cjs'],{stdio:'ignore'}),spawn('nginx',['-e','stderr','-c','/app/runtime/nginx.conf','-g','daemon off;'],{stdio:['ignore','ignore','inherit']})];
let stopping=false,failed=false,exited=0;
function stop(failure){failed=failed||failure;if(stopping)return;stopping=true;children.forEach((c,i)=>{if(c.exitCode===null&&c.signalCode===null)c.kill(i===1?'SIGQUIT':'SIGTERM');});const timer=setTimeout(()=>{children.forEach(c=>{if(c.exitCode===null&&c.signalCode===null)c.kill('SIGKILL');});failed=true;},8000);timer.unref();}
children.forEach(c=>{c.on('error',()=>stop(true));c.on('exit',(code,signal)=>{exited++;if(!stopping)stop(true);if(exited===children.length)process.exit(failed?1:0);});});
for(const signal of ['SIGTERM','SIGINT','SIGQUIT'])process.on(signal,()=>stop(false));

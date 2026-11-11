'use strict';const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
test('service entrypoint must own and supervise both children',()=>{assert(fs.existsSync('runtime/supervise.cjs'),'missing supervisor (scaffold RED)');const s=fs.readFileSync('runtime/supervise.cjs','utf8');assert.match(s,/SIGQUIT/);assert.match(s,/SIGTERM/);assert.match(s,/exit/);});

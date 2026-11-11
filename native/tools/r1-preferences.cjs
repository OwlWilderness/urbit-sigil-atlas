'use strict';
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const source=fs.readFileSync(process.env.R1_SOURCE||'native/frontend/native.js','utf8');
const key='sigil-atlas:favorites';
async function fixture(store=new Map()){
 let durable={},fail=false,gate=null,attempts=0;const events={},wevents={};
 const status={append(){},setAttribute(){},textContent:''};const document={querySelector(){return null},createElement(){return {...status,addEventListener(){},append(){}}},body:{append(){}},addEventListener(n,f){events[n]=f}};
 const window={addEventListener(n,f){wevents[n]=f},sessionStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)}};
 class Urbit{async scry(){return {nativeAuthority:true,ship:'~zod',preferences:structuredClone(durable)}}async poke({json}){attempts++;if(gate)await gate;if(fail)throw Error('native rejection or offline');Object.assign(durable,structuredClone(json.value))}delete(){}}
 const location={href:'initial',origin:'http://fake'};vm.runInNewContext(source,{window,document,location,UrbitHttpApi:{Urbit},TextEncoder,DOMException,URLSearchParams,Map,Promise,JSON,Date,setTimeout:()=>1,clearTimeout(){},console});const n=window.SigilNative;await n.ready;
 return {n,events,wevents,location,store,setFail:v=>fail=v,setGate:v=>gate=v,get durable(){return structuredClone(durable)},get attempts(){return attempts}};
}
(async()=>{
 const f=await fixture();f.setFail(true);f.n.set(key,['prefix-rad']);await f.n.flush();f.setFail(false);await f.n.flush();assert.deepEqual(f.durable[key],['prefix-rad'],'failed intent must remain retryable');
 if(process.env.R1_RED_ONLY){console.log('recovery passed');return;}
 f.setFail(true);f.n.set(key,['prefix-bot']);await f.n.flush();const count=f.attempts;f.n.set(key,['prefix-bot']);await f.n.flush();assert.equal(f.attempts,count+1,'identical unconfirmed edit is retried');
 for(let i=0;i<20;i++)await Promise.resolve();assert.equal(f.attempts,count+1,'no endless rejection retries');assert.equal(f.n.status().state,'error');
 let release;f.setFail(false);f.setGate(new Promise(r=>release=r));const old=f.n.flush();await Promise.resolve();await Promise.resolve();f.n.set(key,['prefix-dev']);release();await old;assert.deepEqual(f.n.get(key,[]),['prefix-dev'],'older acknowledgement cannot clobber desired');await f.n.flush();assert.deepEqual(f.durable[key],['prefix-dev']);
 let releaseFailure;f.setFail(true);f.setGate(new Promise(r=>releaseFailure=r));f.n.set(key,['prefix-rad']);const older=f.n.flush();await Promise.resolve();await Promise.resolve();f.n.set(key,['prefix-bot']);releaseFailure();await older;assert.deepEqual(f.n.get(key,[]),['prefix-bot']);f.setFail(false);f.setGate(null);await f.n.flush();assert.deepEqual(f.durable[key],['prefix-bot']);
 f.setFail(true);f.n.set(key,['prefix-myr']);let prevented=false;f.events.click({target:{closest:()=>({href:'shortlist.html'})},button:0,preventDefault(){prevented=true}});await f.n.flush();assert(prevented);assert.equal(f.location.href,'initial','failed navigation cannot silently leave');
 const restored=await fixture(f.store);assert.deepEqual(restored.n.get(key,[]),['prefix-myr'],'reload retains unconfirmed identity-scoped draft');assert.equal(restored.n.status().state,'unsaved');await restored.n.flush();assert.deepEqual(restored.durable[key],['prefix-myr']);assert.equal(restored.n.status().state,'confirmed');
 console.log('PASS recovery, identical retry, bounded rejection, ack/failure races, blocked navigation, identity-scoped reload drafts, confirmed readback');
})().catch(e=>{console.error(e);process.exitCode=1});

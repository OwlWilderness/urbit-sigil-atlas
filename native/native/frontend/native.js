/* Native Eyre transport. No name search or identity arithmetic here. */
(()=>{'use strict';
const agent=window.SIGFORMEL_AGENT||'sigformel',api=new UrbitHttpApi.Urbit('');
let preferences={},confirmed={},pending=new Map(),timer,serial=0,queue=Promise.resolve(),draftKey,storageError=false,saving=false,lastError=false,statusNode,retryNode;
function status(){return {state:pending.size?(lastError?'error':saving?'saving':'unsaved'):'confirmed',pending:[...pending.keys()],storageError};}
function renderStatus(){
 if(!statusNode){const box=document.createElement('div');box.setAttribute('id','native-preference-status');statusNode=document.createElement('span');statusNode.setAttribute('role','status');statusNode.setAttribute('aria-live','polite');retryNode=document.createElement('button');retryNode.type='button';retryNode.textContent='Retry saving preferences';retryNode.addEventListener('click',()=>flush());box.append(statusNode,retryNode);const main=document.querySelector('main');if(main)main.prepend(box);else document.body.append(box);}
 const s=status();statusNode.textContent=s.state==='confirmed'?'Preferences confirmed on your installing ship.':s.state==='saving'?'Saving preferences — not yet confirmed.':s.state==='error'?'Preferences not saved. Native write or readback failed; check the connection or value, then retry.':'Unsaved preferences restored or awaiting confirmation.';
 if(storageError)statusNode.textContent+=' Browser draft retention unavailable. Do not close or reload until confirmed.';
 retryNode.hidden=!pending.size;retryNode.disabled=saving;
}
function retain(){
 try{if(draftKey){if(pending.size)window.sessionStorage.setItem(draftKey,JSON.stringify({unconfirmed:true,values:Object.fromEntries(pending)}));else window.sessionStorage.removeItem(draftKey);}storageError=false;}catch{storageError=true;}
 renderStatus();
}
const receipts=[],wait=ms=>new Promise(r=>setTimeout(r,ms));
const clone=v=>JSON.parse(JSON.stringify(v));
function abort(signal){if(signal?.aborted)throw new DOMException('Aborted','AbortError');}
function hex(json){const bytes=[...new TextEncoder().encode(JSON.stringify(json))].reverse().map(b=>b.toString(16).padStart(2,'0')).join('');const first=bytes.length%4||4;return bytes.slice(0,first)+(bytes.length>first?'.'+bytes.slice(first).match(/.{4}/g).join('.'):'');}
async function search(query,signal){
 abort(signal);const id='web-'+Date.now().toString(16)+'-'+(++serial).toString(16);
 try{await api.poke({app:agent,mark:'json',json:{action:'search',id,query}});}catch(error){throw new Error('Native search refused these filters. Check the exact star and syllables, then refresh matches.');}abort(signal);
 const deadline=Date.now()+120000;
 while(Date.now()<deadline){abort(signal);const result=await api.scry({app:agent,path:'/result/'+id});abort(signal);if(result&&!result.pending){receipts.push({id,query,result});return result;}await wait(100);}
 throw Error('Native search timed out. Refresh matches to retry.');
}
async function request(endpoint,options={}){
 await ready;abort(options.signal);const [route,params='']=endpoint.split('?');
 if(route==='health')return {ok:true,nativeAuthority:true};
 if(route==='candidates'){const query=Object.fromEntries(new URLSearchParams(params));for(const key of ['offset','limit'])if(query[key]!==undefined)query[key]=Number(query[key]);return search(query,options.signal);}
 if(route==='compose')return api.scry({app:agent,path:'/compose/'+hex(JSON.parse(options.body))});
 if(route==='compositions'){
  if(options.method==='POST'){
   const id='save-web-'+Date.now().toString(16)+'-'+(++serial).toString(16);
   try{await api.poke({app:agent,mark:'json',json:{action:'composition',id,value:JSON.parse(options.body)}});}catch{throw Error('Native composition save was refused. Check canonical name and spawning star.');}
   const collection=await api.scry({app:agent,path:'/compositions'}),item=collection.items.find(x=>x.requestId===id);if(!item)throw Error('Native save readback failed');return {item};
  }
  return api.scry({app:agent,path:'/compositions'});
 }
 throw Error('Unsupported native operation.');
}
function set(key,value){
 const same=JSON.stringify(preferences[key])===JSON.stringify(value);
 if(same&&!pending.has(key))return;
 preferences[key]=clone(value);pending.set(key,clone(value));lastError=false;retain();clearTimeout(timer);timer=setTimeout(()=>flush(),300);
}
function flush(){
 clearTimeout(timer);
 queue=queue.then(async()=>{
  await ready;saving=true;lastError=false;renderStatus();
  // One bounded pass; retries require a new edit or explicit user action.
  const batch=[...pending];
  for(const [key,value]of batch){
   try{
    await api.poke({app:agent,mark:'json',json:{action:'preferences',value:{[key]:value}}});
    const state=await api.scry({app:agent,path:'/state'});
    if(!state.nativeAuthority||state.ship!==api.ship.replace(/^/,'~')||JSON.stringify(state.preferences[key])!==JSON.stringify(value))throw Error('Native preference readback mismatch');
    confirmed[key]=clone(state.preferences[key]);
    if(JSON.stringify(pending.get(key))===JSON.stringify(value))pending.delete(key);
    receipts.push({preference:key,confirmed:true});
   }catch(error){lastError=true;receipts.push({preference:key,confirmed:false,error:String(error)});}
   retain();
  }
  saving=false;retain();return pending.size===0;
 });return queue;
}
const ready=(async()=>{
 const state=await api.scry({app:agent,path:'/state'});if(!state.nativeAuthority)throw Error('Native authority unavailable');api.ship=state.ship.slice(1);confirmed=clone(state.preferences);preferences=clone(confirmed);
 draftKey='sigil-atlas:unconfirmed:v1:'+location.origin+':'+agent+':'+state.ship;
 try{const draft=JSON.parse(window.sessionStorage.getItem(draftKey)||'null');if(draft?.unconfirmed&&draft.values&&typeof draft.values==='object'&&!Array.isArray(draft.values)){for(const [key,value]of Object.entries(draft.values)){pending.set(key,clone(value));preferences[key]=clone(value);}}}catch{storageError=true;}
 renderStatus();return state;
})();
window.SigilNative={ready,request,get:(key,fallback)=>Object.hasOwn(preferences,key)?clone(preferences[key]):fallback,set,flush,status,receipts,api,agent};
ready.catch(error=>{const node=document.querySelector('#backend-status');if(node)node.textContent='Native Eyre connection unavailable: '+error.message;});
document.addEventListener('click',event=>{const link=event.target.closest?.('.main-nav a,.brand');if(!link||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||event.defaultPrevented)return;event.preventDefault();flush().then(ok=>{if(ok)location.href=link.href;else{statusNode.scrollIntoView?.({block:'center'});statusNode.tabIndex=-1;statusNode.focus?.();}}).catch(()=>{});},true);
window.addEventListener('beforeunload',event=>{if(pending.size){retain();event.preventDefault();event.returnValue='';}});
window.addEventListener('pagehide',()=>{try{api.delete();}catch{}});
})();

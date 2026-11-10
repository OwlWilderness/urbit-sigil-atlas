(()=>{'use strict';
const rows=JSON.parse(document.querySelector('#glyph-data').textContent),byId=new Map(rows.map(g=>[g.kind+'-'+g.syllable,g]));
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)],page=document.body.dataset.page,isWorkshop=page==='workshop.html',isShortlist=page==='shortlist.html';
const shapeNames={'circle':'Circle','square':'Square','leaf-down':'Leaf ↘','leaf-up':'Leaf ↗','q-tl':'Quarter · top-left','q-tr':'Quarter · top-right','q-bl':'Quarter · bottom-left','q-br':'Quarter · bottom-right','d-left':'Rounded left','d-right':'Rounded right','d-top':'Rounded top','d-bottom':'Rounded bottom'};
let memory={},storageOkay=true;function read(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{storageOkay=false;return memory[key]??fallback;}}function write(key,value){memory[key]=value;try{localStorage.setItem(key,JSON.stringify(value));}catch{storageOkay=false;}}
let favorites=new Set(read('sigil-atlas:favorites',[]).filter(id=>byId.has(id))),slots=read('sigil-atlas:slots',[null,null,null,null]);if(!Array.isArray(slots)||slots.length!==4)slots=[null,null,null,null];slots=slots.map((s,i)=>byId.has((i%2?'suffix':'prefix')+'-'+s)?s:null);
let enabled=read('sigil-atlas:slotEnabled',[true,true,true,true]);if(!Array.isArray(enabled)||enabled.length!==4)enabled=[true,true,true,true];enabled=enabled.map(v=>v!==false);
let joins=read('sigil-atlas:rowJoins',['and','and','and']);if(!Array.isArray(joins)||joins.length!==3||joins.some(v=>v!=='and'&&v!=='or'))joins=['and','and','and'];
let pairPlacement=read('sigil-atlas:pairPlacement','fixed')==='either'?'either':'fixed';
let matchMode=read('sigil-atlas:matchMode','shape')==='exact'?'exact':'shape',candidateSeq=0,candidateTimer,candidateAbort,dragging=false;
let active=0,mode=read('sigil-atlas:mode','free')==='star'?'star':'free',star=read('sigil-atlas:starInput',null);if(typeof star!=='string'){const previous=read('sigil-atlas:star','');star=typeof previous==='string'&&previous!=='~pacfyl'?previous:'';}let toastTimer,apiOnline=false,preview=null,previewSeq=0,detailId=null,opener=null,visible=[],planetOffset=0,planetQuery=null;
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3500);}
function persist(){write('sigil-atlas:starInput',star);write('sigil-atlas:pairPlacement',pairPlacement);write('sigil-atlas:rowJoins',joins);write('sigil-atlas:slotEnabled',enabled);write('sigil-atlas:slots',slots);write('sigil-atlas:mode',mode);write('sigil-atlas:star',star);write('sigil-atlas:matchMode',matchMode);}
function favoriteUI(){all('[data-favorite]').forEach(b=>{const on=favorites.has(b.dataset.favorite);b.setAttribute('aria-pressed',String(on));b.textContent=on?'★':'☆';b.setAttribute('aria-label',(on?'Remove ':'Save ')+byId.get(b.dataset.favorite).syllable+(on?' from shortlist':' to shortlist'));});if(detailId)$('#detail-save').textContent=favorites.has(detailId)?'Remove from shortlist':'Save to shortlist';}
function toggleFavorite(id){if(favorites.has(id))favorites.delete(id);else favorites.add(id);write('sigil-atlas:favorites',[...favorites]);favoriteUI();filter();}
const params=new URLSearchParams(location.search);if($('#search'))$('#search').value=params.get('q')||'';if($('#shape')&&[...$('#shape').options].some(o=>o.value===params.get('shape')))$('#shape').value=params.get('shape');
function matches(s,q){if(q.startsWith('~'))q=q.slice(1);if(q.startsWith('_'))return s.length===q.length&&[...q].every((c,i)=>c==='_'||s[i]===c);return s.includes(q);}
function filter(){if(!$('#search'))return;const q=$('#search').value.trim().toLowerCase(),shape=$('#shape').value,kind=isWorkshop&&matchMode==='exact'?(active%2?'suffix':'prefix'):$('#kind').value;visible=[];all('.glyph-card').forEach(card=>{const yes=matches(card.dataset.syllable,q)&&(!shape||shape===card.dataset.shape)&&(!kind||kind===card.dataset.kind)&&(!isShortlist||favorites.has(card.dataset.id));card.hidden=!yes;if(yes)visible.push(card.dataset.id);});all('[data-group]').forEach(group=>{const n=group.querySelectorAll('.glyph-card:not([hidden])').length;group.hidden=n===0;group.querySelector('[data-section-count]').textContent=n+' glyph'+(n===1?'':'s');});$('#count').textContent=visible.length+' glyph'+(visible.length===1?'':'s');$('#empty').hidden=visible.length!==0;if(isShortlist)$('#empty-copy').textContent=favorites.size?'No favorites match these filters.':'Tap ☆ on a glyph to keep it here.';all('[data-shape-link]').forEach(a=>a.setAttribute('aria-current',String(a.dataset.shapeLink===shape)));}
function syncURL(){const p=new URLSearchParams(location.search);for(const [key,value]of [['q',$('#search')?.value||''],['shape',$('#shape')?.value||'']])if(value)p.set(key,value);else p.delete(key);try{history.replaceState(null,'',location.pathname+(p.size?'?'+p:'')+location.hash);}catch{}}
function reset(){if(!$('#search'))return;$('#search').value='';$('#shape').value='';$('#kind').value='';filter();syncURL();}
for(const id of ['search','shape','kind'])$('#'+id)?.addEventListener(id==='search'?'input':'change',()=>{filter();syncURL();});$('#reset')?.addEventListener('click',reset);$('#empty-reset')?.addEventListener('click',reset);
all('[data-shape-link]').forEach(a=>{if($('#shape'))a.addEventListener('click',e=>{e.preventDefault();$('#shape').value=a.dataset.shapeLink;$('#search').value='';filter();syncURL();const target=$('#shape-'+a.dataset.shapeLink);if(target&&!target.hidden)target.scrollIntoView({block:'start'});else $('#empty')?.focus();});});
all('[data-favorite]').forEach(b=>b.addEventListener('click',()=>toggleFavorite(b.dataset.favorite)));
const dialog=$('#glyph-dialog');function showDetail(id,button){const g=byId.get(id);if(!g)return;if(button)opener=button;detailId=id;$('#glyph-title').textContent=g.syllable;$('#detail-full').src='assets/glyphs/'+id+'-default.svg';$('#detail-full').alt=g.syllable+' detailed glyph';$('#detail-base').src='assets/glyphs/'+id+'-none.svg';$('#detail-base').alt=g.syllable+' silhouette';$('#detail-meta').textContent=g.kind+' · '+shapeNames[g.shape]+' · planet syllables '+(g.kind==='prefix'?'1 or 3':'2 or 4');const order=visible.length?visible:rows.map(g=>g.kind+'-'+g.syllable),i=order.indexOf(id);$('#detail-position').textContent=(i+1)+' / '+order.length;favoriteUI();if(!dialog.open)dialog.showModal();}
all('[data-open]').forEach(b=>b.addEventListener('click',()=>{if(!dragging)showDetail(b.dataset.open,b);}));function step(delta){const order=visible.length?visible:rows.map(g=>g.kind+'-'+g.syllable);showDetail(order[(order.indexOf(detailId)+delta+order.length)%order.length]);}
$('#previous-glyph').addEventListener('click',()=>step(-1));$('#next-glyph').addEventListener('click',()=>step(1));$('#close-dialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',()=>{detailId=null;if(opener?.isConnected&&!opener.closest('[hidden]'))opener.focus();});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});dialog.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();step(1);}if(e.key==='ArrowLeft'){e.preventDefault();step(-1);}});$('#detail-save').addEventListener('click',()=>toggleFavorite(detailId));
function placeGlyph(id){const g=byId.get(id),kind=g.kind==='prefix'?0:1;let i=active;if(i%2!==kind)i=slots.findIndex((s,k)=>!s&&k%2===kind);if(i<0)i=kind;if(isWorkshop)delete $('[data-slot-input="'+i+'"]').dataset.committed;slots[i]=g.syllable;active=slots.findIndex((s,k)=>!s&&k>i);if(active<0)active=slots.findIndex(s=>!s);if(active<0)active=i;persist();if(isWorkshop){reset();renderSlots();invalidate();scheduleCandidates();if(slots.every(Boolean)&&apiOnline)validate();}else location.href='workshop.html';}
$('#detail-use').addEventListener('click',()=>{const id=detailId;dialog.close();placeGlyph(id);});
async function api(endpoint,options={}){const response=await fetch('api/v1/'+endpoint,{...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...options.headers}});let payload;try{payload=await response.json();}catch{throw Error('The local API is unavailable.');}if(!response.ok)throw Error(payload.error?.message||'API request failed');return payload;}
function renderSlots(){if(!isWorkshop)return;all('[data-slot]').forEach(b=>{const i=Number(b.dataset.slot),s=slots[i],kind=i%2?'suffix':'prefix',g=s?byId.get(kind+'-'+s):null;b.dataset.active=String(i===active);b.dataset.syllable=s||'';b.dataset.shape=g?.shape||'';
const column=b.closest('[data-slot-column]'),select=b.querySelector('[data-slot-select]'),copy=b.querySelector('[data-slot-copy]'),input=column.querySelector('[data-slot-input]');
select.setAttribute('aria-pressed',String(i===active));b.querySelector('[data-slot-art]').setAttribute('aria-pressed',String(i===active));copy.disabled=!g;copy.draggable=!!g;b.querySelector('[data-slot-art]').draggable=!!g;
const art=b.querySelector('.slot-art');if(art.dataset.key!==kind+'-'+s+'-'+matchMode){art.dataset.key=kind+'-'+s+'-'+matchMode;art.replaceChildren();if(g){const img=document.createElement('img');img.src='assets/glyphs/'+kind+'-'+s+'-'+(matchMode==='shape'?'none':'default')+'.svg';img.alt='';img.draggable=false;art.append(img);}}
b.querySelector('strong').textContent=s||'Any';b.querySelector('.slot-family').textContent=g&&matchMode==='shape'?shapeNames[g.shape]:'';
if(input.dataset.committed!==(s||'')){input.value=s||'';input.dataset.committed=s||'';input.setAttribute('aria-invalid','false');column.querySelector('.slot-error').textContent='';}
column.querySelector('[data-slot-enabled]').checked=enabled[i];});const art=$('#compose-art');art.replaceChildren();art.hidden=!slots.every(Boolean);if(!art.hidden)slots.forEach((s,i)=>{const img=document.createElement('img');img.src='assets/glyphs/'+(i%2?'suffix':'prefix')+'-'+s+'-'+(matchMode==='shape'?'none':'default')+'.svg';img.alt=s;art.append(img);});$('#compose-name').textContent='~'+(slots[0]||'___')+(slots[1]||'___')+'-'+(slots[2]||'___')+(slots[3]||'___');$('#match-mode').value=matchMode;$('#kind').value=matchMode==='exact'?(active%2?'suffix':'prefix'):$('#kind').value;$('#kind').disabled=matchMode==='exact';$('#star').disabled=mode!=='star';all('[data-shape-source]').forEach(b=>b.disabled=matchMode==='exact');renderLogic();filter();}
function renderLogic(){
 const active=slots.map((s,i)=>!!s&&enabled[i]);
 const describe=i=>'Box '+(i+1)+' '+(i%2?'suffix':'prefix')+': '+(slots[i]?(matchMode==='shape'?shapeNames[byId.get((i%2?'suffix':'prefix')+'-'+slots[i]).shape]+' family':slots[i]):'empty');
 all('.row-mini [data-condition-slot]').forEach(node=>{
  const i=Number(node.dataset.conditionSlot),s=slots[i],text=describe(i)+(s&&!enabled[i]?' (ignored)':'');
  node.dataset.active=String(active[i]);node.setAttribute('aria-label',text);node.title=text;node.replaceChildren();
  if(s){const img=document.createElement('img');img.src='assets/glyphs/'+(i%2?'suffix':'prefix')+'-'+s+'-'+(matchMode==='shape'?'none':'default')+'.svg';img.alt='';img.width=32;img.height=32;node.append(img);}
  const caption=document.createElement('small');caption.textContent=(i+1)+' · '+(s?(matchMode==='shape'?'shape':s):'—');node.append(caption);
 });
 const applicable=[active[0]&&active[1],active.some(Boolean),active[2]&&active[3]];
 all('[data-join-before]').forEach(select=>{
  const n=Number(select.dataset.joinBefore)-1;
  if(n===1){
   for(const [value,label] of [['and-either','AND ↕'],['or-either','OR ↕']])if(![...select.options].some(o=>o.value===value))select.add(new Option(label,value));
   const wording='Between rows operator — AND / inclusive OR; ↕ searches each pair in either half without moving or shuffling slots';
   select.setAttribute('aria-label',wording);select.title=wording;
  }else select.title=select.getAttribute('aria-label')+' — AND / inclusive OR';
  select.value=joins[n]+(n===1&&pairPlacement==='either'?'-either':'');select.disabled=!applicable[n];
 });
 const row=(indices,op)=>indices.filter(i=>active[i]).map(describe).join(' '+op.toUpperCase()+' ');
 const groups=[row([0,1],joins[0]),row([2,3],joins[2])].filter(Boolean);
 const expression=groups.map(g=>'('+g+')'+(pairPlacement==='either'?' in either half':'')).join(' '+joins[1].toUpperCase()+' ')||'Any name';
 $('#search-expression').textContent=expression;$('#search-expression').setAttribute('aria-label',expression);
}
function status(text,type=''){$('#compose-status').textContent=text;$('#compose-status').dataset.state=type;}
function invalidate(){preview=null;previewSeq++;if(isWorkshop){$('#save-composition').disabled=true;status(hasDraftErrors()?'Fix typed syllables before validating or saving; last valid choices retained.':slots.every(Boolean)?'Ready to validate this combination.':'Choose a slot, then pick a glyph below.');}}
function canonicalStar(value){return value&&!value.startsWith('~')?'~'+value:value;}
function payload(){return {syllables:[...slots],mode,...(mode==='star'?{star:canonicalStar(star)}:{})};}
function hasDraftErrors(){return isWorkshop&&all('[data-slot-input]').some(b=>b.getAttribute('aria-invalid')==='true');}
async function validate(){if(hasDraftErrors()){status('Fix typed syllables before validating or saving; last valid choices retained.','error');return;}if(!slots.every(Boolean)){status('Choose all four syllables first.','error');return;}if(mode==='star'&&!star){status('Enter a star, or choose All stars.');return;}if(!apiOnline){status('Browsing works offline. Start the local API to validate or save names.','error');return;}const seq=++previewSeq,body=payload();status('Checking canonical name and parentage…');$('#save-composition').disabled=true;try{const result=await api('compose',{method:'POST',body:JSON.stringify(body)});if(seq!==previewSeq||hasDraftErrors())return;preview=result;$('#save-composition').disabled=!result.eligible;if(!result.canonical)status('Fun combination only: not a canonical Urbit planet name.','error');else if(mode==='star'&&!result.eligible)status('Belongs to '+result.parent+', not '+star+'. Change syllables, search matches, or switch to free mode.','error');else status('Canonical '+result.kind+' · spawning parent '+(result.parent||'none')+(mode==='free'?' · unrestricted free mode':' · matches '+star), 'ok');}catch(e){if(seq===previewSeq)status(e.message,'error');}}
async function loadSaved(){if(!isWorkshop||!apiOnline)return;try{const result=await api('compositions'),container=$('#saved-compositions');container.replaceChildren();if(!result.items.length){const p=document.createElement('p');p.className='notice';p.textContent='No API compositions saved yet.';container.append(p);return;}for(const item of result.items){const box=document.createElement('div');box.className='planet-result';const name=document.createElement('code');name.textContent=item.name;const modeLabel=document.createElement('small');modeLabel.textContent=item.mode==='star'?'Star: '+item.star:'Free / fun';const use=document.createElement('button');use.textContent='Load';use.addEventListener('click',()=>{slots=[...item.syllables];matchMode='exact';mode=item.mode;star=item.star||star;document.querySelector('input[name=mode][value='+mode+']').checked=true;$('#star').value=star;persist();renderSlots();invalidate();scheduleCandidates();validate();});box.append(name,modeLabel,use);container.append(box);}}catch(e){toast(e.message);}}
let workshopController=null;
if(isWorkshop){
 workshopController=window.SigilWorkshop({$,all,rows,byId,api,canonicalStar,toast,reset,validate,loadSaved,draftChanged:invalidate,getPreview:()=>preview,isDragging:()=>dragging,setDragging:value=>{dragging=value;},
 get:()=>({slots,enabled,joins,pairPlacement,active,mode,star,matchMode,apiOnline}),
 set:(update,options={})=>{
  if(Object.hasOwn(update,'slots'))slots=[...update.slots];
  if(Object.hasOwn(update,'enabled'))enabled=[...update.enabled];
  if(Object.hasOwn(update,'joins'))joins=[...update.joins];
  if(Object.hasOwn(update,'pairPlacement'))pairPlacement=update.pairPlacement==='either'?'either':'fixed';
  if(Object.hasOwn(update,'active'))active=update.active;
  if(Object.hasOwn(update,'mode'))mode=update.mode;
  if(Object.hasOwn(update,'star'))star=update.star;
  if(Object.hasOwn(update,'matchMode'))matchMode=update.matchMode;
  persist();renderSlots();invalidate();
  if(options.query!==false)scheduleCandidates();
  if(options.validate!==false&&slots.every(Boolean)&&apiOnline)validate();
 }});renderSlots();
} 
const sizeHeader=()=>document.documentElement.style.setProperty('--masthead-height',$('.masthead').offsetHeight+'px');
sizeHeader();if(window.ResizeObserver)new ResizeObserver(sizeHeader).observe($('.masthead'));else window.addEventListener('resize',sizeHeader);
function scheduleCandidates(){workshopController?.refresh();}
async function checkAPI(){const element=$('#backend-status');if(location.protocol==='file:'){if(element)element.textContent='Static / offline mode. Run the local backend for validation and saved compositions.';return;}try{const result=await api('health');apiOnline=result.ok===true;if(element){element.dataset.online=String(apiOnline);element.textContent=apiOnline?'Local API connected · names only, no spawning':'Local API unavailable';}if(apiOnline&&isWorkshop){loadSaved();scheduleCandidates();if(slots.every(Boolean))validate();}}catch{if(element)element.textContent='API offline. Atlas browsing and shortlist still work.';}}
favoriteUI();filter();checkAPI();if(!storageOkay)toast('Browser storage unavailable; choices last for this page only.');
})();

/* Workshop interactions; the catalogue and glyph data remain static. */
window.SigilWorkshop=function(ctx){
'use strict';
const {$,all,rows,byId,get,set,api,canonicalStar,toast}=ctx;
let timer,controller,sequence=0,query=null,offset=0,loading=false;
const transferType='application/x-urbit-glyph';
function clearResults(message){$('#planet-results').replaceChildren();$('#planet-search-status').textContent=message;delete $('#planet-search-status').dataset.total;$('#more-planets').hidden=true;}
function makeQuery(){
 const state=get(),p=new URLSearchParams({limit:'50',grouping:'rows'});
 if(state.mode==='star')p.set('star',canonicalStar(state.star));
 if(state.pairPlacement==='either')p.set('pairPlacement','either');
 const active=state.slots.map((s,i)=>!!s&&state.enabled[i]);
 state.slots.forEach((s,i)=>{if(active[i]){const glyph=byId.get((i%2?'suffix':'prefix')+'-'+s);p.set((state.matchMode==='shape'?'shape':'p')+i,state.matchMode==='shape'?glyph.shape:s);}});
 const meaningful=[active[0]&&active[1],(active[0]||active[1])&&(active[2]||active[3]),active[2]&&active[3]];
 meaningful.forEach((yes,n)=>{if(yes&&state.joins[n]==='or')p.set('join'+(n+1),'or');});
 return p;
}
function refresh(immediate=false){
 clearTimeout(timer);controller?.abort();sequence++;loading=false;query=null;offset=0;
 const state=get();
 if(!state.apiOnline){clearResults('Run the local API to see matching names. Drag-and-drop and the atlas still work offline.');return;}
 if(state.mode==='star'&&!state.star){clearResults('Enter a star to filter matching names, or choose All stars.');return;}
 if(!state.slots.some(Boolean)&&state.mode==='free'){clearResults('Drop a shape into any box to see matching names across all stars.');return;}
 clearResults('Updating matching names…');
 const ticket=sequence;
 timer=setTimeout(()=>{if(ticket!==sequence)return;query=makeQuery();load();},immediate?0:250);
}
async function load(){
 if(!query||loading)return;
 const ticket=sequence,request=new URLSearchParams(query);request.set('offset',String(offset));
 controller=new AbortController();loading=true;$('#more-planets').hidden=true;
 $('#planet-search-status').textContent='Finding canonical names that match the combination…';
 try{
  const result=await api('candidates?'+request,{signal:controller.signal});
  if(ticket!==sequence)return;
  for(const item of result.items){
   const card=document.createElement('div');card.className='planet-result';card.dataset.name=item.name;
   const art=document.createElement('div');art.className='planet-art';
   item.syllables.forEach((s,i)=>{const image=document.createElement('img');image.src='assets/glyphs/'+(i%2?'suffix':'prefix')+'-'+s+'-default.svg';image.alt=s;art.append(image);});
   const text=document.createElement('div'),name=document.createElement('code'),parent=document.createElement('small');
   name.textContent=item.name;parent.textContent='Spawning star: '+item.parent;text.append(name,parent);
   const use=document.createElement('button');use.textContent='Use';use.setAttribute('aria-label','Use '+item.name);
   use.addEventListener('click',()=>{set({slots:[...item.syllables],matchMode:'exact'});toast('Loaded exact name '+item.name);});
   card.append(art,text,use);$('#planet-results').append(card);
  }
  offset+=result.items.length;
  const status=$('#planet-search-status');status.dataset.total=String(result.total);status.dataset.star=result.star||'';
  status.textContent=Number(result.total).toLocaleString()+' matching names '+(result.star?'under '+result.star:'across all stars')+'; showing '+offset.toLocaleString()+'. Spawn availability not checked.';
  $('#more-planets').hidden=offset>=result.total;
 }catch(error){if(ticket===sequence&&error.name!=='AbortError')$('#planet-search-status').textContent=error.message;}
 finally{if(ticket===sequence)loading=false;}
}
function discardDraft(index){const input=$('[data-slot-input="'+index+'"]');delete input.dataset.committed;}
function clearSlot(index=get().active){const slots=[...get().slots];discardDraft(index);slots[index]=null;set({slots,active:index});}
function assign(payload,index){
 const state=get(),kind=index%2?'suffix':'prefix';let glyph;
 if(payload.id){
  const supplied=byId.get(payload.id);if(!supplied){toast('Unknown glyph.');return;}
  if(state.matchMode==='exact'){
   if(supplied.kind!==kind){toast('Box '+(index+1)+' needs a '+kind+' glyph.');return;}glyph=supplied;
  }else glyph=supplied.kind===kind?supplied:rows.find(g=>g.kind===kind&&g.shape===supplied.shape);
 }else if(payload.shape&&state.matchMode==='shape')glyph=rows.find(g=>g.kind===kind&&g.shape===payload.shape);
 if(!glyph){toast('That shape has no '+kind+' glyphs for box '+(index+1)+'.');return;}
 discardDraft(index);const slots=[...state.slots];slots[index]=glyph.syllable;
 set({slots,active:(index+1)%4});
}
function startDrag(event,payload){
 if(!event.dataTransfer)return;
 ctx.setDragging(true);event.dataTransfer.effectAllowed='copy';
 const value=JSON.stringify(payload);event.dataTransfer.setData(transferType,value);event.dataTransfer.setData('text/plain',value);
}
function finishDrag(){all('.drop-ready').forEach(b=>b.classList.remove('drop-ready'));setTimeout(()=>ctx.setDragging(false),100);}
all('[data-open]').forEach(button=>{
 button.draggable=true;button.querySelectorAll('img').forEach(i=>i.draggable=false);
 button.addEventListener('dragstart',event=>startDrag(event,{id:button.dataset.open}));button.addEventListener('dragend',finishDrag);
});
all('[data-shape-source]').forEach(button=>{
 button.addEventListener('dragstart',event=>startDrag(event,{shape:button.dataset.shapeSource}));
 button.addEventListener('dragend',finishDrag);
 button.addEventListener('click',()=>assign({shape:button.dataset.shapeSource},get().active));
});
all('[data-slot]').forEach(button=>{
 const index=Number(button.dataset.slot),column=button.closest('[data-slot-column]');
 function selectSlot(){ctx.reset();set({active:index},{query:false,validate:false});}
 const checkbox=column.querySelector('[data-slot-enabled]');
 checkbox.addEventListener('focus',selectSlot);
 checkbox.addEventListener('change',()=>{const enabled=[...get().enabled];enabled[index]=checkbox.checked;set({enabled,active:index});});
 const copy=button.querySelector('[data-slot-copy]'),art=button.querySelector('[data-slot-art]');
 for(const source of [copy,art]){
  source.addEventListener('dragstart',event=>{const syllable=get().slots[index];if(syllable)startDrag(event,{id:(index%2?'suffix':'prefix')+'-'+syllable});else event.preventDefault();});
  source.addEventListener('dragend',finishDrag);
 }
 copy.addEventListener('click',()=>{if(!ctx.isDragging()&&get().slots[index])assign({id:(index%2?'suffix':'prefix')+'-'+get().slots[index]},get().active);});
 art.addEventListener('click',()=>{if(!ctx.isDragging())selectSlot();});
 button.querySelector('[data-slot-clear]').addEventListener('click',()=>clearSlot(index));
 const input=column.querySelector('[data-slot-input]'),select=button.querySelector('[data-slot-select]');
 input.addEventListener('focus',selectSlot);
 function commit(){
  const value=input.value.startsWith('~')?input.value.slice(1):input.value,kind=index%2?'suffix':'prefix',valid=input.value===''||(/^[a-z]{3}$/.test(value)&&byId.has(kind+'-'+value));
  input.setAttribute('aria-invalid',String(!valid));
  column.querySelector('.slot-error').textContent=valid?'':'Enter a lowercase '+kind+' syllable (3 letters). Last valid value retained: '+(get().slots[index]||'empty')+'.';
  if(!valid){ctx.draftChanged();return;}
  input.dataset.committed=value;
  const slots=[...get().slots];slots[index]=value||null;set({slots});
 }
 input.addEventListener('input',commit);input.addEventListener('blur',()=>{if(input.getAttribute('aria-invalid')==='true')commit();});
 input.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();commit();}});
 select.addEventListener('click',selectSlot);
 button.addEventListener('click',event=>{if(event.target===button)selectSlot();});
 for(const target of [select,art])target.addEventListener('keydown',event=>{if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();clearSlot(index);}});
 button.addEventListener('dragover',event=>{if([...event.dataTransfer.types].includes(transferType)){event.preventDefault();event.dataTransfer.dropEffect='copy';button.classList.add('drop-ready');}});
 button.addEventListener('dragleave',()=>button.classList.remove('drop-ready'));
 button.addEventListener('drop',event=>{
  event.preventDefault();button.classList.remove('drop-ready');
  try{const text=event.dataTransfer.getData(transferType);if(!text||text.length>300)throw Error();const payload=JSON.parse(text);if(!payload||typeof payload!=='object'||Array.isArray(payload)||Object.keys(payload).some(k=>!['id','shape'].includes(k)))throw Error();assign(payload,index);}catch{toast('Drop a shape or glyph from this atlas.');}
 });
});
all('[data-join-before]').forEach(select=>select.addEventListener('change',()=>{
 const n=Number(select.dataset.joinBefore)-1,value=select.value,middle=n===1,either=middle&&['and-either','or-either'].includes(value);
 if(!['and','or'].includes(value)&&!either)return;
 const joins=[...get().joins];joins[n]=either?value.split('-')[0]:value;
 set({joins,...(middle?{pairPlacement:either?'either':'fixed'}:{})},{validate:false});
}));
$('#clear-slot').addEventListener('click',()=>clearSlot());
$('#clear-slots').addEventListener('click',()=>{[0,1,2,3].forEach(discardDraft);set({slots:[null,null,null,null],active:0});});
$('#match-mode').value=get().matchMode;
$('#match-mode').addEventListener('change',()=>{ctx.reset();set({matchMode:$('#match-mode').value});});
$('#star').value=get().star;document.querySelector('input[name=mode][value='+get().mode+']').checked=true;
all('input[name=mode]').forEach(radio=>radio.addEventListener('change',()=>set({mode:radio.value})));
$('#star').addEventListener('input',()=>set({star:$('#star').value}));
$('#star').addEventListener('change',()=>refresh(true));
$('#find-planets').addEventListener('click',()=>refresh(true));
$('#more-planets').addEventListener('click',load);
$('#validate').addEventListener('click',ctx.validate);
$('#save-composition').addEventListener('click',async()=>{
 if(!ctx.getPreview()?.eligible||all('[data-slot-input]').some(b=>b.getAttribute('aria-invalid')==='true'))return;
 $('#save-composition').disabled=true;
 try{
  const state=get(),payload={syllables:[...state.slots],mode:state.mode,...(state.mode==='star'?{star:canonicalStar(state.star)}:{})};
  const saved=await api('compositions',{method:'POST',body:JSON.stringify(payload)}),readback=await api('compositions');
  if(!readback.items.some(item=>item.id===saved.item.id&&item.name===saved.item.name))throw Error('Save could not be verified.');
  toast('Saved locally: '+saved.item.name);await ctx.loadSaved();
 }catch(error){toast(error.message);}finally{$('#save-composition').disabled=!ctx.getPreview()?.eligible||all('[data-slot-input]').some(b=>b.getAttribute('aria-invalid')==='true');}
});
return {refresh,more:load};
};

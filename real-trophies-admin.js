(() => {
const URL='https://vqtrpvtedhhekdrmktgq.supabase.co',KEY='sb_publishable_Ywa22K1DwZfDHMDwXDYU6A_dRvRUHjo',BUCKET='coach-kazu-real-trophies',MAX=5*1024*1024,MAX_GALLERY=8;
const db=window.coachKazuDb||(window.coachKazuDb=window.supabase.createClient(URL,KEY));
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let rows=[],editing=null,removeMain=false,coverPreview=null,mainPreview=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const niceDate=s=>{if(!s)return'';try{return new Date(s+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}catch{return s}};
const url=p=>p?db.storage.from(BUCKET).getPublicUrl(p).data.publicUrl:'';
function toast(m){const t=$('#toast');if(!t)return alert(m);t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000)}
function valid(f){if(!f)return true;if(!['image/jpeg','image/png'].includes(f.type)){toast('JPG/JPEG or PNG images only.');return false}if(f.size>MAX){toast('Each photo must be 5 MB or smaller.');return false}return true}
function ext(f){return (f.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg'}
async function upload(f,prefix){if(!valid(f))throw new Error('Invalid image file.');const path=prefix+'/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext(f);const r=await db.storage.from(BUCKET).upload(path,f,{cacheControl:'3600',upsert:false});if(r.error)throw r.error;return path}
function placementIcon(p){return p==='Champion'?'🏆':p==='1st Runner-Up'?'🥈':p==='2nd Runner-Up'?'🥉':'🏅'}
function reset(){
 editing=null;removeMain=false;$('#realTrophyId').value='';$('#realTrophyForm').reset();$('#realTrophyPublished').checked=true;$('#realTrophyFeatured').checked=false;$('#realTrophyPlacement').value='Champion';$('#realTrophySave').textContent='Add Podium Highlight';$('#realTrophyCancel').style.display='none';renderMain();renderGallery([]);
}
function renderCover(path){
 const root=$('#realTrophySectionCoverPreview');if(!root)return;
 const f=$('#realTrophySectionCoverFile')?.files?.[0];
 if(coverPreview){URL.revokeObjectURL?.(coverPreview);coverPreview=null}
 const src=f?(coverPreview=window.URL.createObjectURL(f)):(path?url(path):'');
 root.innerHTML=src?'<img src="'+esc(src)+'" alt=""><div><strong>Section Cover Photo</strong><span>Shown behind THE REAL TROPHIES heading.</span></div>':'<div class="real-trophy-admin-empty">No section cover uploaded yet.</div>';
}
function renderMain(){
 const root=$('#realTrophyMainPreview');if(!root)return;
 const f=$('#realTrophyMainFile')?.files?.[0];
 if(mainPreview){URL.revokeObjectURL?.(mainPreview);mainPreview=null}
 const src=f?(mainPreview=window.URL.createObjectURL(f)):(!removeMain&&editing?.cover_storage_path?url(editing.cover_storage_path):'');
 root.innerHTML=src?'<img src="'+esc(src)+'" alt=""><div><strong>Main Podium Photo</strong><span>Used as the card cover on the public site.</span></div>':'<div class="real-trophy-admin-empty">No main photo selected.</div>';
 $('#realTrophyRemoveMain').style.display=(src&&!f)?'inline-flex':'none';
}
function renderGallery(media){
 const root=$('#realTrophyGalleryManager');if(!root)return;
 if(!media?.length){root.innerHTML='<div class="real-trophy-admin-empty">No additional photos yet.</div>';return}
 root.innerHTML=media.map((m,i)=>'<article class="real-trophy-gallery-item"><img src="'+esc(url(m.storage_path))+'" alt=""><div><span>Photo '+(i+1)+'</span><button type="button" data-remove-media="'+m.id+'">Remove</button></div></article>').join('');
 root.querySelectorAll('[data-remove-media]').forEach(b=>b.onclick=()=>removeMedia(b.dataset.removeMedia));
}
async function load(){
 const [s,t]=await Promise.all([
  db.from('real_trophies_settings').select('*').eq('id',1).maybeSingle(),
  db.from('real_trophies').select('*').order('is_featured',{ascending:false}).order('sort_order').order('created_at',{ascending:false})
 ]);
 if(s.error)return toast(s.error.message);if(t.error)return toast(t.error.message);
 renderCover(s.data?.cover_storage_path||null);
 const ids=(t.data||[]).map(x=>x.id);let media=[];
 if(ids.length){const m=await db.from('real_trophy_media').select('*').in('trophy_id',ids).order('sort_order');if(m.error)return toast(m.error.message);media=m.data||[]}
 rows=(t.data||[]).map(x=>Object.assign({},x,{media:media.filter(m=>m.trophy_id===x.id)}));
 renderList();
}
function renderList(){
 const root=$('#realTrophyAdminList');if(!root)return;
 if(!rows.length){root.innerHTML='<div class="empty">No student podium highlights yet.</div>';return}
 root.innerHTML=rows.map((x,i)=>'<article class="real-trophy-admin-row">'+
  (x.cover_storage_path?'<img src="'+esc(url(x.cover_storage_path))+'" alt="">':'<div class="real-trophy-admin-fallback">'+placementIcon(x.placement)+'</div>')+
  '<div class="real-trophy-admin-copy"><div class="real-trophy-admin-title"><div><span>'+esc(x.placement)+'</span><h4>'+esc(x.student_name)+'</h4></div><em class="'+(x.is_published?'live':'hidden')+'">'+(x.is_published?'LIVE':'HIDDEN')+'</em></div>'+
  '<p><strong>'+esc(x.event_name)+'</strong><br>'+esc(x.category)+(x.event_date?' • '+esc(niceDate(x.event_date)):'')+'</p>'+
  '<small>'+(x.media?.length||0)+' additional photo'+((x.media?.length||0)===1?'':'s')+(x.is_featured?' • FEATURED':'')+'</small>'+
  '<div class="media-actions"><button type="button" data-edit="'+x.id+'">Edit</button><button type="button" data-feature="'+x.id+'">'+(x.is_featured?'Unfeature':'Feature')+'</button><button type="button" data-publish="'+x.id+'">'+(x.is_published?'Hide':'Publish')+'</button><button type="button" data-up="'+x.id+'" '+(i===0?'disabled':'')+'>↑</button><button type="button" data-down="'+x.id+'" '+(i===rows.length-1?'disabled':'')+'>↓</button><button class="danger" type="button" data-delete="'+x.id+'">Delete</button></div></div></article>').join('');
 root.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit));
 root.querySelectorAll('[data-feature]').forEach(b=>b.onclick=()=>toggle(b.dataset.feature,'is_featured'));
 root.querySelectorAll('[data-publish]').forEach(b=>b.onclick=()=>toggle(b.dataset.publish,'is_published'));
 root.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>move(b.dataset.up,-1));
 root.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>move(b.dataset.down,1));
 root.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>remove(b.dataset.delete));
}
async function saveCover(){
 const f=$('#realTrophySectionCoverFile')?.files?.[0];if(!f)return;
 const btn=$('#realTrophySaveCover'),old=btn.textContent;btn.disabled=true;btn.textContent='Uploading…';
 try{
  const cur=await db.from('real_trophies_settings').select('cover_storage_path').eq('id',1).maybeSingle();if(cur.error)throw cur.error;
  const path=await upload(f,'section-cover');
  const u=await db.from('real_trophies_settings').upsert({id:1,cover_storage_path:path,updated_at:new Date().toISOString()});if(u.error)throw u.error;
  if(cur.data?.cover_storage_path)await db.storage.from(BUCKET).remove([cur.data.cover_storage_path]);
  $('#realTrophySectionCoverFile').value='';toast('THE REAL TROPHIES cover updated.');await load();
 }catch(e){toast(e.message||'Could not upload section cover.')}finally{btn.disabled=false;btn.textContent=old}
}
async function clearCover(){
 if(!confirm('Remove the THE REAL TROPHIES section cover photo?'))return;
 const cur=await db.from('real_trophies_settings').select('cover_storage_path').eq('id',1).maybeSingle();if(cur.error)return toast(cur.error.message);
 const u=await db.from('real_trophies_settings').update({cover_storage_path:null,updated_at:new Date().toISOString()}).eq('id',1);if(u.error)return toast(u.error.message);
 if(cur.data?.cover_storage_path)await db.storage.from(BUCKET).remove([cur.data.cover_storage_path]);toast('Section cover removed.');load();
}
async function save(e){
 e.preventDefault();const btn=$('#realTrophySave'),old=btn.textContent;btn.disabled=true;btn.textContent='Saving…';
 let uploadedMain=null,uploadedGallery=[];
 try{
  const student=$('#realTrophyStudent').value.trim(),event=$('#realTrophyEvent').value.trim(),category=$('#realTrophyCategory').value.trim();
  if(!student||!event||!category)throw new Error('Student name, event and category are required.');
  const f=$('#realTrophyMainFile')?.files?.[0];if(f)uploadedMain=await upload(f,'main');
  const gallery=[...($('#realTrophyGalleryFile')?.files||[])];if(gallery.length+(editing?.media?.length||0)>MAX_GALLERY)throw new Error('Maximum of 8 additional photos per podium highlight.');
  for(const file of gallery)uploadedGallery.push(await upload(file,'gallery'));
  const payload={student_name:student,event_name:event,category,placement:$('#realTrophyPlacement').value,event_date:$('#realTrophyDate').value||null,caption:$('#realTrophyCaption').value.trim()||null,is_featured:$('#realTrophyFeatured').checked,is_published:$('#realTrophyPublished').checked,updated_at:new Date().toISOString()};
  if(uploadedMain)payload.cover_storage_path=uploadedMain;else if(removeMain)payload.cover_storage_path=null;
  let id;
  if(editing){const u=await db.from('real_trophies').update(payload).eq('id',editing.id).select('id').single();if(u.error)throw u.error;id=u.data.id}
  else{payload.sort_order=rows.length+1;const u=await db.from('real_trophies').insert(payload).select('id').single();if(u.error)throw u.error;id=u.data.id}
  if(uploadedGallery.length){const start=editing?.media?.length||0;const ins=await db.from('real_trophy_media').insert(uploadedGallery.map((p,i)=>({trophy_id:id,storage_path:p,sort_order:start+i})));if(ins.error)throw ins.error}
  if(editing&&uploadedMain&&editing.cover_storage_path)await db.storage.from(BUCKET).remove([editing.cover_storage_path]);
  if(editing&&removeMain&&editing.cover_storage_path)await db.storage.from(BUCKET).remove([editing.cover_storage_path]);
  toast(editing?'Podium highlight updated.':'Podium highlight added.');reset();await load();
 }catch(err){
  const clean=[uploadedMain,...uploadedGallery].filter(Boolean);if(clean.length)await db.storage.from(BUCKET).remove(clean);
  toast(err.message||'Could not save podium highlight.');
 }finally{btn.disabled=false;btn.textContent=old}
}
function edit(id){
 editing=rows.find(x=>x.id===id);if(!editing)return;
 $('#realTrophyId').value=editing.id;$('#realTrophyStudent').value=editing.student_name||'';$('#realTrophyEvent').value=editing.event_name||'';$('#realTrophyCategory').value=editing.category||'';$('#realTrophyPlacement').value=editing.placement||'Champion';$('#realTrophyDate').value=editing.event_date||'';$('#realTrophyCaption').value=editing.caption||'';$('#realTrophyFeatured').checked=!!editing.is_featured;$('#realTrophyPublished').checked=!!editing.is_published;$('#realTrophyMainFile').value='';$('#realTrophyGalleryFile').value='';removeMain=false;$('#realTrophySave').textContent='Save Changes';$('#realTrophyCancel').style.display='inline-flex';renderMain();renderGallery(editing.media||[]);$('#realTrophyForm').scrollIntoView({behavior:'smooth',block:'start'});
}
async function toggle(id,key){const x=rows.find(v=>v.id===id);if(!x)return;const u=await db.from('real_trophies').update({[key]:!x[key],updated_at:new Date().toISOString()}).eq('id',id);if(u.error)return toast(u.error.message);load()}
async function move(id,dir){const i=rows.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=rows.length)return;const a=rows[i],b=rows[j],sa=Number(a.sort_order||i+1),sb=Number(b.sort_order||j+1);let u=await db.from('real_trophies').update({sort_order:sb}).eq('id',a.id);if(u.error)return toast(u.error.message);u=await db.from('real_trophies').update({sort_order:sa}).eq('id',b.id);if(u.error)return toast(u.error.message);load()}
async function removeMedia(id){const m=editing?.media?.find(x=>x.id===id);if(!m||!confirm('Remove this additional photo?'))return;const d=await db.from('real_trophy_media').delete().eq('id',id);if(d.error)return toast(d.error.message);await db.storage.from(BUCKET).remove([m.storage_path]);toast('Photo removed.');await load();editing=rows.find(x=>x.id===editing.id);renderGallery(editing?.media||[])}
async function remove(id){const x=rows.find(v=>v.id===id);if(!x||!confirm('Delete this student podium highlight and all of its photos?'))return;const paths=[x.cover_storage_path,...(x.media||[]).map(m=>m.storage_path)].filter(Boolean);const d=await db.from('real_trophies').delete().eq('id',id);if(d.error)return toast(d.error.message);if(paths.length)await db.storage.from(BUCKET).remove(paths);if(editing?.id===id)reset();toast('Podium highlight deleted.');load()}
function init(){
 $('#realTrophyForm')?.addEventListener('submit',save);$('#realTrophyCancel')?.addEventListener('click',reset);$('#realTrophyRefresh')?.addEventListener('click',load);$('#realTrophyMainFile')?.addEventListener('change',()=>{removeMain=false;renderMain()});$('#realTrophyRemoveMain')?.addEventListener('click',()=>{removeMain=true;$('#realTrophyMainFile').value='';renderMain()});$('#realTrophySaveCover')?.addEventListener('click',saveCover);$('#realTrophyRemoveCover')?.addEventListener('click',clearCover);$('#realTrophySectionCoverFile')?.addEventListener('change',()=>renderCover(null));
 db.auth.onAuthStateChange((_,s)=>{if(s)setTimeout(load,120)});window.addEventListener('coach:admin-ready',()=>setTimeout(load,120));reset();db.auth.getSession().then(({data})=>{if(data.session)load()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
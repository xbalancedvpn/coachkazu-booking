(() => {
const URL='https://vqtrpvtedhhekdrmktgq.supabase.co',KEY='sb_publishable_Ywa22K1DwZfDHMDwXDYU6A_dRvRUHjo',BUCKET='coach-kazu-achievements',MAX_FILE=5*1024*1024,MAX_GALLERY=8;
const db=window.coachKazuDb||(window.coachKazuDb=window.supabase.createClient(URL,KEY)),$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let rows=[],removeCoverOnSave=false,coverPreviewUrl=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=msg=>{const t=$('#toast');if(!t)return alert(msg);t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000)};
const niceDate=s=>{if(!s)return'';try{return new Date(s+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}catch{return s}};
const publicUrl=path=>path?db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl:'';
const placements=['Champion','1st Runner-Up','2nd Runner-Up','Other'];
const placementIcon=p=>p==='Champion'?'🏆':p==='1st Runner-Up'?'🥈':p==='2nd Runner-Up'?'🥉':'•';
function validImage(file){
 if(!file)return true;
 if(!['image/jpeg','image/png'].includes(file.type)){toast('JPG/JPEG or PNG images only.');return false}
 if(file.size>MAX_FILE){toast('Each achievement photo must be 5 MB or smaller.');return false}
 return true;
}
function inferPlatform(value){
 try{
  const h=new window.URL(value).hostname.toLowerCase();
  if(h.includes('youtube.com')||h.includes('youtu.be'))return'YouTube';
  if(h.includes('facebook.com')||h.includes('fb.watch'))return'Facebook';
  if(h.includes('tiktok.com'))return'TikTok';
  if(h.includes('instagram.com'))return'Instagram';
  return'Other';
 }catch{return'Other'}
}
function normalizedVideoUrl(value){
 try{const u=new window.URL(String(value||'').trim());return ['http:','https:'].includes(u.protocol)?u.href:null}catch{return null}
}
function addResultRow(data={}){
 const root=$('#achievementResultsEditor');if(!root)return;
 const row=document.createElement('div');row.className='achievement-result-row';
 row.innerHTML='<label>Division / category<input class="achievement-result-division" type="text" maxlength="180" placeholder="e.g. Intermediate High Men’s Doubles" value="'+esc(data.division||'')+'"></label><label>Placement<select class="achievement-result-placement">'+placements.map(p=>'<option'+(p===(data.placement||'Champion')?' selected':'')+'>'+p+'</option>').join('')+'</select></label><button class="achievement-row-remove" type="button" aria-label="Remove result">×</button>';
 row.querySelector('.achievement-row-remove').onclick=()=>{row.remove();if(!root.children.length)addResultRow()};
 root.appendChild(row);
}
function addVideoRow(data={}){
 const root=$('#achievementVideosEditor');if(!root)return;
 const row=document.createElement('div');row.className='achievement-video-row';
 row.innerHTML='<label>Video link<input class="achievement-video-url" type="url" inputmode="url" placeholder="Paste Facebook, YouTube, TikTok or Instagram link" value="'+esc(data.external_url||'')+'"></label><button class="achievement-row-remove" type="button" aria-label="Remove video link">×</button>';
 row.querySelector('.achievement-row-remove').onclick=()=>row.remove();
 root.appendChild(row);
}
function collectResults(){
 return $$('.achievement-result-row').map((row,i)=>({division:row.querySelector('.achievement-result-division').value.trim(),placement:row.querySelector('.achievement-result-placement').value,sort_order:i})).filter(x=>x.division);
}
function collectVideos(){
 const out=[];
 for(const [i,row] of $$('.achievement-video-row').entries()){
  const raw=row.querySelector('.achievement-video-url').value.trim();if(!raw)continue;
  const url=normalizedVideoUrl(raw);if(!url)throw new Error('One of the video links is not a valid http/https URL.');
  out.push({media_type:'video',external_url:url,platform:inferPlatform(url),sort_order:i});
 }
 return out;
}
function renderCoverPreview(x=null){
 const root=$('#achievementCoverPreview'),removeBtn=$('#achievementRemoveCover');if(!root)return;
 if(coverPreviewUrl){URL.revokeObjectURL?.(coverPreviewUrl);coverPreviewUrl=null}
 const file=$('#achievementFile')?.files?.[0];
 if(file){
  coverPreviewUrl=window.URL.createObjectURL(file);
  root.innerHTML='<img src="'+esc(coverPreviewUrl)+'" alt="New cover preview"><div><strong>New cover selected</strong><span>'+esc(file.name)+' • '+Math.round(file.size/1024)+' KB</span></div>';
  if(removeBtn){removeBtn.style.display='inline-flex';removeBtn.textContent='Clear New Cover'}
  return;
 }
 const current=x||rows.find(r=>r.id===$('#achievementId')?.value);
 if(current?.storage_path&&!removeCoverOnSave){
  root.innerHTML='<img src="'+esc(publicUrl(current.storage_path))+'" alt="Current achievement cover"><div><strong>Current cover photo</strong><span>Select a new JPG/PNG to replace it, or remove it.</span></div>';
  if(removeBtn){removeBtn.style.display='inline-flex';removeBtn.textContent='Remove Cover'}
 }else{
  root.innerHTML='<div class="achievement-cover-empty">No cover photo — the public site will use the Coach Kazu branded fallback card.</div>';
  if(removeBtn)removeBtn.style.display='none';
 }
}
function mediaCounts(x){
 const gallery=(x.media||[]).filter(m=>m.media_type==='photo').length,videos=(x.media||[]).filter(m=>m.media_type==='video').length;
 return (x.storage_path?'1 Cover':'No Cover')+' · '+gallery+' Photo'+(gallery===1?'':'s')+' · '+videos+' Video'+(videos===1?'':'s');
}
function renderGalleryManager(x){
 const root=$('#achievementGalleryManager');if(!root)return;
 if(!x){root.innerHTML='<div class="achievement-media-empty">Save the event first, or select gallery photos below to upload with it.</div>';return}
 const photos=(x.media||[]).filter(m=>m.media_type==='photo').sort((a,b)=>a.sort_order-b.sort_order);
 if(!photos.length){root.innerHTML='<div class="achievement-media-empty">No additional gallery photos yet.</div>';return}
 root.innerHTML=photos.map(m=>'<article class="achievement-gallery-item"><img src="'+esc(publicUrl(m.storage_path))+'" alt=""><div><button type="button" data-replace-gallery="'+m.id+'">Replace</button><button class="danger-mini" type="button" data-remove-gallery="'+m.id+'">Remove</button></div></article>').join('');
 root.querySelectorAll('[data-remove-gallery]').forEach(b=>b.onclick=()=>removeGalleryPhoto(x.id,b.dataset.removeGallery));
 root.querySelectorAll('[data-replace-gallery]').forEach(b=>b.onclick=()=>replaceGalleryPhoto(x.id,b.dataset.replaceGallery));
}
async function removeGalleryPhoto(eventId,mediaId){
 const x=rows.find(r=>r.id===eventId),m=x?.media?.find(v=>v.id===mediaId);if(!m)return;
 if(!confirm('Remove this gallery photo?'))return;
 const {error}=await db.from('achievement_media').delete().eq('id',mediaId);if(error)return toast(error.message);
 if(m.storage_path)await db.storage.from(BUCKET).remove([m.storage_path]);
 x.media=x.media.filter(v=>v.id!==mediaId);renderGalleryManager(x);toast('Gallery photo removed.');
}
async function replaceGalleryPhoto(eventId,mediaId){
 const x=rows.find(r=>r.id===eventId),m=x?.media?.find(v=>v.id===mediaId);if(!m)return;
 const input=document.createElement('input');input.type='file';input.accept='image/jpeg,image/png';
 input.onchange=async()=>{const file=input.files?.[0];if(!file||!validImage(file))return;
  const ext=file.type==='image/png'?'png':'jpg',path='gallery/'+eventId+'/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext;
  const {error:ue}=await db.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(ue)return toast(ue.message);
  const {error}=await db.from('achievement_media').update({storage_path:path}).eq('id',mediaId);
  if(error){await db.storage.from(BUCKET).remove([path]);return toast(error.message)}
  if(m.storage_path)await db.storage.from(BUCKET).remove([m.storage_path]);
  m.storage_path=path;renderGalleryManager(x);toast('Gallery photo replaced.');
 };input.click();
}
function resetForm(){
 $('#achievementForm')?.reset();$('#achievementId').value='';removeCoverOnSave=false;
 $('#achievementResultsEditor').innerHTML='';addResultRow();
 $('#achievementVideosEditor').innerHTML='';
 $('#achievementPublished').checked=true;$('#achievementFeaturedFlag').checked=false;
 $('#achievementSaveBtn').textContent='Add Event';$('#achievementCancelEdit').style.display='none';
 $('#achievementGalleryFile').value='';renderCoverPreview();renderGalleryManager(null);
}
async function load(){
 const root=$('#achievementAdminList');if(!root)return;
 const {data,error}=await db.from('achievements').select('*').order('is_featured',{ascending:false}).order('sort_order').order('achievement_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
 if(error){root.innerHTML='<div class="empty">'+esc(error.message)+'</div>';return}
 const base=data||[],ids=base.map(x=>x.id);let results=[],media=[];
 if(ids.length){
  const [rr,mr]=await Promise.all([
   db.from('achievement_results').select('*').in('achievement_id',ids).order('sort_order'),
   db.from('achievement_media').select('*').in('achievement_id',ids).order('sort_order')
  ]);
  if(rr.error)return root.innerHTML='<div class="empty">'+esc(rr.error.message)+'</div>';
  if(mr.error)return root.innerHTML='<div class="empty">'+esc(mr.error.message)+'</div>';
  results=rr.data||[];media=mr.data||[];
 }
 rows=base.map(x=>Object.assign({},x,{results:results.filter(r=>r.achievement_id===x.id),media:media.filter(m=>m.achievement_id===x.id)}));
 root.innerHTML=rows.length?rows.map((x,i)=>{
  const resultHtml=x.results.length?'<div class="achievement-admin-results">'+x.results.slice(0,4).map(r=>'<span class="place-'+esc(r.placement.toLowerCase().replace(/[^a-z0-9]+/g,'-'))+'">'+placementIcon(r.placement)+' '+esc(r.placement)+' — '+esc(r.division)+'</span>').join('')+(x.results.length>4?'<span>+'+(x.results.length-4)+' more</span>':'')+'</div>':'<div class="achievement-admin-results"><span>No results encoded yet</span></div>';
  const image=x.storage_path?'<img src="'+esc(publicUrl(x.storage_path))+'" alt="">':'<div class="achievement-admin-fallback"><img src="assets/coach-kazu-favicon.webp?v=3" alt=""><span>NO COVER</span></div>';
  return '<article class="achievement-admin-row">'+image+'<div class="achievement-admin-copy"><div class="achievement-admin-title"><div><span class="achievement-admin-type">'+(x.is_featured?'FEATURED EVENT':'TOURNAMENT / EVENT')+'</span><h4>'+esc(x.title)+'</h4></div>'+(x.is_published?'<span class="achievement-live-badge">PUBLIC</span>':'<span class="achievement-hidden-badge">HIDDEN</span>')+'</div><p>'+esc([x.venue,niceDate(x.achievement_date)].filter(Boolean).join(' • ')||'Date / venue not added yet')+'</p>'+resultHtml+'<div class="achievement-admin-media-count">'+esc(mediaCounts(x))+'</div><div class="media-actions"><button data-edit-achievement="'+x.id+'">Edit</button><button data-feature-achievement="'+x.id+'" data-featured="'+x.is_featured+'">'+(x.is_featured?'Unfeature':'Feature')+'</button><button data-publish-achievement="'+x.id+'" data-published="'+x.is_published+'">'+(x.is_published?'Hide':'Publish')+'</button><button data-up-achievement="'+x.id+'" '+(i===0?'disabled':'')+'>↑ Up</button><button data-down-achievement="'+x.id+'" '+(i===rows.length-1?'disabled':'')+'>↓ Down</button><button class="danger-mini" data-delete-achievement="'+x.id+'">Delete</button></div></div></article>';
 }).join(''):'<div class="empty">No achievement events yet. Add the first tournament above.</div>';
 root.querySelectorAll('[data-edit-achievement]').forEach(b=>b.onclick=()=>edit(b.dataset.editAchievement));
 root.querySelectorAll('[data-feature-achievement]').forEach(b=>b.onclick=()=>feature(b.dataset.featureAchievement,b.dataset.featured!=='true'));
 root.querySelectorAll('[data-publish-achievement]').forEach(b=>b.onclick=()=>publish(b.dataset.publishAchievement,b.dataset.published!=='true'));
 root.querySelectorAll('[data-up-achievement]').forEach(b=>b.onclick=()=>move(b.dataset.upAchievement,-1));
 root.querySelectorAll('[data-down-achievement]').forEach(b=>b.onclick=()=>move(b.dataset.downAchievement,1));
 root.querySelectorAll('[data-delete-achievement]').forEach(b=>b.onclick=()=>removeEvent(b.dataset.deleteAchievement));
}
function edit(id){
 const x=rows.find(r=>r.id===id);if(!x)return;
 $('#achievementId').value=x.id;$('#achievementTitle').value=x.title||x.event_name||'';$('#achievementDate').value=x.achievement_date||'';$('#achievementVenue').value=x.venue||'';$('#achievementDescription').value=x.description||'';
 $('#achievementPublished').checked=!!x.is_published;$('#achievementFeaturedFlag').checked=!!x.is_featured;$('#achievementFile').value='';$('#achievementGalleryFile').value='';removeCoverOnSave=false;
 $('#achievementResultsEditor').innerHTML='';(x.results.length?x.results:[{}]).forEach(addResultRow);
 $('#achievementVideosEditor').innerHTML='';(x.media||[]).filter(m=>m.media_type==='video').forEach(addVideoRow);
 $('#achievementSaveBtn').textContent='Save Changes';$('#achievementCancelEdit').style.display='inline-flex';
 renderCoverPreview(x);renderGalleryManager(x);$('#achievementsAdminSection')?.scrollIntoView({behavior:'smooth',block:'start'});
}
async function uploadImage(file,path){
 const {error}=await db.storage.from(BUCKET).upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(error)throw error;return path;
}
async function syncResults(eventId,results){
 const {error:de}=await db.from('achievement_results').delete().eq('achievement_id',eventId);if(de)throw de;
 if(results.length){const {error}=await db.from('achievement_results').insert(results.map(x=>Object.assign({achievement_id:eventId},x)));if(error)throw error}
}
async function syncVideos(eventId,videos){
 const {error:de}=await db.from('achievement_media').delete().eq('achievement_id',eventId).eq('media_type','video');if(de)throw de;
 if(videos.length){const {error}=await db.from('achievement_media').insert(videos.map(x=>Object.assign({achievement_id:eventId},x)));if(error)throw error}
}
async function uploadGallery(eventId,files,existingCount){
 if(existingCount+files.length>MAX_GALLERY)throw new Error('Maximum of '+MAX_GALLERY+' gallery photos per event.');
 const uploaded=[];
 try{
  for(let i=0;i<files.length;i++){
   const file=files[i];if(!validImage(file))throw new Error('Invalid gallery image.');
   const ext=file.type==='image/png'?'png':'jpg',path='gallery/'+eventId+'/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext;
   await uploadImage(file,path);uploaded.push(path);
   const {error}=await db.from('achievement_media').insert({achievement_id:eventId,media_type:'photo',storage_path:path,sort_order:existingCount+i});if(error)throw error;
  }
 }catch(err){if(uploaded.length)await db.storage.from(BUCKET).remove(uploaded);throw err}
}
async function save(e){
 e.preventDefault();
 const id=$('#achievementId').value.trim(),title=$('#achievementTitle').value.trim(),file=$('#achievementFile').files?.[0],galleryFiles=[...($('#achievementGalleryFile').files||[])];
 if(!title)return toast('Add the tournament / event name.');
 if(file&&!validImage(file))return;
 if(galleryFiles.some(f=>!['image/jpeg','image/png'].includes(f.type)||f.size>MAX_FILE))return toast('Gallery photos must be JPG/PNG and 5 MB or smaller each.');
 let results,videos;try{results=collectResults();videos=collectVideos()}catch(err){return toast(err.message)}
 const current=rows.find(r=>r.id===id),existingGallery=(current?.media||[]).filter(m=>m.media_type==='photo').length;
 if(existingGallery+galleryFiles.length>MAX_GALLERY)return toast('Maximum of '+MAX_GALLERY+' gallery photos per event.');
 const btn=$('#achievementSaveBtn');btn.disabled=true;btn.textContent=id?'Saving…':'Creating…';
 let eventId=id,created=false,newCoverPath=null,oldCover=current?.storage_path||null;
 try{
  const payload={title,event_name:title,achievement_type:'Tournament',achievement_date:$('#achievementDate').value||null,venue:$('#achievementVenue').value.trim()||null,description:$('#achievementDescription').value.trim()||null,is_published:$('#achievementPublished').checked,is_featured:$('#achievementFeaturedFlag').checked,updated_at:new Date().toISOString()};
  if(!eventId){
   const {data:max}=await db.from('achievements').select('sort_order').order('sort_order',{ascending:false}).limit(1);payload.sort_order=Number(max?.[0]?.sort_order||0)+1;payload.storage_path=null;
   const {data,error}=await db.from('achievements').insert(payload).select('id').single();if(error)throw error;eventId=data.id;created=true;
  }
  if(file){
   const ext=file.type==='image/png'?'png':'jpg';newCoverPath='covers/'+eventId+'/'+Date.now()+'-'+crypto.randomUUID()+'.'+ext;await uploadImage(file,newCoverPath);payload.storage_path=newCoverPath;
  }else if(removeCoverOnSave)payload.storage_path=null;
  if(id){const {error}=await db.from('achievements').update(payload).eq('id',eventId);if(error)throw error}
  else if(newCoverPath){const {error}=await db.from('achievements').update({storage_path:newCoverPath}).eq('id',eventId);if(error)throw error}
  await syncResults(eventId,results);await syncVideos(eventId,videos);
  if(galleryFiles.length)await uploadGallery(eventId,galleryFiles,existingGallery);
  if((newCoverPath||removeCoverOnSave)&&oldCover)await db.storage.from(BUCKET).remove([oldCover]);
  toast(created?'Achievement event added.':'Achievement event updated.');resetForm();await load();
 }catch(err){
  if(newCoverPath)await db.storage.from(BUCKET).remove([newCoverPath]);
  if(created&&eventId)await db.from('achievements').delete().eq('id',eventId);
  toast(err.message||'Could not save achievement event.');
 }finally{btn.disabled=false;if(!$('#achievementId').value)btn.textContent='Add Event'}
}
async function feature(id,v){
 const {error}=await db.from('achievements').update({is_featured:v,updated_at:new Date().toISOString()}).eq('id',id);if(error)return toast(error.message);
 toast(v?'Event added to featured highlights.':'Event removed from featured highlights.');load();
}
async function publish(id,v){
 const {error}=await db.from('achievements').update({is_published:v,updated_at:new Date().toISOString()}).eq('id',id);if(error)return toast(error.message);toast(v?'Achievement published.':'Achievement hidden.');load();
}
async function move(id,dir){
 const i=rows.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=rows.length)return;
 const a=rows[i],b=rows[j],sa=Number(a.sort_order||i+1),sb=Number(b.sort_order||j+1);
 const {error:e1}=await db.from('achievements').update({sort_order:sb}).eq('id',a.id);if(e1)return toast(e1.message);
 const {error:e2}=await db.from('achievements').update({sort_order:sa}).eq('id',b.id);if(e2)return toast(e2.message);
 toast('Achievement order updated.');load();
}
async function removeEvent(id){
 const x=rows.find(r=>r.id===id);if(!x||!confirm('Delete this achievement event, its results, photos and video links?'))return;
 const paths=[x.storage_path,...(x.media||[]).filter(m=>m.media_type==='photo').map(m=>m.storage_path)].filter(Boolean);
 const {error}=await db.from('achievements').delete().eq('id',id);if(error)return toast(error.message);
 if(paths.length)await db.storage.from(BUCKET).remove(paths);
 if($('#achievementId')?.value===id)resetForm();toast('Achievement event deleted.');load();
}
function init(){
 $('#achievementForm')?.addEventListener('submit',save);$('#achievementCancelEdit')?.addEventListener('click',resetForm);$('#refreshAchievementsBtn')?.addEventListener('click',load);
 $('#addAchievementResult')?.addEventListener('click',()=>addResultRow());$('#addAchievementVideo')?.addEventListener('click',()=>addVideoRow());
 $('#achievementFile')?.addEventListener('change',()=>{removeCoverOnSave=false;renderCoverPreview()});
 $('#achievementRemoveCover')?.addEventListener('click',()=>{const f=$('#achievementFile');if(f?.files?.length){f.value='';removeCoverOnSave=false}else removeCoverOnSave=true;renderCoverPreview()});
 db.auth.onAuthStateChange((_,s)=>{if(s)setTimeout(load,150)});window.addEventListener('coach:admin-ready',()=>setTimeout(load,120));
 resetForm();db.auth.getSession().then(({data})=>{if(data.session)load()});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
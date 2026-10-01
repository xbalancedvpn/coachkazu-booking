(() => {
const URL='https://vqtrpvtedhhekdrmktgq.supabase.co',KEY='sb_publishable_Ywa22K1DwZfDHMDwXDYU6A_dRvRUHjo',BUCKET='coach-kazu-achievements';
const db=window.coachKazuDb||(window.coachKazuDb=window.supabase.createClient(URL,KEY)),$=s=>document.querySelector(s);
let rows=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=msg=>{const t=$('#toast');if(!t)return alert(msg);t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2800)};
const niceDate=s=>{if(!s)return'';try{return new Date(s+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}catch{return s}};
function resetForm(){
 $('#achievementForm')?.reset();
 if($('#achievementPublished'))$('#achievementPublished').checked=true;
 if($('#achievementId'))$('#achievementId').value='';
 if($('#achievementSaveBtn'))$('#achievementSaveBtn').textContent='Add Achievement';
 if($('#achievementCancelEdit'))$('#achievementCancelEdit').style.display='none';
 if($('#achievementFileHint'))$('#achievementFileHint').textContent='(required for new achievement)';
}
async function load(){
 const root=$('#achievementAdminList');if(!root)return;
 const {data,error}=await db.from('achievements').select('*').order('is_featured',{ascending:false}).order('sort_order').order('achievement_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
 if(error){root.innerHTML='<div class="empty">'+esc(error.message)+'</div>';return}
 rows=data||[];
 root.innerHTML=rows.length?rows.map((x,i)=>{const u=db.storage.from(BUCKET).getPublicUrl(x.storage_path).data.publicUrl;return '<article class="achievement-admin-row"><img src="'+esc(u)+'" alt=""><div class="achievement-admin-copy"><div class="achievement-admin-title"><div><span class="achievement-admin-type">'+esc(x.achievement_type)+'</span><h4>'+esc(x.title)+'</h4></div>'+(x.is_featured?'<span class="achievement-featured-badge">FEATURED</span>':'')+'</div><p>'+esc([x.event_name,x.venue,niceDate(x.achievement_date)].filter(Boolean).join(' • ')||'No event details')+' • '+(x.is_published?'Published':'Hidden')+'</p><div class="media-actions"><button data-edit-achievement="'+x.id+'">Edit</button><button data-feature-achievement="'+x.id+'" data-featured="'+x.is_featured+'">'+(x.is_featured?'Unfeature':'Feature')+'</button><button data-publish-achievement="'+x.id+'" data-published="'+x.is_published+'">'+(x.is_published?'Hide':'Publish')+'</button><button data-up-achievement="'+x.id+'" '+(i===0?'disabled':'')+'>↑ Up</button><button data-down-achievement="'+x.id+'" '+(i===rows.length-1?'disabled':'')+'>↓ Down</button><button class="danger-mini" data-delete-achievement="'+x.id+'" data-path="'+esc(x.storage_path)+'">Delete</button></div></div></article>'}).join(''):'<div class="empty">No achievements yet. Add the first highlight above.</div>';
 root.querySelectorAll('[data-edit-achievement]').forEach(b=>b.onclick=()=>edit(b.dataset.editAchievement));
 root.querySelectorAll('[data-feature-achievement]').forEach(b=>b.onclick=()=>feature(b.dataset.featureAchievement,b.dataset.featured!=='true'));
 root.querySelectorAll('[data-publish-achievement]').forEach(b=>b.onclick=()=>publish(b.dataset.publishAchievement,b.dataset.published!=='true'));
 root.querySelectorAll('[data-up-achievement]').forEach(b=>b.onclick=()=>move(b.dataset.upAchievement,-1));
 root.querySelectorAll('[data-down-achievement]').forEach(b=>b.onclick=()=>move(b.dataset.downAchievement,1));
 root.querySelectorAll('[data-delete-achievement]').forEach(b=>b.onclick=()=>remove(b.dataset.deleteAchievement,b.dataset.path));
}
function edit(id){
 const x=rows.find(r=>r.id===id);if(!x)return;
 $('#achievementId').value=x.id;
 $('#achievementTitle').value=x.title||'';
 $('#achievementType').value=x.achievement_type||'Tournament';
 $('#achievementDate').value=x.achievement_date||'';
 $('#achievementEvent').value=x.event_name||'';
 $('#achievementVenue').value=x.venue||'';
 $('#achievementDescription').value=x.description||'';
 $('#achievementPublished').checked=!!x.is_published;
 $('#achievementFeaturedFlag').checked=!!x.is_featured;
 $('#achievementSaveBtn').textContent='Save Changes';
 $('#achievementCancelEdit').style.display='inline-flex';
 $('#achievementFileHint').textContent='(optional when editing)';
 $('#achievementsAdminSection')?.scrollIntoView({behavior:'smooth',block:'start'});
}
async function save(e){
 e.preventDefault();
 const id=$('#achievementId').value.trim(),file=$('#achievementFile').files?.[0],title=$('#achievementTitle').value.trim();
 if(!title)return toast('Add an achievement title.');
 if(!id&&!file)return toast('Choose an achievement image.');
 if(file&&file.size>12*1024*1024)return toast('Achievement image must be 12 MB or smaller.');
 const btn=$('#achievementSaveBtn'),old=btn.textContent;btn.disabled=true;btn.textContent=id?'Saving…':'Uploading…';
 let newPath=null,oldPath=null;
 try{
   if(file){
     const ext=(file.name.split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'');
     newPath=Date.now()+'-'+crypto.randomUUID()+'.'+ext;
     const {error:ue}=await db.storage.from(BUCKET).upload(newPath,file,{cacheControl:'3600',upsert:false,contentType:file.type});
     if(ue)throw ue;
   }
   const featured=$('#achievementFeaturedFlag').checked;
   if(featured){const {error:fe}=await db.from('achievements').update({is_featured:false}).eq('is_featured',true);if(fe)throw fe}
   const payload={title,achievement_type:$('#achievementType').value,event_name:$('#achievementEvent').value.trim()||null,achievement_date:$('#achievementDate').value||null,venue:$('#achievementVenue').value.trim()||null,description:$('#achievementDescription').value.trim()||null,is_published:$('#achievementPublished').checked,is_featured:featured,updated_at:new Date().toISOString()};
   if(id){
     const existing=rows.find(r=>r.id===id);oldPath=existing?.storage_path||null;if(newPath)payload.storage_path=newPath;
     const {error}=await db.from('achievements').update(payload).eq('id',id);if(error)throw error;
     if(newPath&&oldPath)await db.storage.from(BUCKET).remove([oldPath]);
     toast('Achievement updated.');
   }else{
     const {data:max}=await db.from('achievements').select('sort_order').order('sort_order',{ascending:false}).limit(1);
     payload.sort_order=Number(max?.[0]?.sort_order||0)+1;payload.storage_path=newPath;
     const {error}=await db.from('achievements').insert(payload);if(error)throw error;
     toast('Achievement added.');
   }
   resetForm();await load();
 }catch(err){
   if(newPath)await db.storage.from(BUCKET).remove([newPath]);
   toast(err.message||'Could not save achievement.');
 }finally{
   btn.disabled=false;
   if(!$('#achievementId').value)btn.textContent='Add Achievement';else btn.textContent=old;
 }
}
async function feature(id,v){
 if(v){const {error:e1}=await db.from('achievements').update({is_featured:false}).eq('is_featured',true);if(e1)return toast(e1.message)}
 const {error}=await db.from('achievements').update({is_featured:v,updated_at:new Date().toISOString()}).eq('id',id);
 if(error)return toast(error.message);toast(v?'Featured achievement updated.':'Achievement unfeatured.');load();
}
async function publish(id,v){
 const {error}=await db.from('achievements').update({is_published:v,updated_at:new Date().toISOString()}).eq('id',id);
 if(error)return toast(error.message);toast(v?'Achievement published.':'Achievement hidden.');load();
}
async function move(id,dir){
 const i=rows.findIndex(x=>x.id===id),j=i+dir;if(i<0||j<0||j>=rows.length)return;
 const a=rows[i],b=rows[j],sa=Number(a.sort_order||i+1),sb=Number(b.sort_order||j+1);
 const {error:e1}=await db.from('achievements').update({sort_order:sb}).eq('id',a.id);if(e1)return toast(e1.message);
 const {error:e2}=await db.from('achievements').update({sort_order:sa}).eq('id',b.id);if(e2)return toast(e2.message);
 toast('Achievement order updated.');load();
}
async function remove(id,path){
 if(!confirm('Delete this achievement and its image?'))return;
 const {error}=await db.from('achievements').delete().eq('id',id);if(error)return toast(error.message);
 if(path)await db.storage.from(BUCKET).remove([path]);
 toast('Achievement deleted.');
 if($('#achievementId')?.value===id)resetForm();
 load();
}
async function refresh(){const {data:{session}}=await db.auth.getSession();if(session)load()}
function init(){
 $('#achievementForm')?.addEventListener('submit',save);
 $('#achievementCancelEdit')?.addEventListener('click',resetForm);
 $('#refreshAchievementsBtn')?.addEventListener('click',load);
 db.auth.onAuthStateChange((_,s)=>{if(s)setTimeout(load,150)});
 window.addEventListener('coach:admin-ready',()=>setTimeout(load,120));
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
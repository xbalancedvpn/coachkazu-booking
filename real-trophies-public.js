(() => {
const URL='https://vqtrpvtedhhekdrmktgq.supabase.co',KEY='sb_publishable_Ywa22K1DwZfDHMDwXDYU6A_dRvRUHjo',BUCKET='coach-kazu-real-trophies';
const db=window.coachKazuDb||(window.coachKazuDb=window.supabase.createClient(URL,KEY));
const $=s=>document.querySelector(s);
let rows=[],expanded=false;
const niceDate=s=>{if(!s)return'';try{return new Date(s+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}catch{return s}};
const url=p=>p?db.storage.from(BUCKET).getPublicUrl(p).data.publicUrl:'';
const icon=p=>p==='Champion'?'🏆':p==='1st Runner-Up'?'🥈':p==='2nd Runner-Up'?'🥉':'🏅';
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function card(x){
  const photo=x.cover_storage_path?url(x.cover_storage_path):(x.media?.[0]?.storage_path?url(x.media[0].storage_path):'');
  return '<article class="real-trophy-card" data-trophy-id="'+x.id+'">'+
    '<div class="real-trophy-media">'+(photo?'<img src="'+esc(photo)+'" alt="'+esc(x.student_name)+' podium achievement" loading="lazy">':'<div class="real-trophy-fallback"><span>'+icon(x.placement)+'</span><strong>COACH KAZU</strong></div>')+
    '<span class="real-trophy-place">'+icon(x.placement)+' '+esc(x.placement)+'</span></div>'+
    '<div class="real-trophy-copy"><span class="real-trophy-label">STUDENT PODIUM HIGHLIGHT</span><h3>'+esc(x.student_name)+'</h3><strong>'+esc(x.event_name)+'</strong><p>'+esc(x.category)+'</p>'+
    (x.event_date?'<small>'+esc(niceDate(x.event_date))+'</small>':'')+
    '<button type="button" class="real-trophy-open">View Highlight →</button></div></article>';
}
function render(){
  const grid=$('#realTrophyGrid'),toggle=$('#realTrophyToggle');if(!grid)return;
  const visible=expanded?rows:rows.slice(0,3);
  grid.innerHTML=visible.map(card).join('');
  grid.querySelectorAll('.real-trophy-card').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('button')||e.currentTarget===e.target||e.target)open(rows.find(x=>x.id===el.dataset.trophyId))}));
  if(toggle){toggle.style.display=rows.length>3?'inline-flex':'none';toggle.textContent=expanded?'Show Less':'View All Podium Finishers';toggle.setAttribute('aria-expanded',String(expanded))}
}
function open(x){
  if(!x)return;const dlg=$('#realTrophyDialog');if(!dlg)return;
  const pics=[];if(x.cover_storage_path)pics.push({storage_path:x.cover_storage_path});(x.media||[]).forEach(m=>pics.push(m));
  const main=$('#realTrophyDialogMain'),thumbs=$('#realTrophyDialogThumbs'),fallback=$('#realTrophyDialogFallback');
  thumbs.innerHTML='';
  if(pics.length){main.src=url(pics[0].storage_path);main.style.display='block';fallback.style.display='none';pics.forEach((p,i)=>{const b=document.createElement('button');b.type='button';b.className='real-trophy-thumb'+(i===0?' active':'');b.innerHTML='<img src="'+esc(url(p.storage_path))+'" alt="">';b.onclick=()=>{main.src=url(p.storage_path);thumbs.querySelectorAll('.real-trophy-thumb').forEach(v=>v.classList.remove('active'));b.classList.add('active')};thumbs.appendChild(b)})}
  else{main.removeAttribute('src');main.style.display='none';fallback.style.display='grid'}
  $('#realTrophyDialogPlace').textContent=icon(x.placement)+' '+x.placement;
  $('#realTrophyDialogName').textContent=x.student_name;
  $('#realTrophyDialogEvent').textContent=x.event_name;
  $('#realTrophyDialogMeta').textContent=[x.category,niceDate(x.event_date)].filter(Boolean).join(' • ');
  $('#realTrophyDialogCaption').textContent=x.caption||'';
  $('#realTrophyDialogCaption').style.display=x.caption?'block':'none';
  dlg.showModal();
}
async function load(){
  const section=$('#realTrophiesSection');if(!section)return;
  const [settings,trophyRes]=await Promise.all([
    db.from('real_trophies_settings').select('cover_storage_path').eq('id',1).maybeSingle(),
    db.from('real_trophies').select('*').eq('is_published',true).order('is_featured',{ascending:false}).order('sort_order').order('event_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false})
  ]);
  if(trophyRes.error){section.classList.add('hidden-public');return}
  rows=trophyRes.data||[];
  const ids=rows.map(x=>x.id);let media=[];
  if(ids.length){const m=await db.from('real_trophy_media').select('*').in('trophy_id',ids).order('sort_order');if(!m.error)media=m.data||[]}
  rows=rows.map(x=>Object.assign({},x,{media:media.filter(m=>m.trophy_id===x.id)}));
  const cover=settings.data?.cover_storage_path;
  const hero=$('#realTrophyCover');
  if(cover){hero.style.backgroundImage='linear-gradient(90deg,rgba(0,0,0,.76),rgba(0,0,0,.35)),url("'+url(cover)+'")';hero.classList.add('has-cover')}
  if(!rows.length&&!cover){section.classList.add('hidden-public');return}
  section.classList.remove('hidden-public');
  const podium=rows.length,champions=rows.filter(x=>x.placement==='Champion').length;
  $('#realTrophyPodiumCount').textContent=String(podium);
  $('#realTrophyChampionCount').textContent=String(champions);
  render();
}
function init(){
  $('#realTrophyToggle')?.addEventListener('click',()=>{expanded=!expanded;render();if(!expanded)$('#realTrophyGrid')?.scrollIntoView({behavior:'smooth',block:'start'})});
  $('#closeRealTrophyDialog')?.addEventListener('click',()=>$('#realTrophyDialog')?.close());
  $('#realTrophyDialog')?.addEventListener('click',e=>{if(e.target.id==='realTrophyDialog')e.currentTarget.close()});
  load();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
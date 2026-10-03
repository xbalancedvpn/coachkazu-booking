(() => {
const URL='https://vqtrpvtedhhekdrmktgq.supabase.co',KEY='sb_publishable_Ywa22K1DwZfDHMDwXDYU6A_dRvRUHjo',BUCKET='coach-kazu-achievements';
const db=window.supabase?.createClient(URL,KEY),$=s=>document.querySelector(s);
let allEvents=[],showAll=false;
const niceDate=s=>{if(!s)return'';try{return new Date(s+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}catch{return s}};
const publicUrl=path=>path?db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl:'';
const placementIcon=p=>p==='Champion'?'🏆':p==='1st Runner-Up'?'🥈':p==='2nd Runner-Up'?'🥉':'•';
const placementClass=p=>'place-'+String(p||'other').toLowerCase().replace(/[^a-z0-9]+/g,'-');
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function metaText(x){return [x.venue,niceDate(x.achievement_date)].filter(Boolean).join(' • ')}
function inferPlatform(url){
 try{const h=new URL(url).hostname.toLowerCase();if(h.includes('youtube.com')||h.includes('youtu.be'))return'YouTube';if(h.includes('facebook.com')||h.includes('fb.watch'))return'Facebook';if(h.includes('tiktok.com'))return'TikTok';if(h.includes('instagram.com'))return'Instagram';return'Video'}catch{return'Video'}
}
function fallbackMedia(cls){
 const wrap=el('div',(cls||'')+' achievement-brand-fallback');const logo=el('img');logo.src='assets/coach-kazu-favicon.webp?v=3';logo.alt='';wrap.append(logo,el('span','','COACH KAZU'),el('strong','','COMPETITION HIGHLIGHT'));return wrap;
}
function resultList(x,limit=99){
 const root=el('div','achievement-results');
 (x.results||[]).slice(0,limit).forEach(r=>{const item=el('div','achievement-result '+placementClass(r.placement));item.append(el('span','achievement-medal',placementIcon(r.placement)),el('strong','',r.placement),el('span','',r.division));root.appendChild(item)});
 if((x.results||[]).length>limit)root.appendChild(el('div','achievement-result-more','+'+((x.results||[]).length-limit)+' more result'+(((x.results||[]).length-limit)===1?'':'s')));
 return root;
}
function openButton(x,label='View Event →'){const b=el('button','achievement-open',label);b.type='button';b.addEventListener('click',()=>openAchievement(x));return b}
function buildPhotoStage(x){
 const photos=[];if(x.storage_path)photos.push({storage_path:x.storage_path,caption:'Cover photo'});(x.media||[]).filter(m=>m.media_type==='photo').forEach(m=>photos.push(m));
 const stage=$('#achievementDialogMedia'),main=$('#achievementDialogMainImage'),fallback=$('#achievementDialogFallback'),thumbs=$('#achievementDialogThumbs');
 stage.classList.toggle('no-photo',!photos.length);thumbs.innerHTML='';
 if(!photos.length){main.removeAttribute('src');main.style.display='none';fallback.style.display='grid';return}
 fallback.style.display='none';main.style.display='block';main.src=publicUrl(photos[0].storage_path);main.alt=x.title||'Coach Kazu achievement';
 photos.forEach((p,i)=>{const b=el('button','achievement-thumb'+(i===0?' active':''));b.type='button';const im=el('img');im.src=publicUrl(p.storage_path);im.alt=p.caption||x.title||'Achievement photo';b.appendChild(im);b.onclick=()=>{main.src=im.src;thumbs.querySelectorAll('.achievement-thumb').forEach(v=>v.classList.remove('active'));b.classList.add('active')};thumbs.appendChild(b)});
}
function openAchievement(x){
 const dlg=$('#achievementDialog');if(!dlg)return;
 $('#achievementDialogType').textContent=x.is_featured?'Featured Competition Highlight':'Competition Record';
 $('#achievementDialogTitle').textContent=x.title||'Achievement';
 $('#achievementDialogMeta').textContent=metaText(x);
 $('#achievementDialogDescription').textContent=x.description||'';
 const results=$('#achievementDialogResults');results.innerHTML='';results.appendChild(resultList(x));
 buildPhotoStage(x);
 const videos=$('#achievementDialogVideos');videos.innerHTML='';
 (x.media||[]).filter(m=>m.media_type==='video').forEach(m=>{const a=el('a','achievement-video-link','▶ Watch on '+(m.platform||inferPlatform(m.external_url)));a.href=m.external_url;a.target='_blank';a.rel='noopener noreferrer';videos.appendChild(a)});
 videos.style.display=videos.children.length?'flex':'none';
 dlg.showModal();
}
function renderStats(rows){
 const stats=$('#achievementStats'),results=rows.flatMap(x=>x.results||[]);
 const champion=results.filter(r=>r.placement==='Champion').length,first=results.filter(r=>r.placement==='1st Runner-Up').length,second=results.filter(r=>r.placement==='2nd Runner-Up').length,podium=champion+first+second;
 stats.innerHTML='';
 [['Podium Finishes',podium],['Championships',champion],['1st Runner-Up',first],['2nd Runner-Up',second]].forEach(([label,n])=>{const box=el('div');box.append(el('strong','',String(n)),el('span','',label));stats.appendChild(box)});
}
function renderSpotlight(x){
 const root=$('#achievementFeatured');root.innerHTML='';if(!x)return;
 const hero=el('article','achievement-hero-card'),media=el('div','achievement-hero-media');
 if(x.storage_path){const img=el('img');img.src=publicUrl(x.storage_path);img.alt=x.title;img.loading='lazy';media.appendChild(img)}else media.appendChild(fallbackMedia('achievement-hero-fallback'));
 const copy=el('div','achievement-hero-copy');copy.appendChild(el('span','achievement-kicker',x.is_featured?'Career Spotlight':'Competition Spotlight'));copy.appendChild(el('h3','',x.title));
 const meta=metaText(x);if(meta)copy.appendChild(el('div','achievement-meta',meta));copy.appendChild(resultList(x,4));if(x.description)copy.appendChild(el('p','',x.description));copy.appendChild(openButton(x));
 hero.append(media,copy);root.appendChild(hero);
}
function eventCard(x){
 const card=el('article','achievement-card');
 const m=el('div','achievement-card-media');if(x.storage_path){const im=el('img');im.src=publicUrl(x.storage_path);im.alt=x.title;im.loading='lazy';m.appendChild(im)}else m.appendChild(fallbackMedia('achievement-card-fallback'));
 const c=el('div','achievement-card-copy');const top=el('div','achievement-card-top');top.appendChild(el('span','achievement-kicker',x.is_featured?'Featured':'Tournament / Event'));c.appendChild(top);c.appendChild(el('h3','',x.title));
 const meta=metaText(x);if(meta)c.appendChild(el('div','achievement-meta',meta));c.appendChild(resultList(x,3));c.appendChild(openButton(x,'View Results →'));card.append(m,c);return card;
}
function renderGrid(spotlight){
 const grid=$('#achievementGrid'),toggle=$('#achievementArchiveToggle');grid.innerHTML='';
 const ordered=allEvents.filter(x=>x.id!==spotlight?.id),visible=showAll?ordered:ordered.slice(0,6);visible.forEach(x=>grid.appendChild(eventCard(x)));
 if(ordered.length>6){toggle.style.display='inline-flex';toggle.textContent=showAll?'Show Fewer Events':'View All '+allEvents.length+' Events';toggle.setAttribute('aria-expanded',showAll?'true':'false')}else toggle.style.display='none';
}
async function loadAchievements(){
 const section=$('#achievementsSection');if(!section||!db)return;
 const q=await db.from('achievements').select('id,title,event_name,achievement_date,venue,description,storage_path,is_featured,sort_order,created_at').eq('is_published',true).order('is_featured',{ascending:false}).order('sort_order').order('achievement_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
 if(q.error||!q.data?.length){section.classList.add('hidden-public');return}
 const ids=q.data.map(x=>x.id);
 const [rr,mr]=await Promise.all([db.from('achievement_results').select('*').in('achievement_id',ids).order('sort_order'),db.from('achievement_media').select('*').in('achievement_id',ids).order('sort_order')]);
 if(rr.error||mr.error){section.classList.add('hidden-public');return}
 allEvents=q.data.map(x=>Object.assign({},x,{results:(rr.data||[]).filter(r=>r.achievement_id===x.id),media:(mr.data||[]).filter(m=>m.achievement_id===x.id)}));
 section.classList.remove('hidden-public');renderStats(allEvents);
 const spotlight=allEvents.find(x=>x.is_featured&&x.storage_path)||allEvents.find(x=>x.storage_path)||allEvents.find(x=>x.is_featured)||allEvents[0];
 renderSpotlight(spotlight);renderGrid(spotlight);
}
function init(){
 loadAchievements();const dlg=$('#achievementDialog');$('#closeAchievementDialog')?.addEventListener('click',()=>dlg?.close());dlg?.addEventListener('click',e=>{if(e.target===dlg)dlg.close()});
 $('#achievementArchiveToggle')?.addEventListener('click',()=>{showAll=!showAll;const spotlight=allEvents.find(x=>x.is_featured&&x.storage_path)||allEvents.find(x=>x.storage_path)||allEvents.find(x=>x.is_featured)||allEvents[0];renderGrid(spotlight);if(!showAll)$('#achievementArchiveHead')?.scrollIntoView({behavior:'smooth',block:'start'})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
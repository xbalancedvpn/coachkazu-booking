(() => {
const URL='https://vqtrpvtedhhekdrmktgq.supabase.co',KEY='sb_publishable_Ywa22K1DwZfDHMDwXDYU6A_dRvRUHjo',BUCKET='coach-kazu-achievements';
const db=window.supabase?.createClient(URL,KEY),$=s=>document.querySelector(s);
const niceDate=s=>{if(!s)return'';try{return new Date(s+'T12:00:00').toLocaleDateString('en-PH',{month:'short',day:'numeric',year:'numeric'})}catch{return s}};
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n}
function metaText(x){return [x.event_name,x.venue,niceDate(x.achievement_date)].filter(Boolean).join(' • ')}
function openAchievement(x){
 const dlg=$('#achievementDialog'); if(!dlg)return;
 $('#achievementDialogImage').src=x.image_url||''; $('#achievementDialogImage').alt=x.title||'Coach Kazu achievement';
 $('#achievementDialogType').textContent=x.achievement_type||'Highlight';
 $('#achievementDialogTitle').textContent=x.title||'Achievement';
 $('#achievementDialogMeta').textContent=metaText(x);
 $('#achievementDialogDescription').textContent=x.description||'';
 dlg.showModal();
}
function openButton(x){const b=el('button','achievement-open','View Highlight →');b.type='button';b.addEventListener('click',()=>openAchievement(x));return b}
async function loadAchievements(){
 const section=$('#achievementsSection'),featuredRoot=$('#achievementFeatured'),grid=$('#achievementGrid'),stats=$('#achievementStats');
 if(!section||!featuredRoot||!grid||!stats||!db)return;
 const q=await db.from('achievements').select('id,title,achievement_type,event_name,achievement_date,venue,description,storage_path,is_featured,sort_order,created_at').eq('is_published',true).order('is_featured',{ascending:false}).order('sort_order').order('achievement_date',{ascending:false,nullsFirst:false}).order('created_at',{ascending:false});
 if(q.error||!q.data?.length){section.classList.add('hidden-public');return}
 section.classList.remove('hidden-public');
 const rows=q.data.map(x=>{const u=db.storage.from(BUCKET).getPublicUrl(x.storage_path);return Object.assign({},x,{image_url:u.data.publicUrl})});
 const featured=rows.find(x=>x.is_featured)||rows[0],others=rows.filter(x=>x.id!==featured.id);
 featuredRoot.innerHTML='';
 const hero=el('article','achievement-hero-card'),media=el('div','achievement-hero-media'),img=el('img');
 img.src=featured.image_url;img.alt=featured.title;img.loading='lazy';media.appendChild(img);
 const copy=el('div','achievement-hero-copy');copy.appendChild(el('span','achievement-kicker',featured.achievement_type));copy.appendChild(el('h3','',featured.title));copy.appendChild(el('div','achievement-meta',metaText(featured)));
 if(featured.description)copy.appendChild(el('p','',featured.description));copy.appendChild(openButton(featured));hero.append(media,copy);featuredRoot.appendChild(hero);
 grid.innerHTML='';
 others.slice(0,9).forEach(x=>{const card=el('article','achievement-card'),m=el('div','achievement-card-media'),im=el('img');im.src=x.image_url;im.alt=x.title;im.loading='lazy';m.appendChild(im);const c=el('div','achievement-card-copy');c.appendChild(el('span','achievement-kicker',x.achievement_type));c.appendChild(el('h3','',x.title));c.appendChild(el('div','achievement-meta',metaText(x)));c.appendChild(openButton(x));card.append(m,c);grid.appendChild(card)});
 stats.innerHTML='';
 const counts=[['Highlights',rows.length],['Competition Entries',rows.filter(x=>['Champion','Runner-up','Podium','Medal','Tournament'].includes(x.achievement_type)).length],['Podium / Medals',rows.filter(x=>['Champion','Runner-up','Podium','Medal'].includes(x.achievement_type)).length],['Championships',rows.filter(x=>x.achievement_type==='Champion').length]].filter(x=>x[1]>0);
 counts.forEach(([label,n])=>{const box=el('div');box.append(el('strong','',String(n)),el('span','',label));stats.appendChild(box)});
}
function init(){loadAchievements();const dlg=$('#achievementDialog');$('#closeAchievementDialog')?.addEventListener('click',()=>dlg?.close());dlg?.addEventListener('click',e=>{if(e.target===dlg)dlg.close()})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
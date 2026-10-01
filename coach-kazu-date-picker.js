// Coach Kazu branded date picker - Monday-first, shared by public and admin
(function(){
  const pad=n=>String(n).padStart(2,'0');
  const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
  const parse=s=>{
    const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(!m)return null;
    const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
    return Number.isNaN(d.getTime())?null:d;
  };
  let target=null;
  let view=new Date();
  view.setDate(1);

  function inputTitle(input){
    if(input.dataset.dateTitle)return input.dataset.dateTitle;
    const label=input.closest('label');
    if(label){
      const text=[...label.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join(' ').trim();
      if(text)return 'Choose '+text.toLowerCase();
    }
    return 'Choose a date';
  }

  function ensure(){
    let dlg=document.getElementById('kazuDatePickerDialog');
    if(dlg)return dlg;
    dlg=document.createElement('dialog');
    dlg.id='kazuDatePickerDialog';
    dlg.className='kazu-date-dialog';
    dlg.innerHTML=
      '<div class="kazu-date-card">'+
        '<div class="kazu-date-head">'+
          '<div class="kazu-date-brand"><img src="assets/coach-kazu-favicon.webp?v=3" alt=""><div><span>COACH KAZU</span><h2 id="kazuDateTitle">Choose a date</h2></div></div>'+
          '<button type="button" id="kazuDateClose" aria-label="Close date picker">×</button>'+
        '</div>'+
        '<div class="kazu-date-nav"><button type="button" id="kazuDatePrev" aria-label="Previous month">‹</button><strong id="kazuDateMonth"></strong><button type="button" id="kazuDateNext" aria-label="Next month">›</button></div>'+
        '<div class="kazu-date-weekdays"><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></div>'+
        '<div id="kazuDateGrid" class="kazu-date-grid"></div>'+
        '<div class="kazu-date-actions"><button type="button" id="kazuDateToday" class="kazu-date-secondary">Today</button><button type="button" id="kazuDateDone" class="kazu-date-primary">Close</button></div>'+
      '</div>';
    document.body.appendChild(dlg);
    document.getElementById('kazuDateClose').onclick=()=>dlg.close();
    document.getElementById('kazuDateDone').onclick=()=>dlg.close();
    document.getElementById('kazuDatePrev').onclick=()=>{view.setMonth(view.getMonth()-1);render();};
    document.getElementById('kazuDateNext').onclick=()=>{view.setMonth(view.getMonth()+1);render();};
    document.getElementById('kazuDateToday').onclick=()=>{
      const today=new Date();
      if(allowed(today))pick(today);
      else{
        view=new Date(today.getFullYear(),today.getMonth(),1);
        render();
      }
    };
    dlg.addEventListener('click',e=>{
      if(e.target===dlg)dlg.close();
    });
    return dlg;
  }

  function allowed(d){
    if(!target)return true;
    const min=parse(target.getAttribute('min')||target.dataset.dateMin||'');
    const max=parse(target.getAttribute('max')||target.dataset.dateMax||'');
    const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());
    if(min&&x<new Date(min.getFullYear(),min.getMonth(),min.getDate()))return false;
    if(max&&x>new Date(max.getFullYear(),max.getMonth(),max.getDate()))return false;
    return true;
  }

  function pick(d){
    if(!target||!allowed(d))return;
    target.value=ymd(d);
    target.dispatchEvent(new Event('input',{bubbles:true}));
    target.dispatchEvent(new Event('change',{bubbles:true}));
    ensure().close();
    target.focus({preventScroll:true});
  }

  function render(){
    const dlg=ensure();
    const grid=dlg.querySelector('#kazuDateGrid');
    const month=dlg.querySelector('#kazuDateMonth');
    month.textContent=view.toLocaleDateString('en-PH',{month:'long',year:'numeric'});
    grid.innerHTML='';
    const year=view.getFullYear(),monthIndex=view.getMonth();
    const first=(new Date(year,monthIndex,1).getDay()+6)%7;
    const last=new Date(year,monthIndex+1,0).getDate();
    for(let i=0;i<first;i++){
      const blank=document.createElement('span');
      blank.className='kazu-date-blank';
      grid.appendChild(blank);
    }
    const selected=parse(target?.value);
    const today=new Date();today.setHours(0,0,0,0);
    for(let day=1;day<=last;day++){
      const d=new Date(year,monthIndex,day);
      const btn=document.createElement('button');
      btn.type='button';
      btn.textContent=String(day);
      btn.setAttribute('aria-label',d.toLocaleDateString('en-PH',{weekday:'long',month:'long',day:'numeric',year:'numeric'}));
      if(d.getTime()===today.getTime())btn.classList.add('today');
      if(selected&&ymd(selected)===ymd(d))btn.classList.add('selected');
      if(!allowed(d)){
        btn.disabled=true;
        btn.classList.add('disabled');
      }else{
        btn.onclick=()=>pick(d);
      }
      grid.appendChild(btn);
    }
  }

  function open(input){
    target=input;
    const current=parse(input.value)||new Date();
    view=new Date(current.getFullYear(),current.getMonth(),1);
    const dlg=ensure();
    dlg.querySelector('#kazuDateTitle').textContent=inputTitle(input);
    render();
    if(!dlg.open)dlg.showModal();
  }

  function enhance(input){
    if(!input||input.dataset.kazuDateReady==='1')return;
    input.dataset.kazuDateReady='1';
    input.dataset.dateMin=input.getAttribute('min')||'';
    input.dataset.dateMax=input.getAttribute('max')||'';
    input.type='text';
    input.readOnly=true;
    input.autocomplete='off';
    input.inputMode='none';
    input.classList.add('kazu-date-input');
    input.setAttribute('aria-haspopup','dialog');
    input.addEventListener('click',e=>{e.preventDefault();open(input);});
    input.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '||e.key==='ArrowDown'){
        e.preventDefault();
        open(input);
      }
    });
  }

  function scan(root=document){
    root.querySelectorAll('input[type="date"]').forEach(enhance);
  }

  function init(){
    ensure();
    scan();
    const observer=new MutationObserver(records=>{
      for(const record of records){
        for(const node of record.addedNodes){
          if(node.nodeType!==1)continue;
          if(node.matches?.('input[type="date"]'))enhance(node);
          node.querySelectorAll?.('input[type="date"]').forEach(enhance);
        }
      }
    });
    observer.observe(document.body,{childList:true,subtree:true});
    window.coachKazuDatePicker={enhance,open,scan};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
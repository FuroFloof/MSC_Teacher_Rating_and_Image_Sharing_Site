let teacherId=null, stars=0;

/* modal */
document.getElementById('plus-button').onclick=()=>{document.getElementById('review-modal').style.display='block';};
document.getElementById('modal-close').onclick=()=>{document.getElementById('review-modal').style.display='none';reset();};
window.onclick=e=>{const m=document.getElementById('review-modal');if(e.target===m){m.style.display='none';reset();}};

/* teacher search */
document.getElementById('teacher-selector').oninput=function(){
  const q=this.value.trim().toLowerCase();
  const list=document.getElementById('teacher-list');list.innerHTML='';
  if(!q)return;
  fetch('/teachers/search?query='+encodeURIComponent(q)).then(r=>r.json()).then(d=>{
    d.teachers.forEach(t=>{
      const div=document.createElement('div');div.innerText=t.teacher_name;div.dataset.id=t.teacher_id;
      div.style.padding='5px';div.style.cursor='pointer';
      div.onclick=()=>{teacherId=div.dataset.id;document.getElementById('teacher-selector').value=div.innerText;list.innerHTML='';};
      list.appendChild(div);
    });
  });
};

/* stars */
document.querySelectorAll('#star-rating .star').forEach(s=>{
  s.onclick = ()=>{
    const v=parseInt(s.dataset.value);stars = (stars===v)?0:v;updateStars();
  };
});
function updateStars(){
  document.querySelectorAll('#star-rating .star').forEach(s=>{
    if(parseInt(s.dataset.value)<=stars){s.classList.add('selected');s.innerHTML='&#9733;';}
    else {s.classList.remove('selected');s.innerHTML='&#9734;';}
  });
}

/* anonymous toggle */
document.getElementById('anonymous-toggle').onchange=function(){
  document.getElementById('username-group').style.display=this.checked?'none':'block';
};

/* submit */
document.getElementById('submit-review').onclick=async ()=>{
  const msg=document.getElementById('review-message').value.trim();
  const anon=document.getElementById('anonymous-toggle').checked;
  const author=anon?'anon':document.getElementById('username-input').value.trim();
  if(!teacherId){alert('Lehrer wählen');return;}
  if(!stars){alert('Bewertung wählen');return;}
  if(!anon && !author){alert('Name');return;}
  await fetch('/teacher_review',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({teacher_id:teacherId,review_content:msg,review_author:author,review_score:stars})
  }).then(r=>{if(r.ok)location.reload();else alert('Fehler');});
};

/* reset */
function reset(){
  teacherId=null;stars=0;document.getElementById('teacher-selector').value='';
  document.getElementById('teacher-list').innerHTML='';
  document.getElementById('review-message').value='';
  document.getElementById('anonymous-toggle').checked=true;
  document.getElementById('username-group').style.display='none';
  document.getElementById('username-input').value='';
  updateStars();
}

/* list */
document.getElementById('search-button').onclick = ()=>{
  load(document.getElementById('teacher-search').value.trim().toLowerCase(),
       document.getElementById('sort-select').value);
};
document.getElementById('sort-select').onchange = ()=>{
  load(document.getElementById('teacher-search').value.trim().toLowerCase(),this.value);
};

function load(q='',sort='date_desc'){
  let url='/teacher_reviews?'; if(q) url+='query='+encodeURIComponent(q); url+='&sort='+sort;
  fetch(url).then(r=>r.json()).then(d=>{
    const list=document.getElementById('review-list');list.innerHTML='';
    if(!d.reviews.length){list.innerHTML='<p>Keine Bewertungen.</p>';return;}
    d.reviews.forEach(rv=>{
      const card=document.createElement('div');card.className='review-card';
      const head=document.createElement('div');head.style.display='flex';head.style.justifyContent='space-between';
      const h=document.createElement('h3');h.innerText=rv.teacher;
      const st=document.createElement('div');st.className='stars';st.innerHTML=getStars(rv.review_score);
      head.append(h,st);
      const a=document.createElement('p');a.style.fontStyle='italic';a.innerText='Von: '+(rv.review_author||'Anonym');
      const p=document.createElement('p');p.innerText=rv.review_content;
      card.append(head,a,p);list.appendChild(card);
    });
  });
}
function getStars(s){let str='';for(let i=1;i<=5;i++)str+=i<=s?'&#9733;':'&#9734;';return str;}
document.addEventListener('DOMContentLoaded',()=>load());

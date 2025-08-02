/* plus modal */
document.getElementById('plus-button').onclick=()=>{document.getElementById('comment-modal').style.display='block';};
document.getElementById('modal-close').onclick=()=>{document.getElementById('comment-modal').style.display='none';reset();};
window.onclick=e=>{const m=document.getElementById('comment-modal');if(e.target===m){m.style.display='none';reset();}};

document.getElementById('anonymous-toggle').onchange=function(){
  document.getElementById('username-group').style.display=this.checked?'none':'block';
};

document.getElementById('submit-comment').onclick=async ()=>{
  const txt=document.getElementById('comment-message').value.trim();
  const anon=document.getElementById('anonymous-toggle').checked;
  const author=anon?'anon':document.getElementById('username-input').value.trim();
  if(!txt){alert('Bitte Kommentar');return;}
  if(!anon && !author){alert('Bitte Name');return;}
  await fetch('/comments',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({comment_content:txt,comment_author:author})
  }).then(r=>{if(r.ok)location.reload();else alert('Fehler');});
};

function reset(){
  document.getElementById('comment-message').value='';
  document.getElementById('anonymous-toggle').checked=true;
  document.getElementById('username-group').style.display='none';
  document.getElementById('username-input').value='';
}

document.getElementById('search-button').onclick = ()=>{
  load(document.getElementById('author-search').value.trim().toLowerCase(),
       document.getElementById('sort-select').value);
};
document.getElementById('sort-select').onchange = ()=>{
  load(document.getElementById('author-search').value.trim().toLowerCase(),
       this.value);
};

function load(q='',sort='date_desc'){
  let url='/comments/search?'; if(q) url+='query='+encodeURIComponent(q);
  url+='&sort='+sort;
  fetch(url).then(r=>r.json()).then(d=>{
    const list=document.getElementById('comment-list');list.innerHTML='';
    if(!d.comments.length){list.innerHTML='<p>Keine Kommentare.</p>';return;}
    d.comments.forEach(c=>{
      const card=document.createElement('div');card.className='comment-card';
      const head=document.createElement('div');head.style.display='flex';head.style.justifyContent='space-between';
      const a=document.createElement('h3');a.innerText=c.comment_author||'Anonym';
      const dt=document.createElement('div');dt.style.fontSize='.8em';dt.style.color='#777';
      dt.innerText=new Date(c.date).toLocaleDateString();
      head.append(a,dt);
      const p=document.createElement('p');p.innerText=c.comment_content;
      card.append(head,p);list.appendChild(card);
    });
  });
}
document.addEventListener('DOMContentLoaded',()=>load());

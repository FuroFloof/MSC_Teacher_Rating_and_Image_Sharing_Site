/* visitor counter */
function updateVisitor(){fetch('/visitor_count').then(r=>r.json()).then(d=>{
    document.getElementById('visitor-count').innerText=d.count;
  });}
  document.addEventListener('DOMContentLoaded',()=>{updateVisitor();/*setInterval(updateVisitor,1000);*/});
  
  /* helper */
  const isMobile = ()=>/Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const mobileSpeed = 2, desktopSpeed = .5;
  
  /* gallery helpers */
  function scrollLoop(car,cb){
    const speed=isMobile()?mobileSpeed:desktopSpeed;
    let pos=0;
    const step=()=>{pos+=speed;car.scrollLeft=pos;
      if(pos>=car.scrollWidth-car.clientWidth){setTimeout(()=>{pos=0;cb();},3000);}
      else requestAnimationFrame(step);
    }; step();
  }
  
  /* image carousel */
  function loadImages(){
    fetch('/images/random').then(r=>r.json()).then(d=>{
      const car=document.getElementById('image-carousel');car.innerHTML='';
      d.img_ids.forEach(id=>{const img=document.createElement('img');img.src='/image/'+id;car.appendChild(img);});
      scrollLoop(car,loadImages);
    });
  }
  
  /* teachers */
  function loadTeachers(){
    fetch('/teachers/top_bottom').then(r=>r.json()).then(d=>{
      const car=document.getElementById('teacher-carousel');car.innerHTML='';
      [...d.top,...d.bottom].forEach(t=>{
        const card=document.createElement('div');card.className='teacher-card';
        const n=document.createElement('h3');n.innerText=t.teacher_name;
        const stars=document.createElement('div');stars.className='stars';stars.innerHTML=getStars(t.average_score);
        const tot=document.createElement('p');tot.innerText='Anzahl Bewertungen: '+t.total_reviews;
        card.append(n,stars,tot);car.appendChild(card);
      });
      scrollLoop(car,loadTeachers);
    });
  }
  
  /* reviews */
  function loadReviews(){
    fetch('/teacher_reviews/random').then(r=>r.json()).then(d=>{
      const car=document.getElementById('review-carousel');car.innerHTML='';
      d.reviews.forEach(rv=>{
        const card=document.createElement('div');card.className='review-card';
        const head=document.createElement('div');head.style.display='flex';head.style.justifyContent='space-between';
        const t=document.createElement('h4');t.innerText=rv.teacher;
        const stars=document.createElement('div');stars.className='stars';stars.innerHTML=getStars(rv.review_score);
        head.append(t,stars);
        const a=document.createElement('p');a.style.fontStyle='italic';a.innerText='Von: '+(rv.review_author||'Anonym');
        const c=document.createElement('p');c.innerText=rv.review_content;
        card.append(head,a,c);car.appendChild(card);
      });
      scrollLoop(car,loadReviews);
    });
  }
  
  /* general comments carousel */
  function loadComments(){
    fetch('/comments/random').then(r=>r.json()).then(d=>{
      const car=document.getElementById('general-review-carousel');car.innerHTML='';
      d.comments.forEach(cm=>{
        const card=document.createElement('div');card.className='general-review-card';
        const head=document.createElement('div');head.style.display='flex';head.style.justifyContent='space-between';
        const a=document.createElement('h4');a.innerText=cm.comment_author||'Anonym';
        const dt=document.createElement('div');dt.style.fontSize='.8em';dt.style.color='#777';
        dt.innerText=new Date(cm.date).toLocaleDateString();
        head.append(a,dt);
        const p=document.createElement('p');p.innerText=cm.comment_content;
        card.append(head,p);car.appendChild(card);
      });
      scrollLoop(car,loadComments);
    });
  }
  
  function getStars(s){let str='';for(let i=1;i<=5;i++)str+=i<=Math.round(s)?'&#9733;':'&#9734;';return str;}
  
  /* disclaimer modal */
  function cookie(name){
    const v=document.cookie.match('(^|;)\\s*'+name+'\\s*=\\s*([^;]+)');return v?v.pop():'';
  }
  function checkDisclaimer(){
    if(cookie('does_accept')==='true')document.getElementById('disclaimer-modal').style.display='none';
    else document.getElementById('disclaimer-modal').style.display='block';
  }
  document.addEventListener('DOMContentLoaded',()=>{
    checkDisclaimer();
    const chk=document.getElementById('accept-checkbox');
    const btn=document.getElementById('continue-button');
    chk.onchange = ()=>btn.disabled=!chk.checked;
    btn.onclick = ()=>{
      if(chk.checked){
        const exp=new Date();exp.setFullYear(exp.getFullYear()+1);
        document.cookie='does_accept=true; expires='+exp.toUTCString()+'; path=/';
        document.getElementById('disclaimer-modal').style.display='none';
      }
    };
  });
  
  /* init */
  document.addEventListener('DOMContentLoaded',()=>{
    loadImages();loadTeachers();loadReviews();loadComments();
  });
  
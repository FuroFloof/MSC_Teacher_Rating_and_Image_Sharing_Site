// Open modal
document.getElementById('plus-button').onclick = ()=>{
    document.getElementById('upload-modal').style.display='block';
  };
  // Close modal
  document.getElementById('modal-close').onclick = ()=>{
    document.getElementById('upload-modal').style.display='none';
    resetModal();
  };
  window.onclick = e=>{
    const m=document.getElementById('upload-modal');
    if(e.target===m){m.style.display='none';resetModal();}
  };
  
  document.getElementById('upload-button').onclick = async ()=>{
    const name = document.getElementById('image-name').value.trim();
    const file = document.getElementById('image-file').files[0];
    if(!name){alert('Bitte Bildnamen');return;}
    if(!file){alert('Bitte Datei');return;}
    const fd = new FormData();
    fd.append('img_name',name);
    fd.append('image',file);
    const r = await fetch('/upload_image',{method:'POST',body:fd});
    if(r.ok){alert('Hochgeladen');loadImages();document.getElementById('upload-modal').style.display='none';}
    else alert('Fehler');
  };
  
  function resetModal(){
    document.getElementById('image-name').value='';
    document.getElementById('image-file').value='';
  }
  
  document.getElementById('search-button').onclick = ()=>{
    loadImages(document.getElementById('image-search').value.trim().toLowerCase());
  };
  
  function loadImages(q=''){
    let url='/images/search?'; if(q) url+='query='+encodeURIComponent(q);
    fetch(url).then(r=>r.json()).then(d=>{
      const g=document.getElementById('image-gallery');g.innerHTML='';
      if(!d.images.length){g.innerHTML='<p>Keine Bilder.</p>';return;}
      d.images.forEach(im=>{
        const c=document.createElement('div');c.className='image-card';
        const img=document.createElement('img');img.src='/image/'+im.img_id;
        const p=document.createElement('p');p.innerText=im.img_name;
        c.append(img,p);g.appendChild(c);
      });
    });
  }
  document.addEventListener('DOMContentLoaded',()=>loadImages());
  
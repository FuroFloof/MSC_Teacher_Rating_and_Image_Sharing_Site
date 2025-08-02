/* common helpers + spinner + timezone header */
export function showLoader(){document.getElementById('loader').style.display='block';}
export function hideLoader(){document.getElementById('loader').style.display='none';}

const _orig = window.fetch;
window.fetch = function(url,opt={}){
  opt.headers = Object.assign({
    'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
  }, opt.headers||{});
  showLoader();
  return _orig(url,opt).finally(hideLoader);
};

(function(){
  var b=[window.__APP0,window.__APP1,window.__APP2,window.__APP3,window.__APP4,window.__APP5].join('');
  if(!b){document.getElementById('app').innerHTML='<div style="padding:2rem;text-align:center;color:#c00">خطا در بارگذاری — از APK محلی v1.4.3 استفاده کنید</div>';return;}
  var bin=atob(b), u=new Uint8Array(bin.length);
  for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
  var s=new TextDecoder('utf-8').decode(u);
  (0,eval)(s);
})();

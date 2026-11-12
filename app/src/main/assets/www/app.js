(function(){
  try {
    var b=[window.__APP0,window.__APP1,window.__APP2,window.__APP3,window.__APP4,window.__APP5,window.__APP6,window.__APP7,window.__APP8,window.__APP9,window.__APP10,window.__APP11].join('');
    var bin=atob(b), u=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
    var s=new TextDecoder('utf-8').decode(u);
    (0,eval)(s);
  } catch(e) {
    console.error(e);
    document.getElementById('app').innerHTML='<div style="padding:2rem;text-align:center;direction:rtl"><h2 style="color:#5B2C8A">خطای بارگذاری</h2><p style="color:#b91c1c">'+String(e.message||e)+'</p><button onclick="location.reload()" style="margin-top:12px;padding:10px 18px;background:#5B2C8A;color:#fff;border:0;border-radius:10px">تلاش مجدد</button></div>';
  }
})();

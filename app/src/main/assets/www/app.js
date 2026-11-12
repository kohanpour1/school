(function(){
  try {
    var b=[window.__B0,window.__B1,window.__B2,window.__B3].join('');
    if(!b||b.indexOf('undefined')>=0) throw new Error('فایل‌های برنامه ناقص است');
    var bin=atob(b), u=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
    (0,eval)(new TextDecoder('utf-8').decode(u));
  } catch(e) {
    console.error(e);
    var el=document.getElementById('app');
    if(el) el.innerHTML='<div style="padding:2rem;text-align:center;direction:rtl"><h2 style="color:#5B2C8A">خطای بارگذاری</h2><p style="color:#b91c1c">'+String(e.message||e)+'</p><button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;background:#5B2C8A;color:#fff;border:0;border-radius:12px">تلاش مجدد</button></div>';
  }
})();

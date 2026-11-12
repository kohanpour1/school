(function(){
  try {
    var b=[window.__T0,window.__T1,window.__T2,window.__T3,window.__T4,window.__T5,window.__T6,window.__T7,window.__T8,window.__T9,window.__T10,window.__T11,window.__T12,window.__T13,window.__T14,window.__T15,window.__T16,window.__T17,window.__T18,window.__T19,window.__T20,window.__T21,window.__T22,window.__T23,window.__T24,window.__T25,window.__T26,window.__T27,window.__T28,window.__T29,window.__T30,window.__T31,window.__T32,window.__T33,window.__T34,window.__T35,window.__T36,window.__T37,window.__T38,window.__T39,window.__T40,window.__T41,window.__T42,window.__T43,window.__T44,window.__T45,window.__T46,window.__T47,window.__T48,window.__T49].join('');
    if(!b||b.indexOf('undefined')>=0) throw new Error('فایل‌های برنامه ناقص است — از APK محلی v1.4.5 استفاده کنید');
    var bin=atob(b), u=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++) u[i]=bin.charCodeAt(i);
    (0,eval)(new TextDecoder('utf-8').decode(u));
  } catch(e) {
    console.error(e);
    var el=document.getElementById('app');
    if(el) el.innerHTML='<div style="padding:2rem;text-align:center;direction:rtl"><h2 style="color:#5B2C8A">خطای بارگذاری</h2><p style="color:#b91c1c;margin-top:8px">'+String(e.message||e)+'</p><p style="color:#666;margin-top:12px;font-size:0.9rem">نسخه کامل: Boshra-School-v1.4.5-release.apk</p><button onclick="location.reload()" style="margin-top:16px;padding:10px 20px;background:#5B2C8A;color:#fff;border:0;border-radius:12px">تلاش مجدد</button></div>';
  }
})();

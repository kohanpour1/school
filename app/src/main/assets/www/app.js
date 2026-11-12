(function(){
  try{
    var b=[window.__APP0,window.__APP1,window.__APP2,window.__APP3].join('');
    var bin=atob(b),u=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    (0,eval)(new TextDecoder('utf-8').decode(u));
  }catch(e){
    document.getElementById('app').innerHTML='<div style="padding:2rem;text-align:center"><h2 style="color:#5B2C8A">خطای بارگذاری</h2><p>'+String(e.message||e)+'</p></div>';
  }
})();

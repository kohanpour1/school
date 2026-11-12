/* پس از رندر، حرف ب را با لوگوی رسمی عوض می‌کند */
(function(){
  function applyLogo(){
    var src = window.BOSHRA_LOGO || "";
    if(!src) return;
    var nodes = document.querySelectorAll(".logo");
    for(var i=0;i<nodes.length;i++){
      var el = nodes[i];
      if(el.tagName === "IMG") continue;
      var img = document.createElement("img");
      img.className = el.className + (el.classList.contains("logo") ? "" : " logo");
      img.src = src;
      img.alt = "بشری";
      img.style.cssText = "width:"+(el.style.width||"80px")+";height:"+(el.style.height||"80px")+";border-radius:50%;object-fit:cover;background:#fff;display:block;margin:"+(el.style.margin||"0 auto 1rem")+";box-shadow:0 4px 14px rgba(91,44,138,.2)";
      if(el.parentNode) el.parentNode.replaceChild(img, el);
    }
  }
  var _render = window.render;
  if(typeof _render === "function"){
    window.render = function(){ _render.apply(this, arguments); setTimeout(applyLogo, 0); };
  }
  var _shell = window.shell;
  if(typeof _shell === "function"){
    window.shell = function(){ _shell.apply(this, arguments); setTimeout(applyLogo, 0); };
  }
  var _login = window.renderLogin;
  if(typeof _login === "function"){
    window.renderLogin = function(){ _login.apply(this, arguments); setTimeout(applyLogo, 0); };
  }
  // مشاهده تغییرات DOM
  try{
    var mo = new MutationObserver(function(){ applyLogo(); });
    mo.observe(document.documentElement, {childList:true, subtree:true});
  }catch(e){}
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", applyLogo);
  else applyLogo();
  setTimeout(applyLogo, 100);
  setTimeout(applyLogo, 500);
})();

#!/usr/bin/env python3
from pathlib import Path
t = Path("/tmp/base.html").read_text(encoding="utf-8")
t = t.replace('const VER="1.6.2"', 'const VER="1.6.4"')
t = t.replace('const KEY="boshra_preview_162"', 'const KEY="boshra_preview_164"')
t = t.replace('(a.type==="exam"?"آزمون":"کلاسی")', '(a.type==="exam"?"آزمون":a.type==="cont"?"مستمر":"کلاسی")')
if 'value="cont"' not in t:
    t = t.replace('<option value="exam">آزمون</option>', '<option value="cont">مستمر</option><option value="exam">آزمون</option>')
    t = t.replace('<option value="40">سقف ۴۰</option>', '')
    t = t.replace('سقف ۵', 'از ۵').replace('سقف ۱۰', 'از ۱۰').replace('سقف ۲۰', 'از ۲۰')
t = t.replace('هر تعداد ستون کلاسی یا آزمون اضافه کنید.', 'ستون کلاسی / مستمر / آزمون با سقف ۵، ۱۰ یا ۲۰. معادل از ۲۰ خودکار است.')
t = t.replace('field("توکن",', 'field("توکن API ایتا (از پنل eitaayar)",')
if "function bazaarAvailable" not in t:
    helper = r\"\"\"
function bazaarAvailable(){return !!(window.BazaarBridge&&typeof window.BazaarBridge.purchaseAdmin===\"function\");}
function bazaarUnlocked(){try{if(window.BazaarBridge&&typeof window.BazaarBridge.isAdminUnlocked===\"function\")return!!window.BazaarBridge.isAdminUnlocked();}catch(e){}return!!window.__BAZAAR_ADMIN_UNLOCKED;}
function viewPaywall(){return screen('<h1 style=\"text-align:center\">دسترسی ادمین</h1><p class=\"muted\" style=\"text-align:center\">برای ورود به بخش ادمین باید یک‌بار پرداخت درون‌برنامه‌ای انجام شود (بدون اشتراک).</p><p class=\"muted\" style=\"text-align:center\">شناسه محصول: admin_unlock</p><button class=\"btn\" id=\"buypay\" style=\"margin-top:12px\">پرداخت و فعال‌سازی ادمین</button><button class=\"btn ghost\" id=\"backlogin\" style=\"margin-top:8px\">بازگشت به ورود</button><p class=\"muted\" style=\"text-align:center;margin-top:10px\" id=\"payst\">در صورت نصب بودن برنامه بازار، صفحه پرداخت باز می‌شود.</p>');}
window.onBazaarEvent=function(ev,msg){const st=document.getElementById(\"payst\");if(ev===\"success\"){toast(\"پرداخت موفق — دسترسی ادمین فعال شد\");if(ui._pendingAdmin){session=ui._pendingAdmin;sessionStorage.setItem(\"boshra_sess\",JSON.stringify(session));ui._pendingAdmin=null;ui.tab=\"dash\";}render();return;}if(ev===\"canceled\"){if(st)st.textContent=\"پرداخت لغو شد\";toast(\"پرداخت لغو شد\");}if(ev===\"error\"){if(st)st.textContent=msg||\"خطا\";toast(msg||\"خطای پرداخت\");}if(ev===\"began\"){if(st)st.textContent=\"در حال باز کردن درگاه بازار…\";}};
window.onBazaarUnlockState=function(unlocked){if(unlocked&&ui._pendingAdmin){session=ui._pendingAdmin;sessionStorage.setItem(\"boshra_sess\",JSON.stringify(session));ui._pendingAdmin=null;render();}};
\"\"\"
    t = t.replace(\"const uid=()=>Math.random().toString(36).slice(2,10);\", \"const uid=()=>Math.random().toString(36).slice(2,10);\"+helper)
if \"ui._pendingAdmin\" not in t:
    t = t.replace(
        'session={id:u.id,name:u.name,role:u.role,username:u.username};\\n      sessionStorage.setItem(\"boshra_sess\",JSON.stringify(session));\\n      render();',
        'const sess={id:u.id,name:u.name,role:u.role,username:u.username};\\n      if(u.role===\"admin\"&&bazaarAvailable()&&!bazaarUnlocked()){\\n        ui._pendingAdmin=sess; ui.tab=\"paywall\"; session=null; sessionStorage.removeItem(\"boshra_sess\"); render(); return;\\n      }\\n      session=sess;\\n      sessionStorage.setItem(\"boshra_sess\",JSON.stringify(session));\\n      render();'
    )
if 'ui.tab===\"paywall\"' not in t:
    t = t.replace(
        \"if(!session){\",
        'if(!session&&ui.tab===\"paywall\"){\\n    root.innerHTML=viewPaywall();\\n    const buy=document.getElementById(\"buypay\");\\n    if(buy) buy.onclick=()=>{const st=document.getElementById(\"payst\");if(st)st.textContent=\"در حال اتصال به بازار…\";try{window.BazaarBridge.purchaseAdmin();}catch(e){toast(\"خطا در شروع خرید\");}};\\n    const back=document.getElementById(\"backlogin\");\\n    if(back) back.onclick=()=>{ui.tab=\"dash\";ui._pendingAdmin=null;render();};\\n    return;\\n  }\\n  if(!session){',
        1
    )
Path(\"app/src/main/assets/www/index.html\").write_text(t, encoding=\"utf-8\")
print(\"index\", len(t))
assert 'const VER=\"1.6.4\"' in t
assert \"bazaarAvailable\" in t

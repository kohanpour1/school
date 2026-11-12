const DB="boshra_v6";
function getApi(){return(localStorage.getItem("boshra_api")||"").replace(/\/$/,"");}
function api(p){return getApi()+p;}
function authH(){const t=sessionStorage.getItem("boshra_token");return t?{"Authorization":"Bearer "+t,"Content-Type":"application/json"}:{"Content-Type":"application/json"};}
function uid(){return"x"+Math.random().toString(36).slice(2,10);}
function toast(m,e){const el=document.getElementById("toast");if(!el)return;el.textContent=m;el.className="toast "+(e?"bg-red-600":"bg-brand-600");el.classList.remove("hidden");clearTimeout(window.__tt);window.__tt=setTimeout(()=>el.classList.add("hidden"),2800);}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&","<":"<",">":">","\"":""","'":"&#39;"}[c]));}
function seed(){return{
  settings:{schoolName:"مؤسسه آموزشی غیر دولتی بشری",academicYear:"۱۴۰۴–۱۴۰۵",period:"متوسطه دوم",absenceMode:"per4",eitaaToken:"bot524916:fcbbb06d-4ea5-4932-817c-f9b1a1a9993d",eitaaChannel:"@boshraM2",eitaaAdminId:"34964572",cloudLink:"https://drive.google.com/drive/folders/1kuNTgWcTzhS4LtcJYBfOIdbl3kJyuOAx"},
  users:[
    {id:"u1",username:"admin",password:"admin123",name:"مدیر سامانه",role:"admin"},
    {id:"u2",username:"modir",password:"modir123",name:"مدیر مدرسه",role:"manager"},
    {id:"u3",username:"moaven",password:"m123",name:"معاون",role:"staff"},
    {id:"u4",username:"teacher1",password:"t123",name:"خانم احمدی",role:"teacher"}
  ],
  classes:[{id:"c1",grade:"دهم",classNo:"۱"},{id:"c2",grade:"یازدهم",classNo:"۱"},{id:"c3",grade:"دوازدهم",classNo:"۱"}],
  subjects:["ریاضی","فارسی","علوم","انگلیسی"],
  students:[
    {id:"s1",first:"آوا",last:"محمدی",classId:"c1",phone:"09120000001",eitaaId:"11111111",photo:""},
    {id:"s2",first:"کیا",last:"رضایی",classId:"c1",phone:"09120000002",eitaaId:"22222222",photo:""},
    {id:"s3",first:"هستی",last:"احمدی",classId:"c1",phone:"09120000003",eitaaId:"33333333",photo:""}
  ],
  attendance:[],scores:[],marks:[],notices:[],messages:[]
};}
function load(){
  try{const r=localStorage.getItem(DB);if(r){const d=JSON.parse(r);if(d&&d.settings)return d;}}catch(_){}
  try{const o=localStorage.getItem("boshra_v5")||localStorage.getItem("boshra_v4");if(o){const d=JSON.parse(o);if(d&&d.settings)return d;}}catch(_){}
  return seed();
}
function saveLocal(){localStorage.setItem(DB,JSON.stringify(S));}
let saveT;function save(){saveLocal();clearTimeout(saveT);saveT=setTimeout(pushState,450);}
async function pushState(){const t=sessionStorage.getItem("boshra_token");if(!t)return;try{await fetch(api("/api/state"),{method:"PUT",headers:authH(),body:JSON.stringify(S)});}catch(_){}}
async function pullState(){const t=sessionStorage.getItem("boshra_token");if(!t)return;try{const r=await fetch(api("/api/state"),{headers:authH()});if(r.ok){const d=await r.json();if(d&&d.settings){S=d;saveLocal();}}}catch(_){}}

let S=load(),session=JSON.parse(sessionStorage.getItem("boshra_sess")||"null"),tab="dash";
let ui={date:"1404/08/21",classId:(S.classes[0]&&S.classes[0].id)||"",subject:(S.subjects[0]||""),msgMode:"class"};
if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
if(!ui.subject&&S.subjects[0])ui.subject=S.subjects[0];

function isAdmin(){return session&&session.role==="admin";}
function isTeacher(){return session&&session.role==="teacher";}
function canWrite(){return isTeacher()||isAdmin();}
function isViewer(){return session&&(session.role==="manager"||session.role==="staff");}
function classLabel(c){return c?(c.grade+" / کلاس "+c.classNo):"—";}
function findClass(id){return S.classes.find(c=>c.id===id);}
function studentName(st){return ((st.first||"")+" "+(st.last||"")).trim();}
function abs(sid){return S.attendance.filter(a=>a.studentId===sid&&a.status==="absent").length;}
function pen(sid){const n=abs(sid);return S.settings.absenceMode==="per1"?Math.round(n*.25*100)/100:Math.floor(n/4);}
function tAvg(sid,sub,ty){const v=S.scores.filter(s=>s.studentId===sid&&s.subject===sub&&s.type===ty).map(s=>+s.value);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length*100)/100:null;}
function avg(a){a=a.filter(x=>x!=null);return a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*100)/100:null;}
function grades(sid,sub){
  const cls=tAvg(sid,sub,"class"),exam=tAvg(sid,sub,"exam"),c1=tAvg(sid,sub,"cont1"),f1=tAvg(sid,sub,"final1"),c2=tAvg(sid,sub,"cont2"),f2=tAvg(sid,sub,"final2");
  const plus=S.marks.filter(m=>m.studentId===sid&&m.subject===sub&&m.kind==="plus").length;
  const minus=S.marks.filter(m=>m.studentId===sid&&m.subject===sub&&m.kind==="minus").length;
  const t1=avg([c1,f1,cls,exam]),t2=avg([c2,f2]),b=avg([t1,t2]),p=pen(sid);
  let fin=b==null?null:Math.max(0,Math.round((b-p+(plus*0.25)-(minus*0.25))*100)/100);
  if(fin!=null)fin=Math.min(20,fin);
  return{cls,exam,c1,f1,c2,f2,t1,t2,p,plus,minus,final:fin};
}
function setScore(sid,sub,type,value){
  S.scores=S.scores.filter(s=>!(s.studentId===sid&&s.subject===sub&&s.type===type));
  if(value!==""&&value!=null&&!isNaN(+value))S.scores.push({id:uid(),studentId:sid,subject:sub,type:type,value:Math.min(20,Math.max(0,+value)),date:ui.date});
}
async function login(u,p){
  try{const r=await fetch(api("/api/login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})});
  if(r.ok){const j=await r.json();sessionStorage.setItem("boshra_token",j.token);session={id:j.user.id,name:j.user.name,role:j.user.role,online:true};sessionStorage.setItem("boshra_sess",JSON.stringify(session));await pullState();tab="dash";render();toast("ورود آنلاین");return;}}catch(_){}
  const user=S.users.find(x=>x.username===u&&x.password===p);if(!user)return toast("نام کاربری یا رمز اشتباه","err");
  sessionStorage.removeItem("boshra_token");session={id:user.id,name:user.name,role:user.role,online:false};sessionStorage.setItem("boshra_sess",JSON.stringify(session));tab="dash";render();toast("ورود · نقش: "+roleFa(user.role));
}
function roleFa(r){return({admin:"ادمین",teacher:"معلم",manager:"مدیر",staff:"معاون/عوامل"}[r]||r);}
function logout(){session=null;sessionStorage.removeItem("boshra_sess");sessionStorage.removeItem("boshra_token");render();}
async function eitaa(chatId,text){
  if(!chatId)return;
  S.messages.push({id:uid(),chatId:String(chatId),text,date:ui.date,at:Date.now()});save();
  const tok=sessionStorage.getItem("boshra_token");
  if(tok){try{await fetch(api("/api/eitaa"),{method:"POST",headers:authH(),body:JSON.stringify({chat_id:String(chatId),text})});}catch(_){}}
}
function roleTabs(){
  const base=[{id:"dash",t:"داشبورد"},{id:"stu",t:"دانش‌آموز"},{id:"att",t:"حضور"},{id:"score",t:"نمره"},{id:"card",t:"کارنامه"},{id:"msg",t:"پیام"},{id:"exp",t:"خروجی"}];
  if(isAdmin())base.push({id:"admin",t:"ادمین"});
  return base;
}
function shell(html){
  const items=roleTabs();
  document.getElementById("app").innerHTML=`<header class="bg-brand-600 text-white shadow-lg sticky top-0 z-40">
    <div class="max-w-3xl mx-auto px-3 hdr flex justify-between items-start gap-2">
      <div class="flex gap-3 items-start pt-1">
        <div class="logo text-lg shrink-0" style="width:48px;height:48px">ب</div>
        <div class="pt-0.5">
          <div class="hdr-title">${esc(S.settings.schoolName)}</div>
          <div class="hdr-sub">${esc(session.name)} · ${roleFa(session.role)}${session.online?" · آنلاین":" · آفلاین"} · ${esc(S.settings.academicYear||"")}</div>
        </div>
      </div>
      <button id="lo" class="text-xs bg-white/20 hover:bg-white/30 px-3 py-2.5 rounded-xl mt-1 font-medium">خروج</button>
    </div>
    <div class="max-w-3xl mx-auto flex overflow-x-auto border-t border-white/15">${items.map(i=>`<button data-t="${i.id}" class="nav-btn ${tab===i.id?"tab-on bg-white/15":"text-white/90"}">${i.t}</button>`).join("")}</div>
  </header>
  <main class="max-w-3xl mx-auto p-3.5 pb-24 safe-bottom">${html}</main>`;
  document.getElementById("lo").onclick=logout;
  document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{tab=b.dataset.t;render();});
}
function renderLogin(){
  document.getElementById("app").innerHTML=`<div class="min-h-screen flex items-center justify-center p-4">
    <div class="card w-full max-w-md p-7">
      <div class="text-center mb-6">
        <div class="logo text-3xl mx-auto mb-3.5" style="width:80px;height:80px">ب</div>
        <h1 class="font-extrabold text-brand-700 text-xl leading-9">مؤسسه آموزشی غیر دولتی بشری</h1>
        <p class="text-sm text-gray-500 mt-2">سامانه مدیریت مدرسه · ورود با نقش</p>
      </div>
      <form id="lf" class="gap-form">
        <div><label class="lbl">آدرس سرور همگام‌سازی (اختیاری)</label><input class="inp-lg" name="api" dir="ltr" placeholder="https://server.example.com" value="${esc(localStorage.getItem("boshra_api")||"")}"/></div>
        <div><label class="lbl">نام کاربری</label><input class="inp-lg" name="u" required autocomplete="username" placeholder="نام کاربری"/></div>
        <div><label class="lbl">رمز عبور</label><input class="inp-lg" name="p" type="password" required autocomplete="current-password" placeholder="رمز عبور"/></div>
        <button class="btn-p w-full py-3.5 rounded-xl text-base font-bold mt-1 shadow">ورود به سامانه</button>
      </form>
      <div class="text-[11px] text-gray-500 mt-5 leading-6 text-center">
        <div>admin / admin123 · teacher1 / t123 · modir / modir123</div>
        <div class="mt-1">معلم: دانش‌آموز، حضور، نمره، پیام · ادمین: پایه، کلاس، درس · مدیر: مشاهده</div>
      </div>
    </div>
  </div>`;
  document.getElementById("lf").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);localStorage.setItem("boshra_api",(f.get("api")||"").toString().trim().replace(/\$/,""));await login(f.get("u"),f.get("p"));};
}
function renderDash(){
  const absToday=S.attendance.filter(a=>a.date===ui.date&&a.status==="absent").length;
  shell(`<div class="grid grid-cols-2 gap-3">
    <div class="card p-4 text-center"><div class="text-2xl font-extrabold text-brand-600">${S.students.length}</div><div class="text-xs mt-1.5 text-gray-600">دانش‌آموز</div></div>
    <div class="card p-4 text-center"><div class="text-2xl font-extrabold text-red-600">${absToday}</div><div class="text-xs mt-1.5 text-gray-600">غایب امروز</div></div>
    <div class="card p-4 text-center"><div class="text-2xl font-extrabold text-brand-600">${S.classes.length}</div><div class="text-xs mt-1.5 text-gray-600">کلاس</div></div>
    <div class="card p-4 text-center"><div class="text-2xl font-extrabold text-brand-600">${S.subjects.length}</div><div class="text-xs mt-1.5 text-gray-600">درس</div></div>
  </div>
  <div class="card p-4 mt-3.5 text-sm text-gray-600 leading-7">
    <div class="font-bold text-brand-700 mb-1">نقش شما: ${roleFa(session.role)}</div>
    ${isTeacher()?"امکانات معلم: ثبت دانش‌آموز و آیدی ایتا والدین، حضور و غیاب با اعلان فوری، نمره کلاسی و آزمون، مثبت/منفی، پیام به والدین.":""}
    ${isAdmin()?"امکانات ادمین: تعریف پایه و شماره کلاس و درس، کاربران و نقش‌ها، توکن/کانال ایتا، لینک ابری.":""}
    ${isViewer()?"مدیر و معاون فقط امکان مشاهده لیست حضور و نمرات را دارند.":""}
  </div>`);
}

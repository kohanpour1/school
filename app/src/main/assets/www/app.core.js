const DB="boshra_v5";
function getApi(){return(localStorage.getItem("boshra_api")||"").replace(/\/$/,"");}
function api(p){return getApi()+p;}
function authH(){const t=sessionStorage.getItem("boshra_token");return t?{"Authorization":"Bearer "+t,"Content-Type":"application/json"}:{"Content-Type":"application/json"};}
function uid(){return"x"+Math.random().toString(36).slice(2,9);}
function toast(m,e){const el=document.getElementById("toast");el.textContent=m;el.className="toast "+(e?"bg-red-600":"bg-brand-600");el.classList.remove("hidden");setTimeout(()=>el.classList.add("hidden"),2800);}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&","<":"<",">":">","\"":""","'":"&#39;"}[c]));}
function seed(){return{
  settings:{schoolName:"مؤسسه آموزشی غیر دولتی بشری",academicYear:"۱۴۰۴–۱۴۰۵",absenceMode:"per4",eitaaToken:"bot524916:fcbbb06d-4ea5-4932-817c-f9b1a1a9993d",eitaaChannel:"@boshraM2",eitaaAdminId:"34964572",cloudLink:"https://drive.google.com/drive/folders/1kuNTgWcTzhS4LtcJYBfOIdbl3kJyuOAx"},
  users:[
    {id:"u1",username:"admin",password:"admin123",name:"مدیر سامانه",role:"admin"},
    {id:"u2",username:"modir",password:"modir123",name:"مدیر مدرسه",role:"manager"},
    {id:"u3",username:"moaven",password:"m123",name:"معاون",role:"staff"},
    {id:"u4",username:"teacher1",password:"t123",name:"خانم احمدی",role:"teacher"}
  ],
  classes:[{id:"c1",grade:"دهم",classNo:"۱"},{id:"c2",grade:"یازدهم",classNo:"۱"}],
  subjects:["ریاضی","فارسی","علوم"],
  students:[
    {id:"s1",first:"آوا",last:"محمدی",classId:"c1",phone:"09120000001",eitaaId:"11111111"},
    {id:"s2",first:"کیا",last:"رضایی",classId:"c1",phone:"09120000002",eitaaId:"22222222"},
    {id:"s3",first:"هستی",last:"احمدی",classId:"c1",phone:"09120000003",eitaaId:"33333333"}
  ],
  attendance:[],scores:[],marks:[],notices:[],messages:[]
};}
function load(){try{const r=localStorage.getItem(DB);if(r){const d=JSON.parse(r);if(d&&d.settings)return d;}}catch(_){}
try{const o=localStorage.getItem("boshra_v4");if(o){const d=JSON.parse(o);if(d&&d.settings){d._migrated=1;return d;}}}catch(_){}
return seed();}
function saveLocal(){localStorage.setItem(DB,JSON.stringify(S));}
let saveT;function save(){saveLocal();clearTimeout(saveT);saveT=setTimeout(pushState,400);}
async function pushState(){const t=sessionStorage.getItem("boshra_token");if(!t)return;try{await fetch(api("/api/state"),{method:"PUT",headers:authH(),body:JSON.stringify(S)});}catch(_){}}
async function pullState(){const t=sessionStorage.getItem("boshra_token");if(!t)return;try{const r=await fetch(api("/api/state"),{headers:authH()});if(r.ok){const d=await r.json();if(d&&d.settings){S=d;saveLocal();}}}catch(_){}}

let S=load(),session=JSON.parse(sessionStorage.getItem("boshra_sess")||"null"),tab="dash";
let ui={date:"1404/08/20",classId:(S.classes[0]&&S.classes[0].id)||"",subject:(S.subjects[0]||""),gradeFilter:"",msgMode:"class",msgStudent:"",msgGrade:""};
if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
if(!ui.subject&&S.subjects[0])ui.subject=S.subjects[0];

function isAdmin(){return session&&session.role==="admin";}
function isTeacher(){return session&&session.role==="teacher";}
function canWrite(){return isTeacher()||isAdmin();}
function isViewer(){return session&&(session.role==="manager"||session.role==="staff");}
function classLabel(c){return c?(c.grade+" / کلاس "+c.classNo):"—";}
function findClass(id){return S.classes.find(c=>c.id===id);}
function studentName(st){return (st.first||"")+" "+(st.last||"");}
function abs(sid){return S.attendance.filter(a=>a.studentId===sid&&a.status==="absent").length;}
function pen(sid){const n=abs(sid);return S.settings.absenceMode==="per1"?Math.round(n*.25*100)/100:Math.floor(n/4);}
function tAvg(sid,sub,ty){const v=S.scores.filter(s=>s.studentId===sid&&s.subject===sub&&s.type===ty).map(s=>+s.value);return v.length?Math.round(v.reduce((a,b)=>a+b,0)/v.length*100)/100:null;}
function avg(a){a=a.filter(x=>x!=null);return a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*100)/100:null;}
function grades(sid,sub){
  const cls=tAvg(sid,sub,"class"),exam=tAvg(sid,sub,"exam"),c1=tAvg(sid,sub,"cont1"),f1=tAvg(sid,sub,"final1"),c2=tAvg(sid,sub,"cont2"),f2=tAvg(sid,sub,"final2");
  const t1=avg([c1,f1,cls,exam]),t2=avg([c2,f2]),b=avg([t1,t2]),p=pen(sid);
  return{cls,exam,c1,f1,c2,f2,t1,t2,p,final:b==null?null:Math.max(0,Math.round((b-p)*100)/100)};
}
function setScore(sid,sub,type,value){
  S.scores=S.scores.filter(s=>!(s.studentId===sid&&s.subject===sub&&s.type===type));
  if(value!==""&&value!=null&&!isNaN(+value))S.scores.push({id:uid(),studentId:sid,subject:sub,type:type,value:Math.min(20,Math.max(0,+value)),date:ui.date});
}
async function login(u,p){
  try{const r=await fetch(api("/api/login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})});
  if(r.ok){const j=await r.json();sessionStorage.setItem("boshra_token",j.token);session={id:j.user.id,name:j.user.name,role:j.user.role,online:true};sessionStorage.setItem("boshra_sess",JSON.stringify(session));await pullState();tab="dash";render();toast("ورود آنلاین");return;}}catch(_){}
  const user=S.users.find(x=>x.username===u&&x.password===p);if(!user)return toast("نام کاربری یا رمز اشتباه","err");
  sessionStorage.removeItem("boshra_token");session={id:user.id,name:user.name,role:user.role,online:false};sessionStorage.setItem("boshra_sess",JSON.stringify(session));tab="dash";render();toast("ورود آفلاین · نقش: "+user.role);
}
function logout(){session=null;sessionStorage.removeItem("boshra_sess");sessionStorage.removeItem("boshra_token");render();}
async function eitaa(chatId,text){
  if(!chatId)return;
  S.messages.push({id:uid(),chatId:String(chatId),text,date:ui.date,at:Date.now()});save();
  const tok=sessionStorage.getItem("boshra_token");
  if(tok){try{await fetch(api("/api/eitaa"),{method:"POST",headers:authH(),body:JSON.stringify({chat_id:String(chatId),text})});}catch(_){}}
}
function roleTabs(){
  const base=[{id:"dash",t:"داشبورد"},{id:"stu",t:"دانش‌آموز"},{id:"att",t:"حضور"},{id:"score",t:"نمره"},{id:"card",t:"کارنامه"},{id:"msg",t:"پیام"}];
  if(isAdmin())base.push({id:"admin",t:"ادمین"});
  return base;
}
function shell(html){
  const items=roleTabs();
  document.getElementById("app").innerHTML=`<header class="bg-brand-600 text-white shadow sticky top-0 z-40">
    <div class="max-w-3xl mx-auto px-3 hdr flex justify-between items-start gap-2">
      <div class="flex gap-2.5 items-start pt-1">
        <div class="logo text-base shrink-0" style="width:44px;height:44px">ب</div>
        <div>
          <div class="hdr-title font-bold">${esc(S.settings.schoolName)}</div>
          <div class="hdr-sub">${esc(session.name)} · ${esc(session.role)}${session.online?" · آنلاین":" · آفلاین"}</div>
        </div>
      </div>
      <button id="lo" class="text-xs bg-white/15 px-3 py-2 rounded-lg mt-1">خروج</button>
    </div>
    <div class="max-w-3xl mx-auto flex overflow-x-auto border-t border-white/15">${items.map(i=>`<button data-t="${i.id}" class="nav-btn ${tab===i.id?"tab-on bg-white/10":"text-white/85"}">${i.t}</button>`).join("")}</div>
  </header>
  <main class="max-w-3xl mx-auto p-3 pb-20">${html}</main>`;
  document.getElementById("lo").onclick=logout;
  document.querySelectorAll("[data-t]").forEach(b=>b.onclick=()=>{tab=b.dataset.t;render();});
}

function renderLogin(){
  document.getElementById("app").innerHTML=`<div class="min-h-screen flex items-center justify-center p-4">
    <div class="card w-full max-w-md p-6">
      <div class="text-center mb-5">
        <div class="logo text-2xl mx-auto mb-3" style="width:72px;height:72px">ب</div>
        <h1 class="font-bold text-brand-700 text-lg leading-8">مؤسسه آموزشی غیر دولتی بشری</h1>
        <p class="text-sm text-gray-500 mt-1">ورود با نقش کاربری</p>
      </div>
      <form id="lf" class="gap-form">
        <div><label class="lbl">آدرس سرور (اختیاری)</label><input class="inp-lg" name="api" dir="ltr" placeholder="https://..." value="${esc(localStorage.getItem("boshra_api")||"")}"/></div>
        <div><label class="lbl">نام کاربری</label><input class="inp-lg" name="u" required placeholder="نام کاربری"/></div>
        <div><label class="lbl">رمز عبور</label><input class="inp-lg" name="p" type="password" required placeholder="رمز عبور"/></div>
        <button class="btn-p w-full py-3.5 rounded-xl text-base font-semibold mt-1">ورود</button>
      </form>
      <p class="text-[11px] text-gray-500 mt-4 leading-5">admin/admin123 · teacher1/t123 · modir/modir123<br/>معلم: ثبت دانش‌آموز/حضور/نمره · ادمین: پایه و درس و کلاس · مدیر: مشاهده</p>
    </div>
  </div>`;
  document.getElementById("lf").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.target);localStorage.setItem("boshra_api",(f.get("api")||"").toString().trim().replace(/\$/,""));await login(f.get("u"),f.get("p"));};
}

function renderDash(){
  const absToday=S.attendance.filter(a=>a.date===ui.date&&a.status==="absent").length;
  shell(`<div class="grid grid-cols-2 gap-3">
    <div class="card p-4 text-center"><div class="text-2xl font-bold text-brand-600">${S.students.length}</div><div class="text-xs mt-1 text-gray-600">دانش‌آموز</div></div>
    <div class="card p-4 text-center"><div class="text-2xl font-bold text-red-600">${absToday}</div><div class="text-xs mt-1 text-gray-600">غایب امروز</div></div>
    <div class="card p-4 text-center"><div class="text-2xl font-bold text-brand-600">${S.classes.length}</div><div class="text-xs mt-1 text-gray-600">کلاس</div></div>
    <div class="card p-4 text-center"><div class="text-2xl font-bold text-brand-600">${S.subjects.length}</div><div class="text-xs mt-1 text-gray-600">درس</div></div>
  </div>
  <div class="card p-4 mt-3 text-sm text-gray-600 leading-7">
    <b>نقش شما:</b> ${esc(session.role)}<br/>
    ${isTeacher()?"معلم: افزودن دانش‌آموز، حضور و غیاب، نمره کلاسی/آزمون، پیام به والدین":""}
    ${isAdmin()?"ادمین: تعریف پایه، شماره کلاس، درس، کاربران و تنظیمات ایتا":""}
    ${isViewer()?"مدیر/معاون: فقط مشاهده لیست‌ها و نمرات":""}
  </div>`);
}

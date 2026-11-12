(function(){
"use strict";
var DB="boshra_v7";
function getApi(){var a=localStorage.getItem("boshra_api")||"";return a.replace(/\/$/,"");}
function api(p){return getApi()+p;}
function authH(){
  var t=sessionStorage.getItem("boshra_token");
  var h={"Content-Type":"application/json"};
  if(t)h["Authorization"]="Bearer "+t;
  return h;
}
function uid(){return "x"+Math.random().toString(36).slice(2,10);}
function toast(m,e){
  var el=document.getElementById("toast");
  if(!el)return;
  el.textContent=m;
  el.style.background=e?"#dc2626":"#5B2C8A";
  el.className="toast show";
  clearTimeout(window.__tt);
  window.__tt=setTimeout(function(){el.className="toast";},2800);
}
function esc(s){
  return String(s==null?"":s)
    .replace(/&/g,"&")
    .replace(/</g,"<")
    .replace(/>/g,">")
    .replace(/"/g,""")
    .replace(/'/g,"&#39;");
}
function seed(){
  return {
    settings:{schoolName:"مؤسسه آموزشی غیر دولتی بشری",academicYear:"۱۴۰۴–۱۴۰۵",period:"متوسطه دوم",absenceMode:"per4",
      eitaaToken:"bot524916:fcbbb06d-4ea5-4932-817c-f9b1a1a9993d",eitaaChannel:"@boshraM2",eitaaAdminId:"34964572",
      cloudLink:"https://drive.google.com/drive/folders/1kuNTgWcTzhS4LtcJYBfOIdbl3kJyuOAx"},
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
  };
}
function load(){
  try{var r=localStorage.getItem(DB);if(r){var d=JSON.parse(r);if(d&&d.settings)return d;}}catch(e){}
  try{var o=localStorage.getItem("boshra_v6")||localStorage.getItem("boshra_v5")||localStorage.getItem("boshra_v4");
    if(o){var d2=JSON.parse(o);if(d2&&d2.settings)return d2;}}catch(e2){}
  return seed();
}
function saveLocal(){try{localStorage.setItem(DB,JSON.stringify(S));}catch(e){}}
var saveT;
function save(){saveLocal();clearTimeout(saveT);saveT=setTimeout(pushState,450);}
function pushState(){
  var t=sessionStorage.getItem("boshra_token");if(!t)return;
  try{fetch(api("/api/state"),{method:"PUT",headers:authH(),body:JSON.stringify(S)}).catch(function(){});}catch(e){}
}
function pullState(cb){
  var t=sessionStorage.getItem("boshra_token");if(!t){if(cb)cb();return;}
  try{
    fetch(api("/api/state"),{headers:authH()}).then(function(r){
      if(r.ok)return r.json();
    }).then(function(d){
      if(d&&d.settings){S=d;saveLocal();}
      if(cb)cb();
    }).catch(function(){if(cb)cb();});
  }catch(e){if(cb)cb();}
}

var S=load();
var session=null;
try{session=JSON.parse(sessionStorage.getItem("boshra_sess")||"null");}catch(e){session=null;}
var tab="dash";
var ui={date:"1404/08/21",classId:"",subject:"",msgMode:"class"};
if(S.classes&&S.classes[0])ui.classId=S.classes[0].id;
if(S.subjects&&S.subjects[0])ui.subject=S.subjects[0];

function isAdmin(){return session&&session.role==="admin";}
function isTeacher(){return session&&session.role==="teacher";}
function canWrite(){return isTeacher()||isAdmin();}
function isViewer(){return session&&(session.role==="manager"||session.role==="staff");}
function classLabel(c){return c?(c.grade+" / کلاس "+c.classNo):"—";}
function findClass(id){for(var i=0;i<S.classes.length;i++)if(S.classes[i].id===id)return S.classes[i];return null;}
function studentName(st){return ((st.first||"")+" "+(st.last||"")).trim();}
function abs(sid){var n=0;for(var i=0;i<S.attendance.length;i++){var a=S.attendance[i];if(a.studentId===sid&&a.status==="absent")n++;}return n;}
function pen(sid){var n=abs(sid);return S.settings.absenceMode==="per1"?Math.round(n*0.25*100)/100:Math.floor(n/4);}
function tAvg(sid,sub,ty){
  var v=[],i;for(i=0;i<S.scores.length;i++){var s=S.scores[i];if(s.studentId===sid&&s.subject===sub&&s.type===ty)v.push(+s.value);}
  if(!v.length)return null;
  var sum=0;for(i=0;i<v.length;i++)sum+=v[i];
  return Math.round(sum/v.length*100)/100;
}
function avg(a){var b=[],i;for(i=0;i<a.length;i++)if(a[i]!=null)b.push(a[i]);if(!b.length)return null;var s=0;for(i=0;i<b.length;i++)s+=b[i];return Math.round(s/b.length*100)/100;}
function grades(sid,sub){
  var cls=tAvg(sid,sub,"class"),exam=tAvg(sid,sub,"exam"),c1=tAvg(sid,sub,"cont1"),f1=tAvg(sid,sub,"final1"),c2=tAvg(sid,sub,"cont2"),f2=tAvg(sid,sub,"final2");
  var plus=0,minus=0,i;
  if(!S.marks)S.marks=[];
  for(i=0;i<S.marks.length;i++){var m=S.marks[i];if(m.studentId===sid&&m.subject===sub){if(m.kind==="plus")plus++;if(m.kind==="minus")minus++;}}
  var t1=avg([c1,f1,cls,exam]),t2=avg([c2,f2]),b=avg([t1,t2]),p=pen(sid);
  var fin=b==null?null:Math.max(0,Math.round((b-p+(plus*0.25)-(minus*0.25))*100)/100);
  if(fin!=null)fin=Math.min(20,fin);
  return {cls:cls,exam:exam,c1:c1,f1:f1,c2:c2,f2:f2,t1:t1,t2:t2,p:p,plus:plus,minus:minus,final:fin};
}
function setScore(sid,sub,type,value){
  var next=[];for(var i=0;i<S.scores.length;i++){var s=S.scores[i];if(!(s.studentId===sid&&s.subject===sub&&s.type===type))next.push(s);}
  S.scores=next;
  if(value!==""&&value!=null&&!isNaN(+value))S.scores.push({id:uid(),studentId:sid,subject:sub,type:type,value:Math.min(20,Math.max(0,+value)),date:ui.date});
}
function roleFa(r){return ({admin:"ادمین",teacher:"معلم",manager:"مدیر",staff:"معاون/عوامل"})[r]||r;}

function login(u,p){
  var base=getApi();
  if(base){
    try{
      fetch(api("/api/login"),{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})})
        .then(function(r){if(r.ok)return r.json();throw new Error("x");})
        .then(function(j){
          sessionStorage.setItem("boshra_token",j.token);
          session={id:j.user.id,name:j.user.name,role:j.user.role,online:true};
          sessionStorage.setItem("boshra_sess",JSON.stringify(session));
          pullState(function(){tab="dash";render();toast("ورود آنلاین");});
        }).catch(function(){loginLocal(u,p);});
      return;
    }catch(e){}
  }
  loginLocal(u,p);
}
function loginLocal(u,p){
  var user=null;
  for(var i=0;i<S.users.length;i++)if(S.users[i].username===u&&S.users[i].password===p){user=S.users[i];break;}
  if(!user){toast("نام کاربری یا رمز اشتباه",1);return;}
  sessionStorage.removeItem("boshra_token");
  session={id:user.id,name:user.name,role:user.role,online:false};
  sessionStorage.setItem("boshra_sess",JSON.stringify(session));
  tab="dash";render();toast("ورود موفق");
}
function logout(){
  session=null;
  sessionStorage.removeItem("boshra_sess");
  sessionStorage.removeItem("boshra_token");
  render();
}
function eitaa(chatId,text){
  if(!chatId)return;
  if(!S.messages)S.messages=[];
  S.messages.push({id:uid(),chatId:String(chatId),text:text,date:ui.date,at:Date.now()});
  save();
  var tok=sessionStorage.getItem("boshra_token");
  if(tok){try{fetch(api("/api/eitaa"),{method:"POST",headers:authH(),body:JSON.stringify({chat_id:String(chatId),text:text})}).catch(function(){});}catch(e){}}
}

function roleTabs(){
  var base=[{id:"dash",t:"داشبورد"},{id:"stu",t:"دانش‌آموز"},{id:"att",t:"حضور"},{id:"score",t:"نمره"},{id:"card",t:"کارنامه"},{id:"msg",t:"پیام"},{id:"exp",t:"خروجی"}];
  if(isAdmin())base.push({id:"admin",t:"ادمین"});
  return base;
}
function shell(html){
  var items=roleTabs();
  var nav="";
  for(var i=0;i<items.length;i++){
    var it=items[i];
    nav+='<button data-t="'+it.id+'" class="nav-btn '+(tab===it.id?"tab-on":"")+'" style="'+(tab===it.id?"background:rgba(255,255,255,.15)":"")+'">'+it.t+"</button>";
  }
  document.getElementById("app").innerHTML=
    '<header class="bg-brand-600 text-white shadow-lg sticky top-0 z-40">'+
    '<div class="max-w-3xl mx-auto px-3 hdr flex justify-between items-start gap-2">'+
    '<div class="flex gap-3 items-start" style="padding-top:4px">'+
    '<div class="logo text-lg shrink-0" style="width:48px;height:48px">ب</div>'+
    '<div><div class="hdr-title">'+esc(S.settings.schoolName)+'</div>'+
    '<div class="hdr-sub">'+esc(session.name)+" · "+roleFa(session.role)+(session.online?" · آنلاین":" · آفلاین")+" · "+esc(S.settings.academicYear||"")+"</div></div></div>"+
    '<button id="lo" class="text-xs px-3 py-3 rounded-xl font-bold" style="color:#fff;background:rgba(255,255,255,.2)">خروج</button></div>'+
    '<div class="max-w-3xl mx-auto nav-wrap" style="border-top:1px solid rgba(255,255,255,.15)">'+nav+"</div></header>"+
    '<main class="max-w-3xl mx-auto p-3 pb-24">'+html+"</main>";
  document.getElementById("lo").onclick=logout;
  var btns=document.querySelectorAll("[data-t]");
  for(var j=0;j<btns.length;j++){(function(b){b.onclick=function(){tab=b.getAttribute("data-t");render();};})(btns[j]);}
}

function renderLogin(){
  document.getElementById("app").innerHTML=
    '<div class="min-h-screen flex items-center justify-center p-4">'+
    '<div class="card w-full max-w-md p-7">'+
    '<div class="text-center mb-6">'+
    '<div class="logo text-3xl" style="width:80px;height:80px;margin:0 auto 14px">ب</div>'+
    '<h1 class="font-extrabold text-brand-700 text-xl leading-9">مؤسسه آموزشی غیر دولتی بشری</h1>'+
    '<p class="text-sm text-gray-500 mt-2">سامانه مدیریت مدرسه</p></div>'+
    '<form id="lf" class="gap-form">'+
    '<div><label class="lbl">آدرس سرور همگام‌سازی (اختیاری)</label>'+
    '<input class="inp-lg" name="api" dir="ltr" placeholder="https://server.example.com" value="'+esc(localStorage.getItem("boshra_api")||"")+'"/></div>'+
    '<div><label class="lbl">نام کاربری</label><input class="inp-lg" name="u" required autocomplete="username" placeholder="نام کاربری"/></div>'+
    '<div><label class="lbl">رمز عبور</label><input class="inp-lg" name="p" type="password" required autocomplete="current-password" placeholder="رمز عبور"/></div>'+
    '<button type="submit" class="btn-p w-full py-3 rounded-xl text-base font-bold shadow">ورود به سامانه</button>'+
    '</form></div></div>';
  document.getElementById("lf").onsubmit=function(e){
    e.preventDefault();
    var f=new FormData(e.target);
    localStorage.setItem("boshra_api",(f.get("api")||"").toString().trim().replace(/\$/,""));
    login(f.get("u"),f.get("p"));
  };
}

function renderDash(){
  var absToday=0,i;
  for(i=0;i<S.attendance.length;i++)if(S.attendance[i].date===ui.date&&S.attendance[i].status==="absent")absToday++;
  var roleNote="";
  if(isTeacher())roleNote="امکانات معلم: ثبت دانش‌آموز و آیدی ایتا والدین، حضور و غیاب، نمره، پیام به والدین.";
  if(isAdmin())roleNote="امکانات ادمین: تعریف پایه و کلاس و درس، کاربران، تنظیمات ایتا.";
  if(isViewer())roleNote="مدیر و معاون فقط مشاهده لیست‌ها و نمرات را دارند.";
  shell('<div class="grid grid-cols-2 gap-3">'+
    '<div class="card p-4 text-center"><div class="text-2xl font-extrabold text-brand-600">'+S.students.length+'</div><div class="text-xs text-gray-600 mt-2">دانش‌آموز</div></div>'+
    '<div class="card p-4 text-center"><div class="text-2xl font-extrabold text-red-600">'+absToday+'</div><div class="text-xs text-gray-600 mt-2">غایب امروز</div></div>'+
    '<div class="card p-4 text-center"><div class="text-2xl font-extrabold text-brand-600">'+S.classes.length+'</div><div class="text-xs text-gray-600 mt-2">کلاس</div></div>'+
    '<div class="card p-4 text-center"><div class="text-2xl font-extrabold text-brand-600">'+S.subjects.length+'</div><div class="text-xs text-gray-600 mt-2">درس</div></div></div>'+
    '<div class="card p-4 mt-3 text-sm text-gray-600 leading-7"><div class="font-bold text-brand-700 mb-1">نقش شما: '+roleFa(session.role)+'</div>'+roleNote+'</div>');
}

function studentsOfClass(cid){var out=[],i;for(i=0;i<S.students.length;i++)if(S.students[i].classId===cid)out.push(S.students[i]);return out;}

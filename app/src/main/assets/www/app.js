var DB="boshra_v9",S,session,tab="dash",ui={date:"1404/08/21",classId:"",subject:"",msgMode:"class"};
function $(id){return document.getElementById(id);}
function toast(m,err){var t=$("toast");if(!t)return;t.textContent=m;t.style.background=err?"#dc2626":"#5B2C8A";t.className="toast show";clearTimeout(window._tt);window._tt=setTimeout(function(){t.className="toast";},2500);}
function esc(s){
  s=String(s==null?"":s);
  return s.split("&").join("&"+"amp;").split("<").join("&"+"lt;").split(">").join("&"+"gt;").split('"').join("&"+"quot;");
}
function uid(){return "x"+Math.random().toString(36).slice(2,9);}
function seed(){return{settings:{schoolName:"مؤسسه آموزشی غیر دولتی بشری",academicYear:"۱۴۰۴–۱۴۰۵",period:"متوسطه دوم",absenceMode:"per4",eitaaToken:"bot524916:fcbbb06d-4ea5-4932-817c-f9b1a1a9993d",eitaaChannel:"@boshraM2",eitaaAdminId:"34964572",cloudLink:"https://drive.google.com/drive/folders/1kuNTgWcTzhS4LtcJYBfOIdbl3kJyuOAx"},users:[{id:"u1",username:"admin",password:"admin123",name:"مدیر سامانه",role:"admin"},{id:"u2",username:"modir",password:"modir123",name:"مدیر مدرسه",role:"manager"},{id:"u3",username:"moaven",password:"m123",name:"معاون",role:"staff"},{id:"u4",username:"teacher1",password:"t123",name:"خانم احمدی",role:"teacher"}],classes:[{id:"c1",grade:"دهم",classNo:"۱"},{id:"c2",grade:"یازدهم",classNo:"۱"},{id:"c3",grade:"دوازدهم",classNo:"۱"}],subjects:["ریاضی","فارسی","علوم","انگلیسی"],students:[{id:"s1",first:"آوا",last:"محمدی",classId:"c1",phone:"09120000001",eitaaId:"11111111"},{id:"s2",first:"کیا",last:"رضایی",classId:"c1",phone:"09120000002",eitaaId:"22222222"},{id:"s3",first:"هستی",last:"احمدی",classId:"c1",phone:"09120000003",eitaaId:"33333333"}],attendance:[],scores:[],marks:[],messages:[],notices:[]};}
function load(){try{var r=localStorage.getItem(DB);if(r){var d=JSON.parse(r);if(d&&d.settings)return d;}}catch(e){}try{var o=localStorage.getItem("boshra_v8")||localStorage.getItem("boshra_v7");if(o){var d2=JSON.parse(o);if(d2&&d2.settings)return d2;}}catch(e2){}return seed();}
function save(){try{localStorage.setItem(DB,JSON.stringify(S));}catch(e){}}
S=load();
try{session=JSON.parse(sessionStorage.getItem("boshra_sess")||"null");}catch(e){session=null;}
if(S.classes&&S.classes[0])ui.classId=S.classes[0].id;
if(S.subjects&&S.subjects[0])ui.subject=S.subjects[0];
function isAdmin(){return !!(session&&session.role==="admin");}
function isTeacher(){return !!(session&&session.role==="teacher");}
function canWrite(){return isTeacher()||isAdmin();}
function roleFa(r){return {admin:"ادمین",teacher:"معلم",manager:"مدیر",staff:"معاون"}[r]||r;}
function clabel(c){return c?(c.grade+" / کلاس "+c.classNo):"—";}
function findC(id){for(var i=0;i<S.classes.length;i++)if(S.classes[i].id===id)return S.classes[i];return null;}
function sname(st){return ((st.first||"")+" "+(st.last||"")).trim();}
function students(cid){var a=[],i;for(i=0;i<S.students.length;i++)if(S.students[i].classId===cid)a.push(S.students[i]);return a;}
function absN(sid){var n=0,i;for(i=0;i<S.attendance.length;i++)if(S.attendance[i].studentId===sid&&S.attendance[i].status==="absent")n++;return n;}
function pen(sid){var n=absN(sid);return S.settings.absenceMode==="per1"?Math.round(n*25)/100:Math.floor(n/4);}
function tAvg(sid,sub,ty){var v=[],i;for(i=0;i<S.scores.length;i++){var s=S.scores[i];if(s.studentId===sid&&s.subject===sub&&s.type===ty)v.push(+s.value);}if(!v.length)return null;var t=0;for(i=0;i<v.length;i++)t+=v[i];return Math.round(t/v.length*100)/100;}
function avg(a){var b=[],i;for(i=0;i<a.length;i++)if(a[i]!=null)b.push(a[i]);if(!b.length)return null;var t=0;for(i=0;i<b.length;i++)t+=b[i];return Math.round(t/b.length*100)/100;}
function grades(sid,sub){var cls=tAvg(sid,sub,"class"),exam=tAvg(sid,sub,"exam"),c1=tAvg(sid,sub,"cont1"),f1=tAvg(sid,sub,"final1"),c2=tAvg(sid,sub,"cont2"),f2=tAvg(sid,sub,"final2");var plus=0,minus=0,i;if(!S.marks)S.marks=[];for(i=0;i<S.marks.length;i++){var m=S.marks[i];if(m.studentId===sid&&m.subject===sub){if(m.kind==="plus")plus++;if(m.kind==="minus")minus++;}}var t1=avg([c1,f1,cls,exam]),t2=avg([c2,f2]),b=avg([t1,t2]),p=pen(sid);var fin=b==null?null:Math.max(0,Math.min(20,Math.round((b-p+plus*0.25-minus*0.25)*100)/100));return{cls:cls,exam:exam,c1:c1,f1:f1,c2:c2,f2:f2,t1:t1,t2:t2,p:p,plus:plus,minus:minus,final:fin};}
function setScore(sid,sub,type,val){var n=[],i;for(i=0;i<S.scores.length;i++){var s=S.scores[i];if(!(s.studentId===sid&&s.subject===sub&&s.type===type))n.push(s);}S.scores=n;if(val!==""&&val!=null&&!isNaN(+val))S.scores.push({id:uid(),studentId:sid,subject:sub,type:type,value:Math.min(20,Math.max(0,+val)),date:ui.date});}
function eitaa(id,text){if(!id)return;if(!S.messages)S.messages=[];S.messages.push({id:uid(),chatId:String(id),text:text,date:ui.date,at:Date.now()});save();}
function login(u,p){var user=null,i;for(i=0;i<S.users.length;i++)if(S.users[i].username===u&&S.users[i].password===p)user=S.users[i];if(!user){toast("نام کاربری یا رمز اشتباه",1);return;}session={id:user.id,name:user.name,role:user.role};sessionStorage.setItem("boshra_sess",JSON.stringify(session));tab="dash";render();toast("ورود موفق");}
function logout(){session=null;sessionStorage.removeItem("boshra_sess");render();}
function shell(html){
  var tabs=[{id:"dash",t:"داشبورد"},{id:"stu",t:"دانش‌آموز"},{id:"att",t:"حضور"},{id:"score",t:"نمره"},{id:"card",t:"کارنامه"},{id:"msg",t:"پیام"},{id:"exp",t:"خروجی"}];
  if(isAdmin())tabs.push({id:"admin",t:"ادمین"});
  var nav="",i;
  for(i=0;i<tabs.length;i++)nav+='<button type="button" data-t="'+tabs[i].id+'" class="'+(tab===tabs[i].id?"on":"")+'">'+tabs[i].t+"</button>";
  $("app").innerHTML=
    '<header><div class="top">'+
    '<div style="display:flex;gap:12px;align-items:flex-start">'+
    '<div class="logo" style="width:46px;height:46px;font-size:1.05rem;margin:0">ب</div>'+
    '<div style="padding-top:2px"><div class="ht">'+esc(S.settings.schoolName)+'</div>'+
    '<div class="hs">'+esc(session.name)+" · "+roleFa(session.role)+" · "+esc(S.settings.academicYear||"")+"</div></div></div>"+
    '<button type="button" class="btn-out" id="lo">خروج</button></div>'+
    '<div class="nav">'+nav+"</div></header><main>"+html+"</main>";
  $("lo").onclick=logout;
  var bs=document.querySelectorAll("[data-t]");
  for(i=0;i<bs.length;i++){(function(b){b.onclick=function(){tab=b.getAttribute("data-t");render();};})(bs[i]);}
}
function renderLogin(){
  $("app").innerHTML=
    '<div class="login-wrap">'+
    '<div class="card login-card">'+
    '<div class="logo">ب</div>'+
    '<h1 class="login-title">مؤسسه آموزشی غیر دولتی بشری</h1>'+
    '<p class="muted" style="text-align:center;margin:0 0 1.1rem">سامانه مدیریت مدرسه</p>'+
    '<form id="lf">'+
    '<label>آدرس سرور همگام‌سازی (اختیاری)</label>'+
    '<input class="inp" name="api" dir="ltr" placeholder="https://server.example.com" value="'+esc(localStorage.getItem("boshra_api")||"")+'">'+
    '<label>نام کاربری</label>'+
    '<input class="inp" name="u" required autocomplete="username" placeholder="نام کاربری">'+
    '<label>رمز عبور</label>'+
    '<input class="inp" name="p" type="password" required autocomplete="current-password" placeholder="رمز عبور">'+
    '<button type="submit" class="btn bp full">ورود به سامانه</button>'+
    '</form></div></div>';
  $("lf").onsubmit=function(e){
    e.preventDefault();
    var f=new FormData(e.target);
    localStorage.setItem("boshra_api",(f.get("api")||"").toString().trim());
    login(f.get("u"),f.get("p"));
  };
}
function renderDash(){
  var abs=0,i;
  for(i=0;i<S.attendance.length;i++)if(S.attendance[i].date===ui.date&&S.attendance[i].status==="absent")abs++;
  var note="";
  if(isTeacher())note="ثبت دانش‌آموز، حضور و غیاب، نمره و پیام به والدین.";
  if(isAdmin())note="تعریف پایه، کلاس، درس، کاربران و تنظیمات ایتا.";
  if(session&&(session.role==="manager"||session.role==="staff"))note="فقط مشاهده لیست‌ها و نمرات.";
  shell(
    '<div class="grid2">'+
    '<div class="card stat"><b>'+S.students.length+'</b><span class="muted">دانش‌آموز</span></div>'+
    '<div class="card stat"><b class="red">'+abs+'</b><span class="muted">غایب امروز</span></div>'+
    '<div class="card stat"><b>'+S.classes.length+'</b><span class="muted">کلاس</span></div>'+
    '<div class="card stat"><b>'+S.subjects.length+'</b><span class="muted">درس</span></div></div>'+
    '<div class="card"><div class="sec">نقش شما: '+roleFa(session.role)+'</div><p class="muted" style="margin:.4rem 0 0">'+note+"</p></div>"
  );
}
function render(){
  try{
    if(!session){renderLogin();return;}
    if(tab==="stu"&&typeof renderStu==="function")renderStu();
    else if(tab==="att"&&typeof renderAtt==="function")renderAtt();
    else if(tab==="score"&&typeof renderScore==="function")renderScore();
    else if(tab==="card"&&typeof renderCard==="function")renderCard();
    else if(tab==="msg"&&typeof renderMsg==="function")renderMsg();
    else if(tab==="exp"&&typeof renderExp==="function")renderExp();
    else if(tab==="admin"&&typeof renderAdmin==="function")renderAdmin();
    else renderDash();
  }catch(e){
    $("app").innerHTML='<div class="card" style="margin:1rem"><b>خطا</b><p>'+esc(String(e))+'</p><button type="button" class="btn bp" onclick="render()">تلاش مجدد</button></div>';
  }
}
render();

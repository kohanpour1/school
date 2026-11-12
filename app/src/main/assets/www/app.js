var DB="boshra_v11",S,session,tab="dash",ui={date:"1404/08/21",classId:"",subject:"",msgMode:"class"},API="",syncing=false;
function $(id){return document.getElementById(id);}
function toast(m,err){var t=$("toast");if(!t)return;t.textContent=m;t.style.background=err?"#dc2626":"#5B2C8A";t.className="toast show";clearTimeout(window._tt);window._tt=setTimeout(function(){t.className="toast";},2800);}
function esc(s){s=String(s==null?"":s);return s.split("&").join("&"+"amp;").split("<").join("&"+"lt;").split(">").join("&"+"gt;").split('"').join("&"+"quot;");}
function uid(){return "x"+Math.random().toString(36).slice(2,9);}
function apiBase(){return (localStorage.getItem("boshra_api")||"").replace(/\/$/,"");}
function seed(){
  return {
    settings:{schoolName:"مؤسسه آموزشی غیر دولتی بشری",academicYear:"۱۴۰۴–۱۴۰۵",period:"متوسطه دوم",absenceMode:"per4",
      eitaaToken:"bot524916:fcbbb06d-4ea5-4932-817c-f9b1a1a9993d",eitaaChannel:"@boshraM2",eitaaAdminId:"34964572",
      cloudLink:"https://drive.google.com/drive/folders/1kuNTgWcTzhS4LtcJYBfOIdbl3kJyuOAx",apiUrl:""},
    users:[
      {id:"u1",username:"admin",password:"admin123",name:"مدیر سامانه",role:"admin",subjects:[]},
      {id:"u2",username:"modir",password:"modir123",name:"مدیر مدرسه",role:"manager",subjects:[]},
      {id:"u3",username:"moaven",password:"m123",name:"معاون",role:"staff",subjects:[]},
      {id:"u4",username:"teacher1",password:"t123",name:"خانم احمدی",role:"teacher",subjects:["ریاضی"]},
      {id:"u5",username:"teacher2",password:"t123",name:"آقای کریمی",role:"teacher",subjects:["فارسی"]}
    ],
    grades:["دهم","یازدهم","دوازدهم"],
    classes:[
      {id:"c1",grade:"دهم",classNo:"۱"},
      {id:"c2",grade:"یازدهم",classNo:"۱"},
      {id:"c3",grade:"دوازدهم",classNo:"۱"}
    ],
    subjects:["ریاضی","فارسی","علوم","انگلیسی"],
    assignments:[
      {id:"a1",classId:"c1",subject:"ریاضی",teacherId:"u4"},
      {id:"a2",classId:"c1",subject:"فارسی",teacherId:"u5"}
    ],
    students:[
      {id:"s1",first:"آوا",last:"محمدی",classId:"c1",phone:"09120000001",eitaaId:"11111111"},
      {id:"s2",first:"کیا",last:"رضایی",classId:"c1",phone:"09120000002",eitaaId:"22222222"},
      {id:"s3",first:"هستی",last:"احمدی",classId:"c1",phone:"09120000003",eitaaId:"33333333"}
    ],
    attendance:[],scores:[],marks:[],messages:[],notices:[],updatedAt:new Date().toISOString()
  };
}
function migrate(d){
  if(!d.grades){var g={},i;d.grades=[];for(i=0;i<(d.classes||[]).length;i++){var gr=d.classes[i].grade;if(gr&&!g[gr]){g[gr]=1;d.grades.push(gr);}}if(!d.grades.length)d.grades=["دهم","یازدهم","دوازدهم"];}
  if(!d.assignments)d.assignments=[];
  for(var j=0;j<(d.classes||[]).length;j++){
    var c=d.classes[j];
    if(c.teacherIds&&c.teacherIds.length){
      for(var k=0;k<c.teacherIds.length;k++){
        var tid=c.teacherIds[k],u=null,ii;
        for(ii=0;ii<(d.users||[]).length;ii++)if(d.users[ii].id===tid)u=d.users[ii];
        var subs=(u&&u.subjects&&u.subjects.length)?u.subjects:(d.subjects||["ریاضی"]);
        for(var s=0;s<subs.length;s++){
          var exists=false,a;
          for(a=0;a<d.assignments.length;a++)if(d.assignments[a].classId===c.id&&d.assignments[a].subject===subs[s]&&d.assignments[a].teacherId===tid)exists=true;
          if(!exists)d.assignments.push({id:uid(),classId:c.id,subject:subs[s],teacherId:tid});
        }
      }
      delete c.teacherIds;
    }
  }
  for(var u=0;u<(d.users||[]).length;u++)if(!d.users[u].subjects)d.users[u].subjects=[];
  if(!d.scores)d.scores=[];if(!d.marks)d.marks=[];if(!d.messages)d.messages=[];
  return d;
}
function loadLocal(){
  try{var r=localStorage.getItem(DB);if(r){var d=JSON.parse(r);if(d&&d.settings)return migrate(d);}}catch(e){}
  try{var o=localStorage.getItem("boshra_v10")||localStorage.getItem("boshra_v9");if(o){var d2=JSON.parse(o);if(d2&&d2.settings)return migrate(d2);}}catch(e2){}
  return seed();
}
function saveLocal(){try{S.updatedAt=new Date().toISOString();localStorage.setItem(DB,JSON.stringify(S));}catch(e){}}
function save(){saveLocal();pushRemote();}
S=loadLocal();
API=apiBase();
try{session=JSON.parse(localStorage.getItem("boshra_sess")||"null");}catch(e){session=null;}
if(S.classes&&S.classes[0])ui.classId=S.classes[0].id;
if(S.subjects&&S.subjects[0])ui.subject=S.subjects[0];

function isAdmin(){return !!(session&&session.role==="admin");}
function isTeacher(){return !!(session&&session.role==="teacher");}
function canWrite(){return isTeacher()||isAdmin();}
function roleFa(r){return {admin:"ادمین",teacher:"معلم",manager:"مدیر",staff:"معاون",deputy:"معاون"}[r]||r;}
function clabel(c){return c?(c.grade+" / کلاس "+c.classNo):"—";}
function findC(id){for(var i=0;i<S.classes.length;i++)if(S.classes[i].id===id)return S.classes[i];return null;}
function findUser(id){for(var i=0;i<S.users.length;i++)if(S.users[i].id===id)return S.users[i];return null;}
function teachersList(){var a=[],i;for(i=0;i<S.users.length;i++)if(S.users[i].role==="teacher")a.push(S.users[i]);return a;}
function teacherSubjects(u){return (u&&u.subjects&&u.subjects.length)?u.subjects.join("، "):"—";}
function assignmentsForClass(cid){var a=[],i;for(i=0;i<(S.assignments||[]).length;i++)if(S.assignments[i].classId===cid)a.push(S.assignments[i]);return a;}
function assignLabel(a){var t=findUser(a.teacherId);return (a.subject||"?")+" ← "+(t?t.name:"?");}
function sname(st){return ((st.first||"")+" "+(st.last||"")).trim();}
function students(cid){var a=[],i;for(i=0;i<S.students.length;i++)if(S.students[i].classId===cid)a.push(S.students[i]);return a;}
function absN(sid){var n=0,i;for(i=0;i<S.attendance.length;i++)if(S.attendance[i].studentId===sid&&S.attendance[i].status==="absent")n++;return n;}
function pen(sid){var n=absN(sid);return S.settings.absenceMode==="per1"?Math.round(n*25)/100:Math.floor(n/4);}
function scoresOf(sid,sub,ty){var v=[],i;for(i=0;i<S.scores.length;i++){var s=S.scores[i];if(s.studentId===sid&&s.subject===sub&&s.type===ty)v.push(s);}return v;}
function tAvg(sid,sub,ty){var list=scoresOf(sid,sub,ty);if(!list.length)return null;var t=0,i;for(i=0;i<list.length;i++)t+=(+list[i].value);return Math.round(t/list.length*100)/100;}
function avg(a){var b=[],i;for(i=0;i<a.length;i++)if(a[i]!=null)b.push(a[i]);if(!b.length)return null;var t=0;for(i=0;i<b.length;i++)t+=b[i];return Math.round(t/b.length*100)/100;}
function to20(raw,max){max=+max||20;raw=+raw;if(isNaN(raw)||isNaN(max)||max<=0)return null;return Math.round(Math.min(20,Math.max(0,raw*20/max))*100)/100;}
function grades(sid,sub){
  var cls=tAvg(sid,sub,"class"),exam=tAvg(sid,sub,"exam"),c1=tAvg(sid,sub,"cont1"),f1=tAvg(sid,sub,"final1"),c2=tAvg(sid,sub,"cont2"),f2=tAvg(sid,sub,"final2");
  var plus=0,minus=0,i;if(!S.marks)S.marks=[];
  for(i=0;i<S.marks.length;i++){var m=S.marks[i];if(m.studentId===sid&&m.subject===sub){if(m.kind==="plus")plus++;if(m.kind==="minus")minus++;}}
  var t1=avg([c1,f1,cls,exam]),t2=avg([c2,f2]),b=avg([t1,t2]),p=pen(sid);
  var fin=b==null?null:Math.max(0,Math.min(20,Math.round((b-p+plus*0.25-minus*0.25)*100)/100));
  return{cls:cls,exam:exam,c1:c1,f1:f1,c2:c2,f2:f2,t1:t1,t2:t2,p:p,plus:plus,minus:minus,final:fin,classCount:scoresOf(sid,sub,"class").length};
}
function setSingleScore(sid,sub,type,val){
  var n=[],i;for(i=0;i<S.scores.length;i++){var s=S.scores[i];if(!(s.studentId===sid&&s.subject===sub&&s.type===type))n.push(s);}
  S.scores=n;
  if(val!==""&&val!=null&&!isNaN(+val))S.scores.push({id:uid(),studentId:sid,subject:sub,type:type,value:Math.min(20,Math.max(0,+val)),maxScore:20,raw:+val,date:ui.date,title:""});
}
function addClassScore(sid,sub,raw,maxScore,title){
  var v=to20(raw,maxScore);if(v==null)return null;
  var rec={id:uid(),studentId:sid,subject:sub,type:"class",value:v,maxScore:+maxScore,raw:+raw,title:title||("کلاسی "+(scoresOf(sid,sub,"class").length+1)),date:ui.date};
  S.scores.push(rec);return rec;
}
function eitaa(id,text){if(!id)return;if(!S.messages)S.messages=[];S.messages.push({id:uid(),chatId:String(id),text:text,date:ui.date,at:Date.now()});saveLocal();}

function authHeaders(){var h={"Content-Type":"application/json"};if(session&&session.token)h.Authorization="Bearer "+session.token;return h;}
function pullRemote(cb){
  var base=apiBase();if(!base){if(cb)cb(false);return;}
  syncing=true;
  fetch(base+"/api/state",{headers:authHeaders()}).then(function(r){
    if(!r.ok)throw new Error("HTTP "+r.status);
    return r.json();
  }).then(function(d){
    if(d&&d.settings){S=migrate(d);saveLocal();if(cb)cb(true);toast("همگام‌سازی از سرور");}
    else if(cb)cb(false);
  }).catch(function(e){if(cb)cb(false);toast("سرور در دسترس نیست — حالت آفلاین",1);}).finally(function(){syncing=false;});
}
function pushRemote(){
  var base=apiBase();if(!base||!session||!session.token)return;
  if(!(session.role==="admin"||session.role==="teacher"))return;
  fetch(base+"/api/state",{method:"PUT",headers:authHeaders(),body:JSON.stringify(S)}).then(function(r){
    if(!r.ok)throw new Error("fail");
  }).catch(function(){});
}
function login(u,p){
  var base=apiBase();
  if(base){
    fetch(base+"/api/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})})
      .then(function(r){return r.json().then(function(j){return {ok:r.ok,j:j};});})
      .then(function(res){
        if(!res.ok||!res.j.token){toast((res.j&&res.j.error)||"ورود ناموفق",1);return;}
        session={id:res.j.user.id,name:res.j.user.name,role:res.j.user.role,subjects:res.j.user.subjects||[],token:res.j.token};
        localStorage.setItem("boshra_sess",JSON.stringify(session));
        tab="dash";
        pullRemote(function(){render();toast("ورود و همگام‌سازی موفق");});
      }).catch(function(){localLogin(u,p);});
  } else localLogin(u,p);
}
function localLogin(u,p){
  var user=null,i;for(i=0;i<S.users.length;i++)if(S.users[i].username===u&&S.users[i].password===p)user=S.users[i];
  if(!user){toast("نام کاربری یا رمز اشتباه",1);return;}
  session={id:user.id,name:user.name,role:user.role,subjects:user.subjects||[],token:null};
  localStorage.setItem("boshra_sess",JSON.stringify(session));
  tab="dash";render();toast("ورود موفق (آفلاین)");
}
function logout(){
  var base=apiBase();
  if(base&&session&&session.token)fetch(base+"/api/logout",{method:"POST",headers:authHeaders()}).catch(function(){});
  session=null;localStorage.removeItem("boshra_sess");render();
}
function shell(html){
  var tabs=[{id:"dash",t:"داشبورد"},{id:"stu",t:"دانش‌آموز"},{id:"att",t:"حضور"},{id:"score",t:"نمره"},{id:"card",t:"کارنامه"},{id:"msg",t:"پیام"},{id:"exp",t:"خروجی"}];
  if(isAdmin())tabs.push({id:"admin",t:"ادمین"});
  var nav="",i,syncBadge=apiBase()?'<span style="font-size:.7rem;opacity:.85;margin-right:.4rem">'+(session&&session.token?"آنلاین":"آفلاین")+"</span>":"";
  for(i=0;i<tabs.length;i++)nav+='<button type="button" data-t="'+tabs[i].id+'" class="'+(tab===tabs[i].id?"on":"")+'">'+tabs[i].t+"</button>";
  $("app").innerHTML='<header><div class="top"><div style="display:flex;gap:12px;align-items:flex-start"><div class="logo" style="width:46px;height:46px;font-size:1.05rem;margin:0">ب</div><div style="padding-top:2px"><div class="ht">'+esc(S.settings.schoolName)+'</div><div class="hs">'+esc(session.name)+" · "+roleFa(session.role)+" · "+esc(S.settings.academicYear||"")+" "+syncBadge+'</div></div></div><button type="button" class="btn-out" id="lo">خروج</button></div><div class="nav">'+nav+"</div></header><main>"+html+"</main>";
  $("lo").onclick=logout;
  var bs=document.querySelectorAll("[data-t]");
  for(i=0;i<bs.length;i++){(function(b){b.onclick=function(){tab=b.getAttribute("data-t");render();};})(bs[i]);}
}
function renderLogin(){
  $("app").innerHTML='<div class="login-wrap"><div class="card login-card"><div class="logo">ب</div><h1 class="login-title">مؤسسه آموزشی غیر دولتی بشری</h1><p class="muted" style="text-align:center;margin:0 0 1.1rem">سامانه مدیریت مدرسه</p><form id="lf"><label>آدرس سرور همگام‌سازی</label><input class="inp" name="api" dir="ltr" placeholder="https://server.example.com" value="'+esc(apiBase())+'"><p class="muted" style="margin-top:-.3rem">برای چند موبایل همین آدرس را وارد کنید. خالی = فقط این گوشی</p><label>نام کاربری</label><input class="inp" name="u" required placeholder="نام کاربری"><label>رمز عبور</label><input class="inp" name="p" type="password" required placeholder="رمز عبور"><button type="submit" class="btn bp full">ورود به سامانه</button></form></div></div>';
  $("lf").onsubmit=function(e){e.preventDefault();var f=new FormData(e.target);localStorage.setItem("boshra_api",(f.get("api")||"").toString().trim());login(f.get("u"),f.get("p"));};
}
function renderDash(){
  var abs=0,i;for(i=0;i<S.attendance.length;i++)if(S.attendance[i].date===ui.date&&S.attendance[i].status==="absent")abs++;
  var note="",syncBtn="";
  if(isTeacher())note="دانش‌آموز، حضور، نمره، پیام.";
  if(isAdmin())note="دبیر و درس، پایه، کلاس، اختصاص دبیر به کلاس+درس، کاربران.";
  if(session&&(session.role==="manager"||session.role==="staff"||session.role==="deputy"))note="مشاهده لیست‌ها و نمرات.";
  if(apiBase())syncBtn='<button type="button" id="sync" class="btn bp full" style="margin-top:.6rem">همگام‌سازی با سرور</button>';
  shell('<div class="grid2"><div class="card stat"><b>'+S.students.length+'</b><span class="muted">دانش‌آموز</span></div><div class="card stat"><b class="red">'+abs+'</b><span class="muted">غایب امروز</span></div><div class="card stat"><b>'+S.classes.length+'</b><span class="muted">کلاس</span></div><div class="card stat"><b>'+teachersList().length+'</b><span class="muted">دبیر</span></div></div><div class="card"><div class="sec">نقش: '+roleFa(session.role)+'</div><p class="muted" style="margin:.4rem 0 0">'+note+"</p>"+syncBtn+"</div>");
  if($("sync"))$("sync").onclick=function(){pullRemote(function(ok){render();});};
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
  }catch(e){$("app").innerHTML='<div class="card" style="margin:1rem"><b>خطا</b><p>'+esc(String(e))+'</p><button type="button" class="btn bp" onclick="render()">تلاش مجدد</button></div>';}
}
if(session&&apiBase()&&session.token){pullRemote(function(){render();});} else render();

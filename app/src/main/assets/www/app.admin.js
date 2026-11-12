function renderCard(){
  if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
  var list=students(ui.classId),co="",i,body="";
  for(i=0;i<S.classes.length;i++)co+='<option value="'+S.classes[i].id+'"'+(S.classes[i].id===ui.classId?" selected":"")+">"+esc(clabel(S.classes[i]))+"</option>";
  for(i=0;i<list.length;i++){
    var st=list[i],rows="",j;
    for(j=0;j<S.subjects.length;j++){
      var g=grades(st.id,S.subjects[j]);
      if(g.cls==null&&g.exam==null&&g.c1==null&&g.f1==null&&g.c2==null&&g.f2==null)continue;
      rows+="<tr><td>"+esc(S.subjects[j])+"</td><td>"+(g.classCount||0)+" / "+(g.cls!=null?g.cls:"—")+"</td><td>"+(g.t1!=null?g.t1:"—")+"</td><td><b>"+(g.final!=null?g.final:"—")+"</b></td></tr>";
    }
    if(!rows)rows="<tr><td colspan=4>بدون نمره</td></tr>";
    body+="<div class='card'><b>"+esc(sname(st))+"</b><div class='muted'>آیدی ایتا: "+esc(st.eitaaId||"—")+" · غیبت "+absN(st.id)+" · کسر "+pen(st.id)+"</div><table><tr><th>درس</th><th>کلاسی</th><th>معدل۱</th><th>نهایی</th></tr>"+rows+"</table></div>";
  }
  shell('<div class="card"><label>کلاس</label><select id="cl">'+co+"</select></div>"+(body||"<div class='card muted'>خالی</div>"));
  $("cl").onchange=function(e){ui.classId=e.target.value;render();};
}

function renderMsg(){
  var gradesList=[],seen={},i,co="",so="",go="";
  for(i=0;i<S.classes.length;i++){if(!seen[S.classes[i].grade]){seen[S.classes[i].grade]=1;gradesList.push(S.classes[i].grade);}co+='<option value="'+S.classes[i].id+'">'+esc(clabel(S.classes[i]))+"</option>";}
  for(i=0;i<S.students.length;i++)so+='<option value="'+S.students[i].id+'">'+esc(sname(S.students[i]))+"</option>";
  for(i=0;i<gradesList.length;i++)go+="<option>"+esc(gradesList[i])+"</option>";
  shell('<div class="card"><div class="sec">پیام به والدین</div><label>محدوده</label><select id="mode"><option value="class">کلاس</option><option value="grade">پایه</option><option value="one">یک نفر</option></select><div id="fC"><label>کلاس</label><select id="cl">'+co+'</select></div><div id="fG" class="hide"><label>پایه</label><select id="gr">'+go+'</select></div><div id="fO" class="hide"><label>دانش‌آموز</label><select id="st">'+so+'</select></div><label>متن</label><textarea id="tx" rows="4"></textarea><button type="button" id="send" class="btn bp full"'+(canWrite()?"":" disabled")+">ارسال</button></div>");
  function sync(){var m=$("mode").value;$("fC").className=m==="class"?"":"hide";$("fG").className=m==="grade"?"":"hide";$("fO").className=m==="one"?"":"hide";}$("mode").onchange=sync;
  $("send").onclick=function(){if(!canWrite())return;var t=$("tx").value.trim();if(!t){toast("متن لازم است",1);return;}var targets=[],m=$("mode").value,i;if(m==="class")targets=students($("cl").value);else if(m==="grade"){var g=$("gr").value,ids={};for(i=0;i<S.classes.length;i++)if(S.classes[i].grade===g)ids[S.classes[i].id]=1;for(i=0;i<S.students.length;i++)if(ids[S.students[i].classId])targets.push(S.students[i]);}else{for(i=0;i<S.students.length;i++)if(S.students[i].id===$("st").value)targets.push(S.students[i]);}var n=0;for(i=0;i<targets.length;i++)if(targets[i].eitaaId){eitaa(targets[i].eitaaId,t);n++;}save();toast(n+" پیام ارسال شد");};
}

function renderExp(){
  if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
  var co="",so='<option value="">همه</option>',i;
  for(i=0;i<S.classes.length;i++)co+='<option value="'+S.classes[i].id+'"'+(S.classes[i].id===ui.classId?" selected":"")+">"+esc(clabel(S.classes[i]))+"</option>";
  for(i=0;i<S.subjects.length;i++)so+="<option>"+esc(S.subjects[i])+"</option>";
  shell('<div class="card"><div class="sec">خروجی CSV</div><label>کلاس</label><select id="cl">'+co+'</select><label>درس</label><select id="sub">'+so+'</select><button type="button" id="go" class="btn bp full">دانلود</button></div>');
  $("go").onclick=function(){var cid=$("cl").value,sub=$("sub").value,list=students(cid),subs=sub?[sub]:S.subjects.slice(),rows=[["نام","کلاس","درس","تعدادکلاسی","میانگین‌کلاسی","آزمون","نهایی","غیبت","کسر"]],i,j;for(i=0;i<list.length;i++)for(j=0;j<subs.length;j++){var g=grades(list[i].id,subs[j]);rows.push([sname(list[i]),clabel(findC(list[i].classId)),subs[j],g.classCount||0,g.cls!=null?g.cls:"",g.exam!=null?g.exam:"",g.final!=null?g.final:"",absN(list[i].id),pen(list[i].id)]);}var csv="\ufeff",r,c,line;for(r=0;r<rows.length;r++){line=[];for(c=0;c<rows[r].length;c++)line.push('"'+String(rows[r][c]).replace(/"/g,'""')+'"');csv+=line.join(",")+"\n";}var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download="boshra.csv";a.click();toast("دانلود شد");};
}

function renderAdmin(){
  if(!isAdmin()){tab="dash";render();return;}
  var s=S.settings,i,ghtml="",chtml="",shtml="",thtml="",asghtml="",us="",teachers=teachersList();
  if(!S.grades)S.grades=[];
  if(!S.assignments)S.assignments=[];

  for(i=0;i<S.grades.length;i++)ghtml+="<div class='row' style='margin:.35rem 0;align-items:center'><span>"+esc(S.grades[i])+"</span><button type='button' class='btn bd sm' data-dg='"+esc(S.grades[i])+"'>حذف</button></div>";

  for(i=0;i<S.classes.length;i++){
    var c=S.classes[i],asgs=assignmentsForClass(c.id),lab="";
    for(var a=0;a<asgs.length;a++)lab+=(lab?" · ":"")+assignLabel(asgs[a]);
    if(!lab)lab="بدون دبیر";
    chtml+="<div class='card' style='padding:.75rem;margin-bottom:.5rem'><b>"+esc(clabel(c))+"</b><div class='muted'>"+esc(lab)+"</div><div class='row' style='margin-top:.4rem'><button type='button' class='btn bp sm' data-ec='"+c.id+"'>ویرایش کلاس</button><button type='button' class='btn bg sm' data-as='"+c.id+"'>اختصاص دبیر</button><button type='button' class='btn bd sm' data-dc='"+c.id+"'>حذف</button></div></div>";
  }

  for(i=0;i<S.subjects.length;i++)shtml+="<div class='row' style='margin:.3rem 0;align-items:center'><span>"+esc(S.subjects[i])+"</span><button type='button' class='btn bd sm' data-ds='"+esc(S.subjects[i])+"'>حذف</button></div>";

  for(i=0;i<teachers.length;i++){
    var t=teachers[i];
    thtml+="<div class='card' style='padding:.7rem;margin-bottom:.4rem'><b>"+esc(t.name)+"</b><div class='muted'>"+esc(t.username)+" · درس‌ها: "+esc(teacherSubjects(t))+"</div><div class='row' style='margin-top:.35rem'><button type='button' class='btn bp sm' data-et='"+t.id+"'>ویرایش</button><button type='button' class='btn bd sm' data-rt='"+t.id+"'>حذف</button></div></div>";
  }
  if(!teachers.length)thtml="<p class='muted'>هنوز دبیری ثبت نشده</p>";

  for(i=0;i<S.assignments.length;i++){
    var as=S.assignments[i],cl=findC(as.classId),tu=findUser(as.teacherId);
    asghtml+="<div class='row' style='margin:.3rem 0;align-items:center;flex-wrap:wrap'><span style='flex:2'>"+esc(clabel(cl))+" · "+esc(as.subject)+" · "+esc(tu?tu.name:"?")+"</span><button type='button' class='btn bd sm' data-da='"+as.id+"'>حذف</button></div>";
  }
  if(!S.assignments.length)asghtml="<p class='muted'>هنوز اختصاصی نیست</p>";

  for(i=0;i<S.users.length;i++){
    var uu=S.users[i];
    us+="<div class='muted' style='margin:.25rem 0'>"+esc(uu.username)+" · "+esc(uu.name)+" · "+roleFa(uu.role)+(uu.role==="teacher"?" ("+esc(teacherSubjects(uu))+")":"")+(uu.username!=="admin"?" <button type='button' class='btn bd sm' data-du='"+uu.id+"'>حذف</button>":"")+"</div>";
  }

  shell(
    '<div class="card"><div class="sec">تنظیمات / ایتا / سرور</div><label>نام مدرسه</label><input id="sn" value="'+esc(s.schoolName)+'"><label>سال تحصیلی</label><input id="ay" value="'+esc(s.academicYear||"")+'"><label>دوره</label><input id="pr" value="'+esc(s.period||"")+'"><label>کسر غیبت</label><select id="am"><option value="per4"'+(s.absenceMode==="per4"?" selected":"")+'>هر ۴ غیبت = ۱</option><option value="per1"'+(s.absenceMode==="per1"?" selected":"")+'>هر غیبت ۰٫۲۵</option></select><label>توکن ایتا</label><input id="tk" dir=ltr value="'+esc(s.eitaaToken||"")+'"><label>کانال</label><input id="ch" dir=ltr value="'+esc(s.eitaaChannel||"")+'"><label>آیدی مدیر</label><input id="ad" dir=ltr value="'+esc(s.eitaaAdminId||"")+'"><label>آدرس سرور پیش‌فرض</label><input id="api" dir=ltr value="'+esc(apiBase())+'"><button type="button" id="ss" class="btn bp full">ذخیره تنظیمات</button></div>'+
    '<div class="card"><div class="sec">۱) لیست دبیران و درس‌هایشان</div><p class="muted">اول دبیر را با درس(های) تخصصی تعریف کنید</p><button type="button" id="at" class="btn bp">+ دبیر جدید</button><div style="margin-top:.6rem">'+thtml+'</div></div>'+
    '<div class="card"><div class="sec">۲) پایه‌های تحصیلی</div><div class="row"><input id="ng" placeholder="مثلاً دهم"><button type="button" id="ag" class="btn bp">+</button></div>'+ghtml+'</div>'+
    '<div class="card"><div class="sec">۳) کلاس‌ها</div><button type="button" id="ac" class="btn bp">+ کلاس جدید</button><div style="margin-top:.6rem">'+chtml+'</div></div>'+
    '<div class="card"><div class="sec">۴) اختصاص دبیر به کلاس و درس</div><p class="muted">برای هر کلاس، هر درس یک دبیر</p><button type="button" id="aa" class="btn bp">+ اختصاص جدید</button><div style="margin-top:.5rem">'+asghtml+'</div></div>'+
    '<div class="card"><div class="sec">دروس مدرسه</div><div class="row"><input id="ns" placeholder="نام درس"><button type="button" id="as" class="btn bp">+</button></div>'+shtml+'</div>'+
    '<div class="card"><div class="sec">کاربران و نقش‌ها</div><input id="nu" placeholder="نام کاربری"><input id="np" placeholder="رمز"><input id="nnm" placeholder="نام نمایشی"><select id="nr"><option value="teacher">معلم</option><option value="manager">مدیر</option><option value="staff">معاون</option><option value="admin">ادمین</option></select><button type="button" id="au" class="btn bp full">افزودن کاربر</button>'+us+'</div>'+
    '<div id="modal" class="modal hide"><div id="mb"></div></div>'
  );

  $("ss").onclick=function(){
    S.settings.schoolName=$("sn").value;S.settings.academicYear=$("ay").value;S.settings.period=$("pr").value;
    S.settings.absenceMode=$("am").value;S.settings.eitaaToken=$("tk").value;S.settings.eitaaChannel=$("ch").value;S.settings.eitaaAdminId=$("ad").value;
    localStorage.setItem("boshra_api",$("api").value.trim());
    save();toast("ذخیره شد");
  };

  $("ag").onclick=function(){var g=$("ng").value.trim();if(!g){toast("نام پایه لازم است",1);return;}if(S.grades.indexOf(g)>=0){toast("تکراری",1);return;}S.grades.push(g);save();render();};
  var dgs=document.querySelectorAll("[data-dg]");for(i=0;i<dgs.length;i++){(function(b){b.onclick=function(){var g=b.getAttribute("data-dg");if(!confirm("حذف پایه؟"))return;S.grades=S.grades.filter(function(x){return x!==g;});save();render();};})(dgs[i]);}

  $("as").onclick=function(){var x=$("ns").value.trim();if(!x)return;if(S.subjects.indexOf(x)<0)S.subjects.push(x);save();render();};
  var dss=document.querySelectorAll("[data-ds]");for(i=0;i<dss.length;i++){(function(b){b.onclick=function(){var n=b.getAttribute("data-ds");S.subjects=S.subjects.filter(function(s){return s!==n;});save();render();};})(dss[i]);}

  $("au").onclick=function(){var u=$("nu").value.trim(),p=$("np").value,n=$("nnm").value.trim(),r=$("nr").value;if(!u||!p){toast("ناقص",1);return;}for(var i=0;i<S.users.length;i++)if(S.users[i].username===u){toast("تکراری",1);return;}S.users.push({id:uid(),username:u,password:p,name:n||u,role:r,subjects:[]});save();render();};
  var dus=document.querySelectorAll("[data-du]");for(i=0;i<dus.length;i++){(function(b){b.onclick=function(){S.users=S.users.filter(function(u){return u.id!==b.getAttribute("data-du");});S.assignments=(S.assignments||[]).filter(function(a){return a.teacherId!==b.getAttribute("data-du");});save();render();};})(dus[i]);}

  function openTeacher(t){
    var m=$("modal"),mb=$("mb"),subChecks="",i;
    for(i=0;i<S.subjects.length;i++){
      var sub=S.subjects[i],chk=t&&t.subjects&&t.subjects.indexOf(sub)>=0;
      subChecks+='<label style="display:flex;align-items:center;gap:.4rem;font-weight:500;margin:.2rem 0"><input type="checkbox" value="'+esc(sub)+'" '+(chk?"checked":"")+"> "+esc(sub)+"</label>";
    }
    m.className="modal";
    mb.innerHTML="<h3 class='sec'>"+(t?"ویرایش دبیر":"دبیر جدید")+"</h3><label>نام نمایشی</label><input id='tn' value='"+esc(t?t.name:"")+"'><label>نام کاربری</label><input id='tu' dir=ltr value='"+esc(t?t.username:"")+"'><label>رمز</label><input id='tp' type='password' placeholder='"+(t?"خالی = بدون تغییر":"رمز")+"'><div class='sec' style='font-size:.9rem;margin:.5rem 0'>درس‌های تخصصی</div>"+subChecks+"<button type='button' id='ok' class='btn bp full' style='margin-top:.5rem'>ذخیره</button><button type='button' id='cx' class='btn full' style='background:#eee;margin-top:.35rem'>بستن</button>";
    $("cx").onclick=function(){m.className="modal hide";};
    $("ok").onclick=function(){
      var name=$("tn").value.trim(),user=$("tu").value.trim(),pass=$("tp").value;
      var subs=[],cbs=mb.querySelectorAll('input[type=checkbox]');for(var i=0;i<cbs.length;i++)if(cbs[i].checked)subs.push(cbs[i].value);
      if(!name||!user){toast("نام و نام کاربری لازم است",1);return;}
      if(t){
        for(i=0;i<S.users.length;i++)if(S.users[i].username===user&&S.users[i].id!==t.id){toast("نام کاربری تکراری",1);return;}
        t.name=name;t.username=user;if(pass)t.password=pass;t.subjects=subs;t.role="teacher";
      } else {
        for(i=0;i<S.users.length;i++)if(S.users[i].username===user){toast("نام کاربری تکراری",1);return;}
        if(!pass){toast("رمز لازم است",1);return;}
        S.users.push({id:uid(),username:user,password:pass,name:name,role:"teacher",subjects:subs});
      }
      save();m.className="modal hide";toast("ذخیره شد");render();
    };
  }
  $("at").onclick=function(){openTeacher(null);};
  var ets=document.querySelectorAll("[data-et]");for(i=0;i<ets.length;i++){(function(b){b.onclick=function(){openTeacher(findUser(b.getAttribute("data-et")));};})(ets[i]);}
  var rts=document.querySelectorAll("[data-rt]");for(i=0;i<rts.length;i++){(function(b){b.onclick=function(){if(!confirm("حذف دبیر؟"))return;var id=b.getAttribute("data-rt");S.users=S.users.filter(function(u){return u.id!==id;});S.assignments=S.assignments.filter(function(a){return a.teacherId!==id;});save();render();};})(rts[i]);}

  function openClass(c){
    var m=$("modal"),mb=$("mb"),gopts="",i;
    for(i=0;i<S.grades.length;i++)gopts+="<option"+(c&&c.grade===S.grades[i]?" selected":"")+">"+esc(S.grades[i])+"</option>";
    m.className="modal";
    mb.innerHTML="<h3 class='sec'>"+(c?"ویرایش کلاس":"کلاس جدید")+"</h3><label>پایه</label><select id='cg'>"+gopts+"</select><label>شماره کلاس</label><input id='cn' value='"+esc(c?c.classNo:"")+"'><button type='button' id='ok' class='btn bp full'>ذخیره</button><button type='button' id='cx' class='btn full' style='background:#eee;margin-top:.35rem'>بستن</button>";
    $("cx").onclick=function(){m.className="modal hide";};
    $("ok").onclick=function(){
      var grade=$("cg").value,classNo=$("cn").value.trim();
      if(!grade||!classNo){toast("ناقص",1);return;}
      if(c){c.grade=grade;c.classNo=classNo;}
      else S.classes.push({id:uid(),grade:grade,classNo:classNo});
      save();m.className="modal hide";toast("ذخیره شد");render();
    };
  }
  $("ac").onclick=function(){if(!S.grades.length){toast("اول پایه تعریف کنید",1);return;}openClass(null);};
  var ecs=document.querySelectorAll("[data-ec]");for(i=0;i<ecs.length;i++){(function(b){b.onclick=function(){openClass(findC(b.getAttribute("data-ec")));};})(ecs[i]);}
  var dcs=document.querySelectorAll("[data-dc]");for(i=0;i<dcs.length;i++){(function(b){b.onclick=function(){if(!confirm("حذف کلاس؟"))return;var id=b.getAttribute("data-dc");S.classes=S.classes.filter(function(c){return c.id!==id;});S.assignments=S.assignments.filter(function(a){return a.classId!==id;});save();render();};})(dcs[i]);}

  function openAssign(prefClassId){
    var m=$("modal"),mb=$("mb"),copts="",sopts="",topts="",i;
    for(i=0;i<S.classes.length;i++)copts+='<option value="'+S.classes[i].id+'"'+(prefClassId===S.classes[i].id?" selected":"")+">"+esc(clabel(S.classes[i]))+"</option>";
    for(i=0;i<S.subjects.length;i++)sopts+="<option>"+esc(S.subjects[i])+"</option>";
    for(i=0;i<teachers.length;i++)topts+='<option value="'+teachers[i].id+'">'+esc(teachers[i].name)+" ("+esc(teacherSubjects(teachers[i]))+")</option>";
    if(!teachers.length){toast("اول دبیر تعریف کنید",1);return;}
    m.className="modal";
    mb.innerHTML="<h3 class='sec'>اختصاص دبیر به کلاس و درس</h3><label>کلاس</label><select id='acls'>"+copts+"</select><label>درس</label><select id='asub'>"+sopts+"</select><label>دبیر</label><select id='atch'>"+topts+"</select><button type='button' id='ok' class='btn bp full'>ثبت</button><button type='button' id='cx' class='btn full' style='background:#eee;margin-top:.35rem'>بستن</button>";
    $("cx").onclick=function(){m.className="modal hide";};
    $("ok").onclick=function(){
      var cid=$("acls").value,sub=$("asub").value,tid=$("atch").value;
      for(var i=0;i<S.assignments.length;i++)if(S.assignments[i].classId===cid&&S.assignments[i].subject===sub){S.assignments[i].teacherId=tid;save();m.className="modal hide";toast("به‌روز شد");render();return;}
      S.assignments.push({id:uid(),classId:cid,subject:sub,teacherId:tid});
      save();m.className="modal hide";toast("اختصاص ثبت شد");render();
    };
  }
  $("aa").onclick=function(){openAssign(null);};
  var ass=document.querySelectorAll("[data-as]");for(i=0;i<ass.length;i++){(function(b){b.onclick=function(){openAssign(b.getAttribute("data-as"));};})(ass[i]);}
  var das=document.querySelectorAll("[data-da]");for(i=0;i<das.length;i++){(function(b){b.onclick=function(){S.assignments=S.assignments.filter(function(a){return a.id!==b.getAttribute("data-da");});save();render();};})(das[i]);}
}

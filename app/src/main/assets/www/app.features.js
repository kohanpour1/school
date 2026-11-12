function renderStu(){
  var can=canWrite(),rows="",i;
  for(i=0;i<S.students.length;i++){
    var st=S.students[i];
    rows+="<tr><td style='text-align:right'>"+esc(sname(st))+"</td><td>"+esc(clabel(findC(st.classId)))+"</td><td dir=ltr>"+esc(st.eitaaId||"—")+"</td><td>"+(can?'<button type="button" class="btn bp sm" data-ed="'+st.id+'">ویرایش</button> <button type="button" class="btn bd sm" data-rm="'+st.id+'">حذف</button>':"—")+"</td></tr>";
  }
  shell('<div class="card"><div class="sec">دانش‌آموزان</div><p class="muted">افزودن · ویرایش · حذف · آیدی ایتا والدین</p>'+(can?'<button type="button" id="add" class="btn bp">+ افزودن دانش‌آموز</button>':'')+'</div><div class="card" style="padding:0;overflow:auto"><table><tr><th>نام</th><th>کلاس</th><th>آیدی ایتا</th><th></th></tr>'+(rows||'<tr><td colspan="4">خالی</td></tr>')+'</table></div><div id="modal" class="modal hide"><div id="mb"></div></div>');
  if(!can)return;
  function open(st){
    var m=$("modal"),mb=$("mb"),opts="",i;
    for(i=0;i<S.classes.length;i++)opts+='<option value="'+S.classes[i].id+'"'+(st&&st.classId===S.classes[i].id?" selected":"")+">"+esc(clabel(S.classes[i]))+"</option>";
    m.className="modal";
    mb.innerHTML="<h3 class='sec'>"+(st?"ویرایش":"دانش‌آموز جدید")+"</h3><label>نام</label><input id='sf' value='"+esc(st?st.first:"")+"'><label>نام خانوادگی</label><input id='sl' value='"+esc(st?st.last:"")+"'><label>کلاس</label><select id='sc'>"+opts+"</select><label>تماس والدین</label><input id='sp' dir=ltr value='"+esc(st?st.phone:"")+"'><label>آیدی عددی ایتا والدین</label><input id='se' dir=ltr value='"+esc(st?st.eitaaId:"")+"'><button type='button' id='sv' class='btn bp full'>ذخیره</button><button type='button' id='cx' class='btn full' style='background:#eee;margin-top:.4rem'>بستن</button>";
    $("cx").onclick=function(){m.className="modal hide";};
    $("sv").onclick=function(){
      var f=$("sf").value.trim(),l=$("sl").value.trim(),c=$("sc").value,p=$("sp").value.trim(),e=$("se").value.trim();
      if(!f||!l){toast("نام لازم است",1);return;}
      if(!c){toast("کلاس را انتخاب کنید",1);return;}
      if(st){st.first=f;st.last=l;st.classId=c;st.phone=p;st.eitaaId=e;}
      else S.students.push({id:uid(),first:f,last:l,classId:c,phone:p,eitaaId:e});
      save();m.className="modal hide";toast("ذخیره شد");render();
    };
  }
  if($("add"))$("add").onclick=function(){open(null);};
  var eds=document.querySelectorAll("[data-ed]");for(i=0;i<eds.length;i++){(function(b){b.onclick=function(){var st=null,k;for(k=0;k<S.students.length;k++)if(S.students[k].id===b.getAttribute("data-ed"))st=S.students[k];open(st);};})(eds[i]);}
  var rms=document.querySelectorAll("[data-rm]");for(i=0;i<rms.length;i++){(function(b){b.onclick=function(){if(!confirm("حذف دانش‌آموز و نمرات مرتبط؟"))return;var id=b.getAttribute("data-rm");S.students=S.students.filter(function(s){return s.id!==id;});S.attendance=S.attendance.filter(function(a){return a.studentId!==id;});S.scores=S.scores.filter(function(s){return s.studentId!==id;});if(S.marks)S.marks=S.marks.filter(function(m){return m.studentId!==id;});save();render();};})(rms[i]);}
}

function renderAtt(){
  if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
  var list=students(ui.classId),ro=!canWrite(),st={},i,opts="",rows="";
  for(i=0;i<S.classes.length;i++)opts+='<option value="'+S.classes[i].id+'"'+(S.classes[i].id===ui.classId?" selected":"")+">"+esc(clabel(S.classes[i]))+"</option>";
  for(i=0;i<list.length;i++){
    var rec=null,j;for(j=0;j<S.attendance.length;j++)if(S.attendance[j].studentId===list[i].id&&S.attendance[j].date===ui.date)rec=S.attendance[j];
    st[list[i].id]=rec?rec.status:"";
    rows+='<tr data-sid="'+list[i].id+'"><td style="text-align:right">'+esc(sname(list[i]))+'</td><td class="st">'+(st[list[i].id]==="absent"?"غایب":st[list[i].id]==="present"?"حاضر":"—")+'</td><td>'+(ro?"—":'<button type="button" class="btn bg sm" data-a="present" data-id="'+list[i].id+'">حاضر</button> <button type="button" class="btn bd sm" data-a="absent" data-id="'+list[i].id+'">غایب</button>')+"</td></tr>";
  }
  shell('<div class="card"><div class="sec">حضور و غیاب</div><label>تاریخ شمسی</label><input id="d" value="'+esc(ui.date)+'" '+(ro?"disabled":"")+'><label>کلاس</label><select id="cl">'+opts+"</select></div><div class='card' style='padding:0;overflow:auto'><table><tr><th>نام</th><th>وضعیت</th><th></th></tr>"+(rows||'<tr><td colspan=3>خالی</td></tr>')+"</table></div>"+(ro?"":"<div class='row' style='position:sticky;bottom:12px'><button type='button' id='sv' class='btn bp'>ثبت</button><button type='button' id='dl' class='btn bd'>حذف روز</button></div>"));
  $("d").onchange=function(e){ui.date=e.target.value;render();};$("cl").onchange=function(e){ui.classId=e.target.value;render();};
  var abs=document.querySelectorAll("[data-a]");for(i=0;i<abs.length;i++){(function(b){b.onclick=function(){st[b.getAttribute("data-id")]=b.getAttribute("data-a");var el=document.querySelector('tr[data-sid="'+b.getAttribute("data-id")+'"] .st');if(el)el.textContent=b.getAttribute("data-a")==="absent"?"غایب":"حاضر";};})(abs[i]);}
  if($("sv"))$("sv").onclick=function(){for(var i=0;i<list.length;i++){var sid=list[i].id,status=st[sid];if(!status)continue;var rec=null,j;for(j=0;j<S.attendance.length;j++)if(S.attendance[j].studentId===sid&&S.attendance[j].date===ui.date)rec=S.attendance[j];if(!rec){rec={id:uid(),studentId:sid,date:ui.date,status:status,notified:false};S.attendance.push(rec);}else rec.status=status;if(status==="absent"&&!rec.notified){var text="اعلان غیبت\n"+sname(list[i])+"\n"+clabel(findC(list[i].classId))+"\n"+S.settings.schoolName+"\n"+ui.date;if(list[i].eitaaId)eitaa(list[i].eitaaId,text);if(S.settings.eitaaAdminId)eitaa(S.settings.eitaaAdminId,text);rec.notified=true;}}save();toast("ثبت شد");render();};
  if($("dl"))$("dl").onclick=function(){if(!confirm("حذف حضور این کلاس در این تاریخ؟"))return;var ids={};for(var i=0;i<list.length;i++)ids[list[i].id]=1;S.attendance=S.attendance.filter(function(a){return !(a.date===ui.date&&ids[a.studentId]);});save();render();};
}

function renderScore(){
  if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
  if(!ui.subject&&S.subjects[0])ui.subject=S.subjects[0];
  var list=students(ui.classId),ro=!canWrite(),i,so="",co="",rows="";
  for(i=0;i<S.subjects.length;i++)so+="<option"+(S.subjects[i]===ui.subject?" selected":"")+">"+esc(S.subjects[i])+"</option>";
  for(i=0;i<S.classes.length;i++)co+='<option value="'+S.classes[i].id+'"'+(S.classes[i].id===ui.classId?" selected":"")+">"+esc(clabel(S.classes[i]))+"</option>";
  for(i=0;i<list.length;i++){
    var g=grades(list[i].id,ui.subject);
    rows+="<tr><td style='text-align:right'>"+esc(sname(list[i]))+"</td><td>"+(g.classCount||0)+" مورد<br><small>"+(g.cls!=null?g.cls:"—")+"</small></td><td>"+(g.exam!=null?g.exam:"—")+"</td><td><b>"+(g.final!=null?g.final:"—")+"</b></td><td>"+(ro?"":'<button type="button" class="btn bp sm" data-e="'+list[i].id+'">مدیریت</button>')+"</td></tr>";
  }
  shell('<div class="card"><div class="sec">نمرات</div><p class="muted">نمره کلاسی: چند مورد · مقیاس ۵ / ۱۰ / ۲۰ · تبدیل خودکار به ۲۰</p><label>درس</label><select id="sub">'+so+'</select><label>کلاس</label><select id="cl">'+co+"</select></div><div class='card' style='padding:0;overflow:auto'><table><tr><th>نام</th><th>کلاسی‌ها</th><th>آزمون</th><th>نهایی</th><th></th></tr>"+(rows||'<tr><td colspan=5>—</td></tr>')+"</table></div><div id='modal' class='modal hide'><div id='mb'></div></div>");
  $("sub").onchange=function(e){ui.subject=e.target.value;render();};$("cl").onchange=function(e){ui.classId=e.target.value;render();};
  if(ro)return;
  var eds=document.querySelectorAll("[data-e]");
  for(i=0;i<eds.length;i++){(function(b){b.onclick=function(){openScoreModal(b.getAttribute("data-e"));};})(eds[i]);}

  function openScoreModal(sid){
    var st=null,k;for(k=0;k<S.students.length;k++)if(S.students[k].id===sid)st=S.students[k];
    var m=$("modal"),mb=$("mb");m.className="modal";
    function paint(){
      var g=grades(st.id,ui.subject),clsList=scoresOf(st.id,ui.subject,"class"),h="",i;
      h+="<h3 class='sec'>"+esc(sname(st))+" · "+esc(ui.subject)+"</h3>";
      h+="<div class='sec' style='font-size:.9rem;margin:.6rem 0'>نمرات کلاسی ("+clsList.length+")</div>";
      if(!clsList.length)h+="<p class='muted'>هنوز نمره کلاسی ثبت نشده</p>";
      for(i=0;i<clsList.length;i++){
        var sc=clsList[i];
        h+="<div class='card' style='padding:.7rem;margin-bottom:.45rem'><b>"+esc(sc.title||("کلاسی "+(i+1)))+"</b><div class='muted'>خام: "+sc.raw+" از "+sc.maxScore+" → معادل "+sc.value+" از ۲۰ · "+esc(sc.date||"")+"</div><div class='row' style='margin-top:.4rem'><button type='button' class='btn bp sm' data-ec='"+sc.id+"'>ویرایش</button><button type='button' class='btn bd sm' data-rc='"+sc.id+"'>حذف</button></div></div>";
      }
      h+="<button type='button' id='addCls' class='btn bp full' style='margin:.5rem 0'>+ افزودن نمره کلاسی</button>";
      h+="<hr style='border:0;border-top:1px solid #eee;margin:1rem 0'>";
      h+="<div class='sec' style='font-size:.9rem;margin-bottom:.5rem'>سایر نمرات (از ۲۰)</div>";
      var fields=[["exam","آزمون"],["cont1","مستمر نوبت ۱"],["final1","پایانی نوبت ۱"],["cont2","مستمر نوبت ۲"],["final2","پایانی نوبت ۲"]];
      for(i=0;i<fields.length;i++){var v=g[{exam:"exam",cont1:"c1",final1:"f1",cont2:"c2",final2:"f2"}[fields[i][0]]];h+="<label>"+fields[i][1]+"</label><input type='number' min='0' max='20' step='0.25' data-k='"+fields[i][0]+"' value='"+(v!=null?v:"")+"'>";}
      h+="<div class='row'><button type='button' id='plus' class='btn bg'>+ مثبت ("+g.plus+")</button><button type='button' id='minus' class='btn bd'>− منفی ("+g.minus+")</button></div>";
      h+="<button type='button' id='svOth' class='btn bp full' style='margin-top:.5rem'>ذخیره سایر نمرات</button>";
      h+="<button type='button' id='cx' class='btn full' style='background:#eee;margin-top:.4rem'>بستن</button>";
      mb.innerHTML=h;
      $("cx").onclick=function(){m.className="modal hide";render();};
      $("addCls").onclick=function(){showAddClass();};
      $("plus").onclick=function(){if(!S.marks)S.marks=[];S.marks.push({id:uid(),studentId:st.id,subject:ui.subject,kind:"plus",date:ui.date});save();toast("مثبت");paint();};
      $("minus").onclick=function(){if(!S.marks)S.marks=[];S.marks.push({id:uid(),studentId:st.id,subject:ui.subject,kind:"minus",date:ui.date});save();toast("منفی");paint();};
      $("svOth").onclick=function(){for(var i=0;i<fields.length;i++){var inp=mb.querySelector('[data-k="'+fields[i][0]+'"]');setSingleScore(st.id,ui.subject,fields[i][0],inp.value);}save();toast("ذخیره شد");paint();};
      var ecs=mb.querySelectorAll("[data-ec]");for(i=0;i<ecs.length;i++){(function(btn){btn.onclick=function(){showEditClass(btn.getAttribute("data-ec"));};})(ecs[i]);}
      var rcs=mb.querySelectorAll("[data-rc]");for(i=0;i<rcs.length;i++){(function(btn){btn.onclick=function(){if(!confirm("حذف این نمره کلاسی؟"))return;S.scores=S.scores.filter(function(s){return s.id!==btn.getAttribute("data-rc");});save();toast("حذف شد");paint();};})(rcs[i]);}
    }
    function showAddClass(){
      mb.innerHTML="<h3 class='sec'>نمره کلاسی جدید</h3><label>عنوان (اختیاری)</label><input id='ct' placeholder='مثلاً آزمون کلاسی ۱'><label>سقف نمره</label><select id='cm'><option value='5'>از ۵</option><option value='10'>از ۱۰</option><option value='20' selected>از ۲۰</option></select><label>نمره خام دانش‌آموز</label><input type='number' id='cr' step='0.25' min='0'><p class='muted' id='prev'>معادل از ۲۰: —</p><button type='button' id='ok' class='btn bp full'>ثبت</button><button type='button' id='back' class='btn full' style='background:#eee;margin-top:.4rem'>بازگشت</button>";
      function upd(){var m=+$("cm").value,r=$("cr").value;var v=to20(r,m);$("prev").textContent="معادل از ۲۰: "+(v!=null?v:"—");}
      $("cm").onchange=upd;$("cr").oninput=upd;$("back").onclick=paint;
      $("ok").onclick=function(){var max=+$("cm").value,raw=$("cr").value,title=$("ct").value.trim();if(raw===""||isNaN(+raw)){toast("نمره را وارد کنید",1);return;}if(+raw>max){toast("نمره بیشتر از سقف است",1);return;}addClassScore(st.id,ui.subject,raw,max,title);save();toast("نمره کلاسی اضافه شد");paint();};
    }
    function showEditClass(id){
      var sc=null,i;for(i=0;i<S.scores.length;i++)if(S.scores[i].id===id)sc=S.scores[i];if(!sc)return;
      mb.innerHTML="<h3 class='sec'>ویرایش نمره کلاسی</h3><label>عنوان</label><input id='ct' value='"+esc(sc.title||"")+"'><label>سقف نمره</label><select id='cm'><option value='5'"+(sc.maxScore==5?" selected":"")+">از ۵</option><option value='10'"+(sc.maxScore==10?" selected":"")+">از ۱۰</option><option value='20'"+(+sc.maxScore===20||!sc.maxScore?" selected":"")+">از ۲۰</option></select><label>نمره خام</label><input type='number' id='cr' step='0.25' min='0' value='"+(sc.raw!=null?sc.raw:sc.value)+"'><p class='muted' id='prev'></p><button type='button' id='ok' class='btn bp full'>ذخیره</button><button type='button' id='back' class='btn full' style='background:#eee;margin-top:.4rem'>بازگشت</button>";
      function upd(){var m=+$("cm").value,r=$("cr").value;var v=to20(r,m);$("prev").textContent="معادل از ۲۰: "+(v!=null?v:"—");}upd();
      $("cm").onchange=upd;$("cr").oninput=upd;$("back").onclick=paint;
      $("ok").onclick=function(){var max=+$("cm").value,raw=$("cr").value,title=$("ct").value.trim();if(raw===""||isNaN(+raw)){toast("نمره را وارد کنید",1);return;}if(+raw>max){toast("نمره بیشتر از سقف است",1);return;}var v=to20(raw,max);sc.maxScore=max;sc.raw=+raw;sc.value=v;sc.title=title||sc.title;save();toast("ویرایش شد");paint();};
    }
    paint();
  }
}

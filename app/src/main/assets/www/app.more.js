function renderCard(){
  if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
  const list=S.students.filter(s=>s.classId===ui.classId);
  shell(`<div class="card p-4 mb-3"><label class="lbl">کلاس</label>
    <select id="cl" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${c.id===ui.classId?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select>
  </div>
  ${list.map(st=>`<div class="card p-4 mb-3">
    <div class="font-bold text-base text-brand-800">${esc(studentName(st))}</div>
    <div class="text-xs text-gray-500 mt-1.5 leading-5">آیدی ایتا: ${esc(st.eitaaId||"—")} · غیبت ${abs(st.id)} · کسر ${pen(st.id)}</div>
    <table class="w-full mt-3"><thead><tr><th>درس</th><th>کلاسی</th><th>آزمون</th><th>معدل۱</th><th>نهایی</th></tr></thead>
    <tbody>${S.subjects.map(sub=>{const g=grades(st.id,sub);if([g.cls,g.exam,g.c1,g.f1,g.c2,g.f2].every(x=>x==null))return"";return`<tr><td>${esc(sub)}</td><td>${g.cls??"—"}</td><td>${g.exam??"—"}</td><td>${g.t1??"—"}</td><td class="font-bold">${g.final??"—"}</td></tr>`;}).join("")||"<tr><td colspan=5>بدون نمره</td></tr>"}</tbody></table>
  </div>`).join("")||`<div class="card p-6 text-center text-gray-400">دانش‌آموزی نیست</div>`}`);
  document.getElementById("cl").onchange=e=>{ui.classId=e.target.value;render();};
}

function renderMsg(){
  const grades=[...new Set(S.classes.map(c=>c.grade))];
  shell(`<div class="card p-4 space-y-3.5">
    <div class="font-bold text-brand-700 text-base">ارسال پیام به والدین</div>
    <div><label class="lbl">محدوده ارسال</label>
      <select id="mode" class="inp-lg">
        <option value="class" ${ui.msgMode==="class"?"selected":""}>یک کلاس</option>
        <option value="grade" ${ui.msgMode==="grade"?"selected":""}>یک پایه</option>
        <option value="one" ${ui.msgMode==="one"?"selected":""}>یک دانش‌آموز</option>
      </select>
    </div>
    <div id="fClass"><label class="lbl">کلاس</label>
      <select id="cl" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${c.id===ui.classId?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select>
    </div>
    <div id="fGrade" class="hidden"><label class="lbl">پایه</label>
      <select id="gr" class="inp-lg">${grades.map(g=>`<option value="${esc(g)}">${esc(g)}</option>`).join("")}</select>
    </div>
    <div id="fOne" class="hidden"><label class="lbl">جستجو / دانش‌آموز</label>
      <input id="q" class="inp-lg mb-2" placeholder="جستجوی نام..."/>
      <select id="st" class="inp-lg">${S.students.map(s=>`<option value="${s.id}">${esc(studentName(s))} · ${esc(classLabel(findClass(s.classId)))}</option>`).join("")}</select>
    </div>
    <div><label class="lbl">متن پیام</label><textarea id="tx" rows="4" class="inp-lg" placeholder="متن اطلاع‌رسانی جلسه یا پیام به والدین"></textarea></div>
    <button id="send" class="btn-p w-full py-3.5 rounded-xl font-bold" ${!canWrite()?"disabled":""}>ارسال پیام</button>
    ${!canWrite()?'<p class="text-xs text-amber-700">ارسال فقط برای معلم و ادمین</p>':""}
  </div>`);
  const sync=()=>{
    ui.msgMode=document.getElementById("mode").value;
    document.getElementById("fClass").classList.toggle("hidden",ui.msgMode!=="class");
    document.getElementById("fGrade").classList.toggle("hidden",ui.msgMode!=="grade");
    document.getElementById("fOne").classList.toggle("hidden",ui.msgMode!=="one");
  };
  document.getElementById("mode").onchange=sync;sync();
  document.getElementById("q")?.addEventListener("input",e=>{
    const q=e.target.value.trim();
    const sel=document.getElementById("st");
    const filtered=S.students.filter(s=>!q||studentName(s).includes(q));
    sel.innerHTML=filtered.map(s=>`<option value="${s.id}">${esc(studentName(s))} · ${esc(classLabel(findClass(s.classId)))}</option>`).join("");
  });
  document.getElementById("send").onclick=()=>{
    if(!canWrite())return toast("مجوز ندارید","err");
    const t=document.getElementById("tx").value.trim();if(!t)return toast("متن پیام را وارد کنید","err");
    let targets=[];
    if(ui.msgMode==="class"){const cid=document.getElementById("cl").value;targets=S.students.filter(s=>s.classId===cid);}
    else if(ui.msgMode==="grade"){const g=document.getElementById("gr").value;const ids=new Set(S.classes.filter(c=>c.grade===g).map(c=>c.id));targets=S.students.filter(s=>ids.has(s.classId));}
    else{const id=document.getElementById("st").value;const st=S.students.find(s=>s.id===id);if(st)targets=[st];}
    let n=0;targets.forEach(st=>{if(st.eitaaId){eitaa(st.eitaaId,t);n++;}});
    S.notices.push({id:uid(),date:ui.date,text:t,count:n,mode:ui.msgMode});save();
    toast(n+" پیام به والدین ارسال شد");
  };
}

function renderExp(){
  if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
  shell(`<div class="card p-4 space-y-3">
    <div class="font-bold text-brand-700 text-base">خروجی گزارش</div>
    <p class="text-xs text-gray-500 leading-5">خروجی CSV قابل باز شدن در اکسل — به تفکیک کلاس و درس</p>
    <div><label class="lbl">کلاس</label><select id="cl" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${c.id===ui.classId?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select></div>
    <div><label class="lbl">درس</label><select id="sub" class="inp-lg"><option value="">همه دروس</option>${S.subjects.map(s=>`<option ${s===ui.subject?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
    <button id="go" class="btn-p w-full py-3.5 rounded-xl font-bold">دانلود CSV</button>
  </div>`);
  document.getElementById("go").onclick=()=>{
    const cid=document.getElementById("cl").value;const sub=document.getElementById("sub").value;
    const list=S.students.filter(s=>s.classId===cid);
    const subs=sub?[sub]:S.subjects.slice();
    let rows=[["نام","کلاس","درس","کلاسی","آزمون","مستمر1","پایانی1","مستمر2","پایانی2","نهایی","غیبت","کسر"]];
    list.forEach(st=>{subs.forEach(su=>{const g=grades(st.id,su);rows.push([studentName(st),classLabel(findClass(st.classId)),su,g.cls??"",g.exam??"",g.c1??"",g.f1??"",g.c2??"",g.f2??"",g.final??"",abs(st.id),pen(st.id)]);});});
    const csv="\ufeff"+rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="boshra-report.csv";a.click();
    toast("فایل CSV آماده شد");
  };
}

function renderAdmin(){
  if(!isAdmin()){tab="dash";return render();}
  const s=S.settings;
  shell(`<div class="space-y-3.5">
    <div class="card p-4">
      <div class="font-bold text-brand-700 mb-3 text-base">تنظیمات مدرسه و ایتا</div>
      <div class="gap-form">
        <div><label class="lbl">نام مدرسه</label><input id="sn" class="inp-lg" value="${esc(s.schoolName)}"/></div>
        <div><label class="lbl">سال تحصیلی</label><input id="ay" class="inp-lg" value="${esc(s.academicYear||"")}"/></div>
        <div><label class="lbl">دوره (ابتدایی / متوسطه اول / دوم)</label><input id="pr" class="inp-lg" value="${esc(s.period||"")}"/></div>
        <div><label class="lbl">کسر غیبت</label><select id="am" class="inp-lg"><option value="per4" ${s.absenceMode==="per4"?"selected":""}>هر ۴ غیبت = ۱ نمره</option><option value="per1" ${s.absenceMode==="per1"?"selected":""}>هر غیبت ۰٫۲۵</option></select></div>
        <div><label class="lbl">توکن ایتا</label><input id="tk" class="inp-lg" dir="ltr" value="${esc(s.eitaaToken||"")}"/></div>
        <div><label class="lbl">کانال</label><input id="ch" class="inp-lg" dir="ltr" value="${esc(s.eitaaChannel||"")}"/></div>
        <div><label class="lbl">آیدی عددی مدیر</label><input id="ad" class="inp-lg" dir="ltr" value="${esc(s.eitaaAdminId||"")}"/></div>
        <div><label class="lbl">لینک فضای ابری</label><input id="cld" class="inp-lg" dir="ltr" value="${esc(s.cloudLink||"")}"/></div>
        <button id="ss" class="btn-p w-full py-3.5 rounded-xl font-bold">ذخیره تنظیمات</button>
      </div>
    </div>
    <div class="card p-4">
      <div class="font-bold text-brand-700 mb-2">پایه و شماره کلاس (فقط ادمین)</div>
      <div class="flex gap-2 mb-3">
        <input id="ng" class="inp-lg" placeholder="پایه مثلاً دهم"/>
        <input id="nn" class="inp-lg" placeholder="شماره کلاس"/>
        <button id="ac" class="btn-p px-4 rounded-xl shrink-0 font-bold">+</button>
      </div>
      <ul class="text-sm space-y-2">${S.classes.map(c=>`<li class="flex justify-between items-center border-b border-brand-100 pb-2"><span>${esc(classLabel(c))}</span><button data-dc="${c.id}" class="btn-d text-xs px-2.5 py-1 rounded-lg">حذف</button></li>`).join("")}</ul>
    </div>
    <div class="card p-4">
      <div class="font-bold text-brand-700 mb-2">دروس (فقط ادمین)</div>
      <div class="flex gap-2 mb-3"><input id="ns" class="inp-lg" placeholder="نام درس"/><button id="as" class="btn-p px-4 rounded-xl font-bold">+</button></div>
      <ul class="text-sm space-y-2">${S.subjects.map(sub=>`<li class="flex justify-between items-center border-b border-brand-100 pb-2"><span>${esc(sub)}</span><button data-ds="${esc(sub)}" class="btn-d text-xs px-2.5 py-1 rounded-lg">حذف</button></li>`).join("")}</ul>
    </div>
    <div class="card p-4">
      <div class="font-bold text-brand-700 mb-2">کاربران و نقش‌ها</div>
      <div class="gap-form mb-3">
        <input id="nu" class="inp-lg" placeholder="نام کاربری"/>
        <input id="np" class="inp-lg" placeholder="رمز"/>
        <input id="nnm" class="inp-lg" placeholder="نام نمایشی"/>
        <select id="nr" class="inp-lg"><option value="teacher">معلم</option><option value="manager">مدیر</option><option value="staff">معاون/عوامل</option><option value="admin">ادمین</option></select>
        <button id="au" class="btn-p py-3.5 rounded-xl font-bold">افزودن کاربر</button>
      </div>
      <ul class="text-sm space-y-2">${S.users.map(u=>`<li class="flex justify-between border-b border-brand-100 pb-2"><span>${esc(u.username)} · ${esc(u.name)} · ${roleFa(u.role)}</span>${u.username!=="admin"?`<button data-du="${u.id}" class="btn-d text-xs px-2.5 py-1 rounded-lg">حذف</button>`:""}</li>`).join("")}</ul>
    </div>
  </div>`);
  document.getElementById("ss").onclick=()=>{
    S.settings.schoolName=document.getElementById("sn").value;
    S.settings.academicYear=document.getElementById("ay").value;
    S.settings.period=document.getElementById("pr").value;
    S.settings.absenceMode=document.getElementById("am").value;
    S.settings.eitaaToken=document.getElementById("tk").value;
    S.settings.eitaaChannel=document.getElementById("ch").value;
    S.settings.eitaaAdminId=document.getElementById("ad").value;
    S.settings.cloudLink=document.getElementById("cld").value;
    save();toast("تنظیمات ذخیره شد");
  };
  document.getElementById("ac").onclick=()=>{
    const g=document.getElementById("ng").value.trim(),n=document.getElementById("nn").value.trim();
    if(!g||!n)return toast("پایه و شماره کلاس لازم است","err");
    S.classes.push({id:uid(),grade:g,classNo:n});save();toast("کلاس اضافه شد");render();
  };
  document.querySelectorAll("[data-dc]").forEach(b=>b.onclick=()=>{S.classes=S.classes.filter(c=>c.id!==b.dataset.dc);save();render();});
  document.getElementById("as").onclick=()=>{
    const sub=document.getElementById("ns").value.trim();if(!sub)return;
    if(!S.subjects.includes(sub))S.subjects.push(sub);save();render();
  };
  document.querySelectorAll("[data-ds]").forEach(b=>b.onclick=()=>{S.subjects=S.subjects.filter(s=>s!==b.dataset.ds);save();render();});
  document.getElementById("au").onclick=()=>{
    const username=document.getElementById("nu").value.trim(),password=document.getElementById("np").value,name=document.getElementById("nnm").value.trim(),role=document.getElementById("nr").value;
    if(!username||!password)return toast("نام کاربری و رمز لازم است","err");
    if(S.users.some(u=>u.username===username))return toast("نام کاربری تکراری است","err");
    S.users.push({id:uid(),username,password,name:name||username,role});save();toast("کاربر اضافه شد");render();
  };
  document.querySelectorAll("[data-du]").forEach(b=>b.onclick=()=>{S.users=S.users.filter(u=>u.id!==b.dataset.du);save();render();});
}

function render(){
  if(!session)return renderLogin();
  const map={dash:renderDash,stu:renderStu,att:renderAtt,score:renderScore,card:renderCard,msg:renderMsg,exp:renderExp,admin:renderAdmin};
  (map[tab]||renderDash)();
}
render();

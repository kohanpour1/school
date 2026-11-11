function renderStu(){
  const list=S.students.slice().sort((a,b)=>studentName(a).localeCompare(studentName(b),"fa"));
  const canEdit=canWrite();
  shell(`<div class="card p-4 mb-3">
    <div class="font-bold text-brand-700 mb-2 text-base">لیست دانش‌آموزان</div>
    <p class="text-xs text-gray-500 mb-3 leading-5">نام · پایه/کلاس · آیدی عددی ایتا والدین${canEdit?" · معلم می‌تواند دانش‌آموز اضافه/ویرایش/حذف کند":""}</p>
    ${canEdit?`<button id="addStu" class="btn-p px-4 py-2.5 rounded-lg text-sm">+ افزودن دانش‌آموز</button>`:""}
  </div>
  <div class="card overflow-x-auto">
    <table class="w-full"><thead><tr><th>نام</th><th>پایه/کلاس</th><th>آیدی ایتا والدین</th><th>تماس</th><th></th></tr></thead>
    <tbody>${list.map(st=>{const c=findClass(st.classId);return`<tr>
      <td class="text-right font-medium">${esc(studentName(st))}</td>
      <td>${esc(classLabel(c))}</td>
      <td dir="ltr">${esc(st.eitaaId||"—")}</td>
      <td dir="ltr" class="text-xs">${esc(st.phone||"—")}</td>
      <td class="whitespace-nowrap">${canEdit?`<button data-ed="${st.id}" class="text-xs btn-p px-2 py-1 rounded ml-1">ویرایش</button><button data-rm="${st.id}" class="text-xs btn-d px-2 py-1 rounded">حذف</button>`:"—"}</td>
    </tr>`;}).join("")||`<tr><td colspan="5">دانش‌آموزی نیست</td></tr>`}</tbody></table>
  </div>
  <div id="modal" class="hidden fixed inset-0 modal-bg z-50 flex items-center justify-center p-3"><div id="mb" class="card w-full max-w-sm p-4 max-h-[90vh] overflow-y-auto"></div></div>`);
  if(canEdit){
    const openForm=(st)=>{
      const m=document.getElementById("modal"),mb=document.getElementById("mb");
      m.classList.remove("hidden");
      mb.innerHTML=`<h3 class="font-bold mb-3 text-brand-700">${st?"ویرایش دانش‌آموز":"دانش‌آموز جدید"}</h3>
        <div class="gap-form">
          <div><label class="lbl">نام</label><input id="sf" class="inp-lg" value="${esc(st?.first||"")}"/></div>
          <div><label class="lbl">نام خانوادگی</label><input id="sl" class="inp-lg" value="${esc(st?.last||"")}"/></div>
          <div><label class="lbl">پایه و کلاس (تعریف‌شده توسط ادمین)</label>
            <select id="sc" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${st&&st.classId===c.id?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select>
          </div>
          <div><label class="lbl">شماره تماس والدین</label><input id="sp" class="inp-lg" dir="ltr" value="${esc(st?.phone||"")}"/></div>
          <div><label class="lbl">آیدی عددی ایتا والدین</label><input id="se" class="inp-lg" dir="ltr" value="${esc(st?.eitaaId||"")}" placeholder="مثال: 34964572"/></div>
          <button id="sv" class="btn-p w-full py-3 rounded-xl">ذخیره</button>
          <button id="clm" class="w-full py-2.5 border rounded-xl">بستن</button>
        </div>`;
      document.getElementById("clm").onclick=()=>m.classList.add("hidden");
      document.getElementById("sv").onclick=()=>{
        const first=document.getElementById("sf").value.trim(),last=document.getElementById("sl").value.trim();
        const classId=document.getElementById("sc").value,phone=document.getElementById("sp").value.trim(),eitaaId=document.getElementById("se").value.trim();
        if(!first||!last)return toast("نام و نام خانوادگی لازم است","err");
        if(!classId)return toast("کلاس را انتخاب کنید","err");
        if(st){st.first=first;st.last=last;st.classId=classId;st.phone=phone;st.eitaaId=eitaaId;}
        else S.students.push({id:uid(),first,last,classId,phone,eitaaId});
        save();m.classList.add("hidden");toast("ذخیره شد");render();
      };
    };
    document.getElementById("addStu")?.addEventListener("click",()=>openForm(null));
    document.querySelectorAll("[data-ed]").forEach(b=>b.onclick=()=>openForm(S.students.find(s=>s.id===b.dataset.ed)));
    document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{
      if(!confirm("حذف دانش‌آموز؟"))return;
      const id=b.dataset.rm;
      S.students=S.students.filter(s=>s.id!==id);
      S.attendance=S.attendance.filter(a=>a.studentId!==id);
      S.scores=S.scores.filter(s=>s.studentId!==id);
      save();toast("حذف شد");render();
    });
  }
}

function renderAtt(){
  if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
  const list=S.students.filter(s=>s.classId===ui.classId);
  const ro=!canWrite();
  const pending={};
  list.forEach(st=>{const rec=S.attendance.find(a=>a.studentId===st.id&&a.date===ui.date);pending[st.id]=rec?rec.status:""});
  shell(`<div class="card p-4 mb-3 space-y-3">
    <div class="font-bold text-brand-700 text-base">حضور و غیاب</div>
    <div class="grid grid-cols-2 gap-2">
      <div><label class="lbl">تاریخ (شمسی)</label><input id="d" class="inp-lg" value="${esc(ui.date)}" ${ro?"disabled":""}/></div>
      <div><label class="lbl">کلاس</label><select id="cl" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${c.id===ui.classId?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select></div>
    </div>
    ${ro?'<p class="text-xs text-amber-700">فقط مشاهده — ثبت فقط توسط معلم</p>':""}
  </div>
  <div class="card overflow-x-auto mb-3">
    <table class="w-full"><thead><tr><th>نام</th><th>وضعیت</th><th>انتخاب</th></tr></thead>
    <tbody>${list.map(st=>{const stt=pending[st.id];return`<tr data-sid="${st.id}">
      <td class="text-right">${esc(studentName(st))}</td>
      <td class="stt">${stt==="absent"?"غایب":stt==="present"?"حاضر":"—"}</td>
      <td>${ro?"—":`<button data-a="present" data-id="${st.id}" class="text-xs btn-g px-2 py-1.5 rounded">حاضر</button>
      <button data-a="absent" data-id="${st.id}" class="text-xs btn-d px-2 py-1.5 rounded">غایب</button>`}</td>
    </tr>`;}).join("")||`<tr><td colspan="3">دانش‌آموزی در این کلاس نیست</td></tr>`}</tbody></table>
  </div>
  ${!ro?`<div class="flex gap-2 sticky bottom-3">
    <button id="saveAtt" class="btn-p flex-1 py-3 rounded-xl font-semibold">ثبت حضور و غیاب</button>
    <button id="delAtt" class="btn-d flex-1 py-3 rounded-xl font-semibold">حذف روز</button>
  </div>`:""}`);
  const state={...pending};
  document.getElementById("d").onchange=e=>{ui.date=e.target.value;render();};
  document.getElementById("cl").onchange=e=>{ui.classId=e.target.value;render();};
  document.querySelectorAll("[data-a]").forEach(b=>b.onclick=()=>{
    state[b.dataset.id]=b.dataset.a;
    const row=document.querySelector(`tr[data-sid="${b.dataset.id}"] .stt`);
    if(row)row.textContent=b.dataset.a==="absent"?"غایب":"حاضر";
  });
  document.getElementById("saveAtt")?.addEventListener("click",()=>{
    list.forEach(st=>{
      const status=state[st.id];if(!status)return;
      let rec=S.attendance.find(a=>a.studentId===st.id&&a.date===ui.date);
      if(!rec){rec={id:uid(),studentId:st.id,date:ui.date,status,notified:false};S.attendance.push(rec);}
      else rec.status=status;
      if(status==="absent"&&!rec.notified){
        const c=findClass(st.classId);
        const text=`اعلان غیبت\nدانش‌آموز: ${studentName(st)}\n${classLabel(c)}\nمدرسه: ${S.settings.schoolName}\nتاریخ: ${ui.date}`;
        if(st.eitaaId)eitaa(st.eitaaId,text);
        if(S.settings.eitaaAdminId)eitaa(S.settings.eitaaAdminId,text);
        rec.notified=true;
      }
    });
    save();toast("حضور و غیاب ثبت شد");render();
  });
  document.getElementById("delAtt")?.addEventListener("click",()=>{
    if(!confirm("حذف تمام حضور/غیاب این کلاس در این تاریخ؟"))return;
    const ids=new Set(list.map(s=>s.id));
    S.attendance=S.attendance.filter(a=>!(a.date===ui.date&&ids.has(a.studentId)));
    save();toast("حذف شد");render();
  });
}

function renderScore(){
  if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
  if(!ui.subject&&S.subjects[0])ui.subject=S.subjects[0];
  const list=S.students.filter(s=>s.classId===ui.classId);
  const ro=!canWrite();
  shell(`<div class="card p-4 mb-3 space-y-3">
    <div class="font-bold text-brand-700 text-base">ثبت نمره</div>
    <div class="grid grid-cols-2 gap-2">
      <div><label class="lbl">درس</label><select id="sub" class="inp-lg">${S.subjects.map(s=>`<option ${s===ui.subject?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
      <div><label class="lbl">کلاس</label><select id="cl" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${c.id===ui.classId?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select></div>
    </div>
    <p class="text-xs text-gray-500">نمره کلاسی · آزمون کلاسی · مستمر/پایانی نوبت ۱ و ۲ (از ۲۰)</p>
  </div>
  <div class="card overflow-x-auto">
    <table class="w-full"><thead><tr><th>نام</th><th>کلاسی</th><th>آزمون</th><th>مستمر۱</th><th>نهایی</th><th></th></tr></thead>
    <tbody>${list.map(st=>{const g=grades(st.id,ui.subject);return`<tr>
      <td class="text-right">${esc(studentName(st))}</td>
      <td>${g.cls??"—"}</td><td>${g.exam??"—"}</td><td>${g.c1??"—"}</td>
      <td class="font-bold">${g.final??"—"}</td>
      <td>${ro?"":`<button data-e="${st.id}" class="text-xs btn-p px-2 py-1.5 rounded">ثبت</button>`}</td>
    </tr>`;}).join("")||`<tr><td colspan="6">—</td></tr>`}</tbody></table>
  </div>
  <div id="modal" class="hidden fixed inset-0 modal-bg z-50 flex items-center justify-center p-3"><div id="mb" class="card w-full max-w-sm p-4 max-h-[90vh] overflow-y-auto"></div></div>`);
  document.getElementById("sub").onchange=e=>{ui.subject=e.target.value;render();};
  document.getElementById("cl").onchange=e=>{ui.classId=e.target.value;render();};
  document.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>{
    const st=S.students.find(s=>s.id===b.dataset.e);const g=grades(st.id,ui.subject);
    const m=document.getElementById("modal"),mb=document.getElementById("mb");
    m.classList.remove("hidden");
    const fields=[["class","نمره کلاسی"],["exam","نمره آزمون کلاسی"],["cont1","مستمر نوبت ۱"],["final1","پایانی نوبت ۱"],["cont2","مستمر نوبت ۲"],["final2","پایانی نوبت ۲"]];
    const map={class:"cls",exam:"exam",cont1:"c1",final1:"f1",cont2:"c2",final2:"f2"};
    mb.innerHTML=`<h3 class="font-bold mb-3">${esc(studentName(st))} · ${esc(ui.subject)}</h3>
      ${fields.map(([k,l])=>`<label class="lbl">${l}</label><input type="number" min="0" max="20" step="0.25" data-k="${k}" value="${g[map[k]]??""}" class="mb-2 inp-lg"/>`).join("")}
      <button id="sv" class="btn-p w-full py-3 rounded-xl mt-2">ذخیره نمرات</button>
      <button id="clm" class="w-full py-2.5 border rounded-xl mt-2">بستن</button>`;
    document.getElementById("clm").onclick=()=>m.classList.add("hidden");
    document.getElementById("sv").onclick=()=>{
      fields.forEach(([k])=>setScore(st.id,ui.subject,k,mb.querySelector(`[data-k="${k}"]`).value));
      save();m.classList.add("hidden");toast("نمرات ذخیره شد");render();
    };
  });
}

function renderCard(){
  if(!ui.classId&&S.classes[0])ui.classId=S.classes[0].id;
  const list=S.students.filter(s=>s.classId===ui.classId);
  shell(`<div class="card p-4 mb-3"><label class="lbl">کلاس</label>
    <select id="cl" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${c.id===ui.classId?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select>
  </div>
  ${list.map(st=>`<div class="card p-4 mb-3">
    <div class="font-bold text-base">${esc(studentName(st))}</div>
    <div class="text-xs text-gray-500 mt-1">آیدی ایتا: ${esc(st.eitaaId||"—")} · غیبت ${abs(st.id)} · کسر ${pen(st.id)}</div>
    <table class="w-full mt-3"><thead><tr><th>درس</th><th>کلاسی</th><th>آزمون</th><th>معدل۱</th><th>نهایی</th></tr></thead>
    <tbody>${S.subjects.map(sub=>{const g=grades(st.id,sub);if([g.cls,g.exam,g.c1,g.f1,g.c2,g.f2].every(x=>x==null))return"";return`<tr><td>${esc(sub)}</td><td>${g.cls??"—"}</td><td>${g.exam??"—"}</td><td>${g.t1??"—"}</td><td class="font-bold">${g.final??"—"}</td></tr>`;}).join("")||"<tr><td colspan=5>بدون نمره</td></tr>"}</tbody></table>
  </div>`).join("")||`<div class="card p-4">دانش‌آموزی نیست</div>`}`);
  document.getElementById("cl").onchange=e=>{ui.classId=e.target.value;render();};
}

function renderMsg(){
  const grades=[...new Set(S.classes.map(c=>c.grade))];
  shell(`<div class="card p-4 space-y-3">
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
    <div><label class="lbl">متن پیام</label><textarea id="tx" rows="4" class="inp-lg" placeholder="متن اطلاع‌رسانی به والدین"></textarea></div>
    <button id="send" class="btn-p w-full py-3 rounded-xl font-semibold" ${!canWrite()?"disabled":""}>ارسال پیام</button>
    ${!canWrite()?'<p class="text-xs text-amber-700">ارسال پیام فقط برای معلم/ادمین</p>':""}
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

function renderAdmin(){
  if(!isAdmin()){tab="dash";return render();}
  const s=S.settings;
  shell(`<div class="space-y-3">
    <div class="card p-4">
      <div class="font-bold text-brand-700 mb-3">تنظیمات مدرسه و ایتا</div>
      <div class="gap-form">
        <div><label class="lbl">نام مدرسه</label><input id="sn" class="inp-lg" value="${esc(s.schoolName)}"/></div>
        <div><label class="lbl">سال تحصیلی</label><input id="ay" class="inp-lg" value="${esc(s.academicYear||"")}"/></div>
        <div><label class="lbl">کسر غیبت</label><select id="am" class="inp-lg"><option value="per4" ${s.absenceMode==="per4"?"selected":""}>هر ۴ غیبت = ۱ نمره</option><option value="per1" ${s.absenceMode==="per1"?"selected":""}>هر غیبت ۰٫۲۵</option></select></div>
        <div><label class="lbl">توکن ایتا</label><input id="tk" class="inp-lg" dir="ltr" value="${esc(s.eitaaToken||"")}"/></div>
        <div><label class="lbl">کانال</label><input id="ch" class="inp-lg" dir="ltr" value="${esc(s.eitaaChannel||"")}"/></div>
        <div><label class="lbl">آیدی مدیر (عددی)</label><input id="ad" class="inp-lg" dir="ltr" value="${esc(s.eitaaAdminId||"")}"/></div>
        <div><label class="lbl">لینک فضای ابری</label><input id="cl" class="inp-lg" dir="ltr" value="${esc(s.cloudLink||"")}"/></div>
        <button id="ss" class="btn-p w-full py-3 rounded-xl">ذخیره تنظیمات</button>
      </div>
    </div>
    <div class="card p-4">
      <div class="font-bold text-brand-700 mb-2">پایه و شماره کلاس (فقط ادمین)</div>
      <div class="flex gap-2 mb-3">
        <input id="ng" class="inp-lg" placeholder="پایه مثلا دهم"/>
        <input id="nn" class="inp-lg" placeholder="شماره کلاس"/>
        <button id="ac" class="btn-p px-4 rounded-xl shrink-0">+</button>
      </div>
      <ul class="text-sm space-y-2">${S.classes.map(c=>`<li class="flex justify-between items-center border-b pb-2"><span>${esc(classLabel(c))}</span><button data-dc="${c.id}" class="btn-d text-xs px-2 py-1 rounded">حذف</button></li>`).join("")}</ul>
    </div>
    <div class="card p-4">
      <div class="font-bold text-brand-700 mb-2">دروس (فقط ادمین)</div>
      <div class="flex gap-2 mb-3"><input id="ns" class="inp-lg" placeholder="نام درس"/><button id="as" class="btn-p px-4 rounded-xl">+</button></div>
      <ul class="text-sm space-y-2">${S.subjects.map(sub=>`<li class="flex justify-between items-center border-b pb-2"><span>${esc(sub)}</span><button data-ds="${esc(sub)}" class="btn-d text-xs px-2 py-1 rounded">حذف</button></li>`).join("")}</ul>
    </div>
    <div class="card p-4">
      <div class="font-bold text-brand-700 mb-2">کاربران و نقش‌ها</div>
      <div class="gap-form mb-3">
        <input id="nu" class="inp-lg" placeholder="نام کاربری"/>
        <input id="np" class="inp-lg" placeholder="رمز"/>
        <input id="nnm" class="inp-lg" placeholder="نام نمایشی"/>
        <select id="nr" class="inp-lg"><option value="teacher">معلم</option><option value="manager">مدیر</option><option value="staff">معاون/عوامل</option><option value="admin">ادمین</option></select>
        <button id="au" class="btn-p py-3 rounded-xl">افزودن کاربر</button>
      </div>
      <ul class="text-sm space-y-2">${S.users.map(u=>`<li class="flex justify-between border-b pb-2"><span>${esc(u.username)} · ${esc(u.name)} · ${esc(u.role)}</span>${u.username!=="admin"?`<button data-du="${u.id}" class="btn-d text-xs px-2 py-1 rounded">حذف</button>`:""}</li>`).join("")}</ul>
    </div>
  </div>`);
  document.getElementById("ss").onclick=()=>{
    S.settings.schoolName=document.getElementById("sn").value;
    S.settings.academicYear=document.getElementById("ay").value;
    S.settings.absenceMode=document.getElementById("am").value;
    S.settings.eitaaToken=document.getElementById("tk").value;
    S.settings.eitaaChannel=document.getElementById("ch").value;
    S.settings.eitaaAdminId=document.getElementById("ad").value;
    S.settings.cloudLink=document.getElementById("cl").value;
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
    if(S.users.some(u=>u.username===username))return toast("این نام کاربری تکراری است","err");
    S.users.push({id:uid(),username,password,name:name||username,role});save();toast("کاربر اضافه شد");render();
  };
  document.querySelectorAll("[data-du]").forEach(b=>b.onclick=()=>{S.users=S.users.filter(u=>u.id!==b.dataset.du);save();render();});
}

function render(){
  if(!session)return renderLogin();
  const map={dash:renderDash,stu:renderStu,att:renderAtt,score:renderScore,card:renderCard,msg:renderMsg,admin:renderAdmin};
  (map[tab]||renderDash)();
}
render();

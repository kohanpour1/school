function renderStu(){
  const list=S.students.slice().sort((a,b)=>studentName(a).localeCompare(studentName(b),"fa"));
  const canEdit=canWrite();
  shell(`<div class="card p-4 mb-3">
    <div class="font-bold text-brand-700 mb-1 text-base">لیست دانش‌آموزان</div>
    <p class="text-xs text-gray-500 mb-3 leading-6">نام · پایه و کلاس · آیدی عددی ایتا والدین · تماس${canEdit?" — معلم می‌تواند اضافه/ویرایش/حذف کند":""}</p>
    ${canEdit?`<button id="addStu" class="btn-p px-4 py-2.5 rounded-xl text-sm font-semibold">+ افزودن دانش‌آموز</button>`:""}
  </div>
  <div class="card overflow-x-auto">
    <table class="w-full"><thead><tr><th>عکس</th><th>نام</th><th>پایه/کلاس</th><th>آیدی ایتا</th><th></th></tr></thead>
    <tbody>${list.map(st=>{const c=findClass(st.classId);return`<tr>
      <td>${st.photo?`<img src="${st.photo}" class="w-9 h-9 rounded-full object-cover mx-auto"/>`:`<div class="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs mx-auto">${esc((st.first||"?")[0])}</div>`}</td>
      <td class="text-right font-medium">${esc(studentName(st))}</td>
      <td>${esc(classLabel(c))}</td>
      <td dir="ltr" class="text-xs">${esc(st.eitaaId||"—")}</td>
      <td class="whitespace-nowrap">${canEdit?`<button data-ed="${st.id}" class="text-xs btn-p px-2.5 py-1.5 rounded-lg ml-1">ویرایش</button><button data-rm="${st.id}" class="text-xs btn-d px-2.5 py-1.5 rounded-lg">حذف</button>`:"—"}</td>
    </tr>`;}).join("")||`<tr><td colspan="5" class="py-6 text-gray-400">دانش‌آموزی ثبت نشده</td></tr>`}</tbody></table>
  </div>
  <div id="modal" class="hidden fixed inset-0 modal-bg z-50 flex items-center justify-center p-3"><div id="mb" class="card w-full max-w-sm p-5 max-h-[92vh] overflow-y-auto"></div></div>`);
  if(canEdit){
    const openForm=(st)=>{
      const m=document.getElementById("modal"),mb=document.getElementById("mb");
      m.classList.remove("hidden");
      mb.innerHTML=`<h3 class="font-bold mb-4 text-brand-700 text-lg">${st?"ویرایش دانش‌آموز":"دانش‌آموز جدید"}</h3>
        <div class="gap-form">
          <div><label class="lbl">نام</label><input id="sf" class="inp-lg" value="${esc(st?.first||"")}"/></div>
          <div><label class="lbl">نام خانوادگی</label><input id="sl" class="inp-lg" value="${esc(st?.last||"")}"/></div>
          <div><label class="lbl">پایه و کلاس (تعریف ادمین)</label>
            <select id="sc" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${st&&st.classId===c.id?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select>
          </div>
          <div><label class="lbl">شماره تماس والدین</label><input id="sp" class="inp-lg" dir="ltr" value="${esc(st?.phone||"")}"/></div>
          <div><label class="lbl">آیدی عددی ایتا والدین</label><input id="se" class="inp-lg" dir="ltr" value="${esc(st?.eitaaId||"")}" placeholder="مثال: 34964572"/></div>
          <div><label class="lbl">عکس دانش‌آموز (اختیاری)</label><input id="ph" type="file" accept="image/*" class="text-sm"/></div>
          <button id="sv" class="btn-p w-full py-3.5 rounded-xl font-bold">ذخیره</button>
          <button id="clm" class="w-full py-3 border rounded-xl">بستن</button>
        </div>`;
      let photo=st?.photo||"";
      document.getElementById("ph").onchange=e=>{const f=e.target.files&&e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{photo=r.result;};r.readAsDataURL(f);};
      document.getElementById("clm").onclick=()=>m.classList.add("hidden");
      document.getElementById("sv").onclick=()=>{
        const first=document.getElementById("sf").value.trim(),last=document.getElementById("sl").value.trim();
        const classId=document.getElementById("sc").value,phone=document.getElementById("sp").value.trim(),eitaaId=document.getElementById("se").value.trim();
        if(!first||!last)return toast("نام و نام خانوادگی لازم است","err");
        if(!classId)return toast("کلاس را انتخاب کنید","err");
        if(st){st.first=first;st.last=last;st.classId=classId;st.phone=phone;st.eitaaId=eitaaId;if(photo)st.photo=photo;}
        else S.students.push({id:uid(),first,last,classId,phone,eitaaId,photo});
        save();m.classList.add("hidden");toast("ذخیره شد");render();
      };
    };
    document.getElementById("addStu")?.addEventListener("click",()=>openForm(null));
    document.querySelectorAll("[data-ed]").forEach(b=>b.onclick=()=>openForm(S.students.find(s=>s.id===b.dataset.ed)));
    document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{
      if(!confirm("حذف این دانش‌آموز و نمرات مرتبط؟"))return;
      const id=b.dataset.rm;
      S.students=S.students.filter(s=>s.id!==id);
      S.attendance=S.attendance.filter(a=>a.studentId!==id);
      S.scores=S.scores.filter(s=>s.studentId!==id);
      S.marks=S.marks.filter(m=>m.studentId!==id);
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
    <div class="grid grid-cols-2 gap-2.5">
      <div><label class="lbl">تاریخ شمسی</label><input id="d" class="inp-lg" value="${esc(ui.date)}" ${ro?"disabled":""}/></div>
      <div><label class="lbl">کلاس</label><select id="cl" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${c.id===ui.classId?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select></div>
    </div>
    ${ro?'<p class="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">فقط مشاهده — ثبت فقط توسط معلم</p>':""}
  </div>
  <div class="card overflow-x-auto mb-3">
    <table class="w-full"><thead><tr><th>نام</th><th>وضعیت</th><th>انتخاب</th></tr></thead>
    <tbody>${list.map(st=>{const stt=pending[st.id];return`<tr data-sid="${st.id}">
      <td class="text-right font-medium">${esc(studentName(st))}</td>
      <td class="stt font-semibold">${stt==="absent"?"غایب":stt==="present"?"حاضر":"—"}</td>
      <td>${ro?"—":`<button data-a="present" data-id="${st.id}" class="text-xs btn-g px-2.5 py-1.5 rounded-lg">حاضر</button>
      <button data-a="absent" data-id="${st.id}" class="text-xs btn-d px-2.5 py-1.5 rounded-lg">غایب</button>`}</td>
    </tr>`;}).join("")||`<tr><td colspan="3" class="py-6 text-gray-400">دانش‌آموزی در این کلاس نیست</td></tr>`}</tbody></table>
  </div>
  ${!ro?`<div class="flex gap-2.5 sticky bottom-4">
    <button id="saveAtt" class="btn-p flex-1 py-3.5 rounded-xl font-bold shadow">ثبت حضور و غیاب</button>
    <button id="delAtt" class="btn-d flex-1 py-3.5 rounded-xl font-bold">حذف روز</button>
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
    <div class="font-bold text-brand-700 text-base">ثبت نمره (از ۲۰)</div>
    <div class="grid grid-cols-2 gap-2.5">
      <div><label class="lbl">درس</label><select id="sub" class="inp-lg">${S.subjects.map(s=>`<option ${s===ui.subject?"selected":""}>${esc(s)}</option>`).join("")}</select></div>
      <div><label class="lbl">کلاس</label><select id="cl" class="inp-lg">${S.classes.map(c=>`<option value="${c.id}" ${c.id===ui.classId?"selected":""}>${esc(classLabel(c))}</option>`).join("")}</select></div>
    </div>
    <p class="text-xs text-gray-500 leading-5">نمره کلاسی · آزمون کلاسی · مستمر و پایانی نوبت ۱ و ۲ · مثبت/منفی</p>
  </div>
  <div class="card overflow-x-auto">
    <table class="w-full"><thead><tr><th>نام</th><th>کلاسی</th><th>آزمون</th><th>مستمر۱</th><th>نهایی</th><th></th></tr></thead>
    <tbody>${list.map(st=>{const g=grades(st.id,ui.subject);return`<tr>
      <td class="text-right font-medium">${esc(studentName(st))}</td>
      <td>${g.cls??"—"}</td><td>${g.exam??"—"}</td><td>${g.c1??"—"}</td>
      <td class="font-bold text-brand-700">${g.final??"—"}</td>
      <td>${ro?"":`<button data-e="${st.id}" class="text-xs btn-p px-2.5 py-1.5 rounded-lg">ثبت</button>`}</td>
    </tr>`;}).join("")||`<tr><td colspan="6">—</td></tr>`}</tbody></table>
  </div>
  <div id="modal" class="hidden fixed inset-0 modal-bg z-50 flex items-center justify-center p-3"><div id="mb" class="card w-full max-w-sm p-5 max-h-[92vh] overflow-y-auto"></div></div>`);
  document.getElementById("sub").onchange=e=>{ui.subject=e.target.value;render();};
  document.getElementById("cl").onchange=e=>{ui.classId=e.target.value;render();};
  document.querySelectorAll("[data-e]").forEach(b=>b.onclick=()=>{
    const st=S.students.find(s=>s.id===b.dataset.e);const g=grades(st.id,ui.subject);
    const m=document.getElementById("modal"),mb=document.getElementById("mb");
    m.classList.remove("hidden");
    const fields=[["class","نمره کلاسی"],["exam","نمره آزمون کلاسی"],["cont1","مستمر نوبت ۱"],["final1","پایانی نوبت ۱"],["cont2","مستمر نوبت ۲"],["final2","پایانی نوبت ۲"]];
    const map={class:"cls",exam:"exam",cont1:"c1",final1:"f1",cont2:"c2",final2:"f2"};
    mb.innerHTML=`<h3 class="font-bold mb-3 text-brand-700">${esc(studentName(st))} · ${esc(ui.subject)}</h3>
      ${fields.map(([k,l])=>`<label class="lbl">${l}</label><input type="number" min="0" max="20" step="0.25" data-k="${k}" value="${g[map[k]]??""}" class="mb-2 inp-lg"/>`).join("")}
      <div class="flex gap-2 my-3">
        <button id="plus" class="btn-g flex-1 py-2.5 rounded-xl text-sm">+ مثبت (${g.plus||0})</button>
        <button id="minus" class="btn-d flex-1 py-2.5 rounded-xl text-sm">− منفی (${g.minus||0})</button>
      </div>
      <button id="sv" class="btn-p w-full py-3.5 rounded-xl font-bold mt-1">ذخیره نمرات</button>
      <button id="clm" class="w-full py-3 border rounded-xl mt-2">بستن</button>`;
    document.getElementById("clm").onclick=()=>m.classList.add("hidden");
    document.getElementById("plus").onclick=()=>{S.marks.push({id:uid(),studentId:st.id,subject:ui.subject,kind:"plus",date:ui.date});save();toast("مثبت ثبت شد");b.click();};
    document.getElementById("minus").onclick=()=>{S.marks.push({id:uid(),studentId:st.id,subject:ui.subject,kind:"minus",date:ui.date});save();toast("منفی ثبت شد");b.click();};
    document.getElementById("sv").onclick=()=>{
      fields.forEach(([k])=>setScore(st.id,ui.subject,k,mb.querySelector(`[data-k="${k}"]`).value));
      save();m.classList.add("hidden");toast("نمرات ذخیره شد");render();
    };
  });
}

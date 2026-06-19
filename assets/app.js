// TANFEEZ.MEP — prototype interactions. Demo data persists in the browser
// (localStorage) until the backend exists. Real where possible; clear feedback elsewhere.

(function () {
  // ---------- helpers ----------
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function load(k,seed){ try{var v=JSON.parse(localStorage.getItem(k));return Array.isArray(v)?v:(seed||[]).slice();}catch(e){return (seed||[]).slice();} }
  function save(k,a){ localStorage.setItem(k,JSON.stringify(a)); }
  function initials(name){ var p=String(name).trim().replace(/^م\.?\s*/,'').split(/\s+/); return ((p[0]||'·')[0]+(p[1]?p[1][0]:'')).trim()||'·'; }
  function arNum(n){ try{return Number(n).toLocaleString('ar-EG');}catch(e){return String(n);} }
  function qp(name){ return new URLSearchParams(location.search).get(name); }
  var ROLE_COLOR={'مهندس موقع':'#159BA8','مهندس مكتب':'#159BA8','فني':'#5F6B6B','المحاسب':'#854F0B','موظف مكتب':'#5F6B6B','المدير':'#0E8A94'};

  var toastEl;
  function toast(msg){ if(!toastEl){toastEl=document.createElement('div');toastEl.className='toast';document.body.appendChild(toastEl);} toastEl.innerHTML='<i class="ti ti-info-circle"></i>'+esc(msg); toastEl.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(function(){toastEl.classList.remove('show');},2800); }

  // ---------- AUTH (demo, client-side only — NOT real security) ----------
  var USERS=[
    {u:'yazan',p:'tanfeez2025',name:'م. يزن حمّاد',role:'المدير'},
    {u:'ahmad',p:'ahmad2025',name:'م. أحمد',role:'مهندس موقع'},
    {u:'khaled',p:'khaled2025',name:'م. خالد',role:'مهندس موقع'},
    {u:'sami',p:'sami2025',name:'م. سامي',role:'مهندس موقع'},
    {u:'mahmoud',p:'mahmoud2025',name:'محمود',role:'المحاسب'},
    {u:'noor',p:'noor2025',name:'نور',role:'موظف مكتب'},
    {u:'abdullah',p:'abdullah2025',name:'عبدالله',role:'فني'}
  ];
  var SKEY='tanfeez_session', session=null;
  try{ session=JSON.parse(localStorage.getItem(SKEY)); }catch(e){}
  var loginForm=document.getElementById('login-form');
  if(loginForm){
    loginForm.addEventListener('submit',function(e){ e.preventDefault();
      var u=(document.getElementById('username').value||'').trim().toLowerCase(), p=document.getElementById('password').value||'';
      var f=USERS.filter(function(x){return x.u===u && x.p===p;})[0];
      if(f){ localStorage.setItem(SKEY,JSON.stringify({u:f.u,name:f.name,role:f.role})); location.href='index.html'; }
      else { var er=document.getElementById('login-err'); if(er)er.style.display='block'; }
    });
    return;
  }
  if(!session){ location.replace('login.html'); return; }
  (function(){
    var av=document.querySelector('.topbar .avatar'); if(av){ av.textContent=initials(session.name); av.title=session.name+' · '+session.role; }
    var ALLOWED={
      'مهندس موقع':['index.html','projects.html','project-detail.html','tasks.html','purchase-requests.html','reports.html'],
      'مهندس مكتب':['index.html','projects.html','project-detail.html','tasks.html','purchase-requests.html','reports.html'],
      'المحاسب':['index.html','invoices.html','finance.html','clients.html','client-profile.html','tasks.html'],
      'موظف مكتب':['index.html','tasks.html','reports.html','purchase-requests.html'],
      'فني':['index.html','tasks.html','reports.html']
    };
    var allow=ALLOWED[session.role];
    var page=(location.pathname.split('/').pop()||'index.html'); if(!page)page='index.html';
    if(allow){
      document.querySelectorAll('.sidebar .nav a').forEach(function(a){ if(allow.indexOf(a.getAttribute('href'))===-1) a.style.display='none'; });
      if(allow.indexOf(page)===-1){ location.replace('index.html'); return; }
      var fin=document.getElementById('finance'); if(fin)fin.style.display='none';
      var al=document.querySelector('.content .alert'); if(al)al.style.display='none';
      var ap=document.querySelector('.grid-2 .card'); if(ap)ap.style.display='none';
      if(page==='index.html'){ var sub=document.querySelector('.page-head .sub'); if(sub)sub.textContent='أهلاً '+session.name+' ('+session.role+') — هذه واجهتك'; }
    }
    if(session.role==='مهندس موقع' && page==='projects.html'){
      var cg=document.querySelector('.cat-grid'); if(cg)cg.style.display='none';
      document.querySelectorAll('.proj-grid .proj-card').forEach(function(c){ var bs=c.querySelectorAll('.nums b'); var eng=bs.length?bs[bs.length-1].textContent.trim():''; if(eng!==session.name)c.style.display='none'; });
      var ps=document.querySelector('.page-head .sub'); if(ps)ps.textContent='مشاريعك المسندة إليك فقط';
    }
  })();

  function prActionHtml(s){
    var edit=' <button class="btn-mini pr-edit">تعديل</button>';
    if(s==='معلّق') return '<button class="btn-sm btn-approve">موافقة</button> <button class="btn-sm btn-reject">رفض</button>'+edit;
    if(s==='تمت الموافقة') return '<span class="tag tag-teal">تمت الموافقة</span>'+edit;
    if(s==='مرفوض') return '<span class="tag tag-danger">مرفوض</span>'+edit;
    return '<span class="tag tag-teal">مستلَم</span>';
  }
  function modal(title,sub,fields,onSubmit,values){
    var ov=document.createElement('div'); ov.className='modal-overlay';
    var body=fields.map(function(f){
      if(f.t==='select') return '<div class="field"><label>'+f.l+'</label><select name="'+f.n+'">'+f.o.map(function(v){return '<option value="'+esc(v.value!=null?v.value:v)+'">'+esc(v.label!=null?v.label:v)+'</option>';}).join('')+'</select></div>';
      return '<div class="field"><label>'+f.l+'</label><input name="'+f.n+'" type="'+f.t+'" '+(f.t==='tel'?'dir="ltr"':'')+(f.optional?'':' required')+(values&&values[f.n]!=null?' value="'+esc(values[f.n])+'"':'')+' /></div>';
    }).join('');
    ov.innerHTML='<div class="modal"><h3>'+esc(title)+'</h3><p class="msub">'+esc(sub)+'</p><form><div>'+body+'</div><div class="actions"><button type="submit" class="btn-primary">حفظ</button><button type="button" class="btn-cancel">إلغاء</button></div></form></div>';
    document.body.appendChild(ov); ov.classList.add('open');
    function close(){ov.remove();}
    ov.addEventListener('click',function(e){if(e.target===ov)close();});
    ov.querySelector('.btn-cancel').addEventListener('click',close);
    ov.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var d=new FormData(e.target),o={};fields.forEach(function(f){o[f.n]=(d.get(f.n)||'').toString().trim();});onSubmit(o);close();});
  }

  // ---------- batch add modal (multiple بنود before saving) ----------
  function batchModal(title,sub,fields,onSave){
    var pending=[];
    var ov=document.createElement('div'); ov.className='modal-overlay open';
    var body=fields.map(function(f){
      if(f.t==='select') return '<div class="field"><label>'+f.l+'</label><select name="'+f.n+'">'+f.o.map(function(v){return '<option>'+esc(v)+'</option>';}).join('')+'</select></div>';
      return '<div class="field"><label>'+f.l+'</label><input name="'+f.n+'" type="'+f.t+'" /></div>';
    }).join('');
    ov.innerHTML='<div class="modal"><h3>'+esc(title)+'</h3><p class="msub">'+esc(sub)+'</p><form id="bm-form">'+body+'</form><div id="bm-pending" style="font-size:13px;color:var(--teal-deep);margin:4px 0 2px"></div><div class="actions" style="flex-wrap:wrap"><button type="button" class="btn-mini" id="bm-add" style="padding:9px 14px"><i class="ti ti-plus"></i> إضافة بند آخر</button><button type="button" class="btn-primary" id="bm-save" style="margin-top:0">حفظ الكل</button><button type="button" class="btn-cancel" id="bm-cancel">إلغاء</button></div></div>';
    document.body.appendChild(ov);
    function readForm(){ var fm=document.getElementById('bm-form'),o={},any=false; fields.forEach(function(f){var el=fm.querySelector('[name="'+f.n+'"]'); var v=el?el.value.trim():''; o[f.n]=v; if(v&&v!=='—')any=true;}); return any?o:null; }
    function clearForm(){ var fm=document.getElementById('bm-form'); fields.forEach(function(f){var el=fm.querySelector('[name="'+f.n+'"]'); if(el)el.value=(f.t==='select'?f.o[0]:'');}); var f0=fm.querySelector('[name="'+fields[0].n+'"]'); if(f0)f0.focus(); }
    function upd(){ document.getElementById('bm-pending').textContent=pending.length?('بنود جاهزة للحفظ: '+pending.length):''; }
    function close(){ ov.remove(); }
    ov.querySelector('#bm-add').addEventListener('click',function(){ var o=readForm(); if(o){pending.push(o);clearForm();upd();toast('انضاف بند ('+pending.length+') — كمّل أو احفظ');} else toast('املأ البند الأول'); });
    ov.querySelector('#bm-save').addEventListener('click',function(){ var o=readForm(); if(o)pending.push(o); if(pending.length){onSave(pending);} close(); });
    ov.querySelector('#bm-cancel').addEventListener('click',close);
    ov.addEventListener('click',function(e){if(e.target===ov)close();});
  }

  // ---------- export helpers (Excel / PDF / OneDrive) ----------
  function downloadCSV(name,rows){ var csv='﻿'+rows.map(function(r){return r.map(function(c){return '"'+String(c==null?'':c).replace(/"/g,'""')+'"';}).join(',');}).join('\n'); var b=new Blob([csv],{type:'text/csv;charset=utf-8;'}); var a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name+'.csv'; document.body.appendChild(a); a.click(); a.remove(); }
  function exportChooser(title,printHtml,csvRows){
    var ov=document.createElement('div'); ov.className='modal-overlay open';
    ov.innerHTML='<div class="modal"><h3>'+esc(title)+'</h3><p class="msub">اختر صيغة التصدير</p><div style="display:flex;flex-direction:column;gap:10px"><button class="btn-primary" id="ex-pdf" style="margin-top:0"><i class="ti ti-file-type-pdf"></i> PDF (طباعة / حفظ PDF)</button><button class="btn-add" id="ex-xls" style="justify-content:center;background:#1D9E75"><i class="ti ti-file-spreadsheet"></i> Excel</button><button class="btn-add" id="ex-od" style="justify-content:center;background:#185FA5"><i class="ti ti-brand-onedrive"></i> حفظ على OneDrive</button><button class="btn-cancel" id="ex-x">إغلاق</button></div></div>';
    document.body.appendChild(ov);
    function close(){ov.remove();}
    ov.addEventListener('click',function(e){if(e.target===ov)close();});
    ov.querySelector('#ex-x').addEventListener('click',close);
    ov.querySelector('#ex-pdf').addEventListener('click',function(){ var w=window.open('','_blank'); w.document.write(printHtml()); w.document.close(); w.print(); close(); });
    ov.querySelector('#ex-xls').addEventListener('click',function(){ downloadCSV(title,csvRows()); toast('تم تنزيل ملف Excel'); close(); });
    ov.querySelector('#ex-od').addEventListener('click',function(){ toast('بيتحفظ على OneDrive مع الـ Backend'); close(); });
  }

  // ---------- shared seeds ----------
  var TEAM_KEY='tanfeez_team_v1';
  var teamSeed=[
    {name:'م. يزن حمّاد',role:'المدير',phone:'+962 79 090 4515'},
    {name:'م. أحمد',role:'مهندس موقع',phone:'+962 79 000 0001'},
    {name:'م. خالد',role:'مهندس موقع',phone:'+962 79 000 0002'},
    {name:'م. سامي',role:'مهندس موقع',phone:'+962 79 000 0003'},
    {name:'عبدالله',role:'فني',phone:'+962 79 000 0004'},
    {name:'محمود',role:'المحاسب',phone:'+962 79 000 0005'},
    {name:'نور',role:'موظف مكتب',phone:'+962 79 000 0006'}
  ];
  var CLIENT_KEY='tanfeez_clients_v1';
  var clientSeed=[
    {name:'شركة الياسمين العقارية',contact:'أبو محمد',phone:'+962 79 111 1111',projects:1},
    {name:'مجمّع الصويفية',contact:'إدارة المجمّع',phone:'+962 79 222 2222',projects:1},
    {name:'Marouf Coffee',contact:'قسم المشاريع',phone:'+962 79 333 3333',projects:2}
  ];

  // ---------- notifications ----------
  var NOTIFS=[
    {ico:'ti-alarm',urgent:true,text:'فزعة: برج الياسمين — نقص مواد عاجل يحتاج موافقتك',time:'قبل 10 دقائق'},
    {ico:'ti-shopping-cart',text:'طلب شراء جديد PR-104 من م. أحمد بانتظار موافقتك',time:'قبل ساعة'},
    {ico:'ti-file-invoice',text:'فاتورة الصويفية invoice-21 تأخّر تحصيلها',time:'اليوم'}
  ];
  function notifKey(name){ return 'tanfeez_notifs_'+name; }
  function addNotif(name,n){ if(!name)return; var k=notifKey(name); var a=load(k,[]); a.unshift(n); save(k,a); }
  var panel=document.getElementById('notif-panel'), bell=document.getElementById('bell');
  if(panel&&bell){
    var mine = session? load(notifKey(session.name),[]) : [];
    var allN = mine.concat(NOTIFS);
    var bc=document.getElementById('bell-count'); if(bc)bc.textContent=allN.length;
    panel.innerHTML='<div class="nhead"><span>الإشعارات</span><span class="link" id="mark-read" style="cursor:pointer">تعليم الكل كمقروء</span></div>'+
      allN.map(function(n){return '<div class="notif-item unread '+(n.urgent?'urgent':'')+'"><i class="ti '+(n.ico||'ti-bell')+' ni-ico"></i><div class="ni-body"><p>'+esc(n.text)+'</p><div class="ni-time">'+esc(n.time||'')+'</div></div></div>';}).join('');
    bell.addEventListener('click',function(e){e.stopPropagation();panel.classList.toggle('open');});
    document.addEventListener('click',function(e){ if(panel.classList.contains('open') && !panel.contains(e.target) && e.target!==bell) panel.classList.remove('open'); });
    panel.addEventListener('click',function(e){
      if(e.target.id==='mark-read'){ panel.querySelectorAll('.notif-item').forEach(function(i){i.classList.remove('unread');}); if(bc)bc.style.display='none'; if(session)save(notifKey(session.name),[]); toast('تم تعليم كل الإشعارات كمقروءة'); }
    });
  }

  // ---------- list render (team / clients) ----------
  function renderTeam(){
    var b=document.getElementById('team-body'); if(!b)return;
    var data=load(TEAM_KEY,teamSeed);
    function r(){
      b.innerHTML=data.map(function(m,i){
        var color=ROLE_COLOR[m.role]||'#0E8A94';
        return '<tr><td><a href="employee-profile.html?name='+encodeURIComponent(m.name)+'" style="display:flex;align-items:center;gap:10px;color:inherit"><div class="avatar" style="background:'+color+'">'+esc(initials(m.name))+'</div> <span style="color:var(--teal-deep)">'+esc(m.name)+'</span></a></td><td>'+esc(m.role)+'</td><td><span dir="ltr">'+esc(m.phone)+'</span></td><td><span class="tag tag-teal">نشط</span></td><td><div class="row-actions"><button class="btn-mini edit-m" data-i="'+i+'">تعديل</button><button class="btn-mini danger del-m" data-i="'+i+'">حذف</button></div></td></tr>';
      }).join('');
      b.querySelectorAll('.del-m').forEach(function(x){x.addEventListener('click',function(){ if(confirm('حذف '+data[+x.dataset.i].name+'؟')){data.splice(+x.dataset.i,1);save(TEAM_KEY,data);r();toast('تم الحذف');} });});
      b.querySelectorAll('.edit-m').forEach(function(x){x.addEventListener('click',function(){ var m=data[+x.dataset.i]; var nn=prompt('تعديل الاسم:',m.name); if(nn&&nn.trim()){m.name=nn.trim();save(TEAM_KEY,data);r();toast('تم التعديل');} });});
    }
    r();
    var add=document.getElementById('add-member');
    if(add)add.addEventListener('click',function(){ modal('إضافة عضو','مهندس، فني، محاسب أو موظف مكتب',[{l:'الاسم',n:'name',t:'text'},{l:'الدور',n:'role',t:'select',o:['مهندس موقع','مهندس مكتب','فني','المحاسب','موظف مكتب']},{l:'الهاتف',n:'phone',t:'tel'}],function(o){data.push(o);save(TEAM_KEY,data);r();toast('تمت الإضافة ✓');}); });
  }
  renderTeam();

  function renderClients(){
    var b=document.getElementById('clients-body'); if(!b)return;
    var data=load(CLIENT_KEY,clientSeed);
    function r(){
      b.innerHTML=data.map(function(c,i){
        return '<tr><td><a href="client-profile.html?name='+encodeURIComponent(c.name)+'" style="color:var(--teal-deep)">'+esc(c.name)+'</a></td><td>'+esc(c.contact||'—')+'</td><td><span dir="ltr">'+esc(c.phone)+'</span></td><td>'+esc(c.projects||0)+' مشروع</td><td><span class="tag tag-teal">نشط</span></td><td><div class="row-actions"><button class="btn-mini edit-c" data-i="'+i+'">تعديل</button><button class="btn-mini danger del-c" data-i="'+i+'">حذف</button></div></td></tr>';
      }).join('');
      b.querySelectorAll('.del-c').forEach(function(x){x.addEventListener('click',function(){ if(confirm('حذف العميل؟')){data.splice(+x.dataset.i,1);save(CLIENT_KEY,data);r();toast('تم الحذف');} });});
      b.querySelectorAll('.edit-c').forEach(function(x){x.addEventListener('click',function(){ var c=data[+x.dataset.i]; var nn=prompt('تعديل اسم العميل:',c.name); if(nn&&nn.trim()){c.name=nn.trim();save(CLIENT_KEY,data);r();toast('تم التعديل');} });});
    }
    r();
    var add=document.getElementById('add-client');
    if(add)add.addEventListener('click',function(){ modal('إضافة عميل','بيانات العميل',[{l:'اسم العميل/الشركة',n:'name',t:'text'},{l:'جهة الاتصال',n:'contact',t:'text'},{l:'الهاتف',n:'phone',t:'tel'}],function(o){o.projects=0;data.push(o);save(CLIENT_KEY,data);r();toast('تمت الإضافة ✓');}); });
  }
  renderClients();

  // ---------- Tasks (Microsoft To Do style) ----------
  var peopleList=document.getElementById('people-list'), todoPanel=document.getElementById('todo-panel');
  if(peopleList&&todoPanel){
    var allPeople=load(TEAM_KEY,teamSeed).filter(function(m){return m.role!=='المدير';});
    var people=(session&&session.role!=='المدير')?allPeople.filter(function(m){return m.name===session.name;}):allPeople;
    if(!people.length)people=[{name:session.name,role:session.role}];
    var current=people[0];
    function todoKey(name){return 'tanfeez_todo_'+name;}
    function renderPeople(){
      peopleList.innerHTML=people.map(function(p){
        var n=load(todoKey(p.name),[]).filter(function(t){return !t.done;}).length;
        return '<div class="pl-item '+(p.name===current.name?'active':'')+'" data-name="'+esc(p.name)+'"><div class="av" style="background:'+(ROLE_COLOR[p.role]||'#0E8A94')+'">'+esc(initials(p.name))+'</div> '+esc(p.name)+'<span class="cnt">'+(n||'')+'</span></div>';
      }).join('');
      peopleList.querySelectorAll('.pl-item').forEach(function(it){it.addEventListener('click',function(){ current=people.filter(function(p){return p.name===it.dataset.name;})[0]; renderPeople(); renderTodos(); });});
    }
    function renderTodos(){
      var list=load(todoKey(current.name),[]);
      function r(){
        save(todoKey(current.name),list);
        var items=list.length? list.map(function(t,i){
          if(!t.subs)t.subs=[];
          var subs=t.subs.map(function(s,si){return '<div style="display:flex;align-items:center;gap:10px;padding:5px 0 5px 30px"><span class="sub-check" data-i="'+i+'" data-si="'+si+'" style="width:18px;height:18px;border:2px solid '+(s.done?'#0E8A94':'#CBD3D3')+';background:'+(s.done?'#0E8A94':'#fff')+';border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;flex:0 0 auto">'+(s.done?'✓':'')+'</span><span style="flex:1;font-size:13px'+(s.done?';text-decoration:line-through;color:var(--faint)':'')+'">'+esc(s.text)+'</span><button class="sub-del" data-i="'+i+'" data-si="'+si+'" style="background:none;border:none;color:var(--faint);cursor:pointer">✕</button></div>';}).join('');
          return '<div class="todo-item '+(t.done?'done':'')+'"><div class="todo-check main-check" data-i="'+i+'">'+(t.done?'<i class="ti ti-check"></i>':'')+'</div><div class="todo-text main-text" data-i="'+i+'">'+esc(t.text)+'</div><button class="del-btn main-del" data-i="'+i+'"><i class="ti ti-trash"></i></button></div>'+subs+'<div style="padding:2px 4px 12px 30px"><input class="sub-input" data-i="'+i+'" placeholder="+ خطوة فرعية" style="width:65%;height:30px;border:0.5px solid #E0E0E0;border-radius:6px;padding:0 10px;font-size:12px;font-family:inherit" /></div>';
        }).join('') : '<div class="empty-hint">ما في مهام بعد — ضيف مهمة من فوق</div>';
        todoPanel.innerHTML='<h2><i class="ti ti-checklist" style="color:var(--teal-deep)"></i> مهام '+esc(current.name)+'</h2><div class="todo-add"><input id="todo-input" placeholder="اكتب مهمة جديدة لـ '+esc(current.name)+'..." /><button class="btn-add" id="todo-add-btn"><i class="ti ti-plus"></i> إضافة</button></div>'+items;
        var inp=document.getElementById('todo-input');
        function add(){ var v=inp.value.trim(); if(!v)return; list.push({text:v,done:false,subs:[]}); inp.value=''; r(); renderPeople(); }
        document.getElementById('todo-add-btn').addEventListener('click',add);
        inp.addEventListener('keydown',function(e){if(e.key==='Enter')add();});
        todoPanel.querySelectorAll('.main-check').forEach(function(c){c.addEventListener('click',function(){list[+c.dataset.i].done=!list[+c.dataset.i].done;r();renderPeople();});});
        todoPanel.querySelectorAll('.main-del').forEach(function(d){d.addEventListener('click',function(){list.splice(+d.dataset.i,1);r();renderPeople();});});
        todoPanel.querySelectorAll('.main-text').forEach(function(t){t.addEventListener('dblclick',function(){var nv=prompt('تعديل المهمة:',list[+t.dataset.i].text);if(nv&&nv.trim()){list[+t.dataset.i].text=nv.trim();r();}});});
        todoPanel.querySelectorAll('.sub-check').forEach(function(c){c.addEventListener('click',function(){var t=list[+c.dataset.i];t.subs[+c.dataset.si].done=!t.subs[+c.dataset.si].done;r();});});
        todoPanel.querySelectorAll('.sub-del').forEach(function(d){d.addEventListener('click',function(){list[+d.dataset.i].subs.splice(+d.dataset.si,1);r();});});
        todoPanel.querySelectorAll('.sub-input').forEach(function(si2){si2.addEventListener('keydown',function(e){if(e.key==='Enter'){var v=si2.value.trim();if(!v)return;var t=list[+si2.dataset.i];if(!t.subs)t.subs=[];t.subs.push({text:v,done:false});r();}});});
      }
      r();
    }
    renderPeople(); renderTodos();
  }

  // ---------- Project category cards ----------
  var catCards=document.querySelectorAll('.cat-card');
  if(catCards.length){
    catCards.forEach(function(card){card.addEventListener('click',function(){
      catCards.forEach(function(c){c.classList.remove('active');}); card.classList.add('active');
      var cat=card.dataset.cat;
      document.querySelectorAll('.proj-grid .proj-card').forEach(function(p){ p.style.display=(cat==='all'||p.dataset.cat===cat)?'block':'none'; });
    });});
  }

  // ---------- Project detail tabs ----------
  var tabs=document.querySelectorAll('#pd-tabs a[data-tab]');
  if(tabs.length){
    tabs.forEach(function(t){t.addEventListener('click',function(e){e.preventDefault();
      tabs.forEach(function(x){x.classList.remove('active');}); t.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
      var el=document.getElementById('tab-'+t.dataset.tab); if(el)el.classList.add('active');
    });});
  }

  // ---------- Finance manual adjustments ----------
  var adjBody=document.getElementById('adj-body');
  if(adjBody){
    var ADJ_KEY='tanfeez_adjustments', baseNet=8200;
    var adj=load(ADJ_KEY,[]);
    function rAdj(){
      save(ADJ_KEY,adj);
      adjBody.innerHTML=adj.length?adj.map(function(a,i){return '<tr><td><span class="tag tag-warn">'+esc(a.type)+'</span></td><td>'+esc(a.desc||'—')+'</td><td>−'+arNum(a.amount)+'</td><td><button class="del-btn" data-i="'+i+'"><i class="ti ti-trash"></i></button></td></tr>';}).join(''):'<tr><td colspan="4" style="text-align:center;color:var(--faint)">ما في تعديلات — ضيف بند</td></tr>';
      var total=adj.reduce(function(s,a){return s+(parseFloat(a.amount)||0);},0);
      document.getElementById('adj-net').textContent=arNum(baseNet-total)+' د.أ';
      adjBody.querySelectorAll('.del-btn').forEach(function(d){d.addEventListener('click',function(){adj.splice(+d.dataset.i,1);rAdj();toast('تم الحذف');});});
    }
    rAdj();
    document.getElementById('add-adj').addEventListener('click',function(){ modal('إضافة تعديل مالي','يُخصم من صافي الربح',[{l:'النوع',n:'type',t:'select',o:['خصم','ضريبة','عمولة','مصروف','ضياع']},{l:'الوصف',n:'desc',t:'text'},{l:'المبلغ (د.أ)',n:'amount',t:'number'}],function(o){adj.push(o);rAdj();toast('تمت الإضافة ✓');}); });
  }

  // ---------- Generic "+ add" on table/card pages ----------
  var h1=document.querySelector('.page-head h1'), pageName=h1?h1.textContent.trim():'';
  var PAGES={
    'المشاريع':{key:'tanfeez_x_projects',container:'.proj-grid',title:'إضافة مشروع',sub:'بيانات المشروع',
      fields:[{l:'اسم المشروع',n:'name',t:'text'},{l:'النوع والموقع',n:'type',t:'text'},{l:'المهندس',n:'engineer',t:'text'},{l:'الفئة',n:'cat',t:'select',o:[{value:'hvac',label:'تكييف'},{value:'elec',label:'كهرباء وميكانيك'}]},{l:'الحالة',n:'status',t:'select',o:['جاري','بانتظار اعتماد','قارب الانتهاء']}],
      el:function(o){var sc={'جاري':'status-active','بانتظار اعتماد':'status-hold','قارب الانتهاء':'status-near'}[o.status]||'status-active';var a=document.createElement('a');a.className='proj-card';a.href='project-detail.html';a.dataset.cat=o.cat;a.style.display='block';a.innerHTML='<div class="top"><h3>'+esc(o.name)+' <span class="added-badge">جديد</span></h3><span class="status '+sc+'">'+esc(o.status)+'</span></div><p class="type">'+esc(o.type)+'</p><div class="bar"><span style="width:0%"></span></div><div class="nums"><div>الإنجاز <b>0%</b></div><div>البنود <b>0</b></div><div>المهندس <b>'+esc(o.engineer||'—')+'</b></div></div>';return a;}},
    'الفواتير':{key:'tanfeez_x_invoices',container:'.tbl tbody',title:'إضافة فاتورة',sub:'فاتورة جديدة (مسودة)',
      fields:[{l:'العميل',n:'client',t:'text'},{l:'النوع',n:'type',t:'select',o:['مطالبة مرحلية','فاتورة وطنية','BOQ مسعّر']},{l:'القيمة',n:'value',t:'text'},{l:'اسم المُصدِر',n:'creator',t:'text'}],
      el:function(o){var tr=document.createElement('tr');tr.dataset.status='مسودة';tr.innerHTML='<td>INV-جديد <span class="added-badge">جديد</span></td><td>'+esc(o.client)+'</td><td>'+esc(o.type)+'</td><td>'+esc(o.value||'—')+'</td><td>'+esc(o.creator||'—')+'</td><td><span class="tag tag-warn">مسودة</span></td><td><button class="btn-mini save-onedrive"><i class="ti ti-cloud-upload"></i> حفظ</button></td><td><a class="link" href="#"><i class="ti ti-file-type-pdf"></i> PDF</a></td>';return tr;}},
    'التقارير اليومية':{key:'tanfeez_x_reports',container:'.tbl tbody',title:'إضافة تقرير',sub:'تقرير يومي أو أسبوعي',
      fields:[{l:'المشروع',n:'project',t:'text'},{l:'التاريخ',n:'date',t:'text'},{l:'النوع',n:'type',t:'select',o:['يومي','أسبوعي']},{l:'المهندس',n:'engineer',t:'text'}],
      el:function(o){var tr=document.createElement('tr');tr.dataset.status=o.type;tr.innerHTML='<td>'+esc(o.project)+' <span class="added-badge">جديد</span></td><td>'+esc(o.date||'—')+'</td><td>'+esc(o.type)+'</td><td>'+esc(o.engineer||'—')+'</td><td><span class="tag tag-warn">لم يُرسل</span></td><td><a class="link" href="#"><i class="ti ti-file-type-pdf"></i> PDF</a></td>';return tr;}},
    'طلبات الشراء':{key:'tanfeez_x_pr',container:'.tbl tbody',title:'طلب شراء جديد',sub:'الرقم والتاريخ ومقدّم الطلب تلقائياً',
      fields:[{l:'المشروع',n:'project',t:'text'},{l:'اسم المورد',n:'supplier',t:'text'},{l:'اسم المادة',n:'material',t:'text'},{l:'العدد / الكمية',n:'qty',t:'text'},{l:'القيمة (د.أ)',n:'value',t:'text'},{l:'ملاحظة (اختياري)',n:'note',t:'text',optional:true}],
      prepare:function(o){ var c=parseInt(localStorage.getItem('tanfeez_pr_counter')||'104',10)+1; localStorage.setItem('tanfeez_pr_counter',c); o.num='PR-'+c; o.date=new Date().toLocaleDateString('ar-EG',{weekday:'long',day:'numeric',month:'long'}); o.requester=(session&&session.name)||'—'; },
      el:function(o){var tr=document.createElement('tr');tr.dataset.status='معلّق';tr.dataset.supplier=o.supplier;tr.dataset.num=o.num;tr.dataset.project=o.project;var mats=esc(o.material)+' ('+esc(o.qty)+')'+(o.note?' — '+esc(o.note):'');tr.innerHTML='<td>'+esc(o.num)+' <span class="added-badge">جديد</span></td><td>'+esc(o.date)+'</td><td>'+esc(o.project)+'</td><td>'+esc(o.supplier)+'</td><td>'+mats+'</td><td>'+esc(o.value||'—')+'</td><td>'+esc(o.requester)+'</td><td class="pr-action">'+prActionHtml('معلّق')+'</td>';return tr;}}
  };
  var cfg=PAGES[pageName];
  if(cfg){
    var container=document.querySelector(cfg.container);
    if(container){
      var stored=load(cfg.key,[]);
      stored.forEach(function(o){container.insertBefore(cfg.el(o),container.firstChild);});
      var pill=document.querySelector('.page-head .pill');
      if(pill&&pill.textContent.trim().charAt(0)==='+'){ pill.classList.add('clickable'); pill.addEventListener('click',function(){ modal(cfg.title,cfg.sub,cfg.fields,function(o){if(cfg.prepare)cfg.prepare(o);stored.push(o);save(cfg.key,stored);container.insertBefore(cfg.el(o),container.firstChild);toast('تمت الإضافة ✓');}); }); }
    }
  }

  // ---------- Materials add (project detail) ----------
  var matBody=document.getElementById('materials-body'), addMat=document.getElementById('add-material');
  if(matBody&&addMat){
    var MK='tanfeez_x_materials'; var ms=load(MK,[]);
    ms.forEach(function(o){var tr=document.createElement('tr');tr.innerHTML='<td>'+esc(o.name)+' <span class="added-badge">جديد</span></td><td>'+esc(o.unit)+'</td><td>'+esc(o.bought)+'</td><td>'+esc(o.used||'0')+'</td><td>'+esc(o.left||o.bought)+'</td>';matBody.insertBefore(tr,matBody.firstChild);});
    addMat.addEventListener('click',function(){ modal('إضافة مادة','مادة للمشروع',[{l:'المادة',n:'name',t:'text'},{l:'الوحدة',n:'unit',t:'text'},{l:'الكمية المشتراة',n:'bought',t:'text'}],function(o){ms.push(o);save(MK,ms);var tr=document.createElement('tr');tr.innerHTML='<td>'+esc(o.name)+' <span class="added-badge">جديد</span></td><td>'+esc(o.unit)+'</td><td>'+esc(o.bought)+'</td><td>0</td><td>'+esc(o.bought)+'</td>';matBody.insertBefore(tr,matBody.firstChild);toast('تمت الإضافة ✓');}); });
  }

  // ---------- generic CRUD table ----------
  function crudTable(o){
    var body=document.getElementById(o.bodyId); if(!body)return null;
    var data=load(o.key,o.seed);
    function r(){ save(o.key,data); body.innerHTML=data.map(function(it,i){return o.row(it,i);}).join('');
      body.querySelectorAll('.crud-del').forEach(function(b){b.addEventListener('click',function(){data.splice(+b.getAttribute('data-i'),1);r();toast('تم الحذف');});});
      body.querySelectorAll('.crud-edit').forEach(function(b){b.addEventListener('click',function(){var i=+b.getAttribute('data-i');modal(o.title,'تعديل',o.fields,function(v){data[i]=v;r();toast('تم التعديل');},data[i]);});});
    }
    r();
    var add=document.getElementById(o.addBtn); if(add)add.addEventListener('click',function(){ if(o.batch){ batchModal(o.title,o.sub||'يمكنك إدخال عدة بنود ثم حفظها مرة وحدة',o.fields,function(arr){arr.forEach(function(v){data.push(v);});r();toast('تمت إضافة '+arr.length+' بند ✓');}); } else { modal(o.title,o.sub||'',o.fields,function(v){data.push(v);r();toast('تمت الإضافة ✓');}); } });
    return {get:function(){return data;}};
  }

  // ---------- Project finance: material movements + inventory ----------
  if(document.getElementById('matmove-body')){
    function mvType(t){ if(!t||t==='—')return '—'; var c={'استلام':'tag-teal','استخدام':'tag-warn','هدر':'tag-danger'}[t]; if(t==='إرجاع')return '<span class="tag" style="background:#EAEFEF;color:#5F6B6B">إرجاع</span>'; return '<span class="tag '+(c||'tag-teal')+'">'+esc(t)+'</span>'; }
    function cln(v){ return (v&&v!=='—')?esc(v):'—'; }
    var mm=crudTable({ bodyId:'matmove-body', addBtn:'add-matmove', key:'tanfeez_matmove_v2', title:'حركة مادة', batch:true,
      fields:[{l:'المادة',n:'material',t:'text',optional:true},{l:'القياس',n:'size',t:'text',optional:true},{l:'العدد',n:'qty',t:'text',optional:true},{l:'الوحدة',n:'unit',t:'select',o:['—','متر','متر مربع','قطعة']},{l:'نوع الحركة',n:'type',t:'select',o:['—','استلام','استخدام','إرجاع','هدر']}],
      seed:[{material:'كوع نحاس',size:'3/4',qty:'٦٥٠',unit:'متر',type:'استلام'},{material:'كوع نحاس',size:'3/4',qty:'٥٠٠',unit:'متر',type:'استخدام'},{material:'دكت مجلفن',size:'',qty:'٤٢٠',unit:'متر مربع',type:'استلام'},{material:'عوازل حرارية',size:'',qty:'٢٩٠',unit:'متر مربع',type:'استخدام'},{material:'وحدات Split',size:'',qty:'١٨',unit:'قطعة',type:'استلام'}],
      row:function(it,i){return '<tr><td>'+cln(it.material)+'</td><td>'+cln(it.size)+'</td><td>'+cln(it.qty)+'</td><td>'+cln(it.unit)+'</td><td>'+mvType(it.type)+'</td><td><div class="row-actions"><button class="btn-mini crud-edit" data-i="'+i+'">تعديل</button><button class="btn-mini danger crud-del" data-i="'+i+'">حذف</button></div></td></tr>';}
    });
    var inv=document.getElementById('inventory-btn');
    if(inv&&mm)inv.addEventListener('click',function(){ var d=mm.get(); var rows=d.map(function(it){return '<tr><td>'+(it.material||'')+'</td><td>'+(it.size||'')+'</td><td>'+(it.qty||'')+'</td><td>'+((it.unit&&it.unit!=='—')?it.unit:'')+'</td><td>'+((it.type&&it.type!=='—')?it.type:'')+'</td></tr>';}).join(''); var w=window.open('','_blank'); w.document.write('<html dir="rtl"><head><meta charset="utf-8"><title>حصر المواد</title></head><body style="font-family:sans-serif;padding:30px"><h1 style="color:#0E8A94">TANFEEZ.MEP — حصر مواد المشروع</h1><h3>برج الياسمين · '+new Date().toLocaleDateString('ar-EG')+'</h3><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;text-align:right"><tr style="background:#F4FBFB"><th>المادة</th><th>القياس</th><th>العدد</th><th>الوحدة</th><th>نوع الحركة</th></tr>'+rows+'</table></body></html>'); w.document.close(); w.print(); toast('تم تجهيز حصر المواد للطباعة'); });
  }

  // ---------- Project finance: subcontractors ----------
  if(document.getElementById('subcl-body')){
    var projName=(document.querySelector('.page-head h1')&&document.querySelector('.page-head h1').textContent.trim())||'المشروع';
    var sc=crudTable({ bodyId:'subcl-body', addBtn:'add-subcl', key:'tanfeez_subcl_v2', title:'مطالبة مقاول فرعي',
      fields:[{l:'المقاول',n:'contractor',t:'text',optional:true},{l:'العمل',n:'work',t:'text',optional:true},{l:'الكمية المنجزة',n:'qty',t:'text',optional:true},{l:'السعر الإفرادي',n:'unit_price',t:'text',optional:true},{l:'المستحق',n:'due',t:'text',optional:true},{l:'الحالة',n:'status',t:'select',o:['بانتظار الدفع','مدفوع جزئي','مدفوع']}],
      seed:[{contractor:'مؤسسة النور للعزل',work:'عزل حراري للدكت',qty:'٢٩٠ م²',unit_price:'٨ د.أ',due:'٢٬٣٢٠ د.أ',status:'بانتظار الدفع'},{contractor:'ورشة الحداد',work:'تصنيع دكت',qty:'٣٠٠ م²',unit_price:'١٢ د.أ',due:'٣٬٦٠٠ د.أ',status:'مدفوع جزئي'},{contractor:'فني تمديدات',work:'توصيلات نحاس',qty:'٥٠٠ م.ط',unit_price:'٣ د.أ',due:'١٬٥٠٠ د.أ',status:'بانتظار الدفع'}],
      row:function(it,i){var cl={'بانتظار الدفع':'tag-warn','مدفوع جزئي':'tag-teal','مدفوع':'tag-teal'}[it.status]||'tag-warn';return '<tr><td>'+(it.contractor&&it.contractor!=='—'?esc(it.contractor):'—')+'</td><td>'+(it.work&&it.work!=='—'?esc(it.work):'—')+'</td><td>'+(it.qty&&it.qty!=='—'?esc(it.qty):'—')+'</td><td>'+(it.unit_price&&it.unit_price!=='—'?esc(it.unit_price):'—')+'</td><td>'+(it.due&&it.due!=='—'?esc(it.due):'—')+'</td><td><span class="tag '+cl+'">'+esc(it.status)+'</span></td><td><div class="row-actions"><button class="btn-mini crud-edit" data-i="'+i+'">تعديل</button><button class="btn-mini danger crud-del" data-i="'+i+'">حذف</button></div></td></tr>';}
    });
    function postStmt(title,head,rowFn){ var d=sc.get(); var rows=d.map(rowFn).join(''); var w=window.open('','_blank'); w.document.write('<html dir="rtl"><head><meta charset="utf-8"><title>'+title+'</title></head><body style="font-family:sans-serif;padding:30px"><h1 style="color:#0E8A94">TANFEEZ.MEP — '+title+'</h1><h3>'+esc(projName)+' · '+new Date().toLocaleDateString('ar-EG')+'</h3><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;text-align:right"><tr style="background:#F4FBFB">'+head+'</tr>'+rows+'</table></body></html>'); w.document.close(); w.print(); }
    var pc=document.getElementById('post-costs'); if(pc)pc.addEventListener('click',function(){ postStmt('كشف تكاليف المشروع','<th>المقاول</th><th>العمل</th><th>الكمية</th><th>السعر الإفرادي</th><th>التكلفة</th>',function(it){return '<tr><td>'+(it.contractor||'')+'</td><td>'+(it.work||'')+'</td><td>'+(it.qty||'')+'</td><td>'+(it.unit_price||'')+'</td><td>'+(it.due||'')+'</td></tr>';}); toast('تم الترحيل على كشف تكاليف المشروع ✓'); });
    var ps=document.getElementById('post-subaccount'); if(ps)ps.addEventListener('click',function(){ postStmt('كشف حساب المقاولين الفرعيين','<th>المقاول</th><th>العمل</th><th>المستحق</th><th>الحالة</th>',function(it){return '<tr><td>'+(it.contractor||'')+'</td><td>'+(it.work||'')+'</td><td>'+(it.due||'')+'</td><td>'+(it.status||'')+'</td></tr>';}); toast('تم الترحيل على كشف حساب المقاول ✓'); });
  }

  // ---------- Project finance: unified works (our invoice + subcontractor accounting) ----------
  if(document.getElementById('works-body')){
    var pN=(document.querySelector('.page-head h1')&&document.querySelector('.page-head h1').textContent.trim())||'المشروع';
    var WK='tanfeez_works_v1';
    function pNum(s){ if(s==null)return 0; var x=String(s).replace(/[٠-٩]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'.indexOf(d);}).replace(/[^\d.]/g,''); return parseFloat(x)||0; }
    function fmt(n){ return Math.round(n).toLocaleString('ar-EG')+' د.أ'; }
    function sT(id,t){ var e=document.getElementById(id); if(e)e.textContent=t; }
    var workFields=[{l:'وصف العمل',n:'desc',t:'text',optional:true},{l:'الكمية المنجزة',n:'qty',t:'text',optional:true},{l:'الوحدة',n:'unit',t:'select',o:['—','متر','متر مربع','قطعة','مقطوعية']},{l:'سعرنا على فاتورة العميل (د.أ)',n:'our_price',t:'text',optional:true},{l:'المقاول الفرعي',n:'subcontractor',t:'text',optional:true},{l:'أجور المقاول المتفق عليها (د.أ)',n:'sub_price',t:'text',optional:true}];
    var works=load(WK,[{desc:'أعمال تكييف منجزة',qty:'٧٢٪',unit:'مقطوعية',our_price:'٢٤٢٠٠',subcontractor:'',sub_price:''},{desc:'عزل حراري للدكت',qty:'٢٩٠',unit:'متر مربع',our_price:'٤٠٠٠',subcontractor:'مؤسسة النور للعزل',sub_price:'٢٣٢٠'},{desc:'تصنيع دكت',qty:'٣٠٠',unit:'متر مربع',our_price:'٥٥٠٠',subcontractor:'ورشة الحداد',sub_price:'٣٦٠٠'},{desc:'توصيلات نحاس',qty:'٥٠٠',unit:'متر',our_price:'٣٠٠٠',subcontractor:'فني تمديدات',sub_price:'١٥٠٠'}]);
    function recompute(){
      var ourT=works.reduce(function(s,w){return s+pNum(w.our_price);},0), subT=works.reduce(function(s,w){return s+pNum(w.sub_price);},0);
      sT('sum-ourinvoice',fmt(ourT)); sT('sum-projvalue',fmt(ourT)); sT('sum-subdues',fmt(subT));
      var bySub={}; works.forEach(function(w){ var c=(w.subcontractor||'').trim(); if(c&&c!=='—'){ if(!bySub[c])bySub[c]={n:0,t:0}; bySub[c].n++; bySub[c].t+=pNum(w.sub_price); } });
      var ks=Object.keys(bySub), sb=document.getElementById('subaccounts-body');
      if(sb)sb.innerHTML=ks.length?ks.map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+bySub[k].n+' عمل</td><td><b>'+fmt(bySub[k].t)+'</b></td></tr>';}).join(''):'<tr><td colspan="3" style="text-align:center;color:var(--faint)">ما في مقاولين بعد</td></tr>';
    }
    function renderWorks(){
      save(WK,works);
      var b=document.getElementById('works-body');
      b.innerHTML=works.length?works.map(function(w,i){return '<tr><td>'+(w.desc?esc(w.desc):'—')+'</td><td>'+(w.qty?esc(w.qty):'—')+'</td><td>'+(w.unit&&w.unit!=='—'?esc(w.unit):'—')+'</td><td>'+(w.our_price?esc(w.our_price):'<span style="color:var(--faint)">— املأها</span>')+'</td><td>'+(w.subcontractor?esc(w.subcontractor):'—')+'</td><td>'+(w.sub_price?esc(w.sub_price):'—')+'</td><td><div class="row-actions"><button class="btn-mini crud-edit" data-i="'+i+'">تعديل</button><button class="btn-mini danger crud-del" data-i="'+i+'">حذف</button></div></td></tr>';}).join(''):'<tr><td colspan="7" style="text-align:center;color:var(--faint)">ما في أعمال بعد — اضغط "إضافة عمل"</td></tr>';
      b.querySelectorAll('.crud-del').forEach(function(x){x.addEventListener('click',function(){works.splice(+x.getAttribute('data-i'),1);renderWorks();toast('تم الحذف');});});
      b.querySelectorAll('.crud-edit').forEach(function(x){x.addEventListener('click',function(){var i=+x.getAttribute('data-i');modal('تعديل عمل','',workFields,function(v){works[i]=v;renderWorks();toast('تم التعديل');},works[i]);});});
      recompute();
    }
    renderWorks();
    var aw=document.getElementById('add-work'); if(aw)aw.addEventListener('click',function(){ batchModal('إضافة عمل منجز','أدخل العمل، اضغط "إضافة بند آخر" لمزيد، ثم احفظ الكل للترحيل',workFields,function(arr){ arr.forEach(function(v){works.push(v);}); renderWorks(); toast('تم ترحيل '+arr.length+' بند ✓ — تحدّثت فاتورتنا وحساب المقاول'); }); });
    var mi2=document.getElementById('make-invoice'); if(mi2)mi2.addEventListener('click',function(){ var total=works.reduce(function(s,w){return s+pNum(w.our_price);},0); var inv=load('tanfeez_x_invoices',[]); inv.push({client:'شركة الياسمين العقارية',type:'مطالبة مرحلية',value:fmt(total),creator:(session&&session.name)||'—'}); save('tanfeez_x_invoices',inv); toast('تم إنشاء الفاتورة وإضافتها لصفحة الفواتير'); var items=works.filter(function(w){return pNum(w.our_price)>0;});
      exportChooser('فاتورة العميل',function(){ var rws=items.map(function(w){return '<tr><td>'+(w.desc||'')+'</td><td>'+(w.qty||'')+'</td><td>'+(w.our_price||'')+'</td></tr>';}).join(''); return '<html dir="rtl"><head><meta charset="utf-8"><title>فاتورة</title></head><body style="font-family:sans-serif;padding:30px"><h1 style="color:#0E8A94">TANFEEZ.MEP — مطالبة مالية للعميل</h1><h3>'+esc(pN)+' · '+new Date().toLocaleDateString('ar-EG')+'</h3><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;text-align:right"><tr style="background:#F4FBFB"><th>وصف العمل</th><th>الكمية</th><th>القيمة</th></tr>'+rws+'</table><h2 style="text-align:left">الإجمالي: '+fmt(total)+'</h2></body></html>'; }, function(){ var rows=[['وصف العمل','الكمية','القيمة (د.أ)']]; items.forEach(function(w){rows.push([w.desc||'',w.qty||'',w.our_price||'']);}); rows.push(['الإجمالي','',fmt(total)]); return rows; }); });
    var ss=document.getElementById('sub-statement'); if(ss)ss.addEventListener('click',function(){ var bySub={}; works.forEach(function(w){var c=(w.subcontractor||'').trim(); if(c&&c!=='—'){if(!bySub[c])bySub[c]=[];bySub[c].push(w);}});
      exportChooser('كشف حساب المقاولين',function(){ var html=''; Object.keys(bySub).forEach(function(k){ var tot=bySub[k].reduce(function(s,w){return s+pNum(w.sub_price);},0); html+='<h2 style="color:#0E8A94">'+esc(k)+'</h2><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;text-align:right;margin-bottom:16px"><tr style="background:#F4FBFB"><th>العمل</th><th>الكمية</th><th>الأجور</th></tr>'+bySub[k].map(function(w){return '<tr><td>'+(w.desc||'')+'</td><td>'+(w.qty||'')+'</td><td>'+(w.sub_price||'')+'</td></tr>';}).join('')+'<tr><td colspan="2"><b>الإجمالي المستحق</b></td><td><b>'+fmt(tot)+'</b></td></tr></table>'; }); return '<html dir="rtl"><head><meta charset="utf-8"><title>كشف حساب المقاولين</title></head><body style="font-family:sans-serif;padding:30px"><h1 style="color:#0E8A94">TANFEEZ.MEP — كشف حساب المقاولين الفرعيين</h1><h3>'+esc(pN)+' · '+new Date().toLocaleDateString('ar-EG')+'</h3>'+(html||'<p>لا يوجد مقاولون</p>')+'</body></html>'; }, function(){ var rows=[['المقاول','العمل','الكمية','الأجور (د.أ)']]; Object.keys(bySub).forEach(function(k){ bySub[k].forEach(function(w){rows.push([k,w.desc||'',w.qty||'',w.sub_price||'']);}); }); return rows; }); });
  }

  // ---------- Project: create report ----------
  var addReport=document.getElementById('add-report');
  if(addReport){
    var prl=document.getElementById('proj-reports-list'), RK='tanfeez_proj_reports', prs=load(RK,[]);
    function renderPR(o){ var d=document.createElement('div'); d.className='row'; d.innerHTML='<span>'+esc(o.type)+' · '+esc(o.date)+' · '+esc((session&&session.name)||'م. أحمد')+' <span class="added-badge">جديد</span></span><span class="tag tag-warn">لم يُرسل</span>'; prl.insertBefore(d,prl.firstChild); }
    prs.forEach(renderPR);
    addReport.addEventListener('click',function(){ modal('إنشاء تقرير','تقرير للمشروع',[{l:'النوع',n:'type',t:'select',o:['تقرير يومي','تقرير أسبوعي']},{l:'الوصف / الملاحظات',n:'desc',t:'text'}],function(o){ o.date=new Date().toLocaleDateString('ar-EG'); prs.push(o); save(RK,prs); renderPR(o); toast('تم إنشاء التقرير ✓'); }); });
  }

  // ---------- Employee profile ----------
  if(document.getElementById('emp-name')){
    var en=qp('name')||'موظف'; var team=load(TEAM_KEY,teamSeed); var mem=team.filter(function(m){return m.name===en;})[0]||{name:en,role:'موظف'};
    document.getElementById('emp-name').textContent=mem.name;
    document.getElementById('emp-role').textContent=mem.role;
    var av=document.getElementById('emp-av'); av.textContent=initials(mem.name); av.style.background=ROLE_COLOR[mem.role]||'#0E8A94';
    var ah=document.querySelector('.content .profile-head');
    if(ah){ var ab=document.createElement('div'); ab.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px'; ab.innerHTML='<button class="btn-mini" id="att-month"><i class="ti ti-calendar"></i> كشف دوام شهري</button><button class="btn-mini" id="att-year"><i class="ti ti-calendar-stats"></i> كشف دوام سنوي</button>'; ah.parentNode.insertBefore(ab, ah.nextSibling);
      function attStmt(period){ var att=load('tanfeez_att_'+en,[]); var rows=att.map(function(a){return '<tr><td>'+(a.date||'')+'</td><td>'+(a.in||'—')+'</td><td>'+(a.out||'—')+'</td></tr>';}).join(''); var w=window.open('','_blank'); w.document.write('<html dir="rtl"><head><meta charset="utf-8"><title>كشف دوام</title></head><body style="font-family:sans-serif;padding:30px"><h1 style="color:#0E8A94">TANFEEZ.MEP — كشف دوام '+period+'</h1><h3>'+esc(en)+' · '+new Date().toLocaleDateString('ar-EG')+'</h3><p><b>عدد أيام الدوام المسجّلة:</b> '+att.length+'</p><table border="1" cellpadding="8" style="border-collapse:collapse;width:100%;text-align:right"><tr style="background:#F4FBFB"><th>التاريخ</th><th>بداية الدوام</th><th>نهاية الدوام</th></tr>'+(rows||'<tr><td colspan="3">لا يوجد سجل دوام بعد</td></tr>')+'</table></body></html>'); w.document.close(); w.print(); toast('تم تجهيز كشف الدوام ال'+period); }
      document.getElementById('att-month').addEventListener('click',function(){attStmt('شهري');});
      document.getElementById('att-year').addEventListener('click',function(){attStmt('سنوي');});
    }
    function subList(bodyId,addId,key,fields,rowFn,title,sub){
      var b=document.getElementById(bodyId); var arr=load(key,[]);
      function r(){ save(key,arr); b.innerHTML=arr.length?arr.map(function(o,i){return rowFn(o,i);}).join(''):'<tr><td colspan="4" style="text-align:center;color:var(--faint)">ما في سجلات بعد</td></tr>'; b.querySelectorAll('.del-btn').forEach(function(d){d.addEventListener('click',function(){arr.splice(+d.dataset.i,1);r();toast('تم الحذف');});}); }
      r();
      document.getElementById(addId).addEventListener('click',function(){ modal(title,sub,fields,function(o){o.date=new Date().toLocaleDateString('ar-EG');arr.push(o);r();toast('تمت الإضافة ✓');}); });
    }
    subList('advances-body','add-advance','tanfeez_adv_'+en,[{l:'المبلغ (د.أ)',n:'amount',t:'number'},{l:'ملاحظة',n:'note',t:'text'}],function(o,i){return '<tr><td>'+esc(o.date)+'</td><td>'+arNum(o.amount)+'</td><td>'+esc(o.note||'—')+'</td><td><button class="del-btn" data-i="'+i+'"><i class="ti ti-trash"></i></button></td></tr>';},'إضافة سلفة','سلفة للموظف');
    subList('notes-body','add-note','tanfeez_emp_notes_'+en,[{l:'الملاحظة',n:'text',t:'text'},{l:'التقييم',n:'rating',t:'select',o:['ممتاز','جيد','متوسط','ضعيف']}],function(o,i){var cl={'ممتاز':'tag-teal','جيد':'tag-teal','متوسط':'tag-warn','ضعيف':'tag-danger'}[o.rating]||'tag-teal';return '<tr><td>'+esc(o.date)+'</td><td>'+esc(o.text)+'</td><td><span class="tag '+cl+'">'+esc(o.rating)+'</span></td><td><button class="del-btn" data-i="'+i+'"><i class="ti ti-trash"></i></button></td></tr>';},'إضافة ملاحظة','ملاحظة للتقييم السنوي');
  }

  // ---------- Client profile ----------
  if(document.getElementById('cl-name')){
    var cn=qp('name')||'عميل'; var cls=load(CLIENT_KEY,clientSeed); var cm=cls.filter(function(c){return c.name===cn;})[0]||{name:cn,contact:'عميل'};
    document.getElementById('cl-name').textContent=cm.name;
    document.getElementById('cl-contact').textContent='جهة الاتصال: '+(cm.contact||'—');
    document.getElementById('cl-av').textContent=initials(cm.name);
    var fb=document.getElementById('feedback-body'); var FK='tanfeez_fb_'+cn; var arr=load(FK,[]);
    function rf(){ save(FK,arr); fb.innerHTML=arr.length?arr.map(function(o,i){return '<tr><td>'+esc(o.date)+'</td><td>'+esc(o.text)+'</td><td><button class="del-btn" data-i="'+i+'"><i class="ti ti-trash"></i></button></td></tr>';}).join(''):'<tr><td colspan="3" style="text-align:center;color:var(--faint)">ما في ملاحظات بعد</td></tr>'; fb.querySelectorAll('.del-btn').forEach(function(d){d.addEventListener('click',function(){arr.splice(+d.dataset.i,1);rf();});}); }
    rf();
    document.getElementById('add-feedback').addEventListener('click',function(){ modal('ملاحظة العميل','ملاحظة العميل علينا',[{l:'الملاحظة',n:'text',t:'text'}],function(o){o.date=new Date().toLocaleDateString('ar-EG');arr.push(o);rf();toast('تمت الإضافة ✓');}); });
  }

  // ---------- Reports: keep 2 months + save-forever ----------
  if(pageName==='التقارير اليومية'){
    var rinfo=document.createElement('div'); rinfo.className='alert'; rinfo.style.background='var(--teal-50)'; rinfo.style.borderInlineStartColor='var(--teal-deep)'; rinfo.style.color='var(--teal-deep)';
    rinfo.innerHTML='<i class="ti ti-info-circle"></i><span>التقارير تُحفظ شهرين ثم تُحذف تلقائياً — اضغط "حفظ للأبد" للإبقاء عليها دائماً.</span>';
    var tb0=document.querySelector('.toolbar'); if(tb0)tb0.parentNode.insertBefore(rinfo,tb0.nextSibling);
    var perm=load('tanfeez_report_perm',[]);
    document.querySelectorAll('.tbl tbody tr').forEach(function(tr){
      var key=(tr.children[0].textContent+'|'+tr.children[1].textContent).trim();
      var cell=tr.children[tr.children.length-1];
      var btn=document.createElement('button'); btn.className='btn-mini'; btn.style.marginInlineStart='8px';
      function up(){ var on=perm.indexOf(key)!==-1; btn.innerHTML=on?'<i class="ti ti-infinity"></i> محفوظ للأبد':'حفظ للأبد'; btn.style.color=on?'var(--teal-deep)':''; btn.style.borderColor=on?'var(--teal-deep)':''; }
      up();
      btn.addEventListener('click',function(){ var i=perm.indexOf(key); if(i===-1){perm.push(key);toast('تم الحفظ للأبد ♾️');}else{perm.splice(i,1);toast('أُلغي الحفظ الدائم');} save('tanfeez_report_perm',perm); up(); });
      cell.appendChild(btn);
    });
  }

  // ---------- Engineer dashboard: فزعة + attendance ----------
  if((location.pathname.split('/').pop()||'index.html')==='index.html' && session && session.role!=='المدير' && document.querySelector('.content .page-head')){
    var ph=document.querySelector('.content .page-head');
    var box=document.createElement('div');
    box.innerHTML='<div class="grid grid-2" style="margin:0 0 14px"><section class="card" style="border:1px solid #F3DBDB;background:#FBF4F4"><div class="card-head"><span class="title" style="color:#A32D2D"><i class="ti ti-alarm"></i> فزعة (طوارئ)</span></div><p style="margin:0 0 10px;font-size:13px;color:#7a2222">للحالات الطارئة فقط — تظهر فوراً عند المدير</p><button class="btn-add" id="fazaa-btn" style="background:#CE1126"><i class="ti ti-urgent"></i> أطلق فزعة</button></section><section class="card"><div class="card-head"><span class="title"><i class="ti ti-clock"></i> الدوام</span><span id="att-status" class="tag tag-warn">لم تسجّل حضور</span></div><div id="att-body"></div></section></div>';
    ph.parentNode.insertBefore(box, ph.nextSibling);
    document.getElementById('fazaa-btn').addEventListener('click',function(){ var what=prompt('شو الطارئ؟ (وصف سريع)'); if(what===null)return; addNotif('م. يزن حمّاد',{ico:'ti-alarm',urgent:true,text:'🚨 فزعة من '+session.name+': '+(what||'حالة طارئة عاجلة'),time:'الآن'}); toast('تم إطلاق الفزعة — وصلت للمدير 🚨'); });
    var AK='tanfeez_att_'+session.name; var att=load(AK,[]);
    function tKey(){return new Date().toLocaleDateString('ar-EG');}
    function nowT(){return new Date().toLocaleTimeString('ar-EG',{hour:'2-digit',minute:'2-digit'});}
    function renderAtt(){
      save(AK,att);
      var today=att.filter(function(a){return a.date===tKey();})[0];
      var st=document.getElementById('att-status'), body=document.getElementById('att-body');
      if(today&&today.in&&!today.out){st.textContent='حاضر منذ '+today.in;st.className='tag tag-teal';}
      else if(today&&today.out){st.textContent='انصرف '+today.out;st.className='tag';}
      else {st.textContent='لم تسجّل حضور';st.className='tag tag-warn';}
      body.innerHTML='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px"><button class="btn-add" id="att-in"'+((today&&today.in)?' disabled style="opacity:.5"':'')+'><i class="ti ti-login"></i> بداية الدوام</button><button class="btn-mini" id="att-out"'+((!today||!today.in||today.out)?' disabled style="opacity:.5"':'')+'><i class="ti ti-logout"></i> نهاية الدوام</button><button class="btn-mini" id="att-leave"><i class="ti ti-calendar-off"></i> طلب إجازة/مغادرة</button></div>';
      var bi=document.getElementById('att-in'); if(bi&&!(today&&today.in))bi.addEventListener('click',function(){att.push({date:tKey(),in:nowT(),out:''});renderAtt();toast('سجّلت بداية الدوام');});
      var bo=document.getElementById('att-out'); if(bo&&today&&today.in&&!today.out)bo.addEventListener('click',function(){today.out=nowT();renderAtt();toast('سجّلت نهاية الدوام');});
      document.getElementById('att-leave').addEventListener('click',function(){var r=prompt('اكتب: إجازة أو مغادرة + السبب');if(r===null)return;addNotif('م. يزن حمّاد',{ico:'ti-calendar-off',text:'طلب من '+session.name+': '+(r||'إجازة/مغادرة'),time:'الآن'});toast('تم إرسال الطلب للمدير');});
    }
    renderAtt();
  }

  // ---------- filter chips ----------
  document.querySelectorAll('.toolbar').forEach(function(bar){
    var tb=bar.parentElement.querySelector('.tbl tbody')||(bar.nextElementSibling&&bar.nextElementSibling.querySelector('.tbl tbody'));
    if(!tb)return;
    bar.querySelectorAll('.chip').forEach(function(chip){chip.addEventListener('click',function(){
      bar.querySelectorAll('.chip').forEach(function(c){c.classList.remove('active');}); chip.classList.add('active');
      var f=chip.dataset.filter||chip.textContent.trim(); var all=f==='all'||f==='الكل';
      tb.querySelectorAll('tr').forEach(function(tr){ var ok=all||(tr.dataset.status?tr.dataset.status===f:tr.textContent.indexOf(f)!==-1); tr.classList.toggle('hide-row',!ok); });
    });});
  });

  // ---------- purchase request approve/reject + send ----------
  function sendModal(num,supplier,project){
    var ov=document.createElement('div'); ov.className='modal-overlay open';
    var msg='طلب شراء '+num+' لمشروع '+project+' — تمت الموافقة. يرجى التزويد.';
    ov.innerHTML='<div class="modal"><h3>إرسال للمورد</h3><p class="msub">'+esc(supplier||'المورد')+'</p>'+
      '<div style="display:flex;flex-direction:column;gap:10px"><button class="btn-primary" id="s-pdf"><i class="ti ti-file-type-pdf"></i> عرض / طباعة PDF</button>'+
      '<a class="btn-add" id="s-wa" target="_blank" style="justify-content:center" href="https://wa.me/?text='+encodeURIComponent(msg)+'"><i class="ti ti-brand-whatsapp"></i> إرسال واتساب</a>'+
      '<a class="btn-add" id="s-mail" style="justify-content:center;background:#5F6B6B" href="mailto:?subject='+encodeURIComponent('طلب شراء '+num)+'&body='+encodeURIComponent(msg)+'"><i class="ti ti-mail"></i> إرسال إيميل</a>'+
      '<button class="btn-cancel" id="s-close">إغلاق</button></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
    ov.querySelector('#s-close').addEventListener('click',function(){ov.remove();});
    ov.querySelector('#s-pdf').addEventListener('click',function(){ var w=window.open('','_blank'); w.document.write('<html dir="rtl"><head><meta charset="utf-8"><title>'+num+'</title></head><body style="font-family:sans-serif;padding:40px"><h1 style="color:#0E8A94">TANFEEZ.MEP — طلب شراء</h1><p><b>الرقم:</b> '+num+'</p><p><b>المشروع:</b> '+project+'</p><p><b>المورد:</b> '+esc(supplier)+'</p><p><b>الحالة:</b> تمت الموافقة</p><hr><p>'+esc(msg)+'</p></body></html>'); w.document.close(); w.print(); });
  }
  if(pageName==='طلبات الشراء'){ document.querySelectorAll('.tbl tbody tr').forEach(function(tr){ var a=tr.querySelector('.pr-action'); if(a)a.innerHTML=prActionHtml(tr.dataset.status); }); }
  document.addEventListener('click',function(e){
    var t=e.target.closest?e.target.closest('.btn-approve, .btn-reject, .pr-edit'):null; if(!t)return;
    var tr=t.closest('tr'); if(!tr)return;
    if(t.classList.contains('pr-edit')){
      var cur={project:tr.children[2].textContent.trim(),supplier:tr.children[3].textContent.trim(),mats:tr.children[4].textContent.replace('جديد','').trim(),value:tr.children[5].textContent.trim()};
      modal('تعديل طلب الشراء','عدّل ثم احفظ لإعادة الإرسال',[{l:'المشروع',n:'project',t:'text'},{l:'المورد',n:'supplier',t:'text'},{l:'المادة',n:'mats',t:'text'},{l:'القيمة',n:'value',t:'text'}],function(o){ tr.children[2].textContent=o.project; tr.children[3].textContent=o.supplier; tr.children[4].textContent=o.mats; tr.children[5].textContent=o.value; tr.dataset.status='معلّق'; tr.dataset.supplier=o.supplier; tr.dataset.project=o.project; tr.querySelector('.pr-action').innerHTML=prActionHtml('معلّق'); toast('تم تعديل الطلب وإعادة إرساله'); },cur);
      return;
    }
    var ok=t.classList.contains('btn-approve');
    tr.dataset.status=ok?'تمت الموافقة':'مرفوض';
    tr.querySelector('.pr-action').innerHTML=prActionHtml(tr.dataset.status);
    if(ok){ toast('تمت الموافقة ✓'); sendModal(tr.dataset.num||'PR', tr.dataset.supplier||'', tr.dataset.project||''); }
    else { var req=tr.children[6]?tr.children[6].textContent.trim():''; var num=tr.dataset.num||(tr.children[0]?tr.children[0].textContent.replace('جديد','').trim():'الطلب'); addNotif(req,{ico:'ti-circle-x',urgent:true,text:'تم رفض طلب الشراء '+num+' — يرجى تعديله وإعادة إرساله',time:'الآن'}); toast('تم الرفض وإشعار '+req); }
  });

  // ---------- invoices save to OneDrive ----------
  document.addEventListener('click',function(e){ var b=e.target.closest?e.target.closest('.save-onedrive'):null; if(!b)return; b.innerHTML='<i class="ti ti-check"></i> محفوظ'; toast('تم حفظ الفاتورة على OneDrive (يكتمل مع الـ Backend)'); });

  // ---------- dead links ----------
  document.addEventListener('click',function(e){ var a=e.target.closest?e.target.closest('a[href="#"]'):null; if(!a)return; e.preventDefault(); var t=a.textContent.trim(); toast(/PDF/i.test(t)?'توليد PDF يجهز مع الـ Backend':'هذه الميزة تجهز مع المرحلة الجاية'); });

  // ---------- avatar logout ----------
  var avatar=document.querySelector('.topbar .avatar');
  if(avatar){ avatar.classList.add('clickable'); avatar.addEventListener('click',function(){ if(confirm('تسجيل الخروج؟')){ localStorage.removeItem(SKEY); window.location.href='login.html'; } }); }

  // ---------- finance reveal (dashboard) ----------
  var card=document.getElementById('finance'), toggle=document.getElementById('finance-toggle'), figures=document.getElementById('finance-figures');
  if(toggle&&card&&figures){ var hid='التحصيل ٠٠٠٠ د.أ · الأرباح ٠٠٠٠ · المتأخرات ٠٠٠٠', shown='التحصيل ٤٢٬٥٠٠ د.أ · الأرباح ٨٬٢٠٠ · المتأخرات ١١٬٣٠٠', open=false;
    toggle.addEventListener('click',function(){ open=!open; card.classList.toggle('revealed',open); figures.textContent=open?shown:hid; toggle.textContent=open?'إخفاء ‹':'اضغط للعرض ›'; }); }
})();

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

  function modal(title,sub,fields,onSubmit){
    var ov=document.createElement('div'); ov.className='modal-overlay';
    var body=fields.map(function(f){
      if(f.t==='select') return '<div class="field"><label>'+f.l+'</label><select name="'+f.n+'">'+f.o.map(function(v){return '<option value="'+esc(v.value!=null?v.value:v)+'">'+esc(v.label!=null?v.label:v)+'</option>';}).join('')+'</select></div>';
      return '<div class="field"><label>'+f.l+'</label><input name="'+f.n+'" type="'+f.t+'" '+(f.t==='tel'?'dir="ltr"':'')+' required /></div>';
    }).join('');
    ov.innerHTML='<div class="modal"><h3>'+esc(title)+'</h3><p class="msub">'+esc(sub)+'</p><form><div>'+body+'</div><div class="actions"><button type="submit" class="btn-primary">حفظ</button><button type="button" class="btn-cancel">إلغاء</button></div></form></div>';
    document.body.appendChild(ov); ov.classList.add('open');
    function close(){ov.remove();}
    ov.addEventListener('click',function(e){if(e.target===ov)close();});
    ov.querySelector('.btn-cancel').addEventListener('click',close);
    ov.querySelector('form').addEventListener('submit',function(e){e.preventDefault();var d=new FormData(e.target),o={};fields.forEach(function(f){o[f.n]=(d.get(f.n)||'').toString().trim();});onSubmit(o);close();});
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
  var panel=document.getElementById('notif-panel'), bell=document.getElementById('bell');
  if(panel&&bell){
    panel.innerHTML='<div class="nhead"><span>الإشعارات</span><span class="link" id="mark-read" style="cursor:pointer">تعليم الكل كمقروء</span></div>'+
      NOTIFS.map(function(n){return '<div class="notif-item unread '+(n.urgent?'urgent':'')+'"><i class="ti '+n.ico+' ni-ico"></i><div class="ni-body"><p>'+esc(n.text)+'</p><div class="ni-time">'+esc(n.time)+'</div></div></div>';}).join('');
    bell.addEventListener('click',function(e){e.stopPropagation();panel.classList.toggle('open');});
    document.addEventListener('click',function(e){ if(panel.classList.contains('open') && !panel.contains(e.target) && e.target!==bell) panel.classList.remove('open'); });
    panel.addEventListener('click',function(e){
      if(e.target.id==='mark-read'){ panel.querySelectorAll('.notif-item').forEach(function(i){i.classList.remove('unread');}); var bc=document.getElementById('bell-count'); if(bc)bc.style.display='none'; toast('تم تعليم كل الإشعارات كمقروءة'); }
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
    var people=load(TEAM_KEY,teamSeed).filter(function(m){return m.role!=='المدير';});
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
        var items=list.length? list.map(function(t,i){return '<div class="todo-item '+(t.done?'done':'')+'"><div class="todo-check" data-i="'+i+'">'+(t.done?'<i class="ti ti-check"></i>':'')+'</div><div class="todo-text" data-i="'+i+'">'+esc(t.text)+'</div><button class="del-btn" data-i="'+i+'"><i class="ti ti-trash"></i></button></div>';}).join('') : '<div class="empty-hint">ما في مهام بعد — ضيف مهمة من فوق</div>';
        todoPanel.innerHTML='<h2><i class="ti ti-checklist" style="color:var(--teal-deep)"></i> مهام '+esc(current.name)+'</h2><div class="todo-add"><input id="todo-input" placeholder="اكتب مهمة جديدة لـ '+esc(current.name)+'..." /><button class="btn-add" id="todo-add-btn"><i class="ti ti-plus"></i> إضافة</button></div>'+items;
        var inp=document.getElementById('todo-input');
        function add(){ var v=inp.value.trim(); if(!v)return; list.push({text:v,done:false}); inp.value=''; r(); renderPeople(); }
        document.getElementById('todo-add-btn').addEventListener('click',add);
        inp.addEventListener('keydown',function(e){if(e.key==='Enter')add();});
        todoPanel.querySelectorAll('.todo-check').forEach(function(c){c.addEventListener('click',function(){list[+c.dataset.i].done=!list[+c.dataset.i].done;r();renderPeople();});});
        todoPanel.querySelectorAll('.del-btn').forEach(function(d){d.addEventListener('click',function(){list.splice(+d.dataset.i,1);r();renderPeople();});});
        todoPanel.querySelectorAll('.todo-text').forEach(function(t){t.addEventListener('dblclick',function(){var nv=prompt('تعديل المهمة:',list[+t.dataset.i].text);if(nv&&nv.trim()){list[+t.dataset.i].text=nv.trim();r();}});});
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
    'طلبات الشراء':{key:'tanfeez_x_pr',container:'.tbl tbody',title:'طلب شراء جديد',sub:'يُرسل للمورد بعد الموافقة',
      fields:[{l:'المشروع',n:'project',t:'text'},{l:'اسم المورد',n:'supplier',t:'text'},{l:'المواد',n:'mats',t:'text'},{l:'القيمة',n:'value',t:'text'},{l:'مقدّم الطلب',n:'requester',t:'text'}],
      el:function(o){var tr=document.createElement('tr');tr.dataset.status='معلّق';tr.dataset.supplier=o.supplier;tr.dataset.num='PR-جديد';tr.dataset.project=o.project;tr.innerHTML='<td>PR-جديد <span class="added-badge">جديد</span></td><td>'+esc(o.project)+'</td><td>'+esc(o.supplier)+'</td><td>'+esc(o.mats)+'</td><td>'+esc(o.value||'—')+'</td><td>'+esc(o.requester||'—')+'</td><td class="pr-action"><button class="btn-sm btn-approve">موافقة</button> <button class="btn-sm btn-reject">رفض</button></td>';return tr;}}
  };
  var cfg=PAGES[pageName];
  if(cfg){
    var container=document.querySelector(cfg.container);
    if(container){
      var stored=load(cfg.key,[]);
      stored.forEach(function(o){container.insertBefore(cfg.el(o),container.firstChild);});
      var pill=document.querySelector('.page-head .pill');
      if(pill&&pill.textContent.trim().charAt(0)==='+'){ pill.classList.add('clickable'); pill.addEventListener('click',function(){ modal(cfg.title,cfg.sub,cfg.fields,function(o){stored.push(o);save(cfg.key,stored);container.insertBefore(cfg.el(o),container.firstChild);toast('تمت الإضافة ✓');}); }); }
    }
  }

  // ---------- Materials add (project detail) ----------
  var matBody=document.getElementById('materials-body'), addMat=document.getElementById('add-material');
  if(matBody&&addMat){
    var MK='tanfeez_x_materials'; var ms=load(MK,[]);
    ms.forEach(function(o){var tr=document.createElement('tr');tr.innerHTML='<td>'+esc(o.name)+' <span class="added-badge">جديد</span></td><td>'+esc(o.unit)+'</td><td>'+esc(o.bought)+'</td><td>'+esc(o.used||'0')+'</td><td>'+esc(o.left||o.bought)+'</td>';matBody.insertBefore(tr,matBody.firstChild);});
    addMat.addEventListener('click',function(){ modal('إضافة مادة','مادة للمشروع',[{l:'المادة',n:'name',t:'text'},{l:'الوحدة',n:'unit',t:'text'},{l:'الكمية المشتراة',n:'bought',t:'text'}],function(o){ms.push(o);save(MK,ms);var tr=document.createElement('tr');tr.innerHTML='<td>'+esc(o.name)+' <span class="added-badge">جديد</span></td><td>'+esc(o.unit)+'</td><td>'+esc(o.bought)+'</td><td>0</td><td>'+esc(o.bought)+'</td>';matBody.insertBefore(tr,matBody.firstChild);toast('تمت الإضافة ✓');}); });
  }

  // ---------- Employee profile ----------
  if(document.getElementById('emp-name')){
    var en=qp('name')||'موظف'; var team=load(TEAM_KEY,teamSeed); var mem=team.filter(function(m){return m.name===en;})[0]||{name:en,role:'موظف'};
    document.getElementById('emp-name').textContent=mem.name;
    document.getElementById('emp-role').textContent=mem.role;
    var av=document.getElementById('emp-av'); av.textContent=initials(mem.name); av.style.background=ROLE_COLOR[mem.role]||'#0E8A94';
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
  document.addEventListener('click',function(e){
    var btn=e.target.closest?e.target.closest('.btn-approve, .btn-reject'):null; if(!btn)return;
    var tr=btn.closest('tr'); var ok=btn.classList.contains('btn-approve');
    var cell=btn.closest('.pr-action')||btn.parentElement;
    cell.innerHTML='<span class="tag '+(ok?'tag-teal':'tag-danger')+'">'+(ok?'تمت الموافقة':'مرفوض')+'</span>';
    if(tr)tr.dataset.status=ok?'تمت الموافقة':'مرفوض';
    if(ok){ toast('تمت الموافقة ✓'); sendModal(tr?tr.dataset.num:'PR', tr?tr.dataset.supplier:'', tr?tr.dataset.project:''); } else toast('تم الرفض');
  });

  // ---------- invoices save to OneDrive ----------
  document.addEventListener('click',function(e){ var b=e.target.closest?e.target.closest('.save-onedrive'):null; if(!b)return; b.innerHTML='<i class="ti ti-check"></i> محفوظ'; toast('تم حفظ الفاتورة على OneDrive (يكتمل مع الـ Backend)'); });

  // ---------- dead links ----------
  document.addEventListener('click',function(e){ var a=e.target.closest?e.target.closest('a[href="#"]'):null; if(!a)return; e.preventDefault(); var t=a.textContent.trim(); toast(/PDF/i.test(t)?'توليد PDF يجهز مع الـ Backend':'هذه الميزة تجهز مع المرحلة الجاية'); });

  // ---------- avatar logout ----------
  var avatar=document.querySelector('.topbar .avatar');
  if(avatar){ avatar.classList.add('clickable'); avatar.addEventListener('click',function(){ if(confirm('تسجيل الخروج؟'))window.location.href='login.html'; }); }

  // ---------- finance reveal (dashboard) ----------
  var card=document.getElementById('finance'), toggle=document.getElementById('finance-toggle'), figures=document.getElementById('finance-figures');
  if(toggle&&card&&figures){ var hid='التحصيل ٠٠٠٠ د.أ · الأرباح ٠٠٠٠ · المتأخرات ٠٠٠٠', shown='التحصيل ٤٢٬٥٠٠ د.أ · الأرباح ٨٬٢٠٠ · المتأخرات ١١٬٣٠٠', open=false;
    toggle.addEventListener('click',function(){ open=!open; card.classList.toggle('revealed',open); figures.textContent=open?shown:hid; toggle.textContent=open?'إخفاء ‹':'اضغط للعرض ›'; }); }
})();

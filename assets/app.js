// TANFEEZ.MEP — prototype interactions.
// Real client-side actions where possible; clear feedback elsewhere.
// Demo data persists in the browser (localStorage) until the backend exists.

(function () {
  // ---------- helpers ----------
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load(key, seed) {
    try { var v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : (seed || []).slice(); }
    catch (e) { return (seed || []).slice(); }
  }
  function save(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }
  function initials(name) {
    var p = String(name).trim().replace(/^م\.?\s*/, '').split(/\s+/);
    return ((p[0] || '·')[0] + (p[1] ? p[1][0] : '')).trim() || '·';
  }
  var ROLE_COLOR = { 'مهندس موقع': '#159BA8', 'مهندس مكتب': '#159BA8', 'فني': '#5F6B6B', 'المحاسب': '#854F0B', 'موظف مكتب': '#5F6B6B', 'المدير': '#0E8A94' };

  // ---------- toast ----------
  var toastEl;
  function toast(msg) {
    if (!toastEl) { toastEl = document.createElement('div'); toastEl.className = 'toast'; document.body.appendChild(toastEl); }
    toastEl.innerHTML = '<i class="ti ti-info-circle"></i>' + esc(msg);
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }

  // ---------- generic modal ----------
  function openModal(title, sub, fields, onSubmit) {
    var ov = document.createElement('div');
    ov.className = 'modal-overlay';
    var body = fields.map(function (f) {
      if (f.t === 'select') {
        return '<div class="field"><label>' + f.l + '</label><select name="' + f.n + '">' +
          f.o.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('') + '</select></div>';
      }
      return '<div class="field"><label>' + f.l + '</label><input name="' + f.n + '" type="' + f.t + '" ' +
        (f.t === 'tel' ? 'dir="ltr" placeholder="+962 7X XXX XXXX"' : '') + ' required /></div>';
    }).join('');
    ov.innerHTML = '<div class="modal"><h3>' + esc(title) + '</h3><p class="msub">' + esc(sub) + '</p>' +
      '<form><div>' + body + '</div><div class="actions"><button type="submit" class="btn-primary">إضافة</button>' +
      '<button type="button" class="btn-cancel">إلغاء</button></div></form></div>';
    document.body.appendChild(ov);
    ov.classList.add('open');
    function close() { ov.remove(); }
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.btn-cancel').addEventListener('click', close);
    ov.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(e.target), o = {};
      fields.forEach(function (f) { o[f.n] = (d.get(f.n) || '').toString().trim(); });
      onSubmit(o); close();
    });
  }

  // ---------- list pages (team / clients) ----------
  function renderList(cfg) {
    var body = document.getElementById(cfg.bodyId);
    if (!body) return;
    var data = load(cfg.key, cfg.seed);
    function render() {
      body.innerHTML = data.map(function (m, i) { return cfg.row(m, i); }).join('');
      body.querySelectorAll('.del-btn').forEach(function (b) {
        b.addEventListener('click', function () { data.splice(+b.getAttribute('data-i'), 1); save(cfg.key, data); render(); toast('تم الحذف'); });
      });
    }
    render();
    var btn = document.getElementById(cfg.addBtn);
    if (btn) btn.addEventListener('click', function () {
      openModal(cfg.addTitle, cfg.addSub, cfg.fields, function (o) {
        o.added = true; data.push(o); save(cfg.key, data); render(); toast('تمت الإضافة بنجاح ✓');
      });
    });
  }

  renderList({
    key: 'tanfeez_team_v1', bodyId: 'team-body', addBtn: 'add-member',
    addTitle: 'إضافة عضو للفريق', addSub: 'مهندس، فني، محاسب أو موظف مكتب',
    fields: [{ l: 'الاسم', n: 'name', t: 'text' }, { l: 'الدور', n: 'role', t: 'select', o: ['مهندس موقع', 'مهندس مكتب', 'فني', 'المحاسب', 'موظف مكتب'] }, { l: 'رقم الهاتف', n: 'phone', t: 'tel' }],
    seed: [
      { name: 'م. يزن حمّاد', role: 'المدير', phone: '+962 79 090 4515' },
      { name: 'م. أحمد', role: 'مهندس موقع', phone: '+962 79 000 0001' },
      { name: 'م. خالد', role: 'مهندس موقع', phone: '+962 79 000 0002' },
      { name: 'م. سامي', role: 'مهندس موقع', phone: '+962 79 000 0003' },
      { name: 'عبدالله', role: 'فني', phone: '+962 79 000 0004' },
      { name: 'محمود', role: 'المحاسب', phone: '+962 79 000 0005' },
      { name: 'نور', role: 'موظف مكتب', phone: '+962 79 000 0006' }
    ],
    row: function (m, i) {
      var color = ROLE_COLOR[m.role] || '#0E8A94';
      var badge = m.added ? '<span class="added-badge">جديد</span>' : '';
      var del = m.added ? '<button class="del-btn" data-i="' + i + '" title="حذف"><i class="ti ti-trash"></i></button>' : '';
      return '<tr><td><div style="display:flex;align-items:center;gap:10px"><div class="avatar" style="background:' + color + '">' + esc(initials(m.name)) + '</div> ' + esc(m.name) + badge + '</div></td><td>' + esc(m.role) + '</td><td><span dir="ltr">' + esc(m.phone) + '</span></td><td><span class="tag tag-teal">نشط</span></td><td style="text-align:left">' + del + '</td></tr>';
    }
  });

  renderList({
    key: 'tanfeez_clients_v1', bodyId: 'clients-body', addBtn: 'add-client',
    addTitle: 'إضافة عميل', addSub: 'بيانات العميل الأساسية',
    fields: [{ l: 'اسم العميل / الشركة', n: 'name', t: 'text' }, { l: 'جهة الاتصال', n: 'contact', t: 'text' }, { l: 'رقم الهاتف', n: 'phone', t: 'tel' }],
    seed: [
      { name: 'شركة الياسمين العقارية', contact: 'أبو محمد', phone: '+962 79 111 1111', projects: 1 },
      { name: 'مجمّع الصويفية', contact: 'إدارة المجمّع', phone: '+962 79 222 2222', projects: 1 },
      { name: 'Marouf Coffee', contact: 'قسم المشاريع', phone: '+962 79 333 3333', projects: 2 }
    ],
    row: function (c, i) {
      var badge = c.added ? '<span class="added-badge">جديد</span>' : '';
      var del = c.added ? '<button class="del-btn" data-i="' + i + '" title="حذف"><i class="ti ti-trash"></i></button>' : '';
      return '<tr><td>' + esc(c.name) + badge + '</td><td>' + esc(c.contact || '—') + '</td><td><span dir="ltr">' + esc(c.phone) + '</span></td><td>' + esc(c.projects || 0) + ' مشروع</td><td><span class="tag tag-teal">نشط</span></td><td style="text-align:left">' + del + '</td></tr>';
    }
  });

  // ---------- generic "+ add" on list/table pages ----------
  var h1 = document.querySelector('.page-head h1');
  var pageName = h1 ? h1.textContent.trim() : '';
  var PAGES = {
    'المشاريع': {
      key: 'tanfeez_x_projects', container: '.proj-grid',
      title: 'إضافة مشروع جديد', sub: 'بيانات المشروع الأساسية',
      fields: [{ l: 'اسم المشروع', n: 'name', t: 'text' }, { l: 'النوع والموقع', n: 'type', t: 'text' }, { l: 'المهندس المسؤول', n: 'engineer', t: 'text' }, { l: 'الحالة', n: 'status', t: 'select', o: ['جاري', 'بانتظار اعتماد', 'قارب الانتهاء'] }],
      el: function (o) {
        var sc = { 'جاري': 'status-active', 'بانتظار اعتماد': 'status-hold', 'قارب الانتهاء': 'status-near' }[o.status] || 'status-active';
        var a = document.createElement('a'); a.className = 'proj-card'; a.href = 'project-detail.html'; a.style.display = 'block';
        a.innerHTML = '<div class="top"><h3>' + esc(o.name) + ' <span class="added-badge">جديد</span></h3><span class="status ' + sc + '">' + esc(o.status) + '</span></div><p class="type">' + esc(o.type) + '</p><div class="bar"><span style="width:0%"></span></div><div class="nums"><div>الإنجاز <b>0%</b></div><div>البنود <b>0</b></div><div>المهندس <b>' + esc(o.engineer || '—') + '</b></div></div>';
        return a;
      }
    },
    'المهام': {
      key: 'tanfeez_x_tasks', container: '.tbl tbody',
      title: 'إضافة مهمة', sub: 'مهمة عامة أو خاصة بمشروع',
      fields: [{ l: 'المهمة', n: 'task', t: 'text' }, { l: 'المشروع', n: 'project', t: 'text' }, { l: 'المسؤول', n: 'assignee', t: 'text' }, { l: 'الاستحقاق', n: 'due', t: 'text' }, { l: 'الحالة', n: 'status', t: 'select', o: ['جديد', 'قيد التنفيذ', 'متأخر', 'منجز'] }],
      el: function (o) {
        var cmap = { 'قيد التنفيذ': 'tag-warn', 'متأخر': 'tag-danger', 'جديد': 'tag-teal', 'منجز': 'tag-teal' };
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + esc(o.task) + ' <span class="added-badge">جديد</span></td><td>' + esc(o.project || 'عام') + '</td><td>' + esc(o.assignee || '—') + '</td><td>' + esc(o.due || '—') + '</td><td><span class="tag ' + (cmap[o.status] || 'tag-teal') + '">' + esc(o.status) + '</span></td>';
        return tr;
      }
    },
    'الفواتير': {
      key: 'tanfeez_x_invoices', container: '.tbl tbody',
      title: 'إضافة فاتورة', sub: 'فاتورة جديدة (مسودة)',
      fields: [{ l: 'العميل', n: 'client', t: 'text' }, { l: 'النوع', n: 'type', t: 'select', o: ['مطالبة مرحلية', 'فاتورة وطنية', 'BOQ مسعّر'] }, { l: 'القيمة', n: 'value', t: 'text' }],
      el: function (o) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>INV-جديد <span class="added-badge">جديد</span></td><td>' + esc(o.client) + '</td><td>' + esc(o.type) + '</td><td>' + esc(o.value || '—') + '</td><td><span class="tag tag-warn">مسودة</span></td><td><a class="link" href="#"><i class="ti ti-file-type-pdf"></i> PDF</a></td>';
        return tr;
      }
    },
    'التقارير اليومية': {
      key: 'tanfeez_x_reports', container: '.tbl tbody',
      title: 'إضافة تقرير', sub: 'تقرير يومي أو أسبوعي',
      fields: [{ l: 'المشروع', n: 'project', t: 'text' }, { l: 'التاريخ', n: 'date', t: 'text' }, { l: 'النوع', n: 'type', t: 'select', o: ['يومي', 'أسبوعي'] }, { l: 'المهندس', n: 'engineer', t: 'text' }],
      el: function (o) {
        var tr = document.createElement('tr');
        tr.innerHTML = '<td>' + esc(o.project) + ' <span class="added-badge">جديد</span></td><td>' + esc(o.date || '—') + '</td><td>' + esc(o.type) + '</td><td>' + esc(o.engineer || '—') + '</td><td><span class="tag tag-warn">لم يُرسل</span></td><td><a class="link" href="#"><i class="ti ti-file-type-pdf"></i> PDF</a></td>';
        return tr;
      }
    }
  };

  var pageCfg = PAGES[pageName];
  if (pageCfg) {
    var container = document.querySelector(pageCfg.container);
    if (container) {
      var stored = load(pageCfg.key, []);
      stored.forEach(function (o) { container.insertBefore(pageCfg.el(o), container.firstChild); });
      var pill = document.querySelector('.page-head .pill');
      if (pill && pill.textContent.trim().charAt(0) === '+') {
        pill.classList.add('clickable');
        pill.addEventListener('click', function () {
          openModal(pageCfg.title, pageCfg.sub, pageCfg.fields, function (o) {
            stored.push(o); save(pageCfg.key, stored);
            container.insertBefore(pageCfg.el(o), container.firstChild);
            toast('تمت الإضافة بنجاح ✓');
          });
        });
      }
    }
  }

  // ---------- filter chips ----------
  document.querySelectorAll('.toolbar').forEach(function (bar) {
    var table = bar.parentElement.querySelector('.tbl tbody') || (bar.nextElementSibling && bar.nextElementSibling.querySelector('.tbl tbody'));
    if (!table) return;
    bar.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        bar.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        var label = chip.textContent.trim();
        var all = label === 'الكل';
        table.querySelectorAll('tr').forEach(function (tr) {
          tr.classList.toggle('hide-row', !(all || tr.textContent.indexOf(label) !== -1));
        });
      });
    });
  });

  // ---------- approve / reject (purchase requests) ----------
  document.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('.btn-approve, .btn-reject') : null;
    if (!btn) return;
    var cell = btn.parentElement;
    var ok = btn.classList.contains('btn-approve');
    cell.innerHTML = '<span class="tag ' + (ok ? 'tag-teal' : 'tag-danger') + '">' + (ok ? 'تمت الموافقة' : 'مرفوض') + '</span>';
    toast(ok ? 'تمت الموافقة على الطلب ✓' : 'تم رفض الطلب');
  });

  // ---------- dead "#" links → feedback ----------
  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href="#"]') : null;
    if (!a) return;
    e.preventDefault();
    var t = a.textContent.trim();
    if (/PDF/i.test(t)) toast('توليد ملفات PDF بيجهز مع النظام الكامل (Backend)');
    else toast('هذه الميزة بتجهز مع المرحلة الجاية (Backend)');
  });

  // ---------- notifications bell ----------
  var bell = document.querySelector('.icon-btn');
  if (bell) bell.addEventListener('click', function () { toast('عندك 3 تنبيهات — شاشة الإشعارات بتجهز مع الـ Backend'); });

  // ---------- avatar → logout ----------
  var avatar = document.querySelector('.topbar .avatar');
  if (avatar) {
    avatar.classList.add('clickable');
    avatar.addEventListener('click', function () {
      if (confirm('تسجيل الخروج؟')) window.location.href = 'login.html';
    });
  }

  // ---------- finance reveal (dashboard) ----------
  var card = document.getElementById('finance');
  var toggle = document.getElementById('finance-toggle');
  var figures = document.getElementById('finance-figures');
  if (toggle && card && figures) {
    var hidden = 'التحصيل ٠٠٠٠ د.أ · الأرباح ٠٠٠٠ · المتأخرات ٠٠٠٠';
    var shown = 'التحصيل ٤٢٬٥٠٠ د.أ · الأرباح ٨٬٢٠٠ · المتأخرات ١١٬٣٠٠';
    var open = false;
    toggle.addEventListener('click', function () {
      open = !open;
      card.classList.toggle('revealed', open);
      figures.textContent = open ? shown : hidden;
      toggle.textContent = open ? 'إخفاء ‹' : 'اضغط للعرض ›';
    });
  }
})();

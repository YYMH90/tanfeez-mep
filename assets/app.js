// TANFEEZ.MEP — prototype interactions.
// Demo data persisted in the browser (localStorage) until the backend exists.

(function () {
  // ---------- helpers ----------
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load(key, seed) {
    try { var v = JSON.parse(localStorage.getItem(key)); return Array.isArray(v) ? v : seed.slice(); }
    catch (e) { return seed.slice(); }
  }
  function save(key, arr) { localStorage.setItem(key, JSON.stringify(arr)); }
  function initials(name) {
    var p = String(name).trim().replace(/^م\.?\s*/, '').split(/\s+/);
    return ((p[0] || '·')[0] + (p[1] ? p[1][0] : '')).trim() || '·';
  }
  var ROLE_COLOR = {
    'مهندس موقع': '#159BA8', 'مهندس مكتب': '#159BA8', 'فني': '#5F6B6B',
    'المحاسب': '#854F0B', 'موظف مكتب': '#5F6B6B', 'المدير': '#0E8A94'
  };

  // ---------- seed data ----------
  var TEAM_KEY = 'tanfeez_team_v1';
  var teamSeed = [
    { name: 'م. يزن حمّاد', role: 'المدير', phone: '+962 79 090 4515' },
    { name: 'م. أحمد', role: 'مهندس موقع', phone: '+962 79 000 0001' },
    { name: 'م. خالد', role: 'مهندس موقع', phone: '+962 79 000 0002' },
    { name: 'م. سامي', role: 'مهندس موقع', phone: '+962 79 000 0003' },
    { name: 'عبدالله', role: 'فني', phone: '+962 79 000 0004' },
    { name: 'محمود', role: 'المحاسب', phone: '+962 79 000 0005' },
    { name: 'نور', role: 'موظف مكتب', phone: '+962 79 000 0006' }
  ];
  var CLIENT_KEY = 'tanfeez_clients_v1';
  var clientSeed = [
    { name: 'شركة الياسمين العقارية', contact: 'أبو محمد', phone: '+962 79 111 1111', projects: 1 },
    { name: 'مجمّع الصويفية', contact: 'إدارة المجمّع', phone: '+962 79 222 2222', projects: 1 },
    { name: 'Marouf Coffee', contact: 'قسم المشاريع', phone: '+962 79 333 3333', projects: 2 }
  ];

  // ---------- modal ----------
  function buildModal() {
    var ov = document.createElement('div');
    ov.className = 'modal-overlay';
    ov.innerHTML =
      '<div class="modal"><h3 id="mTitle"></h3><p class="msub" id="mSub"></p>' +
      '<form id="mForm"><div id="mFields"></div>' +
      '<div class="actions"><button type="submit" class="btn-primary">إضافة</button>' +
      '<button type="button" class="btn-cancel" id="mCancel">إلغاء</button></div></form></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.getElementById('mCancel').addEventListener('click', close);
    function close() { ov.classList.remove('open'); }
    return { ov: ov, close: close };
  }

  function field(label, name, type, opts) {
    if (type === 'select') {
      var o = opts.map(function (v) { return '<option value="' + esc(v) + '">' + esc(v) + '</option>'; }).join('');
      return '<div class="field"><label>' + label + '</label><select name="' + name + '">' + o + '</select></div>';
    }
    return '<div class="field"><label>' + label + '</label><input name="' + name + '" type="' + type + '" ' +
      (type === 'tel' ? 'dir="ltr" placeholder="+962 7X XXX XXXX"' : '') + ' required /></div>';
  }

  // ---------- team page ----------
  var teamBody = document.getElementById('team-body');
  if (teamBody) {
    var team = load(TEAM_KEY, teamSeed);
    var renderTeam = function () {
      teamBody.innerHTML = team.map(function (m, i) {
        var color = ROLE_COLOR[m.role] || '#0E8A94';
        var badge = m.added ? '<span class="added-badge">جديد</span>' : '';
        var del = m.added ? '<button class="del-btn" data-i="' + i + '" title="حذف"><i class="ti ti-trash"></i></button>' : '';
        return '<tr><td><div style="display:flex;align-items:center;gap:10px">' +
          '<div class="avatar" style="background:' + color + '">' + esc(initials(m.name)) + '</div> ' +
          esc(m.name) + badge + '</div></td><td>' + esc(m.role) + '</td>' +
          '<td><span dir="ltr">' + esc(m.phone) + '</span></td>' +
          '<td><span class="tag tag-teal">نشط</span></td><td style="text-align:left">' + del + '</td></tr>';
      }).join('');
      teamBody.querySelectorAll('.del-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          team.splice(+b.getAttribute('data-i'), 1); save(TEAM_KEY, team); renderTeam();
        });
      });
    };
    renderTeam();

    var modal = buildModal();
    document.getElementById('add-member').addEventListener('click', function () {
      document.getElementById('mTitle').textContent = 'إضافة عضو للفريق';
      document.getElementById('mSub').textContent = 'مهندس، فني، محاسب أو موظف مكتب';
      document.getElementById('mFields').innerHTML =
        field('الاسم', 'name', 'text') +
        field('الدور', 'role', 'select', ['مهندس موقع', 'مهندس مكتب', 'فني', 'المحاسب', 'موظف مكتب']) +
        field('رقم الهاتف', 'phone', 'tel');
      modal.ov.classList.add('open');
      var form = document.getElementById('mForm');
      form.onsubmit = function (e) {
        e.preventDefault();
        var d = new FormData(form);
        team.push({ name: d.get('name').trim(), role: d.get('role'), phone: d.get('phone').trim(), added: true });
        save(TEAM_KEY, team); renderTeam(); modal.close();
      };
    });
  }

  // ---------- clients page ----------
  var clientsBody = document.getElementById('clients-body');
  if (clientsBody) {
    var clients = load(CLIENT_KEY, clientSeed);
    var renderClients = function () {
      clientsBody.innerHTML = clients.map(function (c, i) {
        var badge = c.added ? '<span class="added-badge">جديد</span>' : '';
        var del = c.added ? '<button class="del-btn" data-i="' + i + '" title="حذف"><i class="ti ti-trash"></i></button>' : '';
        return '<tr><td>' + esc(c.name) + badge + '</td><td>' + esc(c.contact || '—') + '</td>' +
          '<td><span dir="ltr">' + esc(c.phone) + '</span></td>' +
          '<td>' + esc(c.projects || 0) + ' مشروع</td>' +
          '<td><span class="tag tag-teal">نشط</span></td><td style="text-align:left">' + del + '</td></tr>';
      }).join('');
      clientsBody.querySelectorAll('.del-btn').forEach(function (b) {
        b.addEventListener('click', function () {
          clients.splice(+b.getAttribute('data-i'), 1); save(CLIENT_KEY, clients); renderClients();
        });
      });
    };
    renderClients();

    var cmodal = buildModal();
    document.getElementById('add-client').addEventListener('click', function () {
      document.getElementById('mTitle').textContent = 'إضافة عميل';
      document.getElementById('mSub').textContent = 'بيانات العميل الأساسية';
      document.getElementById('mFields').innerHTML =
        field('اسم العميل / الشركة', 'name', 'text') +
        field('جهة الاتصال', 'contact', 'text') +
        field('رقم الهاتف', 'phone', 'tel');
      cmodal.ov.classList.add('open');
      var form = document.getElementById('mForm');
      form.onsubmit = function (e) {
        e.preventDefault();
        var d = new FormData(form);
        clients.push({ name: d.get('name').trim(), contact: d.get('contact').trim(), phone: d.get('phone').trim(), projects: 0, added: true });
        save(CLIENT_KEY, clients); renderClients(); cmodal.close();
      };
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

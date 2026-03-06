// ─── Auth helpers ─────────────────────────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('rdl_token'),
  getUser:  () => JSON.parse(localStorage.getItem('rdl_user') || 'null'),
  set: (token, user) => {
    localStorage.setItem('rdl_token', token);
    localStorage.setItem('rdl_user', JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem('rdl_token');
    localStorage.removeItem('rdl_user');
  },
  isLoggedIn: () => !!localStorage.getItem('rdl_token'),
  hasRole: (...roles) => {
    const u = Auth.getUser();
    return u && roles.includes(u.role);
  },
  requireLogin: () => {
    if (!Auth.isLoggedIn()) { window.location.href = '/'; }
  },
  requireRole: (...roles) => {
    Auth.requireLogin();
    if (!Auth.hasRole(...roles)) { window.location.href = '/dashboard.html'; }
  }
};

// ─── API fetch wrapper ────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = Auth.getToken();
  const res = await fetch('/api' + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  if (res.status === 401) { Auth.clear(); window.location.href = '/'; return; }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro no servidor');
  return data;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────
function showAlert(el, msg, type = 'error') {
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.style.display = 'block';
  if (type === 'success') setTimeout(() => el.style.display = 'none', 3000);
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function diaSemana(iso) {
  const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  return dias[new Date(iso + 'T12:00:00').getDay()];
}

// ─── Render topbar ────────────────────────────────────────────────────────────
function renderTopbar() {
  const u = Auth.getUser();
  if (!u) return;
  const roleLabel = { admin:'Admin', escritorio:'Escritório', sala:'Sala', cozinha:'Cozinha', limpeza:'Limpeza' };
  document.getElementById('topbar-name').textContent = u.name;
  document.getElementById('topbar-role').textContent = roleLabel[u.role] || u.role;
  document.getElementById('btn-logout').onclick = () => { Auth.clear(); window.location.href = '/'; };

  // Hamburger para mobile
  const brand = document.querySelector('.topbar-brand');
  if (brand && !document.getElementById('hamburger')) {
    const btn = document.createElement('button');
    btn.id = 'hamburger'; btn.className = 'hamburger'; btn.innerHTML = '☰'; btn.title = 'Menu';
    document.querySelector('.topbar').insertBefore(btn, brand);

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);

    const sidebar = document.querySelector('.sidebar');
    const toggle = () => {
      sidebar && sidebar.classList.toggle('open');
      overlay.classList.toggle('open');
    };
    btn.onclick = toggle;
    overlay.onclick = toggle;
  }
}

// ─── Render sidebar conforme role ─────────────────────────────────────────────
function renderSidebar() {
  const u = Auth.getUser();
  if (!u) return;
  const cur = window.location.pathname;
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  const links = [
    { href: '/dashboard.html',   icon: '🏠', label: 'Dashboard',   roles: ['admin','escritorio','sala','cozinha','limpeza'] },
    { section: 'Operações' },
    { href: '/encomendas.html',  icon: '📋', label: 'Encomendas',  roles: ['admin','escritorio','sala','cozinha'] },
    { href: '/mesas.html',       icon: '🪑', label: 'Mesas',       roles: ['admin','escritorio','sala','cozinha'] },
    { section: 'Formação' },
    { href: '/guia.html',        icon: '📖', label: 'Guia Staff',  roles: ['admin','escritorio','sala','cozinha','limpeza'] },
    { section: 'Escritório', roles: ['admin','escritorio'] },
    { href: '/faturas.html',     icon: '💶', label: 'Faturas',     roles: ['admin','escritorio'] },
    { href: '/utilizadores.html',icon: '👤', label: 'Utilizadores',roles: ['admin'] },
  ];

  let html = '';
  for (const l of links) {
    if (l.section) {
      if (l.roles && !l.roles.includes(u.role)) continue;
      html += `<div class="nav-section">${l.section}</div>`;
      continue;
    }
    if (!l.roles.includes(u.role)) continue;
    const active = cur.includes(l.href) ? 'active' : '';
    html += `<a href="${l.href}" class="${active}">${l.icon} ${l.label}</a>`;
  }
  nav.innerHTML = html;
}

// RZStore — Admin Module (admin.js)
import { Storage, Session, Toast, formatPrice, formatDate, generateId } from './app.js';
import { requireAdmin } from './auth.js';

const STATUS_LABELS = {
  pending:    'Menunggu',
  processing: 'Diproses',
  shipped:    'Dikirim',
  delivered:  'Diterima',
  cancelled:  'Dibatalkan'
};

// ============================================================
// Section Switching
// ============================================================
function showSection(name) {
  ['dashboard', 'products', 'orders', 'users'].forEach(s => {
    document.getElementById(`section-${s}`)?.classList.add('hidden');
    document.querySelector(`[data-nav="${s}"]`)?.classList.remove('bg-indigo-600', 'text-white');
    document.querySelector(`[data-nav="${s}"]`)?.classList.add('text-gray-700', 'dark:text-slate-300');
  });
  document.getElementById(`section-${name}`)?.classList.remove('hidden');
  const activeBtn = document.querySelector(`[data-nav="${name}"]`);
  activeBtn?.classList.add('bg-indigo-600', 'text-white');
  activeBtn?.classList.remove('text-gray-700', 'dark:text-slate-300');

  if (name === 'dashboard') renderDashboard();
  if (name === 'products')  renderProductsTable();
  if (name === 'orders')    renderOrdersTable();
  if (name === 'users')     renderUsersTable();
}

// ============================================================
// Dashboard
// ============================================================
export function renderDashboard() {
  const products = Storage.get('rz_products') || [];
  const orders   = Storage.get('rz_orders')   || [];
  const users    = Storage.get('rz_users')    || [];
  const revenue  = orders.reduce((s, o) => s + (o.total || 0), 0);

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('stat-products', products.length);
  setEl('stat-orders',   orders.length);
  setEl('stat-users',    users.length);
  setEl('stat-revenue',  formatPrice(revenue));

  // Recent orders
  const recentEl = document.getElementById('recent-orders');
  if (recentEl) {
    const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    if (recent.length === 0) {
      recentEl.innerHTML = '<tr><td colspan="4" class="text-center py-6 text-gray-400 text-sm">Belum ada pesanan</td></tr>';
      return;
    }
    recentEl.innerHTML = recent.map(o => `
      <tr class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
        <td class="py-3 px-4 text-xs font-mono text-gray-700 dark:text-slate-300">${o.transactionId}</td>
        <td class="py-3 px-4 text-sm text-gray-700 dark:text-slate-300">${o.customer?.name || '-'}</td>
        <td class="py-3 px-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400">${formatPrice(o.total)}</td>
        <td class="py-3 px-4"><span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">${STATUS_LABELS[o.status] || o.status}</span></td>
      </tr>
    `).join('');
  }
}

// ============================================================
// Products Table
// ============================================================
export function renderProductsTable() {
  const products = Storage.get('rz_products') || [];
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400 text-sm">Belum ada produk</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => `
    <tr class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
      <td class="py-3 px-4">
        <img src="${p.image}" alt="${p.name}" class="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
          onerror="this.src='https://placehold.co/40x40/e5e7eb/9ca3af?text=?'" />
      </td>
      <td class="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white max-w-[180px] truncate">${p.name}</td>
      <td class="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">${p.category}</td>
      <td class="py-3 px-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400">${formatPrice(p.price)}</td>
      <td class="py-3 px-4 text-sm ${p.stock === 0 ? 'text-red-500 font-semibold' : 'text-gray-700 dark:text-slate-300'}">${p.stock}</td>
      <td class="py-3 px-4">
        <div class="flex gap-2">
          <button class="edit-product-btn px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition" data-id="${p.id}">
            <i class="fas fa-edit mr-1"></i>Edit
          </button>
          <button class="delete-product-btn px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition" data-id="${p.id}">
            <i class="fas fa-trash mr-1"></i>Hapus
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.edit-product-btn').forEach(btn => {
    btn.addEventListener('click', () => openProductModal(btn.dataset.id));
  });
  tbody.querySelectorAll('.delete-product-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
  });
}

function deleteProduct(id) {
  if (!confirm('Yakin ingin menghapus produk ini?')) return;
  const products = (Storage.get('rz_products') || []).filter(p => String(p.id) !== String(id));
  Storage.set('rz_products', products);
  Toast.show('Produk berhasil dihapus.', 'success');
  renderProductsTable();
}

// ============================================================
// Product Modal
// ============================================================
export function openProductModal(productId = null) {
  const modal   = document.getElementById('product-modal');
  const title   = document.getElementById('modal-title');
  const form    = document.getElementById('product-form');
  const isEdit  = productId !== null;
  const product = isEdit ? (Storage.get('rz_products') || []).find(p => String(p.id) === String(productId)) : {};

  if (title) title.textContent = isEdit ? 'Edit Produk' : 'Tambah Produk';

  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('pf-name',        product?.name || '');
  setVal('pf-category',    product?.category || '');
  setVal('pf-price',       product?.price || '');
  setVal('pf-stock',       product?.stock ?? '');
  setVal('pf-image',       product?.image || '');
  setVal('pf-description', product?.description || '');
  setVal('pf-tags',        (product?.tags || []).join(', '));
  const featuredEl = document.getElementById('pf-featured');
  if (featuredEl) featuredEl.checked = product?.featured || false;

  // Clear errors
  ['pf-name', 'pf-category', 'pf-price', 'pf-stock', 'pf-image', 'pf-description'].forEach(f => {
    const err = document.getElementById(f + '-error');
    if (err) { err.textContent = ''; err.classList.add('hidden'); }
  });

  modal?.classList.remove('hidden');

  // Submit handler
  const newForm = form?.cloneNode(true);
  form?.parentNode?.replaceChild(newForm, form);
  document.getElementById('product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveProduct(isEdit ? productId : null);
  });
}

function saveProduct(editId) {
  const getVal = (id) => document.getElementById(id)?.value.trim() || '';
  const name        = getVal('pf-name');
  const category    = getVal('pf-category');
  const price       = parseFloat(getVal('pf-price'));
  const stock       = parseInt(getVal('pf-stock'));
  const image       = getVal('pf-image');
  const description = getVal('pf-description');
  const tags        = getVal('pf-tags').split(',').map(t => t.trim()).filter(Boolean);
  const featured    = document.getElementById('pf-featured')?.checked || false;

  const showErr = (id, msg) => { const el = document.getElementById(id + '-error'); if (el) { el.textContent = msg; el.classList.remove('hidden'); } };
  let valid = true;
  if (!name)        { showErr('pf-name', 'Nama wajib diisi.'); valid = false; }
  if (!category)    { showErr('pf-category', 'Kategori wajib diisi.'); valid = false; }
  if (!price || isNaN(price)) { showErr('pf-price', 'Harga tidak valid.'); valid = false; }
  if (isNaN(stock)) { showErr('pf-stock', 'Stok tidak valid.'); valid = false; }
  if (!image)       { showErr('pf-image', 'URL gambar wajib diisi.'); valid = false; }
  if (!description) { showErr('pf-description', 'Deskripsi wajib diisi.'); valid = false; }
  if (!valid) return;

  const products = Storage.get('rz_products') || [];

  if (editId) {
    const idx = products.findIndex(p => String(p.id) === String(editId));
    if (idx !== -1) {
      products[idx] = { ...products[idx], name, category, price, stock, image, description, tags, featured };
    }
    Toast.show('Produk berhasil diperbarui.', 'success');
  } else {
    // Generate unique ID
    const existingIds = new Set(products.map(p => String(p.id)));
    let newId;
    do { newId = generateId('prod'); } while (existingIds.has(newId));
    products.push({ id: newId, name, category, price, stock, image, description, tags, featured, rating: 4.0, createdAt: new Date().toISOString() });
    Toast.show('Produk berhasil ditambahkan.', 'success');
  }

  Storage.set('rz_products', products);
  document.getElementById('product-modal')?.classList.add('hidden');
  renderProductsTable();
}

// ============================================================
// Orders Table
// ============================================================
export function renderOrdersTable() {
  const orders = Storage.get('rz_orders') || [];
  const tbody  = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-gray-400 text-sm">Belum ada pesanan</td></tr>';
    return;
  }

  const sorted = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date));
  tbody.innerHTML = sorted.map(o => `
    <tr class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
      <td class="py-3 px-4 text-xs font-mono text-gray-700 dark:text-slate-300 max-w-[140px] truncate">${o.transactionId}</td>
      <td class="py-3 px-4 text-sm text-gray-700 dark:text-slate-300">${o.customer?.name || '-'}</td>
      <td class="py-3 px-4 text-xs text-gray-500 dark:text-slate-400">${formatDate(o.date)}</td>
      <td class="py-3 px-4 text-sm font-semibold text-indigo-600 dark:text-indigo-400">${formatPrice(o.total)}</td>
      <td class="py-3 px-4">
        <select class="order-status-select text-xs border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-700 text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" data-id="${o.transactionId}">
          ${['pending','processing','shipped','delivered','cancelled'].map(s =>
            `<option value="${s}" ${o.status === s ? 'selected' : ''}>${STATUS_LABELS[s]}</option>`
          ).join('')}
        </select>
      </td>
      <td class="py-3 px-4">
        <button class="view-order-btn px-3 py-1.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition" data-id="${o.transactionId}">
          <i class="fas fa-eye mr-1"></i>Detail
        </button>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.order-status-select').forEach(sel => {
    sel.addEventListener('change', () => {
      const orders = Storage.get('rz_orders') || [];
      const order  = orders.find(o => o.transactionId === sel.dataset.id);
      if (order) { order.status = sel.value; Storage.set('rz_orders', orders); Toast.show('Status pesanan diperbarui.', 'success'); }
    });
  });

  tbody.querySelectorAll('.view-order-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const order = (Storage.get('rz_orders') || []).find(o => o.transactionId === btn.dataset.id);
      if (!order) return;
      const modal = document.getElementById('order-detail-modal');
      const body  = document.getElementById('order-detail-body');
      if (body) {
        body.innerHTML = `
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div><p class="text-xs text-gray-500 dark:text-slate-400 mb-1">ID Transaksi</p><p class="font-mono font-semibold text-gray-900 dark:text-white text-xs">${order.transactionId}</p></div>
              <div><p class="text-xs text-gray-500 dark:text-slate-400 mb-1">Tanggal</p><p class="text-gray-900 dark:text-white">${formatDate(order.date)}</p></div>
              <div><p class="text-xs text-gray-500 dark:text-slate-400 mb-1">Pelanggan</p><p class="text-gray-900 dark:text-white">${order.customer?.name}</p></div>
              <div><p class="text-xs text-gray-500 dark:text-slate-400 mb-1">Total</p><p class="font-bold text-indigo-600 dark:text-indigo-400">${formatPrice(order.total)}</p></div>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Alamat</p>
              <p class="text-sm text-gray-700 dark:text-slate-300">${order.customer?.address}, ${order.customer?.city} ${order.customer?.postalCode}</p>
              <p class="text-sm text-gray-700 dark:text-slate-300">${order.customer?.phone}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">Item</p>
              <div class="space-y-2">
                ${order.items.map(item => `
                  <div class="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-slate-700 last:border-0">
                    <img src="${item.image}" alt="${item.name}" class="w-10 h-10 object-cover rounded-lg" onerror="this.src='https://placehold.co/40x40/e5e7eb/9ca3af?text=?'" />
                    <div class="flex-1 min-w-0"><p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">${item.name}</p><p class="text-xs text-gray-500 dark:text-slate-400">${formatPrice(item.price)} × ${item.quantity}</p></div>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">${formatPrice(item.price * item.quantity)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
      }
      modal?.classList.remove('hidden');
    });
  });
}

// ============================================================
// Users Table
// ============================================================
export function renderUsersTable() {
  const users = Storage.get('rz_users') || [];
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-8 text-gray-400 text-sm">Belum ada pengguna</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(u => `
    <tr class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50">
      <td class="py-3 px-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            ${u.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2)}
          </div>
          <span class="text-sm font-medium text-gray-900 dark:text-white">${u.name}</span>
        </div>
      </td>
      <td class="py-3 px-4 text-sm text-gray-600 dark:text-slate-400">${u.email}</td>
      <td class="py-3 px-4">
        <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}">
          ${u.role === 'admin' ? 'Admin' : 'Customer'}
        </span>
      </td>
      <td class="py-3 px-4 text-sm text-gray-500 dark:text-slate-400">${formatDate(u.createdAt)}</td>
      <td class="py-3 px-4">
        <div class="flex gap-2">
          <button class="edit-user-btn px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg hover:bg-indigo-200 transition" data-email="${u.email}">
            <i class="fas fa-edit mr-1"></i>Edit
          </button>
          <button class="delete-user-btn px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-lg hover:bg-red-200 transition" data-email="${u.email}" ${u.email === 'admin@rzstore.com' ? 'disabled title="Admin utama tidak bisa dihapus"' : ''}>
            <i class="fas fa-trash mr-1"></i>Hapus
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  // Wire edit buttons
  tbody.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', () => openUserModal(btn.dataset.email));
  });

  // Wire delete buttons
  tbody.querySelectorAll('.delete-user-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(`Hapus pengguna ${btn.dataset.email}?`)) return;
      const session = Session.get();
      if (session?.email === btn.dataset.email) {
        Toast.show('Tidak bisa menghapus akun yang sedang login.', 'error');
        return;
      }
      const updated = (Storage.get('rz_users') || []).filter(u => u.email !== btn.dataset.email);
      Storage.set('rz_users', updated);
      Toast.show('Pengguna berhasil dihapus.', 'success');
      renderUsersTable();
    });
  });
}

// ============================================================
// User Edit Modal
// ============================================================
function openUserModal(email) {
  const users = Storage.get('rz_users') || [];
  const user  = users.find(u => u.email === email);
  if (!user) return;

  const modal = document.getElementById('user-modal');
  if (!modal) return;

  // Populate fields
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
  setVal('uf-name',  user.name);
  setVal('uf-email', user.email);
  setVal('uf-phone', user.phone || '');
  const roleEl = document.getElementById('uf-role');
  if (roleEl) roleEl.value = user.role;

  // Disable role change for currently logged-in admin
  const session = Session.get();
  if (roleEl) roleEl.disabled = (user.email === session?.email);

  modal.classList.remove('hidden');

  // Submit
  const form = document.getElementById('user-form');
  const newForm = form?.cloneNode(true);
  form?.parentNode?.replaceChild(newForm, form);
  document.getElementById('user-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const newName  = document.getElementById('uf-name')?.value.trim();
    const newPhone = document.getElementById('uf-phone')?.value.trim();
    const newRole  = document.getElementById('uf-role')?.value;
    const newPw    = document.getElementById('uf-password')?.value;

    if (!newName) { Toast.show('Nama tidak boleh kosong.', 'error'); return; }

    const allUsers = Storage.get('rz_users') || [];
    const idx = allUsers.findIndex(u => u.email === email);
    if (idx !== -1) {
      allUsers[idx].name  = newName;
      allUsers[idx].phone = newPhone;
      if (!document.getElementById('uf-role')?.disabled) allUsers[idx].role = newRole;
      if (newPw && newPw.length >= 6) allUsers[idx].password = newPw;
      Storage.set('rz_users', allUsers);

      // Update session if editing self
      if (session?.email === email) {
        Storage.set('rz_session', { ...session, name: newName, phone: newPhone });
      }
    }

    modal.classList.add('hidden');
    Toast.show('Data pengguna berhasil diperbarui.', 'success');
    renderUsersTable();
  });
}

// ============================================================
// Init Admin Page
// ============================================================
export function initAdminPage() {
  requireAdmin();

  // Sidebar nav
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => showSection(btn.dataset.nav));
  });

  // Add product button
  document.getElementById('add-product-btn')?.addEventListener('click', () => openProductModal(null));

  // Close modals
  document.getElementById('close-product-modal')?.addEventListener('click', () => {
    document.getElementById('product-modal')?.classList.add('hidden');
  });
  document.getElementById('close-order-modal')?.addEventListener('click', () => {
    document.getElementById('order-detail-modal')?.classList.add('hidden');
  });
  document.getElementById('product-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('product-modal')) document.getElementById('product-modal').classList.add('hidden');
  });
  document.getElementById('order-detail-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('order-detail-modal')) document.getElementById('order-detail-modal').classList.add('hidden');
  });

  // Mobile sidebar toggle
  document.getElementById('admin-menu-btn')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.toggle('hidden');
  });

  // Default section
  showSection('dashboard');
}

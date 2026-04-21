// RZStore — Profile Module (profile.js)
import { Storage, Session, Toast, formatDate, formatPrice } from './app.js';
import { requireAuth } from './auth.js';

export function initProfilePage() {
  requireAuth();

  const session = Session.get();
  const users   = Storage.get('rz_users') || [];
  const user    = users.find(u => u.email === session.email);
  if (!user) return;

  // ── Populate avatar & header ──────────────────────────────
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.querySelectorAll('.profile-avatar').forEach(el => {
    el.textContent = initials;
  });

  // Load saved avatar photo if exists
  const savedAvatar = localStorage.getItem(`rz_avatar_${user.email}`);
  const avatarImg = document.getElementById('avatar-img');
  const avatarInitials = document.querySelector('.profile-avatar');
  if (savedAvatar && avatarImg) {
    avatarImg.src = savedAvatar;
    avatarImg.classList.remove('hidden');
    if (avatarInitials) avatarInitials.classList.add('hidden');
  } else {
    if (avatarInitials) avatarInitials.textContent = initials;
  }
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('profile-name-display',  user.name);
  setEl('profile-email-display', user.email);
  setEl('profile-role-display',  user.role === 'admin' ? 'Administrator' : 'Customer');
  setEl('profile-joined',        formatDate(user.createdAt));

  // ── Stats ─────────────────────────────────────────────────
  const orders   = (Storage.get('rz_orders') || []).filter(o => o.userEmail === user.email);
  const wishlist = ((Storage.get('rz_wishlist') || {})[user.email] || []).length;
  const spent    = orders.reduce((s, o) => s + (o.total || 0), 0);
  setEl('stat-orders',   orders.length);
  setEl('stat-wishlist', wishlist);
  setEl('stat-spent',    formatPrice(spent));

  // ── Edit Profile Form ─────────────────────────────────────
  const nameInput  = document.getElementById('edit-name');
  const emailInput = document.getElementById('edit-email');
  const phoneInput = document.getElementById('edit-phone');
  const bioInput   = document.getElementById('edit-bio');

  if (nameInput)  nameInput.value  = user.name  || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (bioInput)   bioInput.value   = user.bio   || '';

  document.getElementById('profile-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const newName  = nameInput?.value.trim();
    const newPhone = phoneInput?.value.trim();
    const newBio   = bioInput?.value.trim();

    if (!newName) {
      Toast.show('Nama tidak boleh kosong.', 'error');
      return;
    }

    // Update in rz_users
    const allUsers = Storage.get('rz_users') || [];
    const idx = allUsers.findIndex(u => u.email === user.email);
    if (idx !== -1) {
      allUsers[idx].name  = newName;
      allUsers[idx].phone = newPhone;
      allUsers[idx].bio   = newBio;
      Storage.set('rz_users', allUsers);
    }

    // Update session
    const updatedSession = { ...Session.get(), name: newName, phone: newPhone, bio: newBio };
    Storage.set('rz_session', updatedSession);

    setEl('profile-name-display', newName);
    document.querySelectorAll('.profile-avatar').forEach(el => {
      el.textContent = newName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    });

    Toast.show('Profil berhasil diperbarui!', 'success');
  });

  // ── Change Password Form ──────────────────────────────────
  document.getElementById('password-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const current  = document.getElementById('pw-current')?.value;
    const newPw    = document.getElementById('pw-new')?.value;
    const confirmPw = document.getElementById('pw-confirm')?.value;

    const showErr = (id, msg) => {
      const el = document.getElementById(id);
      if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    };
    const clearErr = id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = ''; el.classList.add('hidden'); }
    };

    ['pw-current-error','pw-new-error','pw-confirm-error'].forEach(clearErr);

    const allUsers = Storage.get('rz_users') || [];
    const u = allUsers.find(u => u.email === session.email);

    if (!u || u.password !== current) {
      showErr('pw-current-error', 'Password saat ini salah.');
      return;
    }
    if (!newPw || newPw.length < 6) {
      showErr('pw-new-error', 'Password baru minimal 6 karakter.');
      return;
    }
    if (newPw !== confirmPw) {
      showErr('pw-confirm-error', 'Konfirmasi password tidak cocok.');
      return;
    }

    const idx = allUsers.findIndex(u => u.email === session.email);
    allUsers[idx].password = newPw;
    Storage.set('rz_users', allUsers);

    document.getElementById('password-form').reset();
    Toast.show('Password berhasil diubah!', 'success');
  });

  // ── Recent Orders ─────────────────────────────────────────
  const recentEl = document.getElementById('recent-orders-list');
  if (recentEl) {
    const recent = [...orders].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    if (recent.length === 0) {
      recentEl.innerHTML = `
        <div class="text-center py-8 text-gray-400 dark:text-slate-500">
          <i class="fas fa-box-open text-3xl mb-2"></i>
          <p class="text-sm">Belum ada pesanan</p>
        </div>`;
    } else {
      const STATUS = {
        pending:    { label: 'Menunggu',   cls: 'bg-amber-100 text-amber-700' },
        processing: { label: 'Diproses',   cls: 'bg-blue-100 text-blue-700' },
        shipped:    { label: 'Dikirim',    cls: 'bg-indigo-100 text-indigo-700' },
        delivered:  { label: 'Diterima',   cls: 'bg-green-100 text-green-700' },
        cancelled:  { label: 'Dibatalkan', cls: 'bg-red-100 text-red-700' }
      };
      recentEl.innerHTML = recent.map(o => {
        const s = STATUS[o.status] || STATUS.pending;
        return `
          <a href="orders.html" class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded-lg transition">
            <div>
              <p class="text-sm font-semibold text-gray-900 font-mono">${o.transactionId}</p>
              <p class="text-xs text-gray-500 mt-0.5">${formatDate(o.date)} · ${o.items.length} item</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold text-indigo-600">${formatPrice(o.total)}</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${s.cls}">${s.label}</span>
            </div>
          </a>`;
      }).join('');
    }
  }

  // ── Tab switching ─────────────────────────────────────────
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-tab]').forEach(b => {
        b.classList.remove('border-indigo-600', 'text-indigo-600');
        b.classList.add('border-transparent', 'text-gray-500');
      });
      btn.classList.add('border-indigo-600', 'text-indigo-600');
      btn.classList.remove('border-transparent', 'text-gray-500');

      document.querySelectorAll('[data-panel]').forEach(p => p.classList.add('hidden'));
      document.querySelector(`[data-panel="${btn.dataset.tab}"]`)?.classList.remove('hidden');
    });
  });
}

// RZStore — Auth Module (auth.js)
import { Storage, Session, Toast, generateId } from './app.js';

// ============================================================
// Auth Guards
// ============================================================
export function requireAuth() {
  if (!Session.get()) {
    window.location.href = 'login.html';
  }
}

export function requireAdmin() {
  const session = Session.get();
  if (!session || session.role !== 'admin') {
    window.location.href = 'index.html';
  }
}

// ============================================================
// Seed Default Users (dipanggil langsung, tidak bergantung fetch)
// ============================================================
function ensureDefaultUsers() {
  const users = Storage.get('rz_users') || [];
  const hasAdmin = users.some(u => u.email === 'admin@rzstore.com');
  const hasDemo  = users.some(u => u.email === 'demo@rzstore.com');

  let changed = false;
  if (!hasAdmin) {
    users.push({
      id: 'user_admin',
      name: 'Admin RZStore',
      email: 'admin@rzstore.com',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString()
    });
    changed = true;
  }
  if (!hasDemo) {
    users.push({
      id: 'user_demo',
      name: 'Demo User',
      email: 'demo@rzstore.com',
      password: '123456',
      role: 'customer',
      createdAt: new Date().toISOString()
    });
    changed = true;
  }
  if (changed) Storage.set('rz_users', users);
}


function validatePassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isEmailTaken(email, users) {
  return users.some(u => u.email.toLowerCase() === email.toLowerCase());
}

function showError(fieldId, message) {
  const el = document.getElementById(fieldId);
  if (el) {
    el.textContent = message;
    el.classList.remove('hidden');
  }
}

function clearError(fieldId) {
  const el = document.getElementById(fieldId);
  if (el) {
    el.textContent = '';
    el.classList.add('hidden');
  }
}

function clearAllErrors(ids) {
  ids.forEach(clearError);
}

// ============================================================
// Login Page Init
// ============================================================
export function initLoginPage() {
  // Pastikan akun default selalu ada sebelum form diinit
  ensureDefaultUsers();
  const loginTab    = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginPanel  = document.getElementById('panel-login');
  const registerPanel = document.getElementById('panel-register');

  function showLogin() {
    loginPanel?.classList.remove('hidden');
    registerPanel?.classList.add('hidden');
    loginTab?.classList.add('border-indigo-600', 'text-indigo-600');
    loginTab?.classList.remove('border-transparent', 'text-gray-500');
    registerTab?.classList.remove('border-indigo-600', 'text-indigo-600');
    registerTab?.classList.add('border-transparent', 'text-gray-500');
  }

  function showRegister() {
    registerPanel?.classList.remove('hidden');
    loginPanel?.classList.add('hidden');
    registerTab?.classList.add('border-indigo-600', 'text-indigo-600');
    registerTab?.classList.remove('border-transparent', 'text-gray-500');
    loginTab?.classList.remove('border-indigo-600', 'text-indigo-600');
    loginTab?.classList.add('border-transparent', 'text-gray-500');
  }

  loginTab?.addEventListener('click', showLogin);
  registerTab?.addEventListener('click', showRegister);

  // Default: show login
  showLogin();

  // ---- Login Form ----
  const loginForm = document.getElementById('login-form');
  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllErrors(['login-email-error', 'login-password-error', 'login-general-error']);

    const email    = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    let valid = true;
    if (!email) { showError('login-email-error', 'Email wajib diisi.'); valid = false; }
    if (!password) { showError('login-password-error', 'Password wajib diisi.'); valid = false; }
    if (!valid) return;

    const users = Storage.get('rz_users') || [];
    const user  = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

    if (!user) {
      showError('login-general-error', `Email atau password salah. (${users.length} akun terdaftar)`);
      return;
    }

    Session.set(user);
    Toast.show(`Selamat datang, ${user.name}!`, 'success');
    setTimeout(() => { window.location.href = 'index.html'; }, 800);
  });

  // ---- Register Form ----
  const registerForm = document.getElementById('register-form');
  registerForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAllErrors(['reg-name-error', 'reg-email-error', 'reg-password-error', 'reg-general-error']);

    const name     = document.getElementById('reg-name')?.value.trim();
    const email    = document.getElementById('reg-email')?.value.trim();
    const password = document.getElementById('reg-password')?.value;

    let valid = true;
    if (!name)    { showError('reg-name-error', 'Nama wajib diisi.'); valid = false; }
    if (!email)   { showError('reg-email-error', 'Email wajib diisi.'); valid = false; }
    else if (!validateEmail(email)) { showError('reg-email-error', 'Format email tidak valid.'); valid = false; }
    if (!password) { showError('reg-password-error', 'Password wajib diisi.'); valid = false; }
    else if (!validatePassword(password)) { showError('reg-password-error', 'Password minimal 6 karakter.'); valid = false; }
    if (!valid) return;

    const users = Storage.get('rz_users') || [];
    if (isEmailTaken(email, users)) {
      showError('reg-email-error', 'Email sudah terdaftar.');
      return;
    }

    const newUser = {
      id: generateId('user'),
      name,
      email,
      password,
      role: 'customer',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    Storage.set('rz_users', users);

    Toast.show('Registrasi berhasil! Silakan login.', 'success');
    registerForm.reset();
    showLogin();
  });
}

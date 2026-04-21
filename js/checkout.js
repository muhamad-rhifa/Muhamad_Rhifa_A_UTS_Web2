// RZStore — Checkout Module (checkout.js)
import { Storage, Session, Toast, formatPrice, generateId } from './app.js';
import { requireAuth } from './auth.js';
import { getCart, getCartTotal, clearCart } from './cart.js';

export function generateTransactionId() {
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return 'TRX' + Date.now() + rand;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}
function clearError(id) {
  const el = document.getElementById(id);
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}

export function initCheckoutPage() {
  requireAuth();

  const cart = getCart();
  if (cart.length === 0) {
    Toast.show('Keranjang kosong. Tambahkan produk terlebih dahulu.', 'warning');
    window.location.href = 'cart.html';
    return;
  }

  // Render order summary
  const summaryItems = document.getElementById('checkout-items');
  const { subtotal, shipping, total } = getCartTotal();

  if (summaryItems) {
    summaryItems.innerHTML = cart.map(item => `
      <div class="flex items-center gap-3 py-2">
        <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
          onerror="this.src='https://placehold.co/48x48/e5e7eb/9ca3af?text=?'" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">${item.name}</p>
          <p class="text-xs text-gray-500 dark:text-slate-400">x${item.quantity}</p>
        </div>
        <span class="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">${formatPrice(item.price * item.quantity)}</span>
      </div>
    `).join('');
  }

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('co-subtotal', formatPrice(subtotal));
  setEl('co-shipping', shipping === 0 ? 'Gratis' : formatPrice(shipping));
  setEl('co-total', formatPrice(total));

  // Form submit
  const form = document.getElementById('checkout-form');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();

    const fields = ['co-name', 'co-address', 'co-city', 'co-postal', 'co-phone'];
    fields.forEach(f => clearError(f + '-error'));

    const name    = document.getElementById('co-name')?.value.trim();
    const address = document.getElementById('co-address')?.value.trim();
    const city    = document.getElementById('co-city')?.value.trim();
    const postal  = document.getElementById('co-postal')?.value.trim();
    const phone   = document.getElementById('co-phone')?.value.trim();

    let valid = true;
    if (!name)    { showError('co-name-error', 'Nama wajib diisi.'); valid = false; }
    if (!address) { showError('co-address-error', 'Alamat wajib diisi.'); valid = false; }
    if (!city)    { showError('co-city-error', 'Kota wajib diisi.'); valid = false; }
    if (!postal)  { showError('co-postal-error', 'Kode pos wajib diisi.'); valid = false; }
    if (!phone)   { showError('co-phone-error', 'No. HP wajib diisi.'); valid = false; }
    if (!valid) return;

    const session = Session.get();
    const transactionId = generateTransactionId();
    const order = {
      transactionId,
      userEmail: session.email,
      date: new Date().toISOString(),
      customer: { name, address, city, postalCode: postal, phone },
      items: getCart(),
      subtotal,
      shipping,
      total,
      status: 'pending'
    };

    const orders = Storage.get('rz_orders') || [];
    orders.push(order);
    Storage.set('rz_orders', orders);
    clearCart();

    Toast.show(`Pesanan berhasil! ID: ${transactionId}`, 'success');
    setTimeout(() => { window.location.href = 'orders.html'; }, 1000);
  });
}

// RZStore — Orders Module (orders.js)
import { Storage, Session, formatPrice, formatDate } from './app.js';
import { requireAuth } from './auth.js';

export function getUserOrders(email) {
  const orders = Storage.get('rz_orders') || [];
  return orders
    .filter(o => o.userEmail === email)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

const STATUS_LABELS = {
  pending:    { label: 'Menunggu',   color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  processing: { label: 'Diproses',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  shipped:    { label: 'Dikirim',    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  delivered:  { label: 'Diterima',   color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelled:  { label: 'Dibatalkan', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
};

export function initOrdersPage() {
  requireAuth();
  const session = Session.get();
  const orders  = getUserOrders(session.email);
  const container = document.getElementById('orders-container');
  const emptyState = document.getElementById('orders-empty');

  if (!container) return;

  if (orders.length === 0) {
    emptyState?.classList.remove('hidden');
    container.classList.add('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  container.classList.remove('hidden');
  container.innerHTML = '';

  orders.forEach(order => {
    const s = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden';
    card.innerHTML = `
      <div class="flex items-center justify-between p-5 cursor-pointer order-header hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="text-sm font-bold text-gray-900 dark:text-white font-mono">${order.transactionId}</span>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${s.color}">${s.label}</span>
          </div>
          <div class="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-slate-400">
            <span><i class="fas fa-calendar mr-1"></i>${formatDate(order.date)}</span>
            <span><i class="fas fa-box mr-1"></i>${order.items.length} item</span>
            <span class="font-semibold text-indigo-600 dark:text-indigo-400">${formatPrice(order.total)}</span>
          </div>
        </div>
        <i class="fas fa-chevron-down text-gray-400 transition-transform order-chevron ml-3 flex-shrink-0"></i>
      </div>
      <div class="order-detail hidden border-t border-gray-100 dark:border-slate-700 p-5">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h4 class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Item Pesanan</h4>
            <div class="space-y-2">
              ${order.items.map(item => `
                <div class="flex items-center gap-3">
                  <img src="${item.image}" alt="${item.name}" class="w-10 h-10 object-cover rounded-lg border border-gray-200 dark:border-slate-600"
                    onerror="this.src='https://placehold.co/40x40/e5e7eb/9ca3af?text=?'" />
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">${item.name}</p>
                    <p class="text-xs text-gray-500 dark:text-slate-400">${formatPrice(item.price)} × ${item.quantity}</p>
                  </div>
                  <span class="text-sm font-semibold text-gray-900 dark:text-white">${formatPrice(item.price * item.quantity)}</span>
                </div>
              `).join('')}
            </div>
            <div class="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700 space-y-1 text-sm">
              <div class="flex justify-between text-gray-500 dark:text-slate-400"><span>Subtotal</span><span>${formatPrice(order.subtotal)}</span></div>
              <div class="flex justify-between text-gray-500 dark:text-slate-400"><span>Ongkir</span><span class="text-green-600">${order.shipping === 0 ? 'Gratis' : formatPrice(order.shipping)}</span></div>
              <div class="flex justify-between font-bold text-gray-900 dark:text-white"><span>Total</span><span class="text-indigo-600 dark:text-indigo-400">${formatPrice(order.total)}</span></div>
            </div>
          </div>
          <div>
            <h4 class="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3">Alamat Pengiriman</h4>
            <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-sm space-y-1">
              <p class="font-semibold text-gray-900 dark:text-white">${order.customer.name}</p>
              <p class="text-gray-600 dark:text-slate-400">${order.customer.address}</p>
              <p class="text-gray-600 dark:text-slate-400">${order.customer.city}, ${order.customer.postalCode}</p>
              <p class="text-gray-600 dark:text-slate-400"><i class="fas fa-phone mr-1"></i>${order.customer.phone}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Toggle detail
    card.querySelector('.order-header').addEventListener('click', () => {
      const detail  = card.querySelector('.order-detail');
      const chevron = card.querySelector('.order-chevron');
      detail.classList.toggle('hidden');
      chevron.classList.toggle('rotate-180');
    });

    container.appendChild(card);
  });
}

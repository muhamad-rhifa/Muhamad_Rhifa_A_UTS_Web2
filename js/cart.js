// RZStore — Cart Module (cart.js)
import { Storage, Session, Toast, formatPrice, updateCartBadge } from './app.js';
import { requireAuth } from './auth.js';
import { getProductById } from './products.js';

const SHIPPING_FEE = 0; // Free shipping

// ============================================================
// Cart Data Access
// ============================================================
export function getCart() {
  const cart = Storage.get('rz_cart') || [];
  // Filter out items whose product no longer exists
  const products = Storage.get('rz_products') || [];
  const validIds = new Set(products.map(p => String(p.id)));
  return cart.filter(item => validIds.has(String(item.productId)));
}

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal() {
  const subtotal = getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  return { subtotal, shipping: SHIPPING_FEE, total: subtotal + SHIPPING_FEE };
}

// ============================================================
// Cart Mutations
// ============================================================
export function addToCart(productId, qty = 1) {
  const product = getProductById(productId);
  if (!product) return;

  const cart = getCart();
  const existing = cart.find(i => String(i.productId) === String(productId));
  if (existing) {
    existing.quantity += qty;
  } else {
    cart.push({
      productId: String(productId),
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: qty
    });
  }
  Storage.set('rz_cart', cart);
  updateCartBadge();
}

export function removeFromCart(productId) {
  const cart = getCart().filter(i => String(i.productId) !== String(productId));
  Storage.set('rz_cart', cart);
  updateCartBadge();
}

export function updateQty(productId, delta) {
  let cart = getCart();
  const item = cart.find(i => String(i.productId) === String(productId));
  if (!item) return;

  if (delta === -1 && item.quantity === 1) {
    cart = cart.filter(i => String(i.productId) !== String(productId));
  } else {
    item.quantity += delta;
  }
  Storage.set('rz_cart', cart);
  updateCartBadge();
}

export function clearCart() {
  Storage.remove('rz_cart');
  updateCartBadge();
}

// ============================================================
// Cart Page
// ============================================================
export function initCartPage() {
  requireAuth();

  const cartContainer = document.getElementById('cart-container');
  const emptyState    = document.getElementById('cart-empty');
  const cartContent   = document.getElementById('cart-content');

  function render() {
    const cart = getCart();
    const { subtotal, shipping, total } = getCartTotal();

    if (cart.length === 0) {
      emptyState?.classList.remove('hidden');
      cartContent?.classList.add('hidden');
      return;
    }

    emptyState?.classList.add('hidden');
    cartContent?.classList.remove('hidden');

    // Render items
    const itemsContainer = document.getElementById('cart-items');
    if (!itemsContainer) return;
    itemsContainer.innerHTML = '';

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-4 py-4 border-b border-gray-100 dark:border-slate-700 last:border-0';
      row.innerHTML = `
        <a href="product.html?id=${item.productId}" class="flex-shrink-0">
          <img src="${item.image}" alt="${item.name}"
            class="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-slate-600"
            onerror="this.src='https://placehold.co/80x80/e5e7eb/9ca3af?text=?'" />
        </a>
        <div class="flex-1 min-w-0">
          <a href="product.html?id=${item.productId}" class="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2">${item.name}</a>
          <p class="text-sm text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">${formatPrice(item.price)}</p>
        </div>
        <div class="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl overflow-hidden flex-shrink-0">
          <button class="qty-btn w-8 h-8 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition font-bold" data-id="${item.productId}" data-delta="-1">−</button>
          <span class="w-8 text-center text-sm font-semibold text-gray-900 dark:text-white">${item.quantity}</span>
          <button class="qty-btn w-8 h-8 flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition font-bold" data-id="${item.productId}" data-delta="1">+</button>
        </div>
        <div class="text-right flex-shrink-0 min-w-[80px]">
          <p class="text-sm font-bold text-gray-900 dark:text-white">${formatPrice(item.price * item.quantity)}</p>
          <button class="remove-btn text-xs text-red-400 hover:text-red-600 mt-1 transition" data-id="${item.productId}">
            <i class="fas fa-trash-alt mr-1"></i>Hapus
          </button>
        </div>
      `;
      itemsContainer.appendChild(row);
    });

    // Wire qty buttons
    itemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        updateQty(btn.dataset.id, parseInt(btn.dataset.delta));
        render();
      });
    });

    // Wire remove buttons
    itemsContainer.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        removeFromCart(btn.dataset.id);
        Toast.show('Item dihapus dari keranjang.', 'info');
        render();
      });
    });

    // Update summary
    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('summary-subtotal', formatPrice(subtotal));
    setEl('summary-shipping', shipping === 0 ? 'Gratis' : formatPrice(shipping));
    setEl('summary-total', formatPrice(total));
    setEl('summary-count', `${cart.length} item`);
  }

  render();
}

// RZStore — Wishlist Module (wishlist.js)
import { Storage, Session, Toast, formatPrice, renderStars } from './app.js';
import { requireAuth } from './auth.js';
import { getProductById } from './products.js';
import { addToCart } from './cart.js';

export function getWishlist(email) {
  const map = Storage.get('rz_wishlist') || {};
  return map[email] || [];
}

export function isWishlisted(email, productId) {
  return getWishlist(email).includes(String(productId));
}

export function toggleWishlist(email, productId) {
  const map = Storage.get('rz_wishlist') || {};
  const list = map[email] || [];
  const id = String(productId);
  const idx = list.indexOf(id);
  if (idx === -1) {
    list.push(id);
    map[email] = list;
    Storage.set('rz_wishlist', map);
    return true; // added
  } else {
    list.splice(idx, 1);
    map[email] = list;
    Storage.set('rz_wishlist', map);
    return false; // removed
  }
}

export function initWishlistPage() {
  requireAuth();
  const session = Session.get();
  const wishlistIds = getWishlist(session.email);
  const grid = document.getElementById('wishlist-grid');
  const emptyState = document.getElementById('wishlist-empty');

  if (!grid) return;

  const products = wishlistIds
    .map(id => getProductById(id))
    .filter(Boolean);

  if (products.length === 0) {
    emptyState?.classList.remove('hidden');
    grid.classList.add('hidden');
    return;
  }

  emptyState?.classList.add('hidden');
  grid.classList.remove('hidden');
  grid.innerHTML = '';

  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col card-hover';
    card.innerHTML = `
      <div class="relative aspect-square overflow-hidden bg-gray-100 dark:bg-slate-700">
        <a href="product.html?id=${product.id}">
          <img src="${product.image}" alt="${product.name}"
            class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onerror="this.src='https://placehold.co/400x400/e5e7eb/9ca3af?text=No+Image'" />
        </a>
        <span class="absolute top-2 right-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-full shadow">${product.category}</span>
      </div>
      <div class="p-3 flex flex-col flex-1">
        <a href="product.html?id=${product.id}" class="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2 mb-1">${product.name}</a>
        <div class="flex items-center gap-1 mb-2">
          <div class="flex text-xs">${renderStars(product.rating)}</div>
          <span class="text-xs text-gray-500 dark:text-slate-400">(${product.rating})</span>
        </div>
        <p class="text-base font-bold text-indigo-600 dark:text-indigo-400 mb-3">${formatPrice(product.price)}</p>
        <div class="mt-auto flex gap-2">
          <button class="add-cart-btn flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition" data-id="${product.id}">
            <i class="fas fa-cart-plus mr-1"></i>Keranjang
          </button>
          <button class="remove-wish-btn w-9 h-9 flex items-center justify-center border border-red-300 dark:border-red-700 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" data-id="${product.id}">
            <i class="fas fa-heart-broken text-sm"></i>
          </button>
        </div>
      </div>
    `;

    card.querySelector('.add-cart-btn').addEventListener('click', () => {
      addToCart(product.id, 1);
      Toast.show(`${product.name} ditambahkan ke keranjang!`, 'success');
    });

    card.querySelector('.remove-wish-btn').addEventListener('click', () => {
      toggleWishlist(session.email, product.id);
      card.remove();
      Toast.show('Dihapus dari wishlist.', 'info');
      if (grid.children.length === 0) {
        emptyState?.classList.remove('hidden');
        grid.classList.add('hidden');
      }
    });

    grid.appendChild(card);
  });
}

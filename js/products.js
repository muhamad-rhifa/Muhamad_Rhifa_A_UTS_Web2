// RZStore — Products Module (products.js)
import { Storage, Session, Toast, formatPrice, renderStars, generateId } from './app.js';
import { addToCart } from './cart.js';
import { toggleWishlist, isWishlisted } from './wishlist.js';

// ============================================================
// Data Access
// ============================================================
export function getAllProducts() {
  return Storage.get('rz_products') || [];
}

export function getProductById(id) {
  return getAllProducts().find(p => String(p.id) === String(id)) || null;
}

export function getProductsByCategory(cat) {
  return getAllProducts().filter(p => p.category === cat);
}

export function getFeaturedProducts(limit = 8) {
  return getAllProducts().filter(p => p.featured).slice(0, limit);
}

export function getCategories() {
  const products = getAllProducts();
  const cats = [...new Set(products.map(p => p.category))];
  return cats.map(cat => ({
    name: cat,
    count: products.filter(p => p.category === cat).length
  }));
}

// ============================================================
// Filter & Sort
// ============================================================
export function filterProducts({ products, search = '', category = '', minPrice = 0, maxPrice = Infinity }) {
  return products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      p.name.toLowerCase().includes(q) ||
      (p.tags || []).some(t => t.toLowerCase().includes(q));
    const matchCat   = !category || p.category === category;
    const matchPrice = p.price >= minPrice && p.price <= maxPrice;
    return matchSearch && matchCat && matchPrice;
  });
}

export function sortProducts(products, sortBy = 'newest') {
  const arr = [...products];
  switch (sortBy) {
    case 'price-asc':  return arr.sort((a, b) => a.price - b.price);
    case 'price-desc': return arr.sort((a, b) => b.price - a.price);
    case 'rating':     return arr.sort((a, b) => b.rating - a.rating);
    case 'newest':
    default:           return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }
}

// ============================================================
// Product Card
// ============================================================
export function renderProductCard(product, options = {}) {
  const { showWishlist = true } = options;
  const session   = Session.get();
  const wishlisted = session ? isWishlisted(session.email, product.id) : false;
  const outOfStock = product.stock === 0;

  const card = document.createElement('div');
  card.className = 'bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md card-hover border border-gray-100 dark:border-slate-700 flex flex-col';
  card.innerHTML = `
    <div class="relative overflow-hidden bg-gray-100 dark:bg-slate-700 aspect-square">
      <a href="product.html?id=${product.id}">
        <img src="${product.image}" alt="${product.name}"
          class="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onerror="this.src='https://placehold.co/400x400/e5e7eb/9ca3af?text=No+Image'" />
      </a>
      ${outOfStock ? '<span class="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">Habis</span>' : ''}
      <span class="absolute top-2 right-2 bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 text-xs font-semibold px-2 py-0.5 rounded-full shadow">${product.category}</span>
      ${showWishlist ? `
      <button class="wishlist-btn absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-slate-700 shadow flex items-center justify-center transition hover:scale-110"
        data-product-id="${product.id}" aria-label="Wishlist">
        <i class="${wishlisted ? 'fas text-red-500' : 'far text-gray-400'} fa-heart text-sm"></i>
      </button>` : ''}
    </div>
    <div class="p-3 flex flex-col flex-1">
      <a href="product.html?id=${product.id}" class="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 line-clamp-2 mb-1 leading-snug">${product.name}</a>
      <div class="flex items-center gap-1 mb-2">
        <div class="flex text-xs">${renderStars(product.rating)}</div>
        <span class="text-xs text-gray-500 dark:text-slate-400">(${product.rating})</span>
      </div>
      <div class="mt-auto flex items-center justify-between gap-2">
        <span class="text-base font-bold text-indigo-600 dark:text-indigo-400">${formatPrice(product.price)}</span>
        <button class="add-to-cart-btn flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500
          ${outOfStock
            ? 'bg-gray-100 dark:bg-slate-700 text-gray-400 cursor-not-allowed'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'}"
          data-product-id="${product.id}" ${outOfStock ? 'disabled' : ''}>
          <i class="fas fa-cart-plus mr-1"></i>Keranjang
        </button>
      </div>
    </div>
  `;

  // Add to cart
  card.querySelector('.add-to-cart-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!Session.get()) { window.location.href = 'login.html'; return; }
    addToCart(product.id, 1);
    Toast.show(`${product.name} ditambahkan ke keranjang!`, 'success');
  });

  // Wishlist toggle
  card.querySelector('.wishlist-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!Session.get()) { window.location.href = 'login.html'; return; }
    const s = Session.get();
    const now = toggleWishlist(s.email, product.id);
    const icon = card.querySelector('.wishlist-btn i');
    if (now) {
      icon.className = 'fas fa-heart text-red-500 text-sm';
      Toast.show('Ditambahkan ke wishlist!', 'success');
    } else {
      icon.className = 'far fa-heart text-gray-400 text-sm';
      Toast.show('Dihapus dari wishlist.', 'info');
    }
  });

  return card;
}

// ============================================================
// Skeleton Cards
// ============================================================
function renderSkeletons(container, count = 8) {
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const sk = document.createElement('div');
    sk.className = 'bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-700';
    sk.innerHTML = `
      <div class="skeleton aspect-square w-full"></div>
      <div class="p-3 space-y-2">
        <div class="skeleton h-4 w-3/4 rounded"></div>
        <div class="skeleton h-3 w-1/2 rounded"></div>
        <div class="skeleton h-8 w-full rounded-lg mt-2"></div>
      </div>`;
    container.appendChild(sk);
  }
}

// ============================================================
// Pagination
// ============================================================
const ITEMS_PER_PAGE = 12;

export function renderPagination(container, { currentPage, totalItems }, onPageChange) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = `<div class="flex items-center justify-center gap-1 flex-wrap">`;

  // Prev
  html += `<button class="px-3 py-1.5 rounded-lg text-sm font-medium border transition
    ${currentPage === 1
      ? 'border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600 cursor-not-allowed'
      : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}"
    data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>
    <i class="fas fa-chevron-left text-xs"></i>
  </button>`;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
      if (i === 3 || i === totalPages - 2) html += `<span class="px-2 text-gray-400">…</span>`;
      continue;
    }
    html += `<button class="w-9 h-9 rounded-lg text-sm font-medium border transition
      ${i === currentPage
        ? 'bg-indigo-600 border-indigo-600 text-white'
        : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}"
      data-page="${i}">${i}</button>`;
  }

  // Next
  html += `<button class="px-3 py-1.5 rounded-lg text-sm font-medium border transition
    ${currentPage === totalPages
      ? 'border-gray-200 dark:border-slate-700 text-gray-300 dark:text-slate-600 cursor-not-allowed'
      : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}"
    data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>
    <i class="fas fa-chevron-right text-xs"></i>
  </button>`;

  html += `</div>`;
  container.innerHTML = html;

  container.querySelectorAll('button[data-page]:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page)));
  });
}

// ============================================================
// Shop Page
// ============================================================
export function initShopPage() {
  const grid       = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-state');
  const pagination = document.getElementById('pagination');
  const searchInput   = document.getElementById('search-input');
  const sortSelect    = document.getElementById('sort-select');
  const categoryRadios = document.querySelectorAll('input[name="category"]');
  const minPriceInput  = document.getElementById('min-price');
  const maxPriceInput  = document.getElementById('max-price');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const resultCount    = document.getElementById('result-count');
  const filterToggleBtn = document.getElementById('filter-toggle');
  const filterSidebar   = document.getElementById('filter-sidebar');

  // Mobile filter toggle
  filterToggleBtn?.addEventListener('click', () => {
    filterSidebar?.classList.toggle('hidden');
  });

  // Pre-apply URL params
  const params = new URLSearchParams(window.location.search);
  const urlCategory = params.get('category') || '';
  const urlSearch   = params.get('search') || '';
  if (urlSearch && searchInput) searchInput.value = urlSearch;
  if (urlCategory) {
    categoryRadios.forEach(r => { if (r.value === urlCategory) r.checked = true; });
  }

  let currentPage = 1;

  function getFilters() {
    const checkedCat = document.querySelector('input[name="category"]:checked');
    return {
      search:   searchInput?.value.trim() || '',
      category: checkedCat?.value || '',
      minPrice: parseFloat(minPriceInput?.value) || 0,
      maxPrice: parseFloat(maxPriceInput?.value) || Infinity
    };
  }

  function render() {
    if (!grid) return;
    renderSkeletons(grid, 8);

    setTimeout(() => {
      const all      = getAllProducts();
      const filters  = getFilters();
      const filtered = filterProducts({ products: all, ...filters });
      const sorted   = sortProducts(filtered, sortSelect?.value || 'newest');
      const total    = sorted.length;
      const start    = (currentPage - 1) * ITEMS_PER_PAGE;
      const page     = sorted.slice(start, start + ITEMS_PER_PAGE);

      if (resultCount) resultCount.textContent = `${total} produk`;

      grid.innerHTML = '';
      if (total === 0) {
        emptyState?.classList.remove('hidden');
        pagination && (pagination.innerHTML = '');
        return;
      }
      emptyState?.classList.add('hidden');

      page.forEach(p => grid.appendChild(renderProductCard(p)));

      if (pagination) renderPagination(pagination, { currentPage, totalItems: total }, (p) => {
        currentPage = p;
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }, 150);
  }

  function resetAndRender() { currentPage = 1; render(); }

  searchInput?.addEventListener('input', resetAndRender);
  sortSelect?.addEventListener('change', resetAndRender);
  categoryRadios.forEach(r => r.addEventListener('change', resetAndRender));
  minPriceInput?.addEventListener('input', resetAndRender);
  maxPriceInput?.addEventListener('input', resetAndRender);

  clearFiltersBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    if (minPriceInput) minPriceInput.value = '';
    if (maxPriceInput) maxPriceInput.value = '';
    categoryRadios.forEach(r => { r.checked = r.value === ''; });
    resetAndRender();
  });

  render();
}

// ============================================================
// Product Detail Page
// ============================================================
export function initProductDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');
  const main   = document.getElementById('product-detail-main');
  const notFound = document.getElementById('product-not-found');

  const product = getProductById(id);
  if (!product) {
    main?.classList.add('hidden');
    notFound?.classList.remove('hidden');
    return;
  }

  // Breadcrumb
  const bc = document.getElementById('breadcrumb-category');
  const bn = document.getElementById('breadcrumb-name');
  if (bc) { bc.textContent = product.category; bc.href = `shop.html?category=${encodeURIComponent(product.category)}`; }
  if (bn) bn.textContent = product.name;

  // Image
  const img = document.getElementById('detail-image');
  if (img) { img.src = product.image; img.alt = product.name; }

  // Info
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setEl('detail-name', product.name);
  setEl('detail-price', formatPrice(product.price));
  setEl('detail-description', product.description);
  setEl('detail-category', product.category);
  setEl('detail-rating-text', `${product.rating} / 5`);

  const starsEl = document.getElementById('detail-stars');
  if (starsEl) starsEl.innerHTML = renderStars(product.rating);

  const stockEl = document.getElementById('detail-stock');
  if (stockEl) {
    if (product.stock === 0) {
      stockEl.innerHTML = '<span class="inline-flex items-center gap-1 text-red-500 font-semibold text-sm"><i class="fas fa-times-circle"></i> Stok Habis</span>';
    } else {
      stockEl.innerHTML = `<span class="inline-flex items-center gap-1 text-green-600 font-semibold text-sm"><i class="fas fa-check-circle"></i> Stok: ${product.stock}</span>`;
    }
  }

  // Tags
  const tagsEl = document.getElementById('detail-tags');
  if (tagsEl && product.tags) {
    tagsEl.innerHTML = product.tags.map(t =>
      `<span class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs rounded-full">#${t}</span>`
    ).join('');
  }

  // Wishlist button
  const session = Session.get();
  const wishBtn = document.getElementById('detail-wishlist-btn');
  if (wishBtn) {
    const updateWishBtn = () => {
      const w = session ? isWishlisted(session.email, product.id) : false;
      wishBtn.innerHTML = w
        ? '<i class="fas fa-heart text-red-500 mr-2"></i>Hapus dari Wishlist'
        : '<i class="far fa-heart mr-2"></i>Tambah ke Wishlist';
      wishBtn.className = `flex items-center gap-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition
        ${w ? 'border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`;
    };
    updateWishBtn();
    wishBtn.addEventListener('click', () => {
      if (!session) { window.location.href = 'login.html'; return; }
      toggleWishlist(session.email, product.id);
      updateWishBtn();
    });
  }

  // Add to cart
  const addBtn = document.getElementById('detail-add-cart-btn');
  const qtyInput = document.getElementById('detail-qty');
  if (addBtn) {
    if (product.stock === 0) {
      addBtn.disabled = true;
      addBtn.className = addBtn.className.replace('bg-indigo-600 hover:bg-indigo-700', 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed');
    } else {
      addBtn.addEventListener('click', () => {
        if (!Session.get()) { window.location.href = 'login.html'; return; }
        const qty = parseInt(qtyInput?.value) || 1;
        addToCart(product.id, qty);
        Toast.show(`${product.name} ditambahkan ke keranjang!`, 'success');
      });
    }
  }

  // Qty controls
  document.getElementById('qty-minus')?.addEventListener('click', () => {
    if (qtyInput && parseInt(qtyInput.value) > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
  });
  document.getElementById('qty-plus')?.addEventListener('click', () => {
    if (qtyInput) qtyInput.value = parseInt(qtyInput.value) + 1;
  });

  // Related products
  const relatedGrid = document.getElementById('related-grid');
  if (relatedGrid) {
    const related = getProductsByCategory(product.category)
      .filter(p => String(p.id) !== String(product.id))
      .slice(0, 4);
    related.forEach(p => relatedGrid.appendChild(renderProductCard(p)));
    if (related.length === 0) {
      document.getElementById('related-section')?.classList.add('hidden');
    }
  }
}

// ============================================================
// Featured Section (index.html)
// ============================================================
export function initFeaturedSection() {
  const grid = document.getElementById('featured-grid');
  if (!grid) return;
  renderSkeletons(grid, 8);
  setTimeout(() => {
    grid.innerHTML = '';
    getFeaturedProducts(8).forEach(p => grid.appendChild(renderProductCard(p)));
  }, 150);
}

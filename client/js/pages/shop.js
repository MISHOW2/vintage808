// js/pages/shop.js
import { getAllProducts, IMAGE_BASE_URL } from '../api/products.js';

// ─── State ────────────────────────────────────────────────────
const state = {
  all:        [],   // all products from API
  filtered:   [],   // after filters applied
  open:       false,
  priceMax:   0,
  maxPrice:   0,
  categories: [],
  badges:     [],
};

const ITEMS_PER_PAGE = 6;
let currentPage = 1;

// ─── Init ─────────────────────────────────────────────────────
export async function init() {
  await loadProducts();
  buildFilterPanel();
  bindFilterButton();
  bindAccountIcon();
}

export default { init };

// ─── Load Products from API ───────────────────────────────────
async function loadProducts() {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  grid.innerHTML = `<p class="products-loading">Loading products…</p>`;

  try {
    const res      = await getAllProducts();
    state.all      = res.data || res;
    state.filtered = [...state.all];

    // Set max price from products
    const prices   = state.all.map(p => p.price || 0);
    state.maxPrice = prices.length ? Math.ceil(Math.max(...prices) / 50) * 50 : 1000;
    state.priceMax = state.maxPrice;

    renderPage();
  } catch (err) {
    grid.innerHTML = `<p class="products-error">Could not load products. Please try again.</p>`;
    console.error(err);
  }
}

// ─── Render current page ──────────────────────────────────────
function renderPage() {
  const grid = document.querySelector('.product-grid');
  if (!grid) return;

  const start    = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = state.filtered.slice(start, start + ITEMS_PER_PAGE);

  if (pageItems.length === 0) {
    grid.innerHTML = `<p class="products-error">No products match your filters.</p>`;
    renderPagination();
    return;
  }

  grid.innerHTML = pageItems.map(product => buildCard(product)).join('');

  // Init sliders on all cards
  grid.querySelectorAll('.product-card').forEach(card => initSlider(card));

  renderPagination();
}

// ─── Build product card HTML ──────────────────────────────────
function buildCard(product) {
  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [null];

  const imagesHTML = images.map(img => {
    const src = img
      ? (img.startsWith('http') ? img : `${IMAGE_BASE_URL}${img}`)
      : '';
    return src
      ? `<img src="${src}" alt="${product.name}" loading="lazy" />`
      : `<div style="width:100%;height:100%;background:var(--sand);display:flex;align-items:center;justify-content:center;">
           <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
         </div>`;
  }).join('');

  const dotsHTML = images.length > 1
    ? `<div class="product-image-dots">
        ${images.map((_, i) => `<button class="product-image-dot${i === 0 ? ' active' : ''}" data-index="${i}"></button>`).join('')}
       </div>`
    : '';

  const arrowsHTML = images.length > 1
    ? `<button class="product-image-prev" aria-label="Previous image">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
       </button>
       <button class="product-image-next" aria-label="Next image">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
       </button>`
    : '';

  const badge = product.isFeatured
    ? `<span class="product-badge">New</span>`
    : '';

  const sizes = Array.isArray(product.sizes) && product.sizes.length > 0
    ? `<div class="size-picker">
        <div>
          <p class="size-picker-label">Select size</p>
          <div class="size-options">
            ${product.sizes.map(s => `<button class="size-option" data-size="${s}">${s}</button>`).join('')}
          </div>
          <p class="size-error"></p>
        </div>
       </div>`
    : '';

  return `
    <div class="product-card" data-id="${product.id ?? product._id}" data-name="${product.name}" data-price="${product.price}">
      <div class="product-image">
        ${badge}
        <div class="product-image-track">${imagesHTML}</div>
        ${arrowsHTML}
        ${dotsHTML}
      </div>
      <div class="product-info">
        <p class="product-name">${product.name}</p>
        <span class="product-price">R${Number(product.price).toFixed(2)}</span>
      </div>
      ${sizes}
      <button class="btn-cart">Add to cart</button>
    </div>
  `;
}

// ─── Image Slider ─────────────────────────────────────────────
function initSlider(card) {
  const track  = card.querySelector('.product-image-track');
  const prev   = card.querySelector('.product-image-prev');
  const next   = card.querySelector('.product-image-next');
  const dots   = card.querySelectorAll('.product-image-dot');

  if (!track || (!prev && !next)) return;

  const total = track.children.length;
  let current = 0;

  function goTo(index) {
    current = (index + total) % total;
    track.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  prev?.addEventListener('click', (e) => {
    e.stopPropagation();
    goTo(current - 1);
  });

  next?.addEventListener('click', (e) => {
    e.stopPropagation();
    goTo(current + 1);
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      goTo(i);
    });
  });

  // Size picker + cart button
  const sizePicker = card.querySelector('.size-picker');
  const sizeOptions = card.querySelectorAll('.size-option');
  const sizeError   = card.querySelector('.size-error');
  const cartBtn     = card.querySelector('.btn-cart');
  let selectedSize  = null;

  sizeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      sizeOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      selectedSize = opt.dataset.size;
      if (sizeError) sizeError.textContent = '';
    });
  });

  cartBtn?.addEventListener('click', () => {
    if (sizePicker && !sizePicker.classList.contains('open')) {
      sizePicker.classList.add('open');
      cartBtn.textContent = 'Confirm';
      return;
    }

    if (sizePicker && !selectedSize) {
      if (sizeError) sizeError.textContent = 'Please select a size';
      return;
    }

    // Add to cart
    const { addToCart } = window.CartModule || {};
    if (addToCart) {
      addToCart({
        id:    card.dataset.id + (selectedSize ? `-${selectedSize}` : ''),
        name:  card.dataset.name,
        price: parseFloat(card.dataset.price),
        size:  selectedSize,
        image: track.querySelector('img')?.src || '',
      });
    }

    // Reset
    if (sizePicker) sizePicker.classList.remove('open');
    cartBtn.textContent = 'Add to cart';
    selectedSize = null;
    sizeOptions.forEach(o => o.classList.remove('selected'));
  });
}

// ─── Pagination ───────────────────────────────────────────────
function renderPagination() {
  const container = document.querySelector('.pagination');
  if (!container) return;

  const totalPages = Math.ceil(state.filtered.length / ITEMS_PER_PAGE);
  if (totalPages <= 1) { container.style.display = 'none'; return; }
  container.style.display = 'flex';

  container.innerHTML = `
    <button class="page-btn" id="pg-prev" aria-label="Previous">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    ${Array.from({ length: totalPages }, (_, i) => `
      <button class="page-btn${i + 1 === currentPage ? ' active' : ''}" data-page="${i + 1}">${i + 1}</button>
    `).join('')}
    <button class="page-btn" id="pg-next" aria-label="Next">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
  `;

  container.querySelector('#pg-prev')?.addEventListener('click', () => {
    if (currentPage > 1) { currentPage--; renderPage(); scrollToProducts(); }
  });

  container.querySelector('#pg-next')?.addEventListener('click', () => {
    if (currentPage < totalPages) { currentPage++; renderPage(); scrollToProducts(); }
  });

  container.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderPage();
      scrollToProducts();
    });
  });
}

function scrollToProducts() {
  document.querySelector('.products-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Filters ──────────────────────────────────────────────────
function applyFilters() {
  state.filtered = state.all.filter(product => {
    const price    = product.price || 0;
    const category = (product.category || '').toLowerCase();
    const name     = (product.name || '').toLowerCase();

    const passPrice = price <= state.priceMax;

    const passBadge = state.badges.length === 0 ||
      (state.badges.includes('new') && product.isFeatured);

    const passCat = state.categories.length === 0 ||
      state.categories.some(c => category.includes(c) || name.includes(c));

    return passPrice && passBadge && passCat;
  });

  currentPage = 1;
  renderPage();
  updateActiveCount();
}

function updateActiveCount() {
  const btn = document.querySelector('.filter-btn');
  if (!btn) return;

  let count = 0;
  if (state.priceMax < state.maxPrice) count++;
  count += state.categories.length;
  count += state.badges.length;

  let badge = btn.querySelector('.filter-count');
  if (count > 0) {
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'filter-count';
      btn.appendChild(badge);
    }
    badge.textContent = count;
  } else {
    badge?.remove();
  }
}

function resetFilters() {
  state.priceMax    = state.maxPrice;
  state.categories  = [];
  state.badges      = [];

  const slider  = document.getElementById('price-range');
  const priceVal = document.getElementById('price-value');
  if (slider)   slider.value = state.maxPrice;
  if (priceVal) priceVal.textContent = `R${state.maxPrice}`;

  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  applyFilters();
}

// ─── Filter Panel ─────────────────────────────────────────────
function buildFilterPanel() {
  if (document.getElementById('filter-panel')) return;

  const overlay = document.createElement('div');
  overlay.id = 'filter-overlay';
  overlay.addEventListener('click', closePanel);
  document.body.appendChild(overlay);

  const panel = document.createElement('div');
  panel.id = 'filter-panel';
  panel.innerHTML = `
    <div class="fp-header">
      <span class="fp-title">Filters</span>
      <div class="fp-header-right">
        <button class="fp-reset" id="fp-reset">Clear all</button>
        <button class="fp-close" id="fp-close" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="fp-body">
      <div class="fp-section">
        <p class="fp-section-label">Price range</p>
        <div class="fp-price-row">
          <span>R0</span>
          <span class="fp-price-cur" id="price-value">R${state.maxPrice}</span>
        </div>
        <input type="range" id="price-range" class="fp-range" min="0" max="${state.maxPrice}" step="50" value="${state.maxPrice}" />
      </div>

      <div class="fp-section">
        <p class="fp-section-label">Tag</p>
        <div class="fp-chips">
          <button class="filter-chip" data-type="badge" data-value="new">New</button>
        </div>
      </div>

      <div class="fp-section">
        <p class="fp-section-label">Category</p>
        <div class="fp-chips">
          <button class="filter-chip" data-type="cat" data-value="shirt">Shirts</button>
          <button class="filter-chip" data-type="cat" data-value="short">Shorts</button>
          <button class="filter-chip" data-type="cat" data-value="hat">Hats</button>
        </div>
      </div>
    </div>

    <div class="fp-footer">
      <button class="fp-apply" id="fp-apply">Show results</button>
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('fp-close').addEventListener('click', closePanel);
  document.getElementById('fp-reset').addEventListener('click', resetFilters);
  document.getElementById('fp-apply').addEventListener('click', closePanel);

  document.getElementById('price-range').addEventListener('input', e => {
    state.priceMax = parseInt(e.target.value);
    document.getElementById('price-value').textContent = `R${state.priceMax}`;
    applyFilters();
  });

  panel.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const type  = chip.dataset.type;
      const value = chip.dataset.value;

      if (type === 'badge') {
        state.badges = state.badges.includes(value)
          ? state.badges.filter(v => v !== value)
          : [...state.badges, value];
      } else if (type === 'cat') {
        state.categories = state.categories.includes(value)
          ? state.categories.filter(v => v !== value)
          : [...state.categories, value];
      }
      applyFilters();
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
  });
}

function openPanel()  {
  state.open = true;
  document.getElementById('filter-panel')?.classList.add('open');
  document.getElementById('filter-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closePanel() {
  state.open = false;
  document.getElementById('filter-panel')?.classList.remove('open');
  document.getElementById('filter-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

function bindFilterButton() {
  document.querySelector('.filter-btn')?.addEventListener('click', () => {
    state.open ? closePanel() : openPanel();
  });
}

// ─── Nav account icon ─────────────────────────────────────────
function bindAccountIcon() {
  const token = localStorage.getItem('v808_token');
  document.querySelectorAll('[aria-label="Account"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      window.location.href = token ? './account.html' : './login.html';
    });
  });
}
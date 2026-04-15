/**
 * shop.js — Filter panel functionality
 * Open/close panel, price range slider, category + badge filters.
 * Works on the existing .product-card markup.
 */

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  open: false,
  maxPrice: 1000,
  priceMax: 1000,
  categories: [],       // active category filters
  badges: [],           // active badge filters (e.g. 'new', 'sale')
};

// ─── Gather all cards once ────────────────────────────────────────────────────

function getCards() {
  return [...document.querySelectorAll('.product-card')];
}

// ─── Apply filters ────────────────────────────────────────────────────────────

function applyFilters() {
  const cards = getCards();
  let visible = 0;

  cards.forEach(card => {
    const priceText = card.querySelector('.product-price')?.textContent || 'R0';
    const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;

    const badgeEl  = card.querySelector('.product-badge');
    const badgeVal = badgeEl ? badgeEl.textContent.trim().toLowerCase() : '';

    const catEl  = card.querySelector('.product-name');
    const catText = catEl ? catEl.textContent.toLowerCase() : '';

    // Price check
    const passPrice = price <= state.priceMax;

    // Badge check (if any selected)
    const passBadge = state.badges.length === 0 || state.badges.includes(badgeVal);

    // Category check (if any selected)
    const passCat = state.categories.length === 0 ||
      state.categories.some(c => catText.includes(c.toLowerCase()));

    const show = passPrice && passBadge && passCat;
    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  // Show empty state if nothing matches
  let empty = document.getElementById('filter-empty');
  if (!empty) {
    empty = document.createElement('p');
    empty.id = 'filter-empty';
    empty.textContent = 'No products match your filters.';
    empty.style.cssText = 'grid-column:1/-1;text-align:center;padding:2rem;color:#999;font-size:0.88rem;';
    document.querySelector('.product-grid')?.appendChild(empty);
  }
  empty.style.display = visible === 0 ? 'block' : 'none';

  updateActiveCount();
}

// ─── Active filter badge on button ───────────────────────────────────────────

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

// ─── Reset filters ────────────────────────────────────────────────────────────

function resetFilters() {
  state.priceMax    = state.maxPrice;
  state.categories  = [];
  state.badges      = [];

  // Reset UI
  const slider = document.getElementById('price-range');
  const priceVal = document.getElementById('price-value');
  if (slider)   slider.value = state.maxPrice;
  if (priceVal) priceVal.textContent = `R${state.maxPrice}`;

  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

  applyFilters();
}

// ─── Open / Close panel ───────────────────────────────────────────────────────

function openPanel() {
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

// ─── Build panel HTML ─────────────────────────────────────────────────────────

function buildPanel() {
  if (document.getElementById('filter-panel')) return;

  // Detect max price from cards
  const prices = getCards().map(card => {
    const t = card.querySelector('.product-price')?.textContent || 'R0';
    return parseFloat(t.replace(/[^0-9.]/g, '')) || 0;
  });
  const maxFromProducts = prices.length ? Math.ceil(Math.max(...prices) / 50) * 50 : 1000;
  state.maxPrice  = maxFromProducts;
  state.priceMax  = maxFromProducts;

  // Detect unique badges
  const badgeSet = new Set();
  getCards().forEach(card => {
    const b = card.querySelector('.product-badge');
    if (b) badgeSet.add(b.textContent.trim());
  });
  const badges = [...badgeSet];

  // Build overlay
  const overlay = document.createElement('div');
  overlay.id = 'filter-overlay';
  overlay.addEventListener('click', closePanel);
  document.body.appendChild(overlay);

  // Build panel
  const panel = document.createElement('div');
  panel.id = 'filter-panel';
  panel.innerHTML = `
    <div class="fp-header">
      <span class="fp-title">Filters</span>
      <div class="fp-header-right">
        <button class="fp-reset" id="fp-reset">Clear all</button>
        <button class="fp-close" id="fp-close" aria-label="Close filters">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="fp-body">

      <!-- Price range -->
      <div class="fp-section">
        <p class="fp-section-label">Price range</p>
        <div class="fp-price-row">
          <span class="fp-price-min">R0</span>
          <span class="fp-price-cur" id="price-value">R${maxFromProducts}</span>
        </div>
        <input
          type="range"
          id="price-range"
          class="fp-range"
          min="0"
          max="${maxFromProducts}"
          step="50"
          value="${maxFromProducts}"
        />
      </div>

      ${badges.length > 0 ? `
      <!-- Badge / tag -->
      <div class="fp-section">
        <p class="fp-section-label">Tag</p>
        <div class="fp-chips">
          ${badges.map(b => `
            <button class="filter-chip" data-type="badge" data-value="${b.toLowerCase()}">${b}</button>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- Category (static for now — extend as needed) -->
      <div class="fp-section">
        <p class="fp-section-label">Category</p>
        <div class="fp-chips">
          <button class="filter-chip" data-type="cat" data-value="board shorts">Board Shorts</button>
          <button class="filter-chip" data-type="cat" data-value="tee">T-Shirts</button>
          <button class="filter-chip" data-type="cat" data-value="hat">Hats</button>
          <button class="filter-chip" data-type="cat" data-value="shorts">Shorts</button>
        </div>
      </div>

    </div>

    <div class="fp-footer">
      <button class="fp-apply" id="fp-apply">Show results</button>
    </div>
  `;

  document.body.appendChild(panel);
  injectStyles();

  // Events
  document.getElementById('fp-close').addEventListener('click', closePanel);
  document.getElementById('fp-reset').addEventListener('click', resetFilters);
  document.getElementById('fp-apply').addEventListener('click', closePanel);

  // Price slider — live update
  document.getElementById('price-range').addEventListener('input', e => {
    state.priceMax = parseInt(e.target.value);
    document.getElementById('price-value').textContent = `R${state.priceMax}`;
    applyFilters();
  });

  // Chip toggles
  panel.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const type  = chip.dataset.type;
      const value = chip.dataset.value;

      if (type === 'badge') {
        if (state.badges.includes(value)) {
          state.badges = state.badges.filter(v => v !== value);
        } else {
          state.badges.push(value);
        }
      } else if (type === 'cat') {
        if (state.categories.includes(value)) {
          state.categories = state.categories.filter(v => v !== value);
        } else {
          state.categories.push(value);
        }
      }
      applyFilters();
    });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closePanel();
  });
}

// ─── Wire filter button ───────────────────────────────────────────────────────

function bindFilterButton() {
  document.querySelector('.filter-btn')?.addEventListener('click', () => {
    if (state.open) closePanel(); else openPanel();
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function init() {
  buildPanel();
  bindFilterButton();
}

export default { init };

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #filter-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.35);
      z-index: 800;
    }
    #filter-overlay.open { display: block; }

    #filter-panel {
      position: fixed;
      top: 0; left: 0;
      height: 100%;
      width: 320px;
      max-width: 88vw;
      background: #fff;
      z-index: 801;
      display: flex;
      flex-direction: column;
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    }
    #filter-panel.open { transform: translateX(0); }

    .fp-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #e8e8e8;
    }
    .fp-title {
      font-family: 'Archivo Black', sans-serif;
      font-size: 0.95rem;
      letter-spacing: -0.01em;
    }
    .fp-header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .fp-reset {
      background: none;
      border: none;
      font-size: 0.75rem;
      color: #999;
      cursor: pointer;
      padding: 0;
      transition: color 0.15s;
    }
    .fp-reset:hover { color: #111; }
    .fp-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #111;
      opacity: 0.45;
      display: flex;
      align-items: center;
      transition: opacity 0.15s;
    }
    .fp-close:hover { opacity: 1; }

    .fp-body {
      flex: 1;
      overflow-y: auto;
      padding: 1.25rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .fp-section-label {
      font-size: 0.72rem;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #999;
      margin: 0 0 0.75rem;
    }

    .fp-price-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.82rem;
      color: #111;
      margin-bottom: 8px;
    }
    .fp-price-cur { font-family: 'Space Mono', monospace; }

    .fp-range {
      -webkit-appearance: none;
      width: 100%;
      height: 3px;
      background: #e0e0e0;
      border-radius: 2px;
      outline: none;
      cursor: pointer;
    }
    .fp-range::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #111;
      cursor: pointer;
    }
    .fp-range::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #111;
      border: none;
      cursor: pointer;
    }

    .fp-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .filter-chip {
      padding: 6px 14px;
      font-size: 0.78rem;
      border: 1px solid #ddd;
      border-radius: 2px;
      background: none;
      color: #444;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .filter-chip:hover { border-color: #aaa; color: #111; }
    .filter-chip.active {
      background: #111;
      border-color: #111;
      color: #fff;
    }

    .fp-footer {
      padding: 1rem 1.5rem 1.5rem;
      border-top: 1px solid #e8e8e8;
    }
    .fp-apply {
      display: block;
      width: 100%;
      padding: 13px;
      background: #111;
      color: #fff;
      font-family: 'Archivo Black', sans-serif;
      font-size: 0.8rem;
      letter-spacing: 0.05em;
      border: none;
      border-radius: 2px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .fp-apply:hover { background: #333; }

    /* Active count badge on the filter button */
    .filter-btn { position: relative; }
    .filter-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      background: #111;
      color: #fff;
      font-size: 10px;
      border-radius: 50%;
      margin-left: 6px;
      font-family: 'Archivo', sans-serif;
    }
  `;
  document.head.appendChild(style);
}
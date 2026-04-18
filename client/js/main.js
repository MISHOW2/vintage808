// js/main.js
import { init as initCart } from './components/cart.js';
import { nav } from './components/nav.js';
import { renderFeaturedProducts } from './pages/home.js';
import shop from './pages/shop.js';
shop.init();
document.addEventListener('DOMContentLoaded', () => {

  // ── Cart ──────────────────────────────────────────────────
  initCart();

  // ── Nav burger ───────────────────────────────────────────
  nav();

  // ── Account button → login or account ────────────────────
  document.querySelectorAll('[aria-label="Account"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const token = localStorage.getItem('v808_token');
      window.location.href = token ? './account.html' : './login.html';
    });
  });

  // ── Drawer account button (mobile) ───────────────────────
  document.querySelectorAll('.nav-drawer-icon-btn[aria-label="Account"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const token = localStorage.getItem('v808_token');
      window.location.href = token ? './account.html' : './login.html';
    });
  });

  // ── Featured products (home page only) ───────────────────
  if (document.querySelector('.product-grid')) {
    renderFeaturedProducts();
  }

  // ── Shop filter (shop page only) ─────────────────────────
  if (document.querySelector('.filter-btn')) {
    import('./pages/shop.js').then(m => m.default.init());
  }

});
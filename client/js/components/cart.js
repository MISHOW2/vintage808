

// ─── Open / Close ─────────────────────────────────────────────────────────────

export function openDrawer() {
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeDrawer() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Build & inject drawer HTML ───────────────────────────────────────────────

function buildDrawer() {
  if (document.getElementById('cart-drawer')) return;

  const overlay = document.createElement('div');
  overlay.id = 'cart-overlay';
  overlay.addEventListener('click', closeDrawer);

  const drawer = document.createElement('aside');
  drawer.id = 'cart-drawer';
  drawer.innerHTML = `
    <div class="cart-drawer-header">
      <h2 class="cart-drawer-title">Your cart</h2>
      <button id="cart-drawer-close" aria-label="Close cart">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="cart-drawer-body" id="cart-drawer-body">
      <div class="cart-empty">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <p>Your cart is empty</p>
      </div>
    </div>
    <div class="cart-drawer-footer" id="cart-drawer-footer" style="display:none;">
      <div class="cart-subtotal">
        <span>Subtotal</span>
        <span id="cart-total">R0.00</span>
      </div>
      <p class="cart-shipping-note">Shipping calculated at checkout</p>
      <a href="./checkout.html" class="btn-checkout">Checkout</a>
    </div>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  drawer.querySelector('#cart-drawer-close').addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

  injectStyles();
}

// ─── Wire up nav cart icons ───────────────────────────────────────────────────

function bindCartIcons() {
  document.querySelectorAll('[aria-label="Cart"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      openDrawer();
    });
  });
}

// ─── Wire up Add to cart buttons ─────────────────────────────────────────────

function bindAddToCartButtons() {
  document.querySelectorAll('.btn-cart').forEach((btn, index) => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.product-card');
      if (!card) return;

      const name  = card.querySelector('.product-name')?.textContent.trim() || 'Product';
      const priceStr = card.querySelector('.product-price')?.textContent.trim() || 'R0.00';
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      const image = card.querySelector('.product-image img')?.src || '';
      const id    = image.split('/').pop().split('.')[0] || `item-${index}`;

      addToCart({ id, name, price, image });
    });
  });
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export function init() {
  buildDrawer();
  bindCartIcons();
  bindAddToCartButtons();
}

export default { init, openDrawer, closeDrawer };

// ─── Styles ───────────────────────────────────────────────────────────────────

function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
   
  `;
  document.head.appendChild(style);
}
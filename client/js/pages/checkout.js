// js/pages/checkout.js
import { getCart, getCartTotal, clearCart } from '../components/cart.js';

const API      = 'https://vintage808-api.vercel.app/api';
const SHIPPING = 80;

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('v808_token');
if (!token) {
  sessionStorage.setItem('v808_return', '/checkout');
  window.location.href = '/login';
}

// ── Handle PayFast cancel return ─────────────────────────────
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('status') === 'cancelled' && urlParams.get('restore') === '1') {
  // Restore cart from sessionStorage if user cancelled payment
  const pending = JSON.parse(sessionStorage.getItem('v808_pending_order') || 'null');
  if (pending?.items) {
    localStorage.setItem('v808_cart', JSON.stringify(pending.items));
  }
  // Show a gentle message
  const banner = document.createElement('div');
  banner.style.cssText = 'background:#1a1a1a;color:#fff;text-align:center;padding:12px;font-size:13px;';
  banner.textContent = 'Payment was cancelled. Your cart has been restored.';
  document.body.prepend(banner);
  setTimeout(() => banner.remove(), 5000);
}

// ── Elements ──────────────────────────────────────────────────
const summaryItems    = document.getElementById('summary-items');
const summaryEmpty    = document.getElementById('summary-empty');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryTotal    = document.getElementById('summary-total');
const errorBox        = document.getElementById('checkout-error');
const errorMsg        = document.getElementById('checkout-error-msg');
const payBtn          = document.getElementById('pay-btn');
const payBtnText      = document.getElementById('pay-btn-text');
const payBtnLoader    = document.getElementById('pay-btn-loader');

// ── Render summary ────────────────────────────────────────────
function renderSummary() {
  const cart     = getCart();
  const subtotal = getCartTotal();

  if (cart.length === 0) {
    summaryItems.style.display = 'none';
    summaryEmpty.style.display = 'block';
  } else {
    summaryItems.innerHTML = cart.map(item => `
      <div class="summary-item">
        <img class="summary-item-img" src="${item.image}" alt="${item.name}"
             onerror="this.style.display='none'" />
        <div class="summary-item-info">
          <p class="summary-item-name">${item.name}</p>
          <p class="summary-item-meta">Size: ${item.size ?? '—'} · Qty: ${item.qty}</p>
        </div>
        <span class="summary-item-price">R${(item.price * item.qty).toFixed(2)}</span>
      </div>
    `).join('');
  }

  summarySubtotal.textContent = `R${subtotal.toFixed(2)}`;
  summaryTotal.textContent    = `R${(subtotal + SHIPPING).toFixed(2)}`;
}

renderSummary();

// ── Helpers ───────────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.style.display = 'flex';
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function hideError() { errorBox.style.display = 'none'; }
function setLoading(on) {
  payBtn.disabled            = on;
  payBtnText.style.display   = on ? 'none'        : 'inline';
  payBtnLoader.style.display = on ? 'inline-flex' : 'none';
}

// ── Pay button ────────────────────────────────────────────────
payBtn.addEventListener('click', async () => {
  hideError();

  const fullName = document.getElementById('full-name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const street   = document.getElementById('street').value.trim();
  const city     = document.getElementById('city').value.trim();
  const province = document.getElementById('province').value;
  const postal   = document.getElementById('postal').value.trim();

  if (!fullName || !email || !phone || !street || !city || !province || !postal) {
    showError('Please fill in all fields before continuing.');
    return;
  }

  const cart = getCart();
  if (cart.length === 0) { showError('Your cart is empty.'); return; }

  const subtotal = getCartTotal();
  const total    = subtotal + SHIPPING;

  const [first_name, ...rest] = fullName.split(' ');
  const last_name = rest.join(' ') || '-';

  // Save order to sessionStorage so confirmation page can read it
  sessionStorage.setItem('v808_pending_order', JSON.stringify({
    customerName   : fullName,
    customerEmail  : email,
    items          : cart,
    total,
    shippingAddress: { street, city, province, postal, phone },
    createdAt      : new Date().toISOString(),
  }));

  setLoading(true);
  clearCart();

  // POST a form to YOUR backend /api/payfast/pay
  // The backend signs it and auto-redirects to PayFast sandbox
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `${API}/payfast/pay`;

  const fields = {
    first_name,
    last_name,
    email,
    cell_number : phone,
    amount      : total.toFixed(2),
    item_name   : 'Vintage808 Order',
  };

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit(); // → hits your backend → auto-redirects to PayFast
});
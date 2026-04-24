import { getCart, getCartTotal, clearCart } from '../components/cart.js';

const API      = 'https://vintage808-api.vercel.app/api';
const SHIPPING = 80;

const token = localStorage.getItem('v808_token');
if (!token) {
  sessionStorage.setItem('v808_return', '/checkout');
  window.location.href = '/login';
}

const summaryItems    = document.getElementById('summary-items');
const summaryEmpty    = document.getElementById('summary-empty');
const summarySubtotal = document.getElementById('summary-subtotal');
const summaryTotal    = document.getElementById('summary-total');
const errorBox        = document.getElementById('checkout-error');
const errorMsg        = document.getElementById('checkout-error-msg');
const payBtn          = document.getElementById('pay-btn');
const payBtnText      = document.getElementById('pay-btn-text');
const payBtnLoader    = document.getElementById('pay-btn-loader');

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

  // Split full name for PayFast
  const nameParts   = fullName.split(' ');
  const first_name  = nameParts[0];
  const last_name   = nameParts.slice(1).join(' ') || '-';

  // Save order details for confirmation page BEFORE leaving
sessionStorage.setItem('v808_pending_order', JSON.stringify({
  customerName: fullName,
  customerEmail: email,
  items: cart,
  total,
  shippingAddress: { street, city, province, postal, phone },
  createdAt: new Date().toISOString(),
}));

  setLoading(true);

  try {
    // ── Call your backend /pay route directly ─────────────────
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${API}/payfast/pay`; // ← matches your backend route

    const fields = {
      first_name,
      last_name,
      email,
      cell_number: phone,
      amount:      total.toFixed(2),
      item_name:   'Vintage808 Order',
    };

    Object.entries(fields).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type  = 'hidden';
      input.name  = key;
      input.value = value;
      form.appendChild(input);
    });

    clearCart();
    document.body.appendChild(form);
    form.submit(); // ← backend signs it and redirects to PayFast

  } catch (err) {
    console.error(err);
    showError('Could not connect to server. Please try again.');
    setLoading(false);
  }
});
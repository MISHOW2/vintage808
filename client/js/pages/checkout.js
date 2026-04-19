import { getCart, getCartTotal, clearCart } from '../components/cart.js';

const API = 'https://vintage808-api.vercel.app/api';
const SHIPPING = 80;

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('v808_token');
if (!token) {
  sessionStorage.setItem('v808_return', './checkout.html');
  window.location.href = './login.html';
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
const cart = getCart();
const subtotal = getCartTotal();
const total = subtotal + SHIPPING;
  if (cart.length === 0) {
    summaryItems.style.display = 'none';
    summaryEmpty.style.display = 'block';
  } else {
    summaryItems.innerHTML = cart.map(item => `
      <div class="summary-item">
        <img class="summary-item-img" src="${item.image}" alt="${item.name}" onerror="this.style.display='none'" />
        <div class="summary-item-info">
          <p class="summary-item-name">${item.name}</p>
          <p class="summary-item-meta">Size: ${item.size ?? '—'} &nbsp;·&nbsp; Qty: ${item.qty}</p>
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

function hideError() {
  errorBox.style.display = 'none';
}

function setLoading(loading) {
  payBtn.disabled            = loading;
  payBtnText.style.display   = loading ? 'none' : 'inline';
  payBtnLoader.style.display = loading ? 'inline-flex' : 'none';
}

payBtn.addEventListener('click', async () => {
  hideError();

  const name     = document.getElementById('full-name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const street   = document.getElementById('street').value.trim();
  const city     = document.getElementById('city').value.trim();
  const province = document.getElementById('province').value;
  const postal   = document.getElementById('postal').value.trim();

  if (!name || !email || !phone || !street || !city || !province || !postal) {
    showError('Please fill in all fields before continuing.');
    return;
  }

  const cart = getCart();

  if (cart.length === 0) {
    showError('Your cart is empty.');
    return;
  }

  // 
  const subtotal = getCartTotal();
  const total = subtotal + SHIPPING;

  setLoading(true);

  try {
    const res = await fetch(`${API}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        items: cart,
        total,
        shippingAddress: {
          street,
          city,
          province,
          postal,
          phone
        },
        customerName: name,
        customerEmail: email,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message || 'Something went wrong. Please try again.');
      return;
    }

    clearCart();
    sessionStorage.setItem('v808_last_order', JSON.stringify(data.data));
    window.location.href = './order-confirmation.html';

  } catch (err) {
    showError('Could not connect to server. Please try again.');
  } finally {
    setLoading(false);
  }
});
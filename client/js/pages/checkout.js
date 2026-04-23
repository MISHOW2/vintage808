// js/pages/checkout.js  (replaces your existing checkout page script)
// ─────────────────────────────────────────────────────────────
import { getCart, getCartTotal, clearCart } from '../components/cart.js';

const API      = 'https://vintage808-api.vercel.app/api';
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

// ── Render order summary ──────────────────────────────────────
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

function hideError() { errorBox.style.display = 'none'; }

function setLoading(on) {
  payBtn.disabled             = on;
  payBtnText.style.display    = on ? 'none'        : 'inline';
  payBtnLoader.style.display  = on ? 'inline-flex' : 'none';
}

// ── Redirect to PayFast via auto-submit hidden form ───────────
function redirectToPayFast(payfastUrl, fields) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payfastUrl;

  Object.entries(fields).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type  = 'hidden';
    input.name  = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();   // ← user is taken to PayFast sandbox payment page
}

// ── Place Order & Pay ─────────────────────────────────────────
payBtn.addEventListener('click', async () => {
  hideError();

  // Collect form values
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

  const subtotal = getCartTotal();
  const total    = subtotal + SHIPPING;

  setLoading(true);

  try {
    // ── Step 1: Create the order in your DB ───────────────────
    const orderRes = await fetch(`${API}/orders`, {
      method  : 'POST',
      headers : {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        customerName  : name,
        customerEmail : email,
        items         : cart,
        total,
        shippingAddress: { street, city, province, postal, phone },
      }),
    });

    const orderData = await orderRes.json();

    if (!orderRes.ok) {
      showError(orderData.message || 'Could not create order. Please try again.');
      return;
    }

    const orderId = orderData.data?._id || orderData.data?.id || Date.now();

    // Store for confirmation page (shown after PayFast return)
    sessionStorage.setItem('v808_last_order', JSON.stringify(orderData.data));

    // ── Step 2: Get PayFast payment fields from your backend ──
    const pfRes = await fetch(`${API}/payfast/initiate`, {
      method  : 'POST',
      headers : {
        'Content-Type' : 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        customerName  : name,
        customerEmail : email,
        amount        : total.toFixed(2),
        orderId,
      }),
    });

    const pfData = await pfRes.json();

    if (!pfRes.ok || !pfData.success) {
      showError(pfData.message || 'Payment initiation failed. Please try again.');
      return;
    }

    // ── Step 3: Clear cart then send user to PayFast ──────────
    clearCart();
    redirectToPayFast(pfData.payfast_url, pfData.fields);

  } catch (err) {
    console.error(err);
    showError('Could not connect to server. Please try again.');
  } finally {
    setLoading(false);
  }
});
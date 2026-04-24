// js/pages/order-confirmation.js

// ── Check URL params from PayFast return ──────────────────────
const params  = new URLSearchParams(window.location.search);
const status  = params.get('status');

// If payment was cancelled, go back to checkout
if (status === 'cancelled') {
  window.location.href = '/checkout';
}

// ── Read order from sessionStorage ───────────────────────────
const order = JSON.parse(sessionStorage.getItem('v808_pending_order') || 'null');

if (!order) {
  window.location.href = '/shop';
}

// ── Populate order details ────────────────────────────────────
document.getElementById('confirm-order-id').textContent =
  `#${(order._id || order.id || Date.now()).toString().slice(-6).toUpperCase()}`;

document.getElementById('confirm-date').textContent =
  new Date(order.createdAt).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

document.getElementById('confirm-total').textContent =
  `R${Number(order.total || 0).toFixed(2)}`;

// ── Shipping address ──────────────────────────────────────────
const a = order.shippingAddress;
if (a) {
  document.getElementById('confirm-address').innerHTML =
    `${a.street}<br/>${a.city}, ${a.province}<br/>${a.postal}`;
} else {
  document.getElementById('confirm-address').textContent = '—';
}

// ── Order items ───────────────────────────────────────────────
const itemsEl = document.getElementById('confirm-items');

itemsEl.innerHTML = order.items.map(item => `
  <div class="confirm-item">
    <img
      class="confirm-item-img"
      src="${item.image ?? ''}"
      alt="${item.name}"
      onerror="this.style.display='none'"
    />
    <div class="confirm-item-info">
      <p class="confirm-item-name">${item.name}</p>
      <p class="confirm-item-meta">Size: ${item.size ?? '—'} &nbsp;·&nbsp; Qty: ${item.quantity ?? item.qty ?? 1}</p>
    </div>
    <span class="confirm-item-price">R${(Number(item.price) * (item.quantity ?? item.qty ?? 1)).toFixed(2)}</span>
  </div>
`).join('');

// ── Clear session after rendering ─────────────────────────────
window.addEventListener('pagehide', () => {
  sessionStorage.removeItem('v808_pending_order');
});
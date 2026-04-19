// js/pages/order-confirmation.js
// Reads the last order saved in sessionStorage by checkout.js
// and renders it on the confirmation page

const order = JSON.parse(sessionStorage.getItem('v808_last_order') || 'null');

// If no order found redirect to shop
if (!order) {
  window.location.href = './shop.html';
}

// ── Populate order details ────────────────────────────────────
document.getElementById('confirm-order-id').textContent =
 `#${(order._id || order.id || '').toString().slice(-6).toUpperCase() || '—'}`;

document.getElementById('confirm-date').textContent =
  new Date(order.createdAt).toLocaleDateString('en-ZA', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
document.getElementById('confirm-total').textContent =
  `R${Number(order.total || 0).toFixed(2)}`;
  console.log('order:', order);
console.log('total:', order.total, typeof order.total);
console.log('item:', order.items[0]);
// ── Shipping address ──────────────────────────────────────────
const a = order.shippingAddress;  // ← was order.address
if (a) {
  document.getElementById('confirm-address').innerHTML =
    `${a.street}<br/>${a.city}, ${a.province}<br/>${a.postal}`;
} else {
  document.getElementById('confirm-address').textContent = '—';
}
console.log('shippingAddress:', order.shippingAddress);
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
// Keep it for now so user can refresh — clear when they navigate away
window.addEventListener('pagehide', () => {
  sessionStorage.removeItem('v808_last_order');
});
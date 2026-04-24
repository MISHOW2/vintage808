const API = 'https://vintage808-api.vercel.app/api';

const params = new URLSearchParams(window.location.search);
const orderId = params.get('order');

async function init() {
  const res = await fetch(`${API}/payfast/status/${orderId}`);
  const data = await res.json();

  if (!data.success || data.order.status !== 'paid') {
    window.location.href = `./payment-processing.html?order=${orderId}`;
    return;
  }

  const order = JSON.parse(sessionStorage.getItem('v808_pending_order') || 'null');

  if (!order) {
    window.location.href = './shop.html';
    return;
  }

  document.getElementById('confirm-order-id').textContent =
    `#${orderId.slice(-6).toUpperCase()}`;

  document.getElementById('confirm-date').textContent =
    new Date(order.createdAt).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });

  document.getElementById('confirm-total').textContent =
    `R${Number(order.total || 0).toFixed(2)}`;

  const a = order.shippingAddress;

  if (a) {
    document.getElementById('confirm-address').innerHTML =
      `${a.street}<br/>${a.city}, ${a.province}<br/>${a.postal}`;
  }

  const itemsEl = document.getElementById('confirm-items');

  itemsEl.innerHTML = order.items.map(item => `
    <div class="confirm-item">
      <img class="confirm-item-img" src="${item.image ?? ''}" alt="${item.name}" />
      <div class="confirm-item-info">
        <p class="confirm-item-name">${item.name}</p>
        <p class="confirm-item-meta">
          Size: ${item.size ?? '—'} · Qty: ${item.quantity ?? item.qty ?? 1}
        </p>
      </div>
      <span class="confirm-item-price">
        R${(Number(item.price) * (item.quantity ?? item.qty ?? 1)).toFixed(2)}
      </span>
    </div>
  `).join('');

  sessionStorage.removeItem('v808_pending_order');
}

init();
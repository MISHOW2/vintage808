/* ============================================================
   Vintage808 — js/pages/account.js  (dashboard rewrite)
   ============================================================ */

(function () {
  'use strict';

  const API     = 'https://vintage808-api.vercel.app';
  const token   = localStorage.getItem('v808_token');
  const userRaw = localStorage.getItem('v808_user');

  if (!token || !userRaw) {
    sessionStorage.setItem('v808_return', './account.html');
    window.location.replace('./login.html');
    return;
  }

  let user;
  try {
    user = JSON.parse(userRaw);
  } catch {
    localStorage.removeItem('v808_token');
    localStorage.removeItem('v808_user');
    window.location.replace('./login.html');
    return;
  }

  if (!user.firstName && user.name) {
    const parts    = user.name.split(' ');
    user.firstName = parts[0] ?? '';
    user.lastName  = parts.slice(1).join(' ') ?? '';
  }

  if (user.createdAt) {
    user.memberSince = new Date(user.createdAt)
      .toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  }

  const STATUS_STEPS  = ['confirmed', 'processing', 'shipped', 'delivered'];


 const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', processing: 'Processing',
  shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
  returned: 'Returned', return_requested: 'Return Requested',
  return_approved: 'Return Approved', return_rejected: 'Return Rejected',
  paid: 'Paid', failed: 'Failed',
};

  const $ = id => document.getElementById(id);

  const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const fmtDate = (iso, opts = { year:'numeric', month:'short', day:'numeric' }) => {
    try { return new Date(iso).toLocaleDateString('en-ZA', opts); } catch { return '—'; }
  };
  const fmtCurrency = n => 'R' + Number(n).toFixed(2);
  const show = el => el?.classList.remove('hidden');
  const hide = el => el?.classList.add('hidden');

  function fmtStatus(s) { return STATUS_LABELS[s] ?? 'Pending'; }

function badgeClass(s) {
  return {
    pending:          'order-badge--pending',
    confirmed:        'order-badge--confirmed',
    paid:             'order-badge--paid',
    processing:       'order-badge--processing',
    shipped:          'order-badge--shipped',
    delivered:        'order-badge--delivered',
    cancelled:        'order-badge--cancelled',
    failed:           'order-badge--failed',
    returned:         'order-badge--cancelled',
    return_requested: 'order-badge--processing',
    return_approved:  'order-badge--delivered',
    return_rejected:  'order-badge--cancelled',
  }[s] ?? 'order-badge--pending';
}

  function stepState(orderStatus, step) {
    if (orderStatus === 'cancelled') return 'future';
    if (orderStatus === 'pending') return step === 'confirmed' ? 'active' : 'future';
    const oi = STATUS_STEPS.indexOf(orderStatus);
    const si = STATUS_STEPS.indexOf(step);
    if (si < oi)  return 'done';
    if (si === oi) return 'active';
    return 'future';
  }

  function buildStepperHtml(status) {
    return STATUS_STEPS.map((step, i) => {
      const state   = stepState(status, step);
      const isLast  = i === STATUS_STEPS.length - 1;
      const nextSt  = !isLast ? stepState(status, STATUS_STEPS[i + 1]) : '';
      const lineCls = (nextSt === 'done' || nextSt === 'active') ? 'ostep-line done' : 'ostep-line';
      const label   = step.charAt(0).toUpperCase() + step.slice(1);
      return `
        <div class="ostep ${state}">
          <div class="ostep-dot"></div>
          <div class="ostep-label">${label}</div>
        </div>
        ${!isLast ? `<div class="${lineCls}"></div>` : ''}`;
    }).join('');
  }

  function renderUserInfo() {
    const full     = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    const initials = ((user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '')).toUpperCase() || '??';
    if ($('avatar-initials'))       $('avatar-initials').textContent       = initials;
    if ($('avatar-name'))           $('avatar-name').textContent           = full || user.email;
    if ($('avatar-email'))          $('avatar-email').textContent          = user.email ?? '';
    if ($('profile-name-display'))  $('profile-name-display').textContent  = full || '—';
    if ($('profile-email-display')) $('profile-email-display').textContent = user.email ?? '—';
    if ($('profile-phone-display')) $('profile-phone-display').textContent = user.phone ?? '—';
    if ($('profile-since-display')) $('profile-since-display').textContent = user.memberSince ?? '—';
  }

  function renderDashboardOrders(orders) {
    const el = $('dashboard-orders-list');
    if (!el) return;
    if (!orders.length) {
      el.innerHTML = `<div style="padding:24px 20px;font-size:13px;color:var(--acc-mid);">No orders yet. <a href="./shop.html" style="color:var(--acc-black);font-weight:500;">Browse the shop →</a></div>`;
      return;
    }
    el.innerHTML = orders.slice(0, 3).map(order => {
      const status    = order.orderStatus || order.status || 'pending';
      const displayId = order.orderNumber || ('#' + (order._id || order.id || '').toString().slice(-8).toUpperCase());
      const img       = order.items?.[0]?.image;
      return `
        <div class="recent-order-item" style="cursor:pointer;" data-order-id="${esc((order._id || order.id || '').toString())}">
          ${img
            ? `<img class="recent-order-img" src="${esc(img)}" alt="item" onerror="this.style.display='none'" />`
            : `<div class="recent-order-img-placeholder"></div>`}
          <div class="recent-order-info">
            <div class="recent-order-number">${esc(displayId)}</div>
            <div class="recent-order-date">${fmtDate(order.createdAt)}</div>
            <div class="recent-order-status"><span class="order-badge ${badgeClass(status)}">${fmtStatus(status)}</span></div>
          </div>
          <div class="recent-order-right">
            <div class="recent-order-total">${fmtCurrency(order.total)}</div>
            <div class="recent-order-items-count">${(order.items || []).length} item${(order.items || []).length !== 1 ? 's' : ''}</div>
          </div>
        </div>`;
    }).join('');
    el.querySelectorAll('.recent-order-item').forEach(item => {
      item.addEventListener('click', () => openOrderModal(item.dataset.orderId));
    });
  }

  function renderStats(orders) {
    if ($('stat-total-orders')) $('stat-total-orders').textContent = orders.length;
    if ($('stat-total-spent'))  $('stat-total-spent').textContent  = fmtCurrency(orders.reduce((s, o) => s + Number(o.total || 0), 0));
    if ($('stat-last-order'))   $('stat-last-order').textContent   = orders.length ? fmtDate(orders[0].createdAt) : '—';
  }

  function renderDashboardAddress(addresses) {
    const el = $('dashboard-address-preview');
    if (!el) return;
    if (!addresses.length) {
      el.innerHTML = `<p style="font-size:13px;color:var(--acc-mid);">No saved addresses yet.</p>`;
      return;
    }
    const a = addresses[0];
    el.innerHTML = `
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--acc-mid);margin-bottom:8px;">${esc(a.label)}</div>
      <div style="font-size:13px;color:var(--acc-black);line-height:1.7;">${a.lines.join('<br>')}</div>
      ${addresses.length > 1 ? `<div style="margin-top:8px;font-size:12px;color:var(--acc-mid);">+${addresses.length - 1} more</div>` : ''}`;
  }

  function renderOrders(orders = []) {
    const el = $('orders-list');
    if (!el) return;
    if (!orders.length) {
      el.innerHTML = `
        <div class="account-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" color="var(--acc-mid)">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
          </svg>
          <p>No orders yet.</p>
          <a class="account-btn-secondary" href="./shop.html">Browse the Shop</a>
        </div>`;
      return;
    }
    el.innerHTML = orders.map(order => {
      const status    = order.orderStatus || order.status || 'pending';
      const displayId = order.orderNumber || ('#' + (order._id || order.id || '').toString().slice(-8).toUpperCase());
      const thumbs    = (order.items || []).slice(0, 3).map(item =>
        item.image
          ? `<img class="order-thumb" src="${esc(item.image)}" alt="${esc(item.name)}" />`
          : `<div class="order-thumb-placeholder"></div>`
      ).join('') + ((order.items || []).length > 3 ? `<div class="order-thumb-more">+${order.items.length - 3}</div>` : '');

      return `
        <div class="order-card" data-order-id="${esc((order._id || order.id || '').toString())}" role="button" tabindex="0">
          <div class="order-card-header">
            <div class="order-card-meta">
              <div class="order-number">${esc(displayId)}</div>
              <div class="order-date">${fmtDate(order.createdAt)}</div>
            </div>
            <div class="order-card-right">
              <span class="order-badge ${badgeClass(status)}">${fmtStatus(status)}</span>
              <span class="order-card-total">${fmtCurrency(order.total)}</span>
            </div>
          </div>
          <div class="order-stepper">${buildStepperHtml(status)}</div>
          <div class="order-items-row">${thumbs}</div>
          <div class="order-card-footer">
            <span class="order-card-footer-left">${(order.items || []).length} item${(order.items || []).length !== 1 ? 's' : ''}</span>
            <span class="order-card-footer-right">
              View Details
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </div>
        </div>`;
    }).join('');

    el.querySelectorAll('.order-card').forEach(card => {
      card.addEventListener('click', () => openOrderModal(card.dataset.orderId));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openOrderModal(card.dataset.orderId); });
    });
  }

  function renderAddresses(addresses = []) {
    const el = $('addresses-list');
    if (!el) return;
    if (!addresses.length) {
      el.innerHTML = '<p style="font-size:14px;color:var(--acc-mid);padding:24px 0 12px;">No saved addresses yet.</p>';
      return;
    }
    el.innerHTML = addresses.map(addr => `
      <div class="address-card">
        <div class="address-card-top">
          <div class="address-label">${esc(addr.label || 'Address')}</div>
          <button class="address-action-btn danger address-delete-btn" data-id="${esc(addr._id)}">Remove</button>
        </div>
        <div class="address-text">${addr.lines.join('<br>')}</div>
      </div>`).join('');
    el.querySelectorAll('.address-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this address?')) return;
        try {
          await fetch(`${API}/api/auth/addresses/${btn.dataset.id}`, {
            method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
          });
          fetchAddresses().then(addrs => { renderAddresses(addrs); renderDashboardAddress(addrs); });
        } catch { alert('Could not remove address.'); }
      });
    });
  }

  // ── Order modal ───────────────────────────────────────────────
  let _cachedOrders = [];
async function requestReturn(orderId, reason) {
  const res = await fetch(`${API}/api/orders/${orderId}/return`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body:    JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.message || 'Could not submit return request.');
  }
  return (await res.json()).data;
}
 async function openOrderModal(orderId) {
  let order;
  try {
    const res = await fetch(`${API}/api/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const d = await res.json();
      order   = d.data ?? d;
      const idx = _cachedOrders.findIndex(o => (o._id || o.id || '').toString() === orderId);
      if (idx > -1) _cachedOrders[idx] = order;
    }
  } catch { /* fall through to cache */ }

  if (!order) {
    order = _cachedOrders.find(o => (o._id || o.id || '').toString() === orderId);
  }

  if (!order) return;

  const status    = order.orderStatus || order.status || 'pending';
  const displayId = order.orderNumber || ('#' + (order._id || order.id || '').toString().slice(-8).toUpperCase());
  const addr      = order.shippingAddress || {};

  if ($('modal-order-id'))   $('modal-order-id').textContent   = displayId;
  if ($('modal-order-date')) $('modal-order-date').textContent = fmtDate(order.createdAt, { year:'numeric', month:'long', day:'numeric' });

  const timelineHtml = STATUS_STEPS.map(step => {
    const state = stepState(status, step);
    const hist  = (order.statusHistory || []).find(h => h.status === step);
    return `
      <div class="mstep ${state}">
        <div class="mstep-left"><div class="mstep-dot"></div><div class="mstep-line"></div></div>
        <div class="mstep-right">
          <div class="mstep-name">${step.charAt(0).toUpperCase() + step.slice(1)}</div>
          ${hist?.timestamp ? `<div class="mstep-time">${esc(String(hist.timestamp))}</div>` : ''}
          ${hist?.note      ? `<div class="mstep-note">${esc(hist.note)}</div>`              : ''}
        </div>
      </div>`;
  }).join('');

  const itemsHtml = (order.items || []).map(item => `
    <div class="modal-item">
      <div class="modal-item-img">
        ${item.image ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" style="width:100%;height:100%;object-fit:cover;">` : ''}
      </div>
      <div class="modal-item-info">
        <div class="modal-item-name">${esc(item.name)}</div>
        <div class="modal-item-meta">${item.size && item.size !== '—' ? `Size: ${esc(item.size)}<br>` : ''}Qty: ${item.quantity ?? item.qty ?? 1}</div>
      </div>
      <div class="modal-item-price">${fmtCurrency((item.price ?? 0) * (item.quantity ?? item.qty ?? 1))}</div>
    </div>`).join('');

  const shipping = order.shippingFee ?? order.shipping ?? 0;

  // ── Set the static modal body ──────────────────────────────
  $('modal-body').innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Order Status</div>
      <div class="modal-inner-card"><div class="modal-timeline">${timelineHtml}</div></div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Items (${(order.items || []).length})</div>
      <div class="modal-inner-card">${itemsHtml}</div>
    </div>
    <div class="modal-section">
      <div class="modal-section-title">Order Summary</div>
      <div class="modal-inner-card">
        <div class="modal-totals">
          <div class="modal-total-row"><span>Subtotal</span><span>${fmtCurrency(order.subtotal ?? order.total ?? 0)}</span></div>
          <div class="modal-total-row"><span>Shipping</span><span>${shipping === 0 ? 'Free' : fmtCurrency(shipping)}</span></div>
          <div class="modal-total-row final"><span>Total</span><span>${fmtCurrency(order.total)}</span></div>
        </div>
      </div>
    </div>
    <div class="modal-two-col">
      <div class="modal-section">
        <div class="modal-section-title">Delivery Address</div>
        <div class="modal-inner-card">
          <div class="modal-address-text">
            ${esc(order.customerName || '')}<br>
            ${addr.street  ? esc(addr.street)  + '<br>' : ''}
            ${addr.city    ? esc(addr.city) + (addr.province ? ', ' + esc(addr.province) : '') + '<br>' : ''}
            ${addr.postal  ? esc(addr.postal)  + '<br>' : ''}
            <span style="color:var(--acc-mid)">${esc(addr.phone || '')}</span>
          </div>
        </div>
      </div>
      <div class="modal-section">
        <div class="modal-section-title">Payment</div>
        <div class="modal-inner-card">
          <div class="modal-info-rows">
            <div class="modal-info-row"><span class="modal-info-key">Method</span><span class="modal-info-val">${esc(order.payment?.method || 'PayFast')}</span></div>
            <div class="modal-info-row"><span class="modal-info-key">Status</span><span class="modal-info-val"><span class="order-badge ${badgeClass(order.payment?.status || status)}">${fmtStatus(order.payment?.status || status)}</span></span></div>
            ${order.payment?.transactionId ? `<div class="modal-info-row"><span class="modal-info-key">Ref</span><span class="modal-info-val mono">${esc(order.payment.transactionId)}</span></div>` : ''}
          </div>
        </div>
      </div>
    </div>`;
  // ↑ template literal ends here — nothing else goes inside it

  // ── Returns section (appended separately) ─────────────────
  const ret = order.return;
  let returnHtml = '';

  if (ret?.status) {
    const retBadge = badgeClass('return_' + ret.status);
    const retLabel = fmtStatus('return_' + ret.status);
    returnHtml = `
      <div class="modal-section">
        <div class="modal-section-title">Return Request</div>
        <div class="modal-inner-card">
          <div class="modal-info-rows">
            <div class="modal-info-row">
              <span class="modal-info-key">Status</span>
              <span class="modal-info-val"><span class="order-badge ${retBadge}">${retLabel}</span></span>
            </div>
            <div class="modal-info-row">
              <span class="modal-info-key">Reason</span>
              <span class="modal-info-val">${esc(ret.reason)}</span>
            </div>
            ${ret.requestedAt ? `
            <div class="modal-info-row">
              <span class="modal-info-key">Requested</span>
              <span class="modal-info-val">${fmtDate(ret.requestedAt)}</span>
            </div>` : ''}
            ${ret.adminNote ? `
            <div class="modal-info-row">
              <span class="modal-info-key">Note</span>
              <span class="modal-info-val">${esc(ret.adminNote)}</span>
            </div>` : ''}
          </div>
        </div>
      </div>`;

  } else if (status === 'delivered') {
    returnHtml = `
      <div class="modal-section" id="return-section">
        <div class="modal-section-title">Request a Return</div>
        <div class="modal-inner-card">
          <p style="font-size:13px;color:var(--acc-mid);margin:0 0 12px;">Not happy with your order? Let us know why.</p>
          <textarea id="return-reason" class="edit-input"
            style="width:100%;resize:vertical;min-height:80px;font-family:inherit;"
            placeholder="Describe the reason for your return…"></textarea>
          <p id="return-error" style="font-size:12px;color:var(--acc-red);margin:6px 0 0;display:none;"></p>
          <button id="return-submit-btn" class="account-btn-primary" style="margin-top:12px;width:100%;">
            Submit Return Request
          </button>
        </div>
      </div>`;
  }

  $('modal-body').insertAdjacentHTML('beforeend', returnHtml);

  const submitBtn = $('return-submit-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const reason  = $('return-reason')?.value.trim();
      const errorEl = $('return-error');

      if (!reason) {
        errorEl.textContent = 'Please enter a reason.';
        errorEl.style.display = 'block';
        return;
      }

      submitBtn.disabled    = true;
      submitBtn.textContent = 'Submitting…';
      errorEl.style.display = 'none';

      try {
        await requestReturn(orderId, reason);
        closeModal();
        setTimeout(() => openOrderModal(orderId), 150);
      } catch (err) {
        errorEl.textContent   = err.message;
        errorEl.style.display = 'block';
        submitBtn.disabled    = false;
        submitBtn.textContent = 'Submit Return Request';
      }
    });
  }

  $('modal-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}

  function closeModal() {
    $('modal-overlay')?.classList.remove('open');
    document.body.style.overflow = '';
  }

  $('modal-overlay')?.addEventListener('click', e => { if (e.target === $('modal-overlay')) closeModal(); });
  $('modal-close-btn')?.addEventListener('click', closeModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ── API calls ─────────────────────────────────────────────────
async function fetchOrders() {
  try {
    console.log('[Orders] Fetching orders...');

    const res = await fetch(`${API}/api/orders`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('[Orders] Response status:', res.status);

    if (!res.ok) {
      console.error('[Orders] API failed:', res.status);
      return [];
    }

    const data = await res.json();

    console.log('[Orders] Raw response:', data);

    const rawOrders = data.data ?? data.orders ?? [];

    if (!Array.isArray(rawOrders)) {
      console.error('[Orders] Invalid format:', rawOrders);
      return [];
    }

    const orders = rawOrders.map(order => ({
      ...order,

      // normalize IDs
      id: order.id || order._id,

      // normalize status
      orderStatus: order.orderStatus || order.status || 'pending',

      // normalize totals
      total: Number(order.total || 0),

      // normalize items
      items: Array.isArray(order.items) ? order.items : [],

      // normalize createdAt
      createdAt: order.createdAt || new Date().toISOString(),
    }));

    console.log('[Orders] Normalized orders:', orders);

    _cachedOrders = orders;

    return orders;
  } catch (err) {
    console.error('[Orders] Fetch error:', err);
    return [];
  }
}

  async function fetchAddresses() {
    try {
      const res = await fetch(`${API}/api/auth/addresses`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data ?? []).map((a, i) => ({
        _id: a._id, label: a.label || `Address ${i + 1}`,
        lines: [a.street, `${a.city}, ${a.province}`, a.postal].filter(Boolean),
      }));
    } catch { return []; }
  }

  // ── Tab switching ─────────────────────────────────────────────
  const navItems = document.querySelectorAll('.account-nav-item');

function switchTab(name) {
  document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
  navItems.forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${name}`)?.classList.add('active');
  document.querySelector(`.account-nav-item[data-tab="${name}"]`)?.classList.add('active');
  sessionStorage.setItem('account_tab', name);

  if (name === 'orders') {
    fetchOrders().then(orders => {
      renderOrders(orders);
      renderDashboardOrders(orders);
      renderStats(orders);
    });
  }
  if (name === 'returns') {
    fetchOrders().then(orders => renderReturns(orders));
  }
  if (name === 'wishlist')     renderWishlist();
  if (name === 'preferences')  renderPreferences();
}

  navItems.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));

  $('view-all-orders-btn')?.addEventListener('click', () => switchTab('orders'));
  $('dashboard-orders-footer-btn')?.addEventListener('click', () => switchTab('orders'));
  $('manage-addresses-btn')?.addEventListener('click', () => switchTab('addresses'));
  $('add-address-shortcut-btn')?.addEventListener('click', () => {
    switchTab('addresses');
    setTimeout(() => $('add-address-btn')?.click(), 100);
  });

  const savedTab = sessionStorage.getItem('account_tab');
  if (savedTab) switchTab(savedTab);

  // ── Edit profile ──────────────────────────────────────────────
  function openEdit() {
    if ($('edit-first-name')) $('edit-first-name').value = user.firstName ?? '';
    if ($('edit-last-name'))  $('edit-last-name').value  = user.lastName  ?? '';
    if ($('edit-email'))      $('edit-email').value      = user.email     ?? '';
    hide($('save-success')); hide($('save-error'));
    hide($('profile-view')); show($('profile-edit'));
  }

  function closeEdit() { hide($('profile-edit')); show($('profile-view')); }

  $('edit-profile-btn')?.addEventListener('click', openEdit);
  $('cancel-edit-btn')?.addEventListener('click', closeEdit);

  $('save-profile-btn')?.addEventListener('click', async () => {
    hide($('save-success')); hide($('save-error'));

    const newFirst  = $('edit-first-name')?.value.trim();
    const newLast   = $('edit-last-name')?.value.trim();
    const newEmail  = $('edit-email')?.value.trim();
    const newPw     = $('edit-new-pw')?.value;
    const confirmPw = $('edit-confirm-pw')?.value;

    if (!newFirst || !newEmail) {
      $('save-error-msg').textContent = 'First name and email are required.';
      show($('save-error')); return;
    }
    if (newPw && newPw !== confirmPw) {
      $('save-error-msg').textContent = 'New passwords do not match.';
      show($('save-error')); return;
    }

    $('save-profile-btn').disabled = true;
    show($('save-spinner'));

    try {
      const body = { firstName: newFirst, lastName: newLast, email: newEmail };
      if (newPw) body.password = newPw;

      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        $('save-error-msg').textContent = d.message || 'Could not save changes.';
        show($('save-error')); return;
      }

      user.firstName = newFirst;
      user.lastName  = newLast;
      user.email     = newEmail;
      localStorage.setItem('v808_user', JSON.stringify(user));
      renderUserInfo();
      show($('save-success'));
      setTimeout(closeEdit, 1400);
    } catch {
      $('save-error-msg').textContent = 'Something went wrong.';
      show($('save-error'));
    } finally {
      $('save-profile-btn').disabled = false;
      hide($('save-spinner'));
    }
  });

  // ── Add address ───────────────────────────────────────────────
  $('add-address-btn')?.addEventListener('click', () => {
    const existing = document.getElementById('add-address-form');
    if (existing) { existing.remove(); return; }

    const form = document.createElement('div');
    form.id = 'add-address-form';
    form.style.cssText = 'margin-top:16px;display:flex;flex-direction:column;gap:12px;';
    form.innerHTML = `
      <input class="edit-input" id="addr-label"    placeholder="Label (e.g. Home, Work)" />
      <input class="edit-input" id="addr-street"   placeholder="Street address" />
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <input class="edit-input" id="addr-city"   placeholder="City" />
        <input class="edit-input" id="addr-postal" placeholder="Postal code" />
      </div>
      <select class="edit-input" id="addr-province">
        <option value="" disabled selected>Select province</option>
        <option>Gauteng</option><option>Western Cape</option>
        <option>KwaZulu-Natal</option><option>Eastern Cape</option>
        <option>Limpopo</option><option>Mpumalanga</option>
        <option>North West</option><option>Free State</option>
        <option>Northern Cape</option>
      </select>
      <div style="display:flex;gap:10px;">
        <button id="addr-save-btn"   class="account-btn-primary"   style="flex:1;">Save address</button>
        <button id="addr-cancel-btn" class="account-btn-secondary" style="flex:1;">Cancel</button>
      </div>
      <p id="addr-error" style="font-size:12px;color:var(--acc-red);display:none;"></p>`;

    $('add-address-btn').after(form);

    document.getElementById('addr-cancel-btn').addEventListener('click', () => form.remove());
    document.getElementById('addr-save-btn').addEventListener('click', async () => {
      const street   = document.getElementById('addr-street').value.trim();
      const city     = document.getElementById('addr-city').value.trim();
      const province = document.getElementById('addr-province').value;
      const postal   = document.getElementById('addr-postal').value.trim();
      const label    = document.getElementById('addr-label').value.trim();
      const errEl    = document.getElementById('addr-error');

      if (!street || !city || !province || !postal) {
        errEl.textContent = 'Please fill in all required fields.';
        errEl.style.display = 'block'; return;
      }

      try {
        const res = await fetch(`${API}/api/auth/addresses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ label, street, city, province, postal }),
        });
        if (!res.ok) { errEl.textContent = 'Could not save address.'; errEl.style.display = 'block'; return; }
        form.remove();
        fetchAddresses().then(addrs => { renderAddresses(addrs); renderDashboardAddress(addrs); });
      } catch { errEl.textContent = 'Something went wrong.'; errEl.style.display = 'block'; }
    });
  });

  // ── Render Returns ────────────────────────────────────────────
function renderReturns(orders = []) {
  const el = $('returns-list');
  if (!el) return;

  const returned = orders.filter(o =>
    o.return?.status || ['returned'].includes(o.orderStatus)
  );

  if (!returned.length) {
    el.innerHTML = `
      <div class="account-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 12a9 9 0 0 0 9 9m9-9a9 9 0 0 0-9-9M3 12l4-4m-4 4l4 4"/>
        </svg>
        <p>No return requests yet.</p>
      </div>`;
    return;
  }

  el.innerHTML = returned.map(order => {
    const ret       = order.return || {};
    const status    = ret.status || 'requested';
    const displayId = order.orderNumber || ('#' + (order._id || order.id || '').toString().slice(-8).toUpperCase());
    const badgeCls  = badgeClass('return_' + status);
    const badgeLbl  = fmtStatus('return_' + status);

    return `
      <div class="account-card" style="margin-bottom:12px;cursor:pointer;" data-order-id="${esc((order._id || order.id || '').toString())}">
        <div class="card-header">
          <div>
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--acc-mid);margin-bottom:3px;">${esc(displayId)}</div>
            <div style="font-size:13px;color:var(--acc-black);">${fmtDate(order.createdAt)}</div>
          </div>
          <span class="order-badge ${badgeCls}">${badgeLbl}</span>
        </div>
        <div class="card-body">
          <div class="profile-row">
            <span class="profile-key">Reason</span>
            <span class="profile-val">${esc(ret.reason || '—')}</span>
          </div>
          <div class="profile-row">
            <span class="profile-key">Requested</span>
            <span class="profile-val">${ret.requestedAt ? fmtDate(ret.requestedAt) : '—'}</span>
          </div>
          ${ret.adminNote ? `
          <div class="profile-row">
            <span class="profile-key">Admin Note</span>
            <span class="profile-val">${esc(ret.adminNote)}</span>
          </div>` : ''}
          <div class="profile-row">
            <span class="profile-key">Order Total</span>
            <span class="profile-val">${fmtCurrency(order.total)}</span>
          </div>
        </div>
        <button class="card-footer-link" data-order-id="${esc((order._id || order.id || '').toString())}">
          View Order Details
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>`;
  }).join('');

  el.querySelectorAll('[data-order-id]').forEach(el => {
    el.addEventListener('click', () => openOrderModal(el.dataset.orderId));
  });
}

// ── Render Wishlist ───────────────────────────────────────────
function renderWishlist() {
  const el = $('wishlist-list');
  if (!el) return;

  const raw      = localStorage.getItem('v808_wishlist');
  let wishlist   = [];
  try { wishlist = JSON.parse(raw) || []; } catch { wishlist = []; }

  if (!wishlist.length) {
    el.innerHTML = `
      <div class="account-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <p>Your wishlist is empty.</p>
        <a class="account-btn-secondary" href="./shop.html">Browse the Shop</a>
      </div>`;
    return;
  }

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">
      ${wishlist.map(item => `
        <div class="account-card wishlist-item" style="overflow:hidden;">
          <div style="aspect-ratio:3/4;background:var(--acc-sand);overflow:hidden;">
            ${item.image
              ? `<img src="${esc(item.image)}" alt="${esc(item.name)}" style="width:100%;height:100%;object-fit:cover;" />`
              : ''}
          </div>
          <div style="padding:12px;">
            <div style="font-size:13px;color:var(--acc-black);margin-bottom:4px;font-weight:500;">${esc(item.name)}</div>
            <div style="font-family:var(--font-display);font-size:14px;color:var(--acc-black);margin-bottom:10px;">${fmtCurrency(item.price)}</div>
            <div style="display:flex;gap:6px;">
              <a href="./shop.html" class="account-btn-primary" style="flex:1;font-size:11px;padding:8px 10px;text-decoration:none;text-align:center;">
                Shop
              </a>
              <button class="account-btn-secondary wishlist-remove-btn" data-id="${esc(item.id)}" style="padding:8px 10px;font-size:11px;">
                Remove
              </button>
            </div>
          </div>
        </div>`).join('')}
    </div>`;

  el.querySelectorAll('.wishlist-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      wishlist = wishlist.filter(i => i.id !== btn.dataset.id);
      localStorage.setItem('v808_wishlist', JSON.stringify(wishlist));
      renderWishlist();
    });
  });
}

// ── Render Preferences ────────────────────────────────────────
function renderPreferences() {
  const el = $('preferences-form');
  if (!el) return;

  const raw   = localStorage.getItem('v808_prefs');
  let prefs   = {};
  try { prefs = JSON.parse(raw) || {}; } catch { prefs = {}; }

  el.innerHTML = `
    <div class="account-card">
      <div class="card-header"><span class="card-title">Notifications</span></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:0;">
        ${[
          { key: 'emailOrders',    label: 'Order updates',         desc: 'Shipping and delivery notifications' },
          { key: 'emailReturns',   label: 'Return updates',        desc: 'Status changes on return requests' },
          { key: 'emailMarketing', label: 'Promotions & new drops', desc: 'Sales, restocks and new arrivals' },
        ].map(pref => `
          <div class="profile-row" style="justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:13px;color:var(--acc-black);font-weight:500;">${pref.label}</div>
              <div style="font-size:11px;color:var(--acc-mid);margin-top:2px;">${pref.desc}</div>
            </div>
            <label class="pref-toggle">
              <input type="checkbox" data-key="${pref.key}" ${prefs[pref.key] !== false ? 'checked' : ''} />
              <span class="pref-toggle-track"></span>
            </label>
          </div>`).join('')}
      </div>
    </div>

    <div class="account-card" style="margin-top:12px;">
      <div class="card-header"><span class="card-title">Display</span></div>
      <div class="card-body" style="display:flex;flex-direction:column;gap:0;">
        <div class="profile-row" style="justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:13px;color:var(--acc-black);font-weight:500;">Currency</div>
            <div style="font-size:11px;color:var(--acc-mid);margin-top:2px;">Displayed currency</div>
          </div>
          <select class="edit-input" id="pref-currency" style="width:auto;padding:6px 10px;font-size:12px;">
            <option value="ZAR" ${(prefs.currency || 'ZAR') === 'ZAR' ? 'selected' : ''}>ZAR (R)</option>
            <option value="USD" ${prefs.currency === 'USD' ? 'selected' : ''}>USD ($)</option>
          </select>
        </div>
      </div>
    </div>

    <div style="margin-top:16px;display:flex;gap:10px;">
      <button class="account-btn-primary" id="save-prefs-btn">Save Preferences</button>
      <div class="account-success hidden" id="prefs-success" style="margin:0;padding:10px 14px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Saved!
      </div>
    </div>`;

  $('save-prefs-btn')?.addEventListener('click', () => {
    const updated = {};
    el.querySelectorAll('input[data-key]').forEach(cb => {
      updated[cb.dataset.key] = cb.checked;
    });
    updated.currency = $('pref-currency')?.value || 'ZAR';
    localStorage.setItem('v808_prefs', JSON.stringify(updated));
    show($('prefs-success'));
    setTimeout(() => hide($('prefs-success')), 2000);
  });
}
  // ── Logout ────────────────────────────────────────────────────
  $('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('v808_token');
    localStorage.removeItem('v808_user');
    sessionStorage.clear();
    window.location.href = './index.html';
  });

  // ── Boot ──────────────────────────────────────────────────────
  renderUserInfo();

  fetchOrders().then(orders => {
    renderOrders(orders);
    renderDashboardOrders(orders);
    renderStats(orders);
  });

  fetchAddresses().then(addrs => {
    renderAddresses(addrs);
    renderDashboardAddress(addrs);
  });

})();
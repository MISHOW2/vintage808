/* ============================================================
   Vintage808 — js/pages/account.js  (retail-grade rewrite)
   ============================================================ */

(function () {
  'use strict';

  const API      = 'https://vintage808-api.vercel.app';
  const token    = localStorage.getItem('v808_token');
  const userRaw  = localStorage.getItem('v808_user');

  // ── Auth guard ───────────────────────────────────────────────
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

  // Normalise name fields
  if (!user.firstName && user.name) {
    const parts    = user.name.split(' ');
    user.firstName = parts[0] ?? '';
    user.lastName  = parts.slice(1).join(' ') ?? '';
  }

  if (user.createdAt) {
    user.memberSince = new Date(user.createdAt)
      .toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  }

  // ── CONSTANTS ────────────────────────────────────────────────
  const STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'delivered'];

  const STATUS_LABELS = {
    pending:    'Pending',
    confirmed:  'Confirmed',
    processing: 'Processing',
    shipped:    'Shipped',
    delivered:  'Delivered',
    cancelled:  'Cancelled',
    paid:       'Paid',
    failed:     'Failed',
  };

  // ── DOM refs ─────────────────────────────────────────────────
  const avatarInitials   = document.getElementById('avatar-initials');
  const avatarName       = document.getElementById('avatar-name');
  const avatarEmail      = document.getElementById('avatar-email');
  const profileNameDisp  = document.getElementById('profile-name-display');
  const profileEmailDisp = document.getElementById('profile-email-display');
  const profilePhoneDisp = document.getElementById('profile-phone-display');
  const profileSinceDisp = document.getElementById('profile-since-display');
  const profileView      = document.getElementById('profile-view');
  const profileEdit      = document.getElementById('profile-edit');
  const editProfileBtn   = document.getElementById('edit-profile-btn');
  const cancelEditBtn    = document.getElementById('cancel-edit-btn');
  const saveProfileBtn   = document.getElementById('save-profile-btn');
  const saveSuccess      = document.getElementById('save-success');
  const saveError        = document.getElementById('save-error');
  const saveErrorMsg     = document.getElementById('save-error-msg');
  const saveSpinner      = document.getElementById('save-spinner');
  const editFirstName    = document.getElementById('edit-first-name');
  const editLastName     = document.getElementById('edit-last-name');
  const editEmail        = document.getElementById('edit-email');
  const editCurrentPw    = document.getElementById('edit-current-pw');
  const editNewPw        = document.getElementById('edit-new-pw');
  const editConfirmPw    = document.getElementById('edit-confirm-pw');
  const ordersList       = document.getElementById('orders-list');
  const addressesList    = document.getElementById('addresses-list');
  const addAddressBtn    = document.getElementById('add-address-btn');
  const logoutBtn        = document.getElementById('logout-btn');
  const navItems         = document.querySelectorAll('.account-nav-item');

  // Modal refs
  const modalOverlay  = document.getElementById('modal-overlay');
  const modalOrderId  = document.getElementById('modal-order-id');
  const modalOrderDt  = document.getElementById('modal-order-date');
  const modalBody     = document.getElementById('modal-body');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  // ── HELPERS ──────────────────────────────────────────────────

  function getInitials(first, last) {
    return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '??';
  }

  function fmtStatus(s) {
    return STATUS_LABELS[s] ?? 'Pending';
  }

  function fmtDate(iso, opts = { year: 'numeric', month: 'short', day: 'numeric' }) {
    try { return new Date(iso).toLocaleDateString('en-ZA', opts); }
    catch { return '—'; }
  }

  function fmtCurrency(n) {
    return 'R' + Number(n).toFixed(2);
  }

  function badgeClass(s) {
    const map = {
      pending:    'order-badge--pending',
      confirmed:  'order-badge--confirmed',
      paid:       'order-badge--paid',
      processing: 'order-badge--processing',
      shipped:    'order-badge--shipped',
      delivered:  'order-badge--delivered',
      cancelled:  'order-badge--cancelled',
      failed:     'order-badge--failed',
    };
    return map[s] ?? 'order-badge--pending';
  }

  function stepState(orderStatus, step) {
    if (orderStatus === 'pending') return step === 'confirmed' ? 'active' : 'future';
    if (orderStatus === 'cancelled') return 'future';
    const oi = STATUS_STEPS.indexOf(orderStatus);
    const si = STATUS_STEPS.indexOf(step);
    if (si < oi)  return 'done';
    if (si === oi) return 'active';
    return 'future';
  }

  function show(el) { el?.classList.remove('hidden'); }
  function hide(el) { el?.classList.add('hidden'); }

  function escHtml(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── RENDER USER INFO ─────────────────────────────────────────

  function renderUserInfo() {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();

    if (avatarInitials)   avatarInitials.textContent  = getInitials(user.firstName, user.lastName);
    if (avatarName)       avatarName.textContent       = fullName || user.email;
    if (avatarEmail)      avatarEmail.textContent      = user.email ?? '';
    if (profileNameDisp)  profileNameDisp.textContent  = fullName || '—';
    if (profileEmailDisp) profileEmailDisp.textContent = user.email ?? '—';
    if (profilePhoneDisp) profilePhoneDisp.textContent = user.phone ?? '—';
    if (profileSinceDisp) profileSinceDisp.textContent = user.memberSince ?? '—';
  }

  // ── RENDER ORDERS LIST ───────────────────────────────────────

  function buildStepperHtml(status) {
    return STATUS_STEPS.map((step, i) => {
      const state = stepState(status, step);
      const isLastStep = i === STATUS_STEPS.length - 1;
      const nextState = !isLastStep ? stepState(status, STATUS_STEPS[i + 1]) : '';
      const lineClass = (nextState === 'done' || nextState === 'active') ? 'ostep-line done' : 'ostep-line';
      const label = step.charAt(0).toUpperCase() + step.slice(1);
      return `
        <div class="ostep ${state}">
          <div class="ostep-dot"></div>
          <div class="ostep-label">${escHtml(label)}</div>
        </div>
        ${!isLastStep ? `<div class="${lineClass}"></div>` : ''}
      `;
    }).join('');
  }

  function renderOrders(orders = []) {
    if (!ordersList) return;

    if (!orders.length) {
      ordersList.innerHTML = `
        <div class="account-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" color="var(--mid)">
            <rect x="2" y="3" width="20" height="14" rx="2"/>
            <path d="M8 21h8M12 17v4"/>
          </svg>
          <p>No orders yet.</p>
          <a class="account-btn-secondary" href="shop.html">Browse the Shop</a>
        </div>`;
      return;
    }

    ordersList.innerHTML = orders.map(order => {
      const status = order.orderStatus || order.status || 'pending';
      const displayId = order.orderNumber || ('#' + (order._id || order.id || '').toString().slice(-8).toUpperCase());
      const hasTracking = order.tracking?.number;

      const trackingBar = hasTracking ? `
        <div class="order-tracking-bar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M16 8h4l3 5v3h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          <span class="order-tracking-bar-text">${escHtml(order.tracking.courier ? order.tracking.courier + ' · ' : '')}${escHtml(order.tracking.number)}</span>
          ${order.tracking.url ? `<a href="${escHtml(order.tracking.url)}" target="_blank" class="order-track-link" onclick="event.stopPropagation()">Track</a>` : ''}
        </div>` : '';

      const thumbsHtml = (order.items || []).slice(0, 3).map(item => item.image
        ? `<img class="order-thumb" src="${escHtml(item.image)}" alt="${escHtml(item.name)}" />`
        : `<div class="order-thumb-placeholder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--mid)" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
            </svg>
           </div>`
      ).join('') + ((order.items || []).length > 3
        ? `<div class="order-thumb-more">+${(order.items.length - 3)}</div>` : '');

      return `
        <div class="order-card" data-order-id="${escHtml((order._id || order.id || '').toString())}" role="button" tabindex="0">
          <div class="order-card-header">
            <div class="order-card-meta">
              <div class="order-number">${escHtml(displayId)}</div>
              <div class="order-date">${fmtDate(order.createdAt)}</div>
            </div>
            <div class="order-card-right">
              <span class="order-badge ${badgeClass(status)}">${fmtStatus(status)}</span>
              <span class="order-card-total">${fmtCurrency(order.total)}</span>
            </div>
          </div>

          <div class="order-stepper">${buildStepperHtml(status)}</div>

          ${trackingBar}

          <div class="order-items-row">${thumbsHtml}</div>

          <div class="order-card-footer">
            <span class="order-card-footer-left">${(order.items || []).length} item${(order.items || []).length !== 1 ? 's' : ''}</span>
            <span class="order-card-footer-right">
              View Details
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </div>
        </div>`;
    }).join('');

    // Attach click/keyboard handlers
    ordersList.querySelectorAll('.order-card').forEach(card => {
      card.addEventListener('click', () => openOrderModal(card.dataset.orderId));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') openOrderModal(card.dataset.orderId);
      });
    });
  }

  // ── ORDER DETAIL MODAL ───────────────────────────────────────

  let _cachedOrders = [];

  async function openOrderModal(orderId) {
    // Try cache first, then fetch individually
    let order = _cachedOrders.find(o => (o._id || o.id || '').toString() === orderId);

    if (!order) {
      try {
        const res = await fetch(`${API}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          order = data.data ?? data;
        }
      } catch { /* fall through */ }
    }

    if (!order) return;

    const status   = order.orderStatus || order.status || 'pending';
    const displayId = order.orderNumber || ('#' + (order._id || order.id || '').toString().slice(-8).toUpperCase());

    if (modalOrderId) modalOrderId.textContent = displayId;
    if (modalOrderDt) modalOrderDt.textContent = fmtDate(order.createdAt, { year: 'numeric', month: 'long', day: 'numeric' });

    const hasTracking = order.tracking?.number;
    const history     = order.statusHistory || [];

    // ── Build timeline ──
    const timelineHtml = STATUS_STEPS.map(step => {
      const state   = stepState(status, step);
      const hist    = history.find(h => h.status === step);
      const label   = step.charAt(0).toUpperCase() + step.slice(1);
      return `
        <div class="mstep ${state}">
          <div class="mstep-left">
            <div class="mstep-dot"></div>
            <div class="mstep-line"></div>
          </div>
          <div class="mstep-right">
            <div class="mstep-name">${escHtml(label)}</div>
            ${hist?.timestamp ? `<div class="mstep-time">${escHtml(hist.timestamp)}</div>` : ''}
            ${hist?.note      ? `<div class="mstep-note">${escHtml(hist.note)}</div>` : ''}
          </div>
        </div>`;
    }).join('');

    // ── Build tracking section ──
    const trackingHtml = hasTracking ? `
      <div class="modal-section">
        <div class="modal-section-title">Tracking</div>
        <div class="modal-inner-card">
          <div class="modal-tracking-detail">
            ${order.tracking.courier ? `<div class="modal-tracking-courier">${escHtml(order.tracking.courier)}</div>` : ''}
            <div class="modal-tracking-number">${escHtml(order.tracking.number)}</div>
            ${order.estimatedDelivery ? `<div class="modal-tracking-eta">Estimated delivery: <strong>${fmtDate(order.estimatedDelivery, { weekday: 'long', day: 'numeric', month: 'long' })}</strong></div>` : ''}
            ${order.tracking.url ? `
              <button class="modal-track-btn" onclick="window.open('${escHtml(order.tracking.url)}','_blank')">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="3" width="15" height="13" rx="2"/>
                  <path d="M16 8h4l3 5v3h-7V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                Track Parcel
              </button>` : ''}
          </div>
        </div>
      </div>` : '';

    // ── Build items ──
    const itemsHtml = (order.items || []).map(item => `
      <div class="modal-item">
        <div class="modal-item-img">
          ${item.image
            ? `<img src="${escHtml(item.image)}" alt="${escHtml(item.name)}" style="width:100%;height:100%;object-fit:cover;border-radius:4px;">`
            : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--mid)" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`}
        </div>
        <div class="modal-item-info">
          <div class="modal-item-name">${escHtml(item.name)}</div>
          <div class="modal-item-meta">
            ${item.size && item.size !== '—' ? `Size: ${escHtml(item.size)}<br>` : ''}
            Qty: ${item.quantity ?? item.qty ?? 1}
          </div>
        </div>
        <div class="modal-item-price">${fmtCurrency((item.price ?? 0) * (item.quantity ?? item.qty ?? 1))}</div>
      </div>`).join('');

    // ── Build totals ──
    const shipping = order.shippingFee ?? order.shipping ?? 0;
    const totalsHtml = `
      <div class="modal-totals">
        <div class="modal-total-row">
          <span>Subtotal</span>
          <span>${fmtCurrency(order.subtotal ?? order.total ?? 0)}</span>
        </div>
        <div class="modal-total-row">
          <span>Shipping</span>
          <span>${shipping === 0 ? 'Free' : fmtCurrency(shipping)}</span>
        </div>
        <div class="modal-total-row final">
          <span>Total</span>
          <span>${fmtCurrency(order.total)}</span>
        </div>
      </div>`;

    // ── Build address ──
    const addr = order.shippingAddress || {};
    const addressHtml = `
      <div class="modal-address-text">
        ${escHtml(order.customerName || '')}<br>
        ${addr.street  ? escHtml(addr.street)  + '<br>' : ''}
        ${(addr.city && addr.province) ? escHtml(addr.city) + ', ' + escHtml(addr.province) + '<br>' : ''}
        ${addr.postal  ? escHtml(addr.postal)  + '<br>' : ''}
        <span style="color:var(--mid)">${escHtml(addr.phone || order.customerPhone || '')}</span>
      </div>`;

    // ── Build payment ──
    const payStatus = order.payment?.status || (status === 'confirmed' ? 'paid' : 'pending');
    const paymentHtml = `
      <div class="modal-info-rows">
        <div class="modal-info-row">
          <span class="modal-info-key">Method</span>
          <span class="modal-info-val">${escHtml(order.payment?.method || 'PayFast')}</span>
        </div>
        <div class="modal-info-row">
          <span class="modal-info-key">Status</span>
          <span class="modal-info-val">
            <span class="order-badge ${badgeClass(payStatus)}">${fmtStatus(payStatus)}</span>
          </span>
        </div>
        ${order.payment?.transactionId ? `
          <div class="modal-info-row">
            <span class="modal-info-key">Ref</span>
            <span class="modal-info-val mono">${escHtml(order.payment.transactionId)}</span>
          </div>` : ''}
        ${order.payment?.paidAt ? `
          <div class="modal-info-row">
            <span class="modal-info-key">Paid</span>
            <span class="modal-info-val">${fmtDate(order.payment.paidAt)}</span>
          </div>` : ''}
      </div>`;

    // ── Build contact ──
    const contactHtml = `
      <div class="modal-info-rows">
        <div class="modal-info-row">
          <span class="modal-info-key">Name</span>
          <span class="modal-info-val">${escHtml(order.customerName || '—')}</span>
        </div>
        <div class="modal-info-row">
          <span class="modal-info-key">Email</span>
          <span class="modal-info-val" style="font-size:12px">${escHtml(order.customerEmail || '—')}</span>
        </div>
        ${addr.phone ? `
          <div class="modal-info-row">
            <span class="modal-info-key">Phone</span>
            <span class="modal-info-val">${escHtml(addr.phone)}</span>
          </div>` : ''}
      </div>`;

    // ── Assemble modal body ──
    modalBody.innerHTML = `

      <div class="modal-section">
        <div class="modal-section-title">Order status</div>
        <div class="modal-inner-card">
          <div class="modal-timeline">${timelineHtml}</div>
        </div>
      </div>

      ${trackingHtml}

      <div class="modal-section">
        <div class="modal-section-title">Items (${(order.items || []).length})</div>
        <div>${itemsHtml}</div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Order summary</div>
        <div class="modal-inner-card">${totalsHtml}</div>
      </div>

      <div class="modal-two-col">
        <div class="modal-section">
          <div class="modal-section-title">Delivery address</div>
          <div class="modal-inner-card">${addressHtml}</div>
        </div>
        <div class="modal-section">
          <div class="modal-section-title">Payment</div>
          <div class="modal-inner-card">${paymentHtml}</div>
        </div>
      </div>

      <div class="modal-section">
        <div class="modal-section-title">Contact</div>
        <div class="modal-inner-card">${contactHtml}</div>
      </div>`;

    modalOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Close on overlay click or close button
  modalOverlay?.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });
  modalCloseBtn?.addEventListener('click', closeModal);

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // ── RENDER ADDRESSES ─────────────────────────────────────────

  function renderAddresses(addresses = []) {
    if (!addressesList) return;

    if (!addresses.length) {
      addressesList.innerHTML = '<p style="font-size:14px;color:var(--mid);padding:24px 0 12px;">No saved addresses yet.</p>';
      return;
    }

    addressesList.innerHTML = addresses.map(addr => `
      <div class="address-card">
        <div class="address-card-top">
          <div class="address-label">${escHtml(addr.label || 'Address')}</div>
          <div class="address-actions">
            <button class="address-action-btn danger address-delete-btn" data-id="${escHtml(addr._id)}">Remove</button>
          </div>
        </div>
        <div class="address-text">${addr.lines.join('<br>')}</div>
      </div>`).join('');

    addressesList.querySelectorAll('.address-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Remove this address?')) return;
        try {
          await fetch(`${API}/api/auth/addresses/${btn.dataset.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchAddresses().then(renderAddresses);
        } catch { alert('Could not remove address.'); }
      });
    });
  }

  // ── API CALLS ─────────────────────────────────────────────────

  async function fetchOrders() {
    try {
      const res = await fetch(`${API}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      const allOrders = data.data ?? data.orders ?? data ?? [];
      const filtered = allOrders.filter(o =>
        o.customerEmail === user.email ||
        o.userId === (user._id || user.id)
      );
      _cachedOrders = filtered;
      return filtered;
    } catch { return []; }
  }

  async function fetchAddresses() {
    try {
      const res = await fetch(`${API}/api/auth/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data ?? []).map((a, i) => ({
        _id:   a._id,
        label: a.label || `Address ${i + 1}`,
        lines: [a.street, `${a.city}, ${a.province}`, a.postal].filter(Boolean),
      }));
    } catch { return []; }
  }

  // ── TAB SWITCHING ─────────────────────────────────────────────

  function switchTab(tabName) {
    document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
    navItems.forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    document.querySelector(`.account-nav-item[data-tab="${tabName}"]`)?.classList.add('active');
    sessionStorage.setItem('account_tab', tabName);
  }

  navItems.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  const savedTab = sessionStorage.getItem('account_tab');
  if (savedTab) switchTab(savedTab);

  // ── EDIT PROFILE ──────────────────────────────────────────────

  function openEdit() {
    if (editFirstName) editFirstName.value = user.firstName ?? '';
    if (editLastName)  editLastName.value  = user.lastName  ?? '';
    if (editEmail)     editEmail.value     = user.email     ?? '';
    if (editCurrentPw) editCurrentPw.value = '';
    if (editNewPw)     editNewPw.value     = '';
    if (editConfirmPw) editConfirmPw.value = '';
    hide(saveSuccess);
    hide(saveError);
    hide(profileView);
    show(profileEdit);
  }

  function closeEdit() {
    hide(profileEdit);
    show(profileView);
  }

  editProfileBtn?.addEventListener('click', openEdit);
  cancelEditBtn?.addEventListener('click', closeEdit);

  saveProfileBtn?.addEventListener('click', async () => {
    hide(saveSuccess);
    hide(saveError);

    const newFirst  = editFirstName?.value.trim();
    const newLast   = editLastName?.value.trim();
    const newEmail  = editEmail?.value.trim();
    const newPw     = editNewPw?.value;
    const confirmPw = editConfirmPw?.value;

    if (!newFirst || !newEmail) {
      if (saveErrorMsg) saveErrorMsg.textContent = 'First name and email are required.';
      show(saveError);
      return;
    }

    if (newPw && newPw !== confirmPw) {
      if (saveErrorMsg) saveErrorMsg.textContent = 'New passwords do not match.';
      show(saveError);
      return;
    }

    if (saveProfileBtn) saveProfileBtn.disabled = true;
    show(saveSpinner);

    try {
      const body = { firstName: newFirst, lastName: newLast, email: newEmail };
      if (newPw) body.password = newPw;

      const res = await fetch(`${API}/api/auth/profile`, {
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (saveErrorMsg) saveErrorMsg.textContent = d.message || 'Could not save changes.';
        show(saveError);
        return;
      }

      user.firstName = newFirst;
      user.lastName  = newLast;
      user.email     = newEmail;
      localStorage.setItem('v808_user', JSON.stringify(user));
      renderUserInfo();
      show(saveSuccess);
      setTimeout(closeEdit, 1400);
    } catch {
      if (saveErrorMsg) saveErrorMsg.textContent = 'Something went wrong. Please try again.';
      show(saveError);
    } finally {
      if (saveProfileBtn) saveProfileBtn.disabled = false;
      hide(saveSpinner);
    }
  });

  // ── ADD ADDRESS ───────────────────────────────────────────────

  addAddressBtn?.addEventListener('click', () => {
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
      <p id="addr-error" style="font-size:12px;color:#b91c1c;display:none;"></p>`;

    addAddressBtn.after(form);
    document.getElementById('addr-cancel-btn').addEventListener('click', () => form.remove());

    document.getElementById('addr-save-btn').addEventListener('click', async () => {
      const label    = document.getElementById('addr-label').value.trim();
      const street   = document.getElementById('addr-street').value.trim();
      const city     = document.getElementById('addr-city').value.trim();
      const province = document.getElementById('addr-province').value;
      const postal   = document.getElementById('addr-postal').value.trim();
      const errEl    = document.getElementById('addr-error');

      if (!street || !city || !province || !postal) {
        errEl.textContent = 'Please fill in all required fields.';
        errEl.style.display = 'block';
        return;
      }

      try {
        const res = await fetch(`${API}/api/auth/addresses`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ label, street, city, province, postal }),
        });
        if (!res.ok) { errEl.textContent = 'Could not save address.'; errEl.style.display = 'block'; return; }
        form.remove();
        fetchAddresses().then(renderAddresses);
      } catch {
        errEl.textContent = 'Something went wrong.';
        errEl.style.display = 'block';
      }
    });
  });

  // ── LOGOUT ────────────────────────────────────────────────────

  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('v808_token');
    localStorage.removeItem('v808_user');
    sessionStorage.clear();
    window.location.href = './index.html';
  });

  // ── BOOT ──────────────────────────────────────────────────────

  renderUserInfo();
  fetchOrders().then(renderOrders);
  fetchAddresses().then(renderAddresses);

})();
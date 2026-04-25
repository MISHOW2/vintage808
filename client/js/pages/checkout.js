/* ============================================================
   Vintage808 — js/pages/account.js  (full upgrade)
   Features: order tracker, buy again, collapsible orders,
   stats header, address edit/default, phone + DOB profile,
   size preferences, newsletter toggle, return requests,
   recently viewed (localStorage)
   ============================================================ */

(function () {
  'use strict';

  const API     = 'https://vintage808-api.vercel.app';
  const token   = localStorage.getItem('v808_token');
  const userRaw = localStorage.getItem('v808_user');

  // ── Auth guard ───────────────────────────────────────────────
  if (!token || !userRaw) {
    sessionStorage.setItem('v808_return', './account.html');
    window.location.replace('./login.html');
    return;
  }

  let user;
  try { user = JSON.parse(userRaw); }
  catch {
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

  // ── DOM refs ─────────────────────────────────────────────────
  const avatarInitials   = document.getElementById('avatar-initials');
  const avatarName       = document.getElementById('avatar-name');
  const avatarEmail      = document.getElementById('avatar-email');
  const profileNameDisp  = document.getElementById('profile-name-display');
  const profileEmailDisp = document.getElementById('profile-email-display');
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
  const editPhone        = document.getElementById('edit-phone');
  const editDob          = document.getElementById('edit-dob');
  const editNewPw        = document.getElementById('edit-new-pw');
  const editConfirmPw    = document.getElementById('edit-confirm-pw');
  const ordersList       = document.getElementById('orders-list');
  const ordersStats      = document.getElementById('orders-stats');
  const addressesList    = document.getElementById('addresses-list');
  const addAddressBtn    = document.getElementById('add-address-btn');
  const returnsList      = document.getElementById('returns-list');
  const logoutBtn        = document.getElementById('logout-btn');
  const navItems         = document.querySelectorAll('.account-nav-item');

  // ── Helpers ──────────────────────────────────────────────────
  function getInitials(f, l) {
    return ((f?.[0] ?? '') + (l?.[0] ?? '')).toUpperCase() || '??';
  }

  function formatStatus(s) {
    return { pending:'Pending', confirmed:'Confirmed', processing:'Processing',
             shipped:'Shipped', delivered:'Delivered', cancelled:'Cancelled',
             paid:'Paid', failed:'Failed' }[s] ?? 'Pending';
  }

  function fmt(n) { return `R${Number(n || 0).toFixed(2)}`; }
  function fmtDate(d) {
    return new Date(d).toLocaleDateString('en-ZA', { year:'numeric', month:'short', day:'numeric' });
  }

  function show(el) { el?.classList.remove('hidden'); }
  function hide(el) { el?.classList.add('hidden'); }

  function apiFetch(path, opts = {}) {
    return fetch(`${API}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts.headers ?? {}),
      },
      ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
    }).then(r => r.json());
  }

  // ── Order status steps ────────────────────────────────────────
  const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

  function orderStatusTracker(status) {
    if (status === 'cancelled') {
      return `<div class="order-tracker order-tracker--cancelled">
        <span class="tracker-cancelled-icon">✕</span>
        <span class="tracker-cancelled-label">Order Cancelled</span>
      </div>`;
    }
    const current = STATUS_STEPS.indexOf(status);
    return `<div class="order-tracker">
      ${STATUS_STEPS.map((step, i) => `
        <div class="tracker-step ${i <= current ? 'done' : ''} ${i === current ? 'active' : ''}">
          <div class="tracker-dot">
            ${i < current ? `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
          </div>
          ${i < STATUS_STEPS.length - 1 ? `<div class="tracker-line ${i < current ? 'done' : ''}"></div>` : ''}
          <span class="tracker-label">${formatStatus(step)}</span>
        </div>
      `).join('')}
    </div>`;
  }

  // ── Render user info ──────────────────────────────────────────
  function renderUserInfo() {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (avatarInitials)   avatarInitials.textContent  = getInitials(user.firstName, user.lastName);
    if (avatarName)       avatarName.textContent       = fullName || user.email;
    if (avatarEmail)      avatarEmail.textContent      = user.email;
    if (profileNameDisp)  profileNameDisp.textContent  = fullName || '—';
    if (profileEmailDisp) profileEmailDisp.textContent = user.email || '—';
    if (profileSinceDisp) profileSinceDisp.textContent = user.memberSince || '—';

    // Phone + DOB display
    const phoneDisp = document.getElementById('profile-phone-display');
    const dobDisp   = document.getElementById('profile-dob-display');
    if (phoneDisp) phoneDisp.textContent = user.phone || '—';
    if (dobDisp)   dobDisp.textContent   = user.dateOfBirth
      ? new Date(user.dateOfBirth).toLocaleDateString('en-ZA', { year:'numeric', month:'long', day:'numeric' })
      : '—';
  }

  // ── Render orders ─────────────────────────────────────────────
  function renderOrders(orders = []) {
    if (!ordersList) return;

    // Stats bar
    if (ordersStats && orders.length) {
      const totalSpent = orders.reduce((s, o) => s + Number(o.total || 0), 0);
      ordersStats.innerHTML = `
        <div class="orders-stat"><span class="orders-stat-val">${orders.length}</span><span class="orders-stat-key">Orders</span></div>
        <div class="orders-stat-divider"></div>
        <div class="orders-stat"><span class="orders-stat-val">${fmt(totalSpent)}</span><span class="orders-stat-key">Total spent</span></div>
        <div class="orders-stat-divider"></div>
        <div class="orders-stat"><span class="orders-stat-val">${formatStatus(orders[0]?.orderStatus || orders[0]?.status || 'pending')}</span><span class="orders-stat-key">Latest status</span></div>
      `;
      show(ordersStats);
    }

    if (!orders.length) {
      ordersList.innerHTML = `
        <div class="account-empty">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          <p>No orders yet.</p>
          <a class="account-btn-secondary" href="shop.html">Browse the Shop</a>
        </div>`;
      return;
    }

    ordersList.innerHTML = orders.map((order, idx) => {
      const status   = order.orderStatus || order.status || 'pending';
      const orderId  = (order._id || order.id || '').toString();
      const orderRef = `#${orderId.slice(-6).toUpperCase()}`;
      const tracking = order.tracking;
      const canReturn = ['delivered'].includes(status);

      return `
        <div class="order-card" id="order-card-${idx}">
          <div class="order-card-header" onclick="toggleOrder(${idx})">
            <div class="order-card-header-left">
              <span class="order-id">${orderRef}</span>
              <span class="order-date">${fmtDate(order.createdAt)}</span>
            </div>
            <div class="order-card-header-right">
              <span class="order-status order-status--${status}">${formatStatus(status)}</span>
              <svg class="order-chevron" id="chevron-${idx}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
          </div>

          <div class="order-card-body" id="order-body-${idx}" style="display:none;">

            ${orderStatusTracker(status)}

            ${tracking?.number ? `
              <div class="order-tracking">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                <span>${tracking.courier ? `${tracking.courier} · ` : ''}${tracking.number}</span>
                ${tracking.url ? `<a href="${tracking.url}" target="_blank" rel="noopener" class="tracking-link">Track →</a>` : ''}
              </div>
            ` : ''}

            <div class="order-items-list">
              ${(order.items || []).map(item => `
                <div class="order-item">
                  <div class="order-item-img">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}" loading="lazy" />` : ''}
                  </div>
                  <div class="order-item-info">
                    <div class="order-item-name">${item.name}</div>
                    <div class="order-item-meta">Size: ${item.size ?? '—'} · Qty: ${item.quantity ?? item.qty ?? 1}</div>
                  </div>
                  <span class="order-item-price">${fmt(Number(item.price) * (item.quantity ?? item.qty ?? 1))}</span>
                </div>
              `).join('')}
            </div>

            <div class="order-card-footer">
              <div class="order-footer-actions">
                <button class="account-btn-secondary btn-sm" onclick="buyAgain('${orderId}')">Buy Again</button>
                ${canReturn ? `<button class="account-btn-ghost btn-sm" onclick="openReturnModal('${orderId}', '${orderRef}', ${JSON.stringify(order.items || []).replace(/"/g, '&quot;')})">Request Return</button>` : ''}
              </div>
              <div class="order-footer-total">
                <span class="order-total-label">Order Total</span>
                <span class="order-total-amount">${fmt(order.total)}</span>
              </div>
            </div>

          </div>
        </div>
      `;
    }).join('');

    // Auto-open first order
    if (orders.length) toggleOrder(0);
  }

  window.toggleOrder = function (idx) {
    const body    = document.getElementById(`order-body-${idx}`);
    const chevron = document.getElementById(`chevron-${idx}`);
    if (!body) return;
    const open = body.style.display !== 'none';
    body.style.display    = open ? 'none' : 'block';
    chevron.style.transform = open ? '' : 'rotate(180deg)';
  };

  // ── Buy Again ─────────────────────────────────────────────────
  window.buyAgain = function (orderId) {
    const orders = window._v808_orders || [];
    const order  = orders.find(o => (o._id || o.id) === orderId);
    if (!order?.items?.length) return;

    const cart = JSON.parse(localStorage.getItem('v808_cart') || '[]');
    order.items.forEach(item => {
      const exists = cart.find(c => c.productId === item.productId && c.size === item.size);
      if (exists) exists.qty = (exists.qty || 1) + (item.quantity || 1);
      else cart.push({
        productId: item.productId,
        name:      item.name,
        price:     item.price,
        size:      item.size,
        image:     item.image,
        qty:       item.quantity || 1,
      });
    });
    localStorage.setItem('v808_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('v808:cart-updated'));
    showToast('Items added to cart');
  };

  // ── Render addresses ──────────────────────────────────────────
  function renderAddresses(addresses = []) {
    if (!addressesList) return;
    if (!addresses.length) {
      addressesList.innerHTML = '<p class="account-empty-text">No saved addresses.</p>';
      return;
    }
    addressesList.innerHTML = addresses.map(addr => `
      <div class="address-card ${addr.isDefault ? 'address-card--default' : ''}">
        <div class="address-card-top">
          <div class="address-card-label">
            ${addr.isDefault ? '<span class="address-default-badge">Default</span>' : ''}
            ${addr.label || 'Address'}
          </div>
          <div class="address-card-actions">
            ${!addr.isDefault ? `<button class="address-action-btn" onclick="setDefaultAddress('${addr._id}')">Set default</button>` : ''}
            <button class="address-action-btn" onclick="editAddress('${addr._id}')">Edit</button>
            <button class="address-action-btn address-action-btn--danger" onclick="deleteAddress('${addr._id}')">Remove</button>
          </div>
        </div>
        <div class="address-text">
          ${addr.street}<br/>
          ${addr.city}, ${addr.province}<br/>
          ${addr.postal}
        </div>
      </div>
    `).join('');
  }

  window.setDefaultAddress = async function (id) {
    await apiFetch(`/api/auth/addresses/${id}/default`, { method: 'PUT' });
    fetchAddresses().then(renderAddresses);
  };

  window.deleteAddress = async function (id) {
    if (!confirm('Remove this address?')) return;
    await apiFetch(`/api/auth/addresses/${id}`, { method: 'DELETE' });
    fetchAddresses().then(renderAddresses);
  };

  window.editAddress = function (id) {
    // Fetch current addresses and pre-fill the form
    apiFetch('/api/auth/addresses').then(data => {
      const addr = (data.data || []).find(a => a._id === id);
      if (!addr) return;
      openAddressForm(addr);
    });
  };

  function openAddressForm(existing = null) {
    const old = document.getElementById('add-address-form');
    if (old) old.remove();

    const form = document.createElement('div');
    form.id = 'add-address-form';
    form.className = 'address-form';
    form.innerHTML = `
      <div class="address-form-grid">
        <input class="edit-input" id="addr-label"    placeholder="Label (e.g. Home)" value="${existing?.label || ''}" />
        <input class="edit-input" id="addr-street"   placeholder="Street address"    value="${existing?.street || ''}" />
        <input class="edit-input" id="addr-city"     placeholder="City"              value="${existing?.city || ''}" />
        <input class="edit-input" id="addr-postal"   placeholder="Postal code"       value="${existing?.postal || ''}" />
        <select class="edit-input" id="addr-province">
          <option value="" disabled ${!existing?.province ? 'selected' : ''}>Province</option>
          ${['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Limpopo','Mpumalanga','North West','Free State','Northern Cape']
            .map(p => `<option ${existing?.province === p ? 'selected' : ''}>${p}</option>`).join('')}
        </select>
        <label class="toggle-row">
          <input type="checkbox" id="addr-default" ${existing?.isDefault ? 'checked' : ''} />
          <span>Set as default address</span>
        </label>
      </div>
      <p id="addr-error" class="form-error" style="display:none;"></p>
      <div class="address-form-actions">
        <button id="addr-save-btn" class="account-btn-primary">${existing ? 'Save changes' : 'Add address'}</button>
        <button id="addr-cancel-btn" class="account-btn-secondary">Cancel</button>
      </div>
    `;

    addAddressBtn?.after(form);
    document.getElementById('addr-cancel-btn').addEventListener('click', () => form.remove());
    document.getElementById('addr-save-btn').addEventListener('click', async () => {
      const label    = document.getElementById('addr-label').value.trim();
      const street   = document.getElementById('addr-street').value.trim();
      const city     = document.getElementById('addr-city').value.trim();
      const province = document.getElementById('addr-province').value;
      const postal   = document.getElementById('addr-postal').value.trim();
      const isDefault = document.getElementById('addr-default').checked;
      const errEl    = document.getElementById('addr-error');

      if (!street || !city || !province || !postal) {
        errEl.textContent = 'Please fill in all required fields.';
        errEl.style.display = 'block';
        return;
      }

      const body = { label, street, city, province, postal, isDefault };
      if (existing) {
        await apiFetch(`/api/auth/addresses/${existing._id}`, { method: 'PUT', body });
      } else {
        await apiFetch('/api/auth/addresses', { method: 'POST', body });
      }
      form.remove();
      fetchAddresses().then(renderAddresses);
    });
  }

  addAddressBtn?.addEventListener('click', () => {
    const existing = document.getElementById('add-address-form');
    if (existing) { existing.remove(); return; }
    openAddressForm();
  });

  // ── Render returns ────────────────────────────────────────────
  function renderReturns(returns = []) {
    if (!returnsList) return;
    if (!returns.length) {
      returnsList.innerHTML = '<p class="account-empty-text">No return requests.</p>';
      return;
    }
    returnsList.innerHTML = returns.map(r => `
      <div class="return-card">
        <div class="return-card-header">
          <span class="order-id">${r.orderRef}</span>
          <span class="return-date">${fmtDate(r.createdAt)}</span>
          <span class="order-status order-status--${r.status}">${formatStatus(r.status)}</span>
        </div>
        <div class="return-reason"><strong>Reason:</strong> ${r.reason}</div>
        ${r.comments ? `<div class="return-comments">${r.comments}</div>` : ''}
        <div class="return-items">
          ${(r.items || []).map(i => `<span class="return-item-pill">${i.name} · ${i.size ?? '—'} × ${i.quantity ?? 1}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  // ── Return modal ──────────────────────────────────────────────
  window.openReturnModal = function (orderId, orderRef, itemsJson) {
    let items;
    try { items = typeof itemsJson === 'string' ? JSON.parse(itemsJson.replace(/&quot;/g, '"')) : itemsJson; }
    catch { items = []; }

    const existing = document.getElementById('return-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'return-modal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Request Return — ${orderRef}</h3>
          <button class="modal-close" onclick="document.getElementById('return-modal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-field">
            <label class="edit-label">Items to return</label>
            <div class="return-item-checks">
              ${items.map((item, i) => `
                <label class="toggle-row">
                  <input type="checkbox" class="return-item-cb" value="${i}" checked />
                  <span>${item.name} · ${item.size ?? '—'} × ${item.quantity ?? 1}</span>
                </label>
              `).join('')}
            </div>
          </div>
          <div class="form-field">
            <label class="edit-label" for="return-reason">Reason *</label>
            <select class="edit-input" id="return-reason">
              <option value="" disabled selected>Select a reason</option>
              <option>Wrong size</option>
              <option>Damaged / defective</option>
              <option>Not as described</option>
              <option>Changed my mind</option>
              <option>Other</option>
            </select>
          </div>
          <div class="form-field">
            <label class="edit-label" for="return-comments">Additional comments</label>
            <textarea class="edit-input" id="return-comments" rows="3" placeholder="Optional details…" style="resize:vertical;"></textarea>
          </div>
          <p id="return-error" class="form-error" style="display:none;"></p>
        </div>
        <div class="modal-footer">
          <button class="account-btn-secondary" onclick="document.getElementById('return-modal').remove()">Cancel</button>
          <button class="account-btn-primary" id="return-submit-btn">Submit Request</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('return-submit-btn').addEventListener('click', async () => {
      const reason   = document.getElementById('return-reason').value;
      const comments = document.getElementById('return-comments').value.trim();
      const errEl    = document.getElementById('return-error');
      const checked  = [...document.querySelectorAll('.return-item-cb:checked')].map(cb => items[Number(cb.value)]);

      if (!reason)         { errEl.textContent = 'Please select a reason.';        errEl.style.display = 'block'; return; }
      if (!checked.length) { errEl.textContent = 'Select at least one item.';      errEl.style.display = 'block'; return; }

      const btn = document.getElementById('return-submit-btn');
      btn.disabled    = true;
      btn.textContent = 'Submitting…';

      try {
        const res = await apiFetch('/api/auth/returns', {
          method: 'POST',
          body:   { orderId, items: checked, reason, comments },
        });
        if (res.success) {
          modal.remove();
          showToast('Return request submitted');
          fetchReturns().then(renderReturns);
          switchTab('returns');
        } else {
          errEl.textContent    = res.message || 'Failed to submit.';
          errEl.style.display  = 'block';
          btn.disabled         = false;
          btn.textContent      = 'Submit Request';
        }
      } catch {
        errEl.textContent   = 'Something went wrong.';
        errEl.style.display = 'block';
        btn.disabled        = false;
        btn.textContent     = 'Submit Request';
      }
    });

    // Close on backdrop click
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  };

  // ── Recently viewed ───────────────────────────────────────────
  function renderRecentlyViewed() {
    const recentEl = document.getElementById('recently-viewed-list');
    if (!recentEl) return;
    const items = JSON.parse(localStorage.getItem('v808_recently_viewed') || '[]');
    if (!items.length) {
      recentEl.innerHTML = '<p class="account-empty-text">No recently viewed items.</p>';
      return;
    }
    recentEl.innerHTML = items.slice(0, 8).map(p => `
      <a href="./product.html?id=${p.id}" class="recent-product-card">
        <div class="recent-product-img">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" loading="lazy" />` : ''}
        </div>
        <div class="recent-product-name">${p.name}</div>
        <div class="recent-product-price">${fmt(p.price)}</div>
      </a>
    `).join('');
  }

  // ── Preferences ───────────────────────────────────────────────
  function renderPreferences(prefs = {}) {
    const sizesEl     = document.getElementById('pref-sizes');
    const newsletterEl = document.getElementById('pref-newsletter');
    const smsEl       = document.getElementById('pref-sms');

    if (sizesEl) {
      const saved = prefs.sizes || [];
      sizesEl.querySelectorAll('input[type=checkbox]').forEach(cb => {
        cb.checked = saved.includes(cb.value);
      });
    }
    if (newsletterEl) newsletterEl.checked = prefs.newsletter ?? false;
    if (smsEl)        smsEl.checked        = prefs.smsMarketing ?? false;
  }

  async function savePreferences() {
    const sizesEl = document.getElementById('pref-sizes');
    const sizes   = sizesEl
      ? [...sizesEl.querySelectorAll('input:checked')].map(cb => cb.value)
      : [];
    const newsletter   = document.getElementById('pref-newsletter')?.checked ?? false;
    const smsMarketing = document.getElementById('pref-sms')?.checked ?? false;

    await apiFetch('/api/auth/preferences', {
      method: 'PUT',
      body:   { sizes, newsletter, smsMarketing },
    });
    showToast('Preferences saved');
  }

  document.getElementById('save-prefs-btn')?.addEventListener('click', savePreferences);

  // ── API calls ─────────────────────────────────────────────────
  async function fetchOrders() {
    try {
      const data = await apiFetch('/api/orders');
      const all  = data.data ?? data.orders ?? [];
      return all.filter(o =>
        o.customerEmail === user.email ||
        o.userId === (user._id || user.id)
      );
    } catch { return []; }
  }

  async function fetchAddresses() {
    try {
      const data = await apiFetch('/api/auth/addresses');
      return data.data ?? [];
    } catch { return []; }
  }

  async function fetchReturns() {
    try {
      const data = await apiFetch('/api/auth/returns');
      return data.data ?? [];
    } catch { return []; }
  }

  async function fetchPreferences() {
    try {
      const data = await apiFetch('/api/auth/preferences');
      return data.data ?? {};
    } catch { return {}; }
  }

  // ── Tab switching ─────────────────────────────────────────────
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

  // ── Edit profile ──────────────────────────────────────────────
  function openEdit() {
    if (editFirstName) editFirstName.value = user.firstName ?? '';
    if (editLastName)  editLastName.value  = user.lastName  ?? '';
    if (editEmail)     editEmail.value     = user.email     ?? '';
    if (editPhone)     editPhone.value     = user.phone     ?? '';
    if (editDob && user.dateOfBirth) {
      editDob.value = new Date(user.dateOfBirth).toISOString().slice(0, 10);
    }
    if (editNewPw)     editNewPw.value     = '';
    if (editConfirmPw) editConfirmPw.value = '';
    hide(saveSuccess); hide(saveError);
    hide(profileView); show(profileEdit);
  }

  function closeEdit() { hide(profileEdit); show(profileView); }

  editProfileBtn?.addEventListener('click', openEdit);
  cancelEditBtn?.addEventListener('click', closeEdit);

  saveProfileBtn?.addEventListener('click', async () => {
    hide(saveSuccess); hide(saveError);

    const newFirst  = editFirstName?.value.trim();
    const newLast   = editLastName?.value.trim();
    const newEmail  = editEmail?.value.trim();
    const newPhone  = editPhone?.value.trim();
    const newDob    = editDob?.value;
    const newPw     = editNewPw?.value;
    const confirmPw = editConfirmPw?.value;

    if (!newFirst || !newEmail) {
      if (saveErrorMsg) saveErrorMsg.textContent = 'First name and email are required.';
      show(saveError); return;
    }
    if (newPw && newPw !== confirmPw) {
      if (saveErrorMsg) saveErrorMsg.textContent = 'New passwords do not match.';
      show(saveError); return;
    }
    if (newPw && newPw.length < 8) {
      if (saveErrorMsg) saveErrorMsg.textContent = 'Password must be at least 8 characters.';
      show(saveError); return;
    }

    if (saveProfileBtn) saveProfileBtn.disabled = true;
    show(saveSpinner);

    try {
      const body = { firstName: newFirst, lastName: newLast, email: newEmail, phone: newPhone };
      if (newDob)    body.dateOfBirth = newDob;
      if (newPw)     body.password    = newPw;

      const res = await apiFetch('/api/auth/profile', { method: 'PUT', body });

      if (!res.success) {
        if (saveErrorMsg) saveErrorMsg.textContent = res.message || 'Could not save changes.';
        show(saveError); return;
      }

      user.firstName   = newFirst;
      user.lastName    = newLast;
      user.email       = newEmail;
      user.phone       = newPhone;
      user.dateOfBirth = newDob;
      localStorage.setItem('v808_user', JSON.stringify(user));
      renderUserInfo();
      show(saveSuccess);
      setTimeout(closeEdit, 1400);
    } catch {
      if (saveErrorMsg) saveErrorMsg.textContent = 'Something went wrong.';
      show(saveError);
    } finally {
      if (saveProfileBtn) saveProfileBtn.disabled = false;
      hide(saveSpinner);
    }
  });

  // ── Toast ─────────────────────────────────────────────────────
  function showToast(msg) {
    let t = document.getElementById('v808-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'v808-toast';
      t.className = 'v808-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
  }

  // ── Logout ─────────────────────────────────────────────────────
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('v808_token');
    localStorage.removeItem('v808_user');
    sessionStorage.clear();
    window.location.href = './index.html';
  });

  // ── Boot ───────────────────────────────────────────────────────
  renderUserInfo();
  fetchOrders().then(orders => {
    window._v808_orders = orders;
    renderOrders(orders);
  });
  fetchAddresses().then(renderAddresses);
  fetchReturns().then(renderReturns);
  fetchPreferences().then(renderPreferences);
  renderRecentlyViewed();

})();
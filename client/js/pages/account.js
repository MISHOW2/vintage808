/* ============================================================
   Vintage808 — assets/js/pages/account.js
   ============================================================ */

(function () {
  'use strict';

  // ── Auth guard ───────────────────────────────────────────────
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

  // Normalise field names — handle {firstName,lastName} or {name}
  if (!user.firstName && user.name) {
    const parts   = user.name.split(' ');
    user.firstName = parts[0] ?? '';
    user.lastName  = parts.slice(1).join(' ') ?? '';
  }

  if (user.createdAt) {
    user.memberSince = new Date(user.createdAt)
      .toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  }

  /* ── DOM refs ──────────────────────────────────────────────── */
  const avatarInitials    = document.getElementById('avatar-initials');
  const avatarName        = document.getElementById('avatar-name');
  const avatarEmail       = document.getElementById('avatar-email');
  const profileNameDisp   = document.getElementById('profile-name-display');
  const profileEmailDisp  = document.getElementById('profile-email-display');
  const profileSinceDisp  = document.getElementById('profile-since-display');
  const profileView       = document.getElementById('profile-view');
  const profileEdit       = document.getElementById('profile-edit');
  const editProfileBtn    = document.getElementById('edit-profile-btn');
  const cancelEditBtn     = document.getElementById('cancel-edit-btn');
  const saveProfileBtn    = document.getElementById('save-profile-btn');
  const saveSuccess       = document.getElementById('save-success');
  const saveError         = document.getElementById('save-error');
  const saveErrorMsg      = document.getElementById('save-error-msg');
  const saveSpinner       = document.getElementById('save-spinner');
  const editFirstName     = document.getElementById('edit-first-name');
  const editLastName      = document.getElementById('edit-last-name');
  const editEmail         = document.getElementById('edit-email');
  const editCurrentPw     = document.getElementById('edit-current-pw');
  const editNewPw         = document.getElementById('edit-new-pw');
  const editConfirmPw     = document.getElementById('edit-confirm-pw');
  const ordersList        = document.getElementById('orders-list');
  const addressesList     = document.getElementById('addresses-list');
  const addAddressBtn     = document.getElementById('add-address-btn');
  const logoutBtn         = document.getElementById('logout-btn');
  const navItems          = document.querySelectorAll('.account-nav-item');

  /* ── Helpers ───────────────────────────────────────────────── */
  function getInitials(first, last) {
    return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase() || '??';
  }

  function formatStatus(s) {
    return { paid: 'Paid', pending: 'Pending', failed: 'Failed' }[s] ?? s;
  }

  function show(el) { el?.classList.remove('hidden'); }
  function hide(el) { el?.classList.add('hidden'); }

  /* ── Render ────────────────────────────────────────────────── */
  function renderUserInfo() {
    const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
    if (avatarInitials)   avatarInitials.textContent  = getInitials(user.firstName, user.lastName);
    if (avatarName)       avatarName.textContent       = fullName || user.email;
    if (avatarEmail)      avatarEmail.textContent      = user.email;
    if (profileNameDisp)  profileNameDisp.textContent  = fullName || '—';
    if (profileEmailDisp) profileEmailDisp.textContent = user.email || '—';
    if (profileSinceDisp) profileSinceDisp.textContent = user.memberSince || '—';
  }

function renderOrders(orders = []) {
  if (!ordersList) return;

  if (!orders.length) {
    ordersList.innerHTML = '<p style="font-size:14px;color:var(--mid);padding:24px 0 12px;">No orders yet.</p>';
    return;
  }

  ordersList.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-card-header">
        <span class="order-id">#${order.id}</span>
        <span class="order-date">${new Date(order.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
        <span class="order-status order-status--${order.status}">${formatStatus(order.status)}</span>
      </div>
      <div class="order-card-body">
        ${order.items.map(item => `
          <div class="order-item">
            <div class="order-item-img" style="background:var(--sand);">
              ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:2px;">` : ''}
            </div>
            <div class="order-item-info">
              <div class="order-item-name">${item.name}</div>
              <div class="order-item-meta">Size: ${item.size ?? '—'} · Qty: ${item.qty}</div>
            </div>
            <span class="order-item-price">R${(item.price * item.qty).toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
      <div class="order-card-footer">
        <span class="order-total-label">Order Total</span>
        <span class="order-total-amount">R${order.total.toFixed(2)}</span>
      </div>
    </div>
  `).join('');
}
  function renderAddresses(addresses = []) {
    if (!addressesList) return;
    if (!addresses.length) {
      addressesList.innerHTML = '<p style="font-size:14px;color:var(--mid);padding:24px 0 12px;">No saved addresses.</p>';
      return;
    }
    addressesList.innerHTML = addresses.map(addr => `
      <div class="address-card">
        <div class="address-label">${addr.label}</div>
        <div class="address-text">${addr.lines.join('<br>')}</div>
      </div>
    `).join('');
  }


// ── API calls ─────────────────────────────────────────────────

async function fetchOrders() {
  try {
    const res = await fetch('https://vintage808-api.vercel.app/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const allOrders = data.data ?? data.orders ?? data ?? [];

    // filter by customerEmail not customer.email
    return allOrders.filter(o => o.customerEmail === user.email);
  } catch { return []; }
}

async function fetchOrders() {
  try {
    const res = await fetch('https://vintage808-api.vercel.app/api/orders', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const allOrders = data.data ?? data.orders ?? data ?? [];

    // filter by customerEmail not customer.email
    return allOrders.filter(o => o.customerEmail === user.email);
  } catch { return []; }
}
  /* ── Tab switching ─────────────────────────────────────────── */
  function switchTab(tabName) {
    document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
    navItems.forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabName}`)?.classList.add('active');
    document.querySelector(`.account-nav-item[data-tab="${tabName}"]`)?.classList.add('active');
    sessionStorage.setItem('account_tab', tabName);
  }
// fetch real addresses
async function fetchAddresses() {
  try {
    const res = await fetch(`${API}/auth/addresses`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.data ?? []).map((a, i) => ({
      _id:   a._id,
      label: a.label || `Address ${i + 1}`,
      lines: [a.street, `${a.city}, ${a.province}`, a.postal]
    }));
  } catch { return []; }
}

// render with delete button
function renderAddresses(addresses = []) {
  if (!addressesList) return;
  if (!addresses.length) {
    addressesList.innerHTML = '<p style="font-size:14px;color:var(--mid);padding:24px 0 12px;">No saved addresses.</p>';
    return;
  }
  addressesList.innerHTML = addresses.map(addr => `
    <div class="address-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <div class="address-label">${addr.label}</div>
        <button class="address-delete-btn" data-id="${addr._id}" style="background:none;border:none;font-size:12px;color:var(--mid);cursor:pointer;text-decoration:underline;">Remove</button>
      </div>
      <div class="address-text">${addr.lines.join('<br>')}</div>
    </div>
  `).join('');

  // bind delete buttons
  addressesList.querySelectorAll('.address-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Remove this address?')) return;
      try {
        await fetch(`${API}/auth/addresses/${btn.dataset.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchAddresses().then(renderAddresses);
      } catch { alert('Could not remove address.'); }
    });
  });
}
  navItems.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
  const savedTab = sessionStorage.getItem('account_tab');
  if (savedTab) switchTab(savedTab);

  /* ── Edit profile ──────────────────────────────────────────── */
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

      const res = await fetch('http://localhost:5000/api/auth/profile', {  // ← change this line
        method:  'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (saveErrorMsg) saveErrorMsg.textContent = data.message || 'Could not save changes.';
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

// add address form
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
      <input class="edit-input" id="addr-postal"  placeholder="Postal code" />
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
      <button id="addr-save-btn" class="account-btn-primary" style="flex:1;">Save address</button>
      <button id="addr-cancel-btn" class="account-btn-secondary" style="flex:1;">Cancel</button>
    </div>
    <p id="addr-error" style="font-size:12px;color:#b91c1c;display:none;"></p>
  `;

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
      errEl.textContent = 'Please fill in all fields.';
      errEl.style.display = 'block';
      return;
    }

    try {
      const res = await fetch(`${API}/auth/addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ label, street, city, province, postal }),
      });

      if (!res.ok) {
        errEl.textContent = 'Could not save address.';
        errEl.style.display = 'block';
        return;
      }

      form.remove();
      fetchAddresses().then(renderAddresses);
    } catch {
      errEl.textContent = 'Something went wrong.';
      errEl.style.display = 'block';
    }
  });
});

  /* ── Logout ─────────────────────────────────────────────────── */
  logoutBtn?.addEventListener('click', () => {
    localStorage.removeItem('v808_token');
    localStorage.removeItem('v808_user');
    sessionStorage.clear();
    window.location.href = './index.html';
  });

  /* ── Boot ───────────────────────────────────────────────────── */
  renderUserInfo();
  fetchOrders().then(renderOrders);
  fetchAddresses().then(renderAddresses);

})();
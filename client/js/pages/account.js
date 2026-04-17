/* ============================================================
   Vintage808 — assets/js/pages/account.js
   ============================================================ */

(function () {
  'use strict';

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

  /* ── Mock user data (replace with real API calls) ──────────── */
  const user = {
    firstName:   'John',
    lastName:    'Doe',
    email:       'john@example.com',
    memberSince: 'March 2024',
  };

  const mockOrders = [
    {
      id: '#V808-00142',
      date: '12 March 2025',
      status: 'paid',
      items: [
        { name: "Levi's 501 Original — Stonewash", meta: 'Size W32 L30 · Qty 1', price: 'R 1,250', bg: '#d4c8bc' },
        { name: 'Vintage Polo Shirt — Cream',       meta: 'Size M · Qty 1',       price: 'R 480',   bg: '#c9bfb3' },
      ],
      total: 'R 1,730',
    },
    {
      id: '#V808-00098',
      date: '5 January 2025',
      status: 'paid',
      items: [
        { name: '90s Windbreaker — Forest Green', meta: 'Size L · Qty 1', price: 'R 920', bg: '#bfb5a8' },
      ],
      total: 'R 920',
    },
  ];

  const mockAddresses = [
    {
      label: 'Default Shipping Address',
      lines: ['John Doe', '14 Long Street', 'Cape Town, Western Cape', '8001, South Africa'],
    },
  ];

  /* ── Helpers ───────────────────────────────────────────────── */
  function getInitials(first, last) {
    return ((first?.[0] ?? '') + (last?.[0] ?? '')).toUpperCase();
  }

  function formatStatus(status) {
    const map = { paid: 'Paid', pending: 'Pending', failed: 'Failed' };
    return map[status] ?? status;
  }

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  /* ── Populate sidebar & profile view ──────────────────────── */
  function renderUserInfo() {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    avatarInitials.textContent   = getInitials(user.firstName, user.lastName);
    avatarName.textContent        = fullName;
    avatarEmail.textContent       = user.email;
    profileNameDisp.textContent   = fullName;
    profileEmailDisp.textContent  = user.email;
    profileSinceDisp.textContent  = user.memberSince;
  }

  /* ── Populate orders ───────────────────────────────────────── */
  function renderOrders() {
    if (!mockOrders.length) return; // keep empty-state markup

    ordersList.innerHTML = mockOrders.map(order => `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-id">${order.id}</span>
          <span class="order-date">${order.date}</span>
          <span class="order-status order-status--${order.status}">${formatStatus(order.status)}</span>
        </div>
        <div class="order-card-body">
          ${order.items.map(item => `
            <div class="order-item">
              <div class="order-item-img" style="background:${item.bg};"></div>
              <div class="order-item-info">
                <div class="order-item-name">${item.name}</div>
                <div class="order-item-meta">${item.meta}</div>
              </div>
              <span class="order-item-price">${item.price}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-card-footer">
          <span class="order-total-label">Order Total</span>
          <span class="order-total-amount">${order.total}</span>
        </div>
      </div>
    `).join('');
  }

  /* ── Populate addresses ────────────────────────────────────── */
  function renderAddresses() {
    if (!mockAddresses.length) {
      addressesList.innerHTML = '<p style="font-size:14px;color:var(--mid);padding:24px 0;">No saved addresses.</p>';
      return;
    }

    addressesList.innerHTML = mockAddresses.map(addr => `
      <div class="address-card">
        <div class="address-label">${addr.label}</div>
        <div class="address-text">${addr.lines.join('<br>')}</div>
      </div>
    `).join('');
  }

  /* ── Tab switching ─────────────────────────────────────────── */
  function switchTab(tabName) {
    document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
    navItems.forEach(b => b.classList.remove('active'));

    const tab = document.getElementById(`tab-${tabName}`);
    if (tab) tab.classList.add('active');

    const activeBtn = document.querySelector(`.account-nav-item[data-tab="${tabName}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Persist active tab in session
    sessionStorage.setItem('account_tab', tabName);
  }

  navItems.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Restore last active tab on page load
  const savedTab = sessionStorage.getItem('account_tab');
  if (savedTab) switchTab(savedTab);

  /* ── Edit profile toggle ───────────────────────────────────── */
  function openEdit() {
    editFirstName.value = user.firstName;
    editLastName.value  = user.lastName;
    editEmail.value     = user.email;
    editCurrentPw.value = '';
    editNewPw.value     = '';
    editConfirmPw.value = '';
    hide(saveSuccess);
    hide(saveError);
    hide(profileView);
    show(profileEdit);
  }

  function closeEdit() {
    hide(profileEdit);
    show(profileView);
  }

  editProfileBtn.addEventListener('click', openEdit);
  cancelEditBtn.addEventListener('click', closeEdit);

  /* ── Save profile ──────────────────────────────────────────── */
  saveProfileBtn.addEventListener('click', async () => {
    hide(saveSuccess);
    hide(saveError);

    const newFirst   = editFirstName.value.trim();
    const newLast    = editLastName.value.trim();
    const newEmail   = editEmail.value.trim();
    const newPw      = editNewPw.value;
    const confirmPw  = editConfirmPw.value;

    // Basic validation
    if (!newFirst || !newEmail) {
      saveErrorMsg.textContent = 'First name and email are required.';
      show(saveError);
      return;
    }

    if (newPw && newPw !== confirmPw) {
      saveErrorMsg.textContent = 'New passwords do not match.';
      show(saveError);
      return;
    }

    // Simulate async save
    saveProfileBtn.disabled = true;
    show(saveSpinner);

    await new Promise(resolve => setTimeout(resolve, 800));

    // Commit changes to local user object (replace with real API call)
    user.firstName = newFirst;
    user.lastName  = newLast;
    user.email     = newEmail;

    renderUserInfo();

    saveProfileBtn.disabled = false;
    hide(saveSpinner);
    show(saveSuccess);

    setTimeout(closeEdit, 1400);
  });

  /* ── Add address (placeholder) ─────────────────────────────── */
  addAddressBtn.addEventListener('click', () => {
    alert('Add address form — connect to your backend here.');
  });

  /* ── Logout ─────────────────────────────────────────────────── */
  logoutBtn.addEventListener('click', () => {
    // Clear any auth tokens / session
    localStorage.removeItem('v808_token');
    sessionStorage.clear();
    window.location.href = 'login.html';
  });

  /* ── Init ───────────────────────────────────────────────────── */
  renderUserInfo();
  renderOrders();
  renderAddresses();

})();
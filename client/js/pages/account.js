// js/pages/account.js

const API = 'http://localhost:5000/api';

// ── Auth guard ────────────────────────────────────────────────
const token = localStorage.getItem('v808_token');
const user  = JSON.parse(localStorage.getItem('v808_user') || 'null');

if (!token || !user) {
  sessionStorage.setItem('v808_return', './account.html');
  window.location.href = './login.html';
}

// ── Nav account icon ──────────────────────────────────────────
document.getElementById('nav-account-btn')?.addEventListener('click', () => {
  window.location.href = token ? './account.html' : './login.html';
});

// ── Populate sidebar ──────────────────────────────────────────
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

document.getElementById('avatar-initials').textContent = getInitials(user.name);
document.getElementById('sidebar-name').textContent    = user.name;
document.getElementById('sidebar-email').textContent   = user.email;

// ── Tab switching ─────────────────────────────────────────────
function switchTab(tabName) {
  document.querySelectorAll('.account-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.account-nav-item').forEach(n => n.classList.remove('active'));

  document.getElementById(`tab-${tabName}`)?.classList.add('active');
  document.querySelector(`.account-nav-item[data-tab="${tabName}"]`)?.classList.add('active');
}

document.querySelectorAll('.account-nav-item').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Edit profile shortcut from profile tab
document.querySelectorAll('[data-tab-trigger]').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tabTrigger));
});

// ── Profile tab ───────────────────────────────────────────────
document.getElementById('profile-name').textContent  = user.name;
document.getElementById('profile-email').textContent = user.email;
document.getElementById('profile-since').textContent = user.createdAt
  ? new Date(user.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })
  : '—';

// ── Orders tab ────────────────────────────────────────────────
async function loadOrders() {
  const list  = document.getElementById('orders-list');
  const empty = document.getElementById('orders-empty');

  try {
    const res  = await fetch(`${API}/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    // Filter orders belonging to this user by email
    const myOrders = (data.data || []).filter(o => o.customer?.email === user.email);

    if (myOrders.length === 0) {
      list.style.display  = 'none';
      empty.style.display = 'block';
      return;
    }

    list.innerHTML = myOrders.map(order => `
      <div class="order-card">
        <div class="order-card-header">
          <span class="order-id">Order #${order.id}</span>
          <span class="order-date">${new Date(order.createdAt).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
          <span class="order-status order-status--${order.status}">${order.status}</span>
        </div>
        <div class="order-card-body">
          ${order.items.map(item => `
            <div class="order-item">
              <img class="order-item-img" src="${item.image ?? ''}" alt="${item.name}" onerror="this.style.display='none'" />
              <div class="order-item-info">
                <p class="order-item-name">${item.name}</p>
                <p class="order-item-meta">Size: ${item.size ?? '—'} &nbsp;·&nbsp; Qty: ${item.qty}</p>
              </div>
              <span class="order-item-price">R${(item.price * item.qty).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        <div class="order-card-footer">
          <span class="order-total-label">Total</span>
          <span class="order-total-amount">R${order.total.toFixed(2)}</span>
        </div>
      </div>
    `).join('');

    // Also load addresses from orders
    loadAddresses(myOrders);

  } catch (err) {
    list.innerHTML = '<p style="color:var(--mid);font-size:13px;">Could not load orders.</p>';
  }
}

loadOrders();

// ── Addresses tab ─────────────────────────────────────────────
function loadAddresses(orders) {
  const list  = document.getElementById('addresses-list');
  const empty = document.getElementById('addresses-empty');

  // Unique addresses from order history
  const seen = new Set();
  const addresses = orders
    .map(o => o.address)
    .filter(a => {
      const key = JSON.stringify(a);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  if (addresses.length === 0) {
    list.style.display  = 'none';
    empty.style.display = 'block';
    return;
  }

  list.innerHTML = addresses.map((a, i) => `
    <div class="address-card">
      <p class="address-label">Address ${i + 1}</p>
      <p class="address-text">
        ${a.street}<br/>
        ${a.city}, ${a.province}<br/>
        ${a.postal}
      </p>
    </div>
  `).join('');
}

// ── Edit profile tab ──────────────────────────────────────────
// Pre-fill with current user info
document.getElementById('edit-name').value  = user.name;
document.getElementById('edit-email').value = user.email;

const saveBtn       = document.getElementById('save-profile-btn');
const saveBtnText   = document.getElementById('save-btn-text');
const saveBtnLoader = document.getElementById('save-btn-loader');
const editSuccess   = document.getElementById('edit-success');
const editError     = document.getElementById('edit-error');
const editErrorMsg  = document.getElementById('edit-error-msg');

function setEditLoading(loading) {
  saveBtn.disabled          = loading;
  saveBtnText.style.display  = loading ? 'none' : 'inline';
  saveBtnLoader.style.display = loading ? 'inline-flex' : 'none';
}

function showEditError(msg) {
  editErrorMsg.textContent    = msg;
  editError.style.display     = 'flex';
  editSuccess.style.display   = 'none';
}

function showEditSuccess() {
  editSuccess.style.display = 'flex';
  editError.style.display   = 'none';
}

saveBtn.addEventListener('click', async () => {
  editSuccess.style.display = 'none';
  editError.style.display   = 'none';

  const name      = document.getElementById('edit-name').value.trim();
  const email     = document.getElementById('edit-email').value.trim();
  const currentPw = document.getElementById('edit-current-pw').value;
  const newPw     = document.getElementById('edit-new-pw').value;
  const confirmPw = document.getElementById('edit-confirm-pw').value;

  if (!name || !email) {
    showEditError('Name and email are required.');
    return;
  }

  if (newPw && newPw !== confirmPw) {
    showEditError('New passwords do not match.');
    return;
  }

  if (newPw && !currentPw) {
    showEditError('Please enter your current password to set a new one.');
    return;
  }

  setEditLoading(true);

  try {
    // TODO: wire to PUT /api/auth/me when backend endpoint is ready
    // For now update localStorage
    const updatedUser = { ...user, name, email };
    localStorage.setItem('v808_user', JSON.stringify(updatedUser));

    // Update sidebar and profile tab
    document.getElementById('avatar-initials').textContent = getInitials(name);
    document.getElementById('sidebar-name').textContent    = name;
    document.getElementById('sidebar-email').textContent   = email;
    document.getElementById('profile-name').textContent    = name;
    document.getElementById('profile-email').textContent   = email;

    showEditSuccess();

    // Clear password fields
    document.getElementById('edit-current-pw').value = '';
    document.getElementById('edit-new-pw').value      = '';
    document.getElementById('edit-confirm-pw').value  = '';

  } catch (err) {
    showEditError('Something went wrong. Please try again.');
  } finally {
    setEditLoading(false);
  }
});

// ── Logout ────────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('v808_token');
  localStorage.removeItem('v808_user');
  window.location.href = './index.html';
});
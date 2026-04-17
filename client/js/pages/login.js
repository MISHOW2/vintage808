// js/pages/login.js

const emailInput   = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn     = document.getElementById('login-btn');
const btnText      = document.getElementById('login-btn-text');
const btnLoader    = document.getElementById('login-btn-loader');
const errorBox     = document.getElementById('auth-error');
const errorMsg     = document.getElementById('auth-error-msg');
const togglePw     = document.getElementById('toggle-pw');

// ── Show / hide password ─────────────────────────────────────
togglePw.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
});

// ── Show error ───────────────────────────────────────────────
function showError(msg) {
  errorMsg.textContent = msg;
  errorBox.style.display = 'flex';
}

function hideError() {
  errorBox.style.display = 'none';
}

// ── Loading state ────────────────────────────────────────────
function setLoading(loading) {
  loginBtn.disabled  = loading;
  btnText.style.display   = loading ? 'none' : 'inline';
  btnLoader.style.display = loading ? 'inline-flex' : 'none';
}

// ── Login ────────────────────────────────────────────────────
loginBtn.addEventListener('click', async () => {
  hideError();

  const email    = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    showError('Please fill in all fields.');
    return;
  }

  setLoading(true);

  try {
    const res  = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message || 'Invalid email or password.');
      return;
    }

    // Save token and user to localStorage
    localStorage.setItem('v808_token', data.token);
    localStorage.setItem('v808_user', JSON.stringify(data.user));

    // Redirect — back to checkout if they came from there, else home
    const returnTo = sessionStorage.getItem('v808_return') || './index.html';
    sessionStorage.removeItem('v808_return');
    window.location.href = returnTo;

  } catch (err) {
    showError('Something went wrong. Please try again.');
  } finally {
    setLoading(false);
  }
});

// ── Nav account icon: go to account if logged in ─────────────
const token = localStorage.getItem('v808_token');
const navAccountBtn = document.getElementById('nav-account-btn');
if (navAccountBtn) {
  navAccountBtn.addEventListener('click', () => {
    window.location.href = token ? './account.html' : './login.html';
  });
}
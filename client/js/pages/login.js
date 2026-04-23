// js/pages/login.js
import { login, register, initGoogleSignIn, GOOGLE_CLIENT_ID } from '../api/auth.js';

// ── If already logged in, skip ────────────────────────────────
if (localStorage.getItem('v808_token')) {
  window.location.replace('./account.html');
}

// ── Panel toggle ─────────────────────────────────────────────
const panelLogin    = document.getElementById('panel-login');
const panelRegister = document.getElementById('panel-register');

function showLogin() {
  panelLogin.classList.remove('auth-form-wrap--hidden');
  panelRegister.classList.add('auth-form-wrap--hidden');
}
function showRegister() {
  panelRegister.classList.remove('auth-form-wrap--hidden');
  panelLogin.classList.add('auth-form-wrap--hidden');
}

document.getElementById('go-to-register').addEventListener('click', showRegister);
document.getElementById('go-to-login').addEventListener('click', showLogin);

// ── Helpers ───────────────────────────────────────────────────
function showError(boxId, msgId, msg) {
  document.getElementById(msgId).textContent = msg;
  document.getElementById(boxId).style.display = 'flex';
}
function hideError(boxId) { document.getElementById(boxId).style.display = 'none'; }

function setLoading(btnId, textId, loaderId, loading) {
  document.getElementById(btnId).disabled = loading;
  document.getElementById(textId).style.display   = loading ? 'none' : 'inline';
  document.getElementById(loaderId).style.display = loading ? 'inline-flex' : 'none';
}

function bindPasswordToggle(btnId, inputId) {
  document.getElementById(btnId)?.addEventListener('click', () => {
    const input = document.getElementById(inputId);
    input.type  = input.type === 'password' ? 'text' : 'password';
  });
}

bindPasswordToggle('login-toggle-pw',    'login-password');
bindPasswordToggle('reg-toggle-pw',      'reg-password');
bindPasswordToggle('reg-toggle-confirm', 'reg-confirm');

// ── Session helpers ───────────────────────────────────────────
function getReturnUrl() {
  const returnTo = sessionStorage.getItem('v808_return') || './index.html';
  sessionStorage.removeItem('v808_return');
  return returnTo;
}

function saveSession(token, user) {
  localStorage.setItem('v808_token', token);
  localStorage.setItem('v808_user',  JSON.stringify(user));
}

// ── LOGIN ─────────────────────────────────────────────────────
document.getElementById('login-btn').addEventListener('click', async () => {
  hideError('login-error');
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  if (!email || !password) {
    showError('login-error', 'login-error-msg', 'Please fill in all fields.');
    return;
  }

  setLoading('login-btn', 'login-btn-text', 'login-btn-loader', true);
  try {
    const data = await login(email, password);
    saveSession(data.token, data.user);
    window.location.href = getReturnUrl();
  } catch (err) {
    showError('login-error', 'login-error-msg', err.message || 'Something went wrong.');
  } finally {
    setLoading('login-btn', 'login-btn-text', 'login-btn-loader', false);
  }
});

// ── REGISTER ──────────────────────────────────────────────────
document.getElementById('register-btn').addEventListener('click', async () => {
  hideError('register-error');
  const first    = document.getElementById('reg-first').value.trim();
  const last     = document.getElementById('reg-last').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;

  if (!first || !last || !email || !password) {
    showError('register-error', 'register-error-msg', 'Please fill in all fields.');
    return;
  }
  if (password.length < 8) {
    showError('register-error', 'register-error-msg', 'Password must be at least 8 characters.');
    return;
  }
  if (password !== confirm) {
    showError('register-error', 'register-error-msg', 'Passwords do not match.');
    return;
  }

  setLoading('register-btn', 'register-btn-text', 'register-btn-loader', true);
  try {
    const data = await register(`${first} ${last}`.trim(), email, password);
    saveSession(data.token, data.user);
    window.location.href = getReturnUrl();
  } catch (err) {
    showError('register-error', 'register-error-msg', err.message || 'Something went wrong.');
  } finally {
    setLoading('register-btn', 'register-btn-text', 'register-btn-loader', false);
  }
});

// ── GOOGLE SIGN IN ────────────────────────────────────────────
function onGoogleSuccess(data) {
  saveSession(data.token, data.user);
  window.location.href = getReturnUrl();
}

function onGoogleError(msg) {
  showError('login-error', 'login-error-msg', msg);
}

// Render Google button on both login and register panels
window.onGoogleLibraryLoad = () => {
  if (!window.google || !GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') return;

  // Shared callback
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async (response) => {
      try {
        const { googleLogin } = await import('../api/auth.js');
        const data = await googleLogin(response.credential);
        onGoogleSuccess(data);
      } catch (err) {
        onGoogleError(err.message || 'Google login failed.');
      }
    },
  });

  // Render on login panel
  google.accounts.id.renderButton(
    document.getElementById('google-signin-btn'),
    { theme: 'outline', size: 'large', width: 320, text: 'continue_with', shape: 'rectangular' }
  );

  // Render on register panel
  google.accounts.id.renderButton(
    document.getElementById('google-signin-btn-register'),
    { theme: 'outline', size: 'large', width: 320, text: 'signup_with', shape: 'rectangular' }
  );
};
// js/pages/login.js
// Handles both the Sign In and Create Account panels on the same page.

import { login, register } from '../api/auth.js';

// ── If already logged in, skip this page ─────────────────────
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
  const box  = document.getElementById(boxId);
  const span = document.getElementById(msgId);
  span.textContent = msg;
  box.style.display = 'flex';
}

function hideError(boxId) {
  document.getElementById(boxId).style.display = 'none';
}

function setLoading(btnId, textId, loaderId, loading) {
  const btn = document.getElementById(btnId);
  btn.disabled = loading;
  document.getElementById(textId).style.display   = loading ? 'none'        : 'inline';
  document.getElementById(loaderId).style.display = loading ? 'inline-flex' : 'none';
}

function bindPasswordToggle(btnId, inputId) {
  document.getElementById(btnId)?.addEventListener('click', () => {
    const input = document.getElementById(inputId);
    input.type  = input.type === 'password' ? 'text' : 'password';
  });
}

// ── Password toggles ─────────────────────────────────────────
bindPasswordToggle('login-toggle-pw',    'login-password');
bindPasswordToggle('reg-toggle-pw',      'reg-password');
bindPasswordToggle('reg-toggle-confirm', 'reg-confirm');

// ── Where to redirect after login/register ────────────────────
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
    showError('login-error', 'login-error-msg', err.message || 'Something went wrong. Please try again.');

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
    // Combine first + last into a single `name` field to match the backend
    const name = `${first} ${last}`.trim();
    const data = await register(name, email, password);
    saveSession(data.token, data.user);
    window.location.href = getReturnUrl();

  } catch (err) {
    showError('register-error', 'register-error-msg', err.message || 'Something went wrong. Please try again.');

  } finally {
    setLoading('register-btn', 'register-btn-text', 'register-btn-loader', false);
  }
});
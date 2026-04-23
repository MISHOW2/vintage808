// js/api/auth.js
const BASE_URL         = 'https://vintage808-api.vercel.app/api/auth';
export const GOOGLE_CLIENT_ID = '112620041770-khue4b05v11lmr81v5fmjs9iebiuqf8v.apps.googleusercontent.com'; // ← replace with your Google Client ID

export async function login(email, password) {
  const res  = await fetch(`${BASE_URL}/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || 'Invalid email or password.' };
  return data;
}

export async function register(name, email, password) {
  const res  = await fetch(`${BASE_URL}/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || 'Could not create account.' };
  return login(email, password);
}

export async function googleLogin(credential) {
  const res  = await fetch(`${BASE_URL}/google`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.message || 'Google login failed.' };
  return data;
}

export function initGoogleSignIn(onSuccess, onError) {
  if (!window.google) return;
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: async (response) => {
      try {
        const data = await googleLogin(response.credential);
        onSuccess(data);
      } catch (err) {
        onError(err.message || 'Google login failed.');
      }
    },
  });
  google.accounts.id.renderButton(
    document.getElementById('google-signin-btn'),
    { theme: 'outline', size: 'large', width: '100%', text: 'continue_with', shape: 'rectangular' }
  );
}
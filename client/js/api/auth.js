// js/api/auth.js
// All authentication-related API calls using native fetch.

const BASE_URL = 'https://vintage808-api.vercel.app/auth';

/**
 * Log in an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function login(email, password) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, message: data.message || 'Invalid email or password.' };
  }

  return data; // { success, token, user }
}

/**
 * Register a new user.
 * Backend expects a single `name` field.
 * After successful register we auto-login to get a token.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function register(name, email, password) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    throw { status: res.status, message: data.message || 'Could not create account.' };
  }

  // Backend doesn't return a token on register, so auto-login
  return login(email, password);
}
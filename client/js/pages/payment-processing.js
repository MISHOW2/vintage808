const API = 'https://vintage808-api.vercel.app/api';

const params  = new URLSearchParams(window.location.search);
const orderId = params.get('order');

// ── Guard: if no order ID, go home ───────────────────────────
if (!orderId) {
  window.location.replace('./index.html');
}

// ── Guard: already redirecting — stop everything ─────────────
let redirecting = false;

function safeRedirect(url) {
  if (redirecting) return;
  redirecting = true;
  clearInterval(poller);
  window.location.replace(url);  // replace() so back-button can't loop back here
}

let attempts = 0;
const MAX_ATTEMPTS = 40; // ~2 minutes (40 × 3s)

async function pollPaymentStatus() {
  if (redirecting) return;   // already on the way out
  attempts++;

  if (attempts > MAX_ATTEMPTS) {
    safeRedirect(`./order-confirmation.html?order=${orderId}&timeout=1`);
    return;
  }

  try {
    const res  = await fetch(`${API}/payfast/status/${orderId}`);
    const data = await res.json();
    console.log('Poll result:', JSON.stringify(data));

    if (!data.success) return;

    const payStatus = data.order?.payment?.status;

    if (payStatus === 'paid') {
      localStorage.removeItem('v808_cart');
      safeRedirect(`./order-confirmation.html?order=${orderId}`);
      return;
    }

    if (payStatus === 'cancelled' || payStatus === 'failed') {
      safeRedirect('./checkout.html?status=cancelled&restore=1');
      return;
    }

  } catch (err) {
    console.error('Poll error:', err);
  }
}

const poller = setInterval(pollPaymentStatus, 3000);
pollPaymentStatus();
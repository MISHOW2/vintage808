const API = 'https://vintage808-api.vercel.app/api';

const params  = new URLSearchParams(window.location.search);
const orderId = params.get('order');

let attempts = 0;
const MAX_ATTEMPTS = 40; // stop after 2 minutes (40 x 3s)

async function pollPaymentStatus() {
  attempts++;

  if (attempts > MAX_ATTEMPTS) {
    clearInterval(poller);
    window.location.href = `./order-confirmation.html?order=${orderId}&timeout=1`;
    return;
  }

  try {
    const res  = await fetch(`${API}/payfast/status/${orderId}`);
    const data = await res.json();

    // ← ADD THIS
    console.log('Poll result:', JSON.stringify(data));

    if (!data.success) return;

    if (data.order?.payment?.status === 'paid') {
      clearInterval(poller);
      localStorage.removeItem('v808_cart');
      window.location.href = `./order-confirmation.html?order=${orderId}`;
    }

    if (data.order?.payment?.status === 'cancelled' ||
        data.order?.payment?.status === 'failed') {
      clearInterval(poller);
      window.location.href = './checkout.html?status=cancelled&restore=1';
    }

  } catch (err) {
    console.error('Poll error:', err);
  }
}
const poller = setInterval(pollPaymentStatus, 3000);
pollPaymentStatus();
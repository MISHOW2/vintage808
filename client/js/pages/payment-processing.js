const API = 'https://vintage808-api.vercel.app/api';

const params = new URLSearchParams(window.location.search);
const orderId = params.get('order');

async function pollPaymentStatus() {
  try {
    const res = await fetch(`${API}/payfast/status/${orderId}`);
    const data = await res.json();

    if (!data.success) return;

    if (data.order.status === 'paid') {
      localStorage.removeItem('v808_cart');
      window.location.href = `./order-confirmation.html?order=${orderId}`;
    }

    if (data.order.status === 'cancelled') {
      window.location.href = './checkout.html?status=cancelled&restore=1';
    }

  } catch (err) {
    console.error(err);
  }
}

setInterval(pollPaymentStatus, 3000);
pollPaymentStatus();
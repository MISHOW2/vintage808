//js/pages/payment-processing.js

const API = 'https://vintage808-api.vercel.app/api';

const params    = new URLSearchParams(window.location.search);
// Paystack sends the reference back in the URL as ?trxref= or ?reference=
const reference = params.get('trxref') || params.get('reference')
               || sessionStorage.getItem('v808_paystack_ref');
const orderId   = sessionStorage.getItem('v808_paystack_order_id');

if (!reference) {
  window.location.replace('./index.html');
}

async function verifyAndRedirect() {
  try {
    const token = localStorage.getItem('v808_token');

    const res  = await fetch(`${API}/paystack/verify`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ reference }),
    });

    const data = await res.json();
    console.log('[OrderSuccess] Verify result:', data);

    if (data.success) {
      // Clean up
      localStorage.removeItem('v808_cart');
      sessionStorage.removeItem('v808_paystack_ref');
      sessionStorage.removeItem('v808_paystack_order_id');
      sessionStorage.removeItem('v808_pending_order');

      window.location.replace(
        `./order-confirmation.html?order=${data.order?._id || orderId}`
      );
    } else {
      // Payment failed or not found
      window.location.replace('./checkout.html?status=cancelled&restore=1');
    }

  } catch (err) {
    console.error('[OrderSuccess] Error:', err);
    // Retry once after 3s in case of network blip
    setTimeout(verifyAndRedirect, 3000);
  }
}

verifyAndRedirect();
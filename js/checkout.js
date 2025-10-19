(function () {
  'use strict';

  // --- Utility Functions ---
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function haversineKm(lat1, lon1, lat2, lon2) {
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function softZoneCheck(lat, lon) {
    const warnId = 'zoneWarning';
    const container = document.querySelector('.checkout-section');
    if (!lat || !lon || !container) return;
    const nashik = { lat: 19.9975, lon: 73.7898 };
    const km = haversineKm(lat, lon, nashik.lat, nashik.lon);
    let warn = document.getElementById(warnId);
    if (!warn) {
      warn = document.createElement('div');
      warn.id = warnId;
      warn.className = 'zone-warning';
      container.appendChild(warn);
    }
    if (km > 30) {
      warn.textContent = `Note: Your address is approximately ${km.toFixed(
        1
      )} km from Nashik. Delivery availability may vary.`;
      warn.style.display = 'block';
    } else {
      warn.textContent = '';
      warn.style.display = 'none';
    }
  }

  // --- Order Rendering ---
  const cartData = JSON.parse(sessionStorage.getItem('checkoutCart') || '[]');
  const deliveryFee = 29;
  const taxRate = 0.1;

  function displayOrderItems() {
    const container = document.getElementById('orderItems');
    if (!container) return;

    if (!cartData.length) {
      document.getElementById('emptyCartMessage').style.display = 'block';
      document.getElementById('checkoutContent').style.display = 'none';
      return;
    }

    console.log('Cart Data:', cartData.length);
    container.innerHTML = cartData
      .map(
        (item) => `
      <div class="order-item">
        <img src="${item.image}" alt="${escapeHtml(item.name)}">
        <div class="order-item-details">
          <div class="order-item-name">${escapeHtml(item.name)}</div>
          <div class="order-item-quantity">Qty: ${item.quantity}</div>
        </div>
        <div class="order-item-price">₹${(
          item.quantity * parseFloat(item.price.replace(/[₹$]/g, ''))
        ).toFixed()}</div>
      </div>
    `
      )
      .join('');
  }

  function calculateTotals() {
    const subtotal = cartData.reduce((sum, item) => {
      return sum + item.quantity * parseFloat(item.price.replace(/[₹$]/g, ''));
    }, 0);
    const tax = subtotal * taxRate;
    const total = subtotal + tax + deliveryFee;

    document.getElementById('subtotal').textContent = `₹${subtotal.toFixed(
      2
    )}`;
    document.getElementById('tax').textContent = `₹${tax.toFixed(2)}`;
    document.getElementById('finalTotal').textContent = `₹${total.toFixed(2)}`;
  }

  // --- City Autocomplete ---
  function initCityAutocomplete() {
    if (!window.initCityAutocomplete) return;
    window.initCityAutocomplete();
  }

  // --- Pincode Validation ---
  function initPincodeValidation() {
    if (!window.initPincodeValidation) return;
    window.initPincodeValidation();
  }

  // --- Payment Method ---
  let selectedPayment = 'card';
  function setupPaymentSelection() {
    document.querySelectorAll('.payment-method').forEach((method) => {
      method.addEventListener('click', () => {
        document
          .querySelectorAll('.payment-method')
          .forEach((m) => m.classList.remove('active'));
        method.classList.add('active');
        selectedPayment = method.dataset.method;
      });
    });
  }

  // --- Form Validation ---
  function validateForm() {
    const form = document.getElementById('checkoutForm');
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach((input) => {
      const group = input.closest('.form-group');
      if (!input.value.trim()) {
        group.classList.add('error');
        isValid = false;
      } else {
        group.classList.remove('error');
      }
    });

    const email = document.getElementById('email');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.value)) {
      email.closest('.form-group').classList.add('error');
      isValid = false;
    }

    const phone = document.getElementById('phone');
    const phoneRegex = /^\+91\s?\d{10}$/;
    if (!phoneRegex.test(phone.value)) {
      phone.closest('.form-group').classList.add('error');
      isValid = false;
    }

    return isValid;
  }

  // --- Place Order ---
  function placeOrderRazorpay() {
    const totalAmount =
      parseFloat(
        document.getElementById('finalTotal').textContent.replace(/[₹$]/g, '')
      ) * 100; // in paise

    const orderId = 'FD' + Date.now().toString().slice(-8);
    document.getElementById('orderId').textContent = orderId;

    const options = {
      key: 'rzp_test_RS6EdXdKAxfVLe', // Razorpay test key
      amount: totalAmount,
      currency: 'INR',
      name: 'Foodie',
      description: 'Order Payment',
      handler: function (response) {
        console.log('Payment Success:', response);
        document.getElementById('successModal').classList.add('active');
        sessionStorage.removeItem('checkoutCart');
      },
      prefill: {
        name: document.getElementById('fullName').value,
        email: document.getElementById('email').value,
        contact: document.getElementById('phone').value,
      },
      theme: { color: '#F2BD12' },
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  function setupPlaceOrder() {
    document
      .getElementById('placeOrderBtn')
      .addEventListener('click', (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (selectedPayment !== 'card') {
          alert('Currently only Card payment is integrated.');
          return;
        }
        placeOrderRazorpay();
      });
  }

  // --- Initialize ---
  document.addEventListener('DOMContentLoaded', () => {
    displayOrderItems();
    calculateTotals();
    setupPaymentSelection();
    setupPlaceOrder();
    initCityAutocomplete();
    initPincodeValidation();
  });
})();

(function () {
  'use strict';

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
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
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
      warn.textContent = `Note: Your address is approximately ${km.toFixed(1)} km from Nashik. Delivery availability may vary.`;
      warn.style.display = 'block';
    } else {
      warn.textContent = '';
      warn.style.display = 'none';
    }
  }

  function initCityAutocomplete() {
    const cityInput = document.getElementById('city');
    const suggestionsEl = document.getElementById('citySuggestions');
    if (!cityInput || !suggestionsEl) return;

    let currentController = null;
    const debouncedSearch = debounce(async (q) => {
      if (!q || q.length < 2) {
        suggestionsEl.innerHTML = '';
        suggestionsEl.classList.remove('open');
        return;
      }
      try {
        if (currentController) currentController.abort();
        currentController = new AbortController();
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=8&dedupe=1&countrycodes=in&q=${encodeURIComponent(q)}`;

        // Show loading state
        suggestionsEl.innerHTML = '<div class="loading">Searching cities...</div>';
        suggestionsEl.classList.add('open');

        const res = await fetch(url, { headers: { 'Accept-Language': 'en-IN,en' }, signal: currentController.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        renderSuggestions(data || [], q);
      } catch (error) {
        if (error.name === 'AbortError') return; // Ignore aborted requests
        console.error('City search error:', error);
        suggestionsEl.innerHTML = '<div class="error">Unable to search cities. Please check your connection and try again.</div>';
        suggestionsEl.classList.add('open');
        // Add retry button
        setTimeout(() => {
          const retryBtn = document.createElement('button');
          retryBtn.textContent = 'Retry';
          retryBtn.className = 'retry-btn';
          retryBtn.onclick = () => debouncedSearch(q);
          suggestionsEl.appendChild(retryBtn);
        }, 1000);
      }
    }, 250);

    function renderSuggestions(items, query) {
      const uniqueCities = [];
      const seen = new Set();
      items.forEach((it) => {
        const a = it.address || {};
        const cityName = a.city || a.town || a.village || a.hamlet;
        const kind = (it.type || '').toLowerCase();
        const isCityLike = ['city', 'town', 'municipality'].includes(kind) || !!a.city || !!a.town;
        if (cityName) {
          const key = cityName.toLowerCase();
          if (!seen.has(key) && isCityLike) {
            seen.add(key);
            uniqueCities.push({ label: cityName, lat: it.lat, lon: it.lon, importance: it.importance || 0 });
          }
        }
      });

      uniqueCities.sort((a, b) => b.importance - a.importance || a.label.localeCompare(b.label));
      const q = String(query || '').trim().toLowerCase();
      const filtered = q ? uniqueCities.filter(c => c.label.toLowerCase().startsWith(q)) : uniqueCities;
      const results = filtered.length > 0 ? filtered : uniqueCities;

      if (results.length === 0) {
        suggestionsEl.innerHTML = '';
        suggestionsEl.classList.remove('open');
        return;
      }
      suggestionsEl.innerHTML = results.map((it, idx) => `<button type="button" role="option" class="autocomplete-item" data-idx="${idx}">${escapeHtml(it.label)}</button>`).join('');
      suggestionsEl.classList.add('open');

      suggestionsEl.querySelectorAll('.autocomplete-item').forEach((btn) => {
        btn.addEventListener('click', () => {
          const i = parseInt(btn.dataset.idx, 10);
          const chosen = results[i];
          if (!chosen) return;
          cityInput.value = chosen.label;
          suggestionsEl.innerHTML = '';
          suggestionsEl.classList.remove('open');
          softZoneCheck(Number(chosen.lat), Number(chosen.lon));
        });
      });
    }

    cityInput.addEventListener('input', (e) => debouncedSearch(e.target.value.trim()));
    document.addEventListener('click', (e) => {
      if (!suggestionsEl.contains(e.target) && e.target !== cityInput) {
        suggestionsEl.innerHTML = '';
        suggestionsEl.classList.remove('open');
      }
    });
  }

  function initPincodeValidation() {
    const zipInput = document.getElementById('zipCode');
    const cityInput = document.getElementById('city');
    if (!zipInput) return;

    const setError = (msg) => {
      const group = zipInput.closest('.form-group');
      if (group) group.classList.add('error');
      const err = group ? group.querySelector('.error-message') : null;
      if (err) err.textContent = msg || 'Invalid pincode';
      window.__lastPinStatus = 'error';
    };

    const clearError = () => {
      const group = zipInput.closest('.form-group');
      if (group) group.classList.remove('error');
    };

    const validateLength = (pin) => /^\d{6}$/.test(pin);

    const lookupPin = debounce(async (pin) => {
      if (!validateLength(pin)) { setError('Pincode must be 6 digits'); return; }
      try {
        // Show loading state
        setError('Validating pincode...');

        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data = await res.json();
        if (!Array.isArray(data) || !data[0] || data[0].Status !== 'Success') { setError('Pincode not found'); return; }
        const postOffices = data[0].PostOffice || [];
        if (postOffices.length === 0) { setError('Pincode not found'); return; }
        const cityFromPin = postOffices[0].District || postOffices[0].Division || postOffices[0].Region || '';

        if (cityInput && !cityInput.value.trim() && cityFromPin) { cityInput.value = cityFromPin; }

        if (cityInput && cityInput.value.trim()) {
          const typed = cityInput.value.trim().toLowerCase();
          const ok = postOffices.some((po) => {
            const district = (po.District || '').toLowerCase();
            const region = (po.Region || '').toLowerCase();
            const division = (po.Division || '').toLowerCase();
            const state = (po.State || '').toLowerCase();
            return district === typed || region === typed || division === typed || state === typed || (po.Name || '').toLowerCase() === typed;
          });
          if (!ok) { setError('Pincode does not match selected city'); return; }
        }

        clearError();
        window.__lastPinStatus = 'ok';
      } catch (error) {
        console.error('Pincode validation error:', error);
        setError('Unable to validate pincode. Please check your connection and try again.');
        // Add retry mechanism
        const group = zipInput.closest('.form-group');
        if (group) {
          const retryBtn = document.createElement('button');
          retryBtn.textContent = 'Retry';
          retryBtn.className = 'retry-btn';
          retryBtn.onclick = () => {
            retryBtn.remove();
            lookupPin(pin);
          };
          group.appendChild(retryBtn);
        }
      }
    }, 350);

    zipInput.addEventListener('input', (e) => {
      window.__lastPinStatus = undefined;
      const pin = e.target.value.replace(/\D/g, '').slice(0, 6);
      e.target.value = pin;
      if (pin.length === 6) lookupPin(pin);
    });

    cityInput?.addEventListener('input', () => {
      const pin = zipInput.value.trim();
      if (pin.length === 6) lookupPin(pin);
    });
  }

  window.initCityAutocomplete = initCityAutocomplete;
  window.initPincodeValidation = initPincodeValidation;
  window.softZoneCheck = softZoneCheck;
})();



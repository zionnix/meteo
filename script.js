// script.js — version compatible GitHub Pages utilisant OpenWeather forecast 2.5
document.addEventListener('DOMContentLoaded', () => {

  // ----- === CONFIG === -----
  const API_KEY = '840f2e7255bcf146931fd21cbbbe7b97'; // remplace si besoin
  const GEOCODING_URL = (q, limit = 6) =>
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=${limit}&appid=${API_KEY}`;
  const FORECAST_URL = (lat, lon) =>
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=fr`;

  // ----- === DOM === -----
  const cityInput = document.getElementById('cityInput');
  const validateBtn = document.getElementById('validateBtn');
  const locBtn = document.getElementById('locBtn');
  const suggestionsEl = document.getElementById('suggestions');

  const weatherPanel = document.getElementById('weatherPanel');
  const backBtn = document.getElementById('backBtn');

  const placeNameEl = document.getElementById('placeName');
  const localTimeEl = document.getElementById('localTime');
  const tempNowEl = document.getElementById('tempNow');
  const weatherDescEl = document.getElementById('weatherDesc');
  const minMaxEl = document.getElementById('minMax');
  const precipInfoEl = document.getElementById('precipInfo');
  const adviceEl = document.getElementById('advice');
  const sparkline = document.getElementById('sparkline');
  const hourItems = document.getElementById('hourItems');

  // ----- === HELPERS === -----
  async function fetchJSON(url) {
    const res = await fetch(url);
    if (!res.ok) {
      // read body for debugging if possible
      let body = '';
      try { body = await res.text(); } catch (e) { /* ignore */ }
      const err = new Error(`HTTP ${res.status} ${res.statusText} — ${body}`);
      err.status = res.status;
      throw err;
    }
    return res.json();
  }

  async function fetchPlaces(query, limit = 6) {
    try {
      return await fetchJSON(GEOCODING_URL(query, limit));
    } catch (err) {
      console.error('fetchPlaces error:', err);
      return [];
    }
  }

  async function fetchForecast(lat, lon) {
    try {
      return await fetchJSON(FORECAST_URL(lat, lon));
    } catch (err) {
      console.error('fetchForecast error:', err);
      throw err;
    }
  }

  function toLocalDateTime(unixSec, tzOffsetSec = 0) {
    // forecast 2.5 renvoie dt en sec et city.timezone en secondes
    return new Date(unixSec * 1000 + tzOffsetSec * 1000);
  }

  function clothingAdvice(temp, pop) {
    const t = Math.round(temp);
    const parts = [];
    if (t <= 0) parts.push("Gros manteau et gants ❄️");
    else if (t <= 8) parts.push("Manteau chaud");
    else if (t <= 15) parts.push("Veste / pull");
    else if (t <= 22) parts.push("T-shirt + légère couche");
    else parts.push("Tenue légère 🌞");

    if (pop >= 60) parts.push("Parapluie requis");
    else if (pop >= 30) parts.push("Parapluie conseillé");

    return parts.join(' — ');
  }

  function drawSparkline(values) {
    const w = 240, h = 60, pad = 6;
    if (!values || !values.length) {
      sparkline.innerHTML = '';
      return;
    }
    const min = Math.min(...values), max = Math.max(...values), range = Math.max(1, max - min);
    const step = (w - pad*2) / (values.length - 1);
    const pts = values.map((v,i) => `${pad+i*step},${h-pad-((v-min)/range)*(h-pad*2)}`).join(' ');
    const area = `<polygon points="${pts} ${w-pad},${h-pad} ${pad},${h-pad}" fill="rgba(255,255,255,0.06)"/>`;
    const line = `<polyline points="${pts}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    sparkline.innerHTML = area + line;
  }

  // ----- === UI / affichage ===-
  function showWeatherFromForecast(data, displayName) {
    if (!data || !data.list || !data.city) {
      alert('Données météo invalides');
      return;
    }

    // on prend la première entrée comme "maintenant"
    const nowItem = data.list[0];
    const tzOffset = data.city.timezone || 0;
    const now = toLocalDateTime(nowItem.dt, tzOffset);

    placeNameEl.textContent = `${displayName}${data.city.name ? ' — ' + data.city.name : ''}`;
    localTimeEl.textContent = `${now.toLocaleDateString()} • ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
    tempNowEl.textContent = `${Math.round(nowItem.main.temp)}°C`;
    weatherDescEl.textContent = nowItem.weather[0].description || '—';

    // min/max aujourd'hui (parcours des éléments du même jour)
    const todayDate = toLocalDateTime(nowItem.dt, tzOffset).getDate();
    const todayTemps = data.list.filter(it => toLocalDateTime(it.dt, tzOffset).getDate() === todayDate).map(it => it.main.temp);
    const minTemp = todayTemps.length ? Math.min(...todayTemps) : nowItem.main.temp;
    const maxTemp = todayTemps.length ? Math.max(...todayTemps) : nowItem.main.temp;
    minMaxEl.textContent = `Min ${Math.round(minTemp)}° / Max ${Math.round(maxTemp)}°`;

    const pop = Math.round((nowItem.pop || 0) * 100);
    precipInfoEl.textContent = `Probabilité précip. ${pop}%`;
    adviceEl.textContent = clothingAdvice(nowItem.main.temp, pop);

    // sparkline sur les prochaines 8 entrées (≈24h)
    const temps24h = data.list.slice(0, 8).map(d => d.main.temp);
    drawSparkline(temps24h);

    // next hours (8 * 3h = 24h)
    hourItems.innerHTML = '';
    data.list.slice(0, 8).forEach(h => {
      const d = toLocalDateTime(h.dt, tzOffset);
      const el = document.createElement('div');
      el.className = 'hourItem';
      el.innerHTML = `<div>${d.getHours()}h</div><div>${Math.round(h.main.temp)}°</div><div>${Math.round((h.pop||0)*100)}%</div>`;
      hourItems.appendChild(el);
    });

    // body class selon météo
    const main = (nowItem.weather[0].main || '').toLowerCase();
    document.body.setAttribute('data-weather', main.includes('rain') ? 'rain' : main.includes('cloud') ? 'clouds' : main.includes('snow') ? 'snow' : 'clear');

    // Afficher panneau
    weatherPanel.classList.remove('hidden');
    const intro = document.querySelector('.intro');
    if (intro) intro.classList.add('fadeOut');
    const bgWorld = document.getElementById('bgWorld');
    const bgLandscape = document.getElementById('bgLandscape');
    if (bgWorld) bgWorld.style.opacity = 0;
    if (bgLandscape) bgLandscape.style.opacity = 1;
  }

  // ----- === EVENTS ===-
  validateBtn.addEventListener('click', async () => {
    const q = cityInput.value.trim();
    if (!q) return alert('Tape le nom d’une ville.');

    validateBtn.disabled = true;
    validateBtn.textContent = 'Chargement...';

    try {
      const places = await fetchPlaces(q, 5);
      if (!places || !places.length) {
        alert('Ville introuvable.');
        return;
      }

      // on prend la première correspondance
      const p = places[0];
      const lat = Number(p.lat);
      const lon = Number(p.lon);
      const displayName = `${p.name}${p.state ? ', ' + p.state : ''}, ${p.country || ''}`;

      const forecast = await fetchForecast(lat, lon);
      showWeatherFromForecast(forecast, displayName);

    } catch (err) {
      console.error('Erreur lors de la récupération météo (validate):', err);
      if (err.status === 401) alert('401 Unauthorized — vérifie ta clé API OpenWeather.');
      else if (err.status === 429) alert('429 Too Many Requests — quota API dépassé.');
      else alert('Erreur lors de la récupération météo.');
    } finally {
      validateBtn.disabled = false;
      validateBtn.textContent = 'Valider';
    }
  });

  // bouton "Votre position"
  locBtn.addEventListener('click', () => {
    if (!navigator.geolocation) return alert('Géolocalisation non supportée par ce navigateur.');
    locBtn.disabled = true;
    locBtn.textContent = 'Localisation...';

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // Optionnel : reverse-geocode pour montrer le nom de la ville
        // On peut appeler le geocoding inverse en utilisant le même endpoint OpenWeather Geocoding
        const reverseUrl = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
        let displayName = `Lat ${lat.toFixed(3)}, Lon ${lon.toFixed(3)}`;
        try {
          const rev = await fetchJSON(reverseUrl);
          if (rev && rev.length) {
            const r = rev[0];
            displayName = `${r.name}${r.state ? ', ' + r.state : ''}, ${r.country}`;
          }
        } catch (e) {
          console.warn('Reverse geocoding failed:', e);
        }

        const forecast = await fetchForecast(lat, lon);
        showWeatherFromForecast(forecast, displayName);

      } catch (err) {
        console.error('Erreur localisation -> météo:', err);
        alert('Impossible de récupérer la météo pour votre position.');
      } finally {
        locBtn.disabled = false;
        locBtn.textContent = 'Votre position';
      }
    }, (err) => {
      console.error('Geolocation error:', err);
      alert('Impossible de récupérer votre position : ' + (err.message || err.code));
      locBtn.disabled = false;
      locBtn.textContent = 'Votre position';
    }, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 600000
    });
  });

  // back button
  backBtn.addEventListener('click', () => {
    weatherPanel.classList.add('hidden');
    const intro = document.querySelector('.intro');
    if (intro) intro.classList.remove('fadeOut');
    const bgWorld = document.getElementById('bgWorld');
    const bgLandscape = document.getElementById('bgLandscape');
    if (bgWorld) bgWorld.style.opacity = 1;
    if (bgLandscape) bgLandscape.style.opacity = 0;
  });

  // suggestions basiques lors de la frappe (appel geocoding)
  let suggestTimeout = null;
  cityInput.addEventListener('input', () => {
    clearTimeout(suggestTimeout);
    const q = cityInput.value.trim();
    if (!q) {
      suggestionsEl.classList.remove('show');
      suggestionsEl.innerHTML = '';
      return;
    }
    suggestTimeout = setTimeout(async () => {
      try {
        const places = await fetchPlaces(q, 6);
        suggestionsEl.innerHTML = '';
        if (places && places.length) {
          places.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.name}${p.state ? ', ' + p.state : ''} — ${p.country}`;
            li.addEventListener('click', () => {
              cityInput.value = `${p.name}${p.state ? ', ' + p.state : ''}`;
              suggestionsEl.classList.remove('show');
              suggestionsEl.innerHTML = '';
            });
            suggestionsEl.appendChild(li);
          });
          suggestionsEl.classList.add('show');
        } else {
          suggestionsEl.classList.remove('show');
        }
      } catch (e) {
        console.error('suggest error:', e);
      }
    }, 300);
  });

  // click outside suggestions ferme la liste
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('.search')) {
      suggestionsEl.classList.remove('show');
      // suggestionsEl.innerHTML = '';
    }
  });

  // Fin DOMContentLoaded
});

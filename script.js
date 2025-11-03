document.addEventListener('DOMContentLoaded', () => {

  const API_KEY = '840f2e7255bcf146931fd21cbbbe7b97';
  const GEOCODING_URL = (q, limit=6) =>
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=${limit}&appid=${API_KEY}`;
  const ONECALL = (lat, lon) =>
    `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&units=metric&exclude=minutely,alerts&appid=${API_KEY}`;

  // --- DOM ---
  const cityInput = document.getElementById('cityInput');
  const validateBtn = document.getElementById('validateBtn');
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

  // --- Fonctions helpers ---
  async function fetchPlaces(query, limit = 6) {
    try {
      const res = await fetch(GEOCODING_URL(query, limit));
      if (!res.ok) throw new Error('Erreur géocodage');
      return await res.json();
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async function fetchWeather(lat, lon) {
    try {
      const res = await fetch(ONECALL(lat, lon));
      if (!res.ok) throw new Error('Erreur API météo');
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  function toLocalDateTime(unixSec, tzOffsetSec) {
    return new Date((unixSec + tzOffsetSec) * 1000);
  }

  // --- Affichage météo ---
  function showWeather(data, displayName) {
    const tz = data.timezone_offset || 0;
    const now = toLocalDateTime(data.current.dt, tz);

    placeNameEl.textContent = displayName;
    localTimeEl.textContent = `${now.toLocaleDateString()} • ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
    tempNowEl.textContent = `${Math.round(data.current.temp)}°C`;
    weatherDescEl.textContent = data.current.weather[0].description;

    const d0 = data.daily[0];
    minMaxEl.textContent = `Min ${Math.round(d0.temp.min)}° / Max ${Math.round(d0.temp.max)}°`;

    const pop = Math.round((data.hourly[0]?.pop || 0) * 100);
    precipInfoEl.textContent = `Probabilité précip. ${pop}%`;
    adviceEl.textContent = clothingAdvice(data.current.temp, pop);

    drawSparkline(data.hourly.slice(0, 24).map(h => h.temp));

    // next hours
    hourItems.innerHTML = '';
    data.hourly.slice(0, 12).forEach(h => {
      const d = toLocalDateTime(h.dt, tz);
      const el = document.createElement('div');
      el.className = 'hourItem';
      el.innerHTML = `<div>${d.getHours()}h</div><div>${Math.round(h.temp)}°</div><div>${Math.round((h.pop||0)*100)}%</div>`;
      hourItems.appendChild(el);
    });

    // body class selon météo
    const main = (data.current.weather[0].main || '').toLowerCase();
    document.body.setAttribute('data-weather', main.includes('rain') ? 'rain' : main.includes('cloud') ? 'clouds' : main.includes('snow') ? 'snow' : 'clear');

    // afficher le panneau
    weatherPanel.classList.remove('hidden');
    document.querySelector('.intro').classList.add('fadeOut');
    document.getElementById('bgWorld').style.opacity = 0;
    document.getElementById('bgLandscape').style.opacity = 1;
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
    if (!values.length) return (sparkline.innerHTML = '');
    const min = Math.min(...values), max = Math.max(...values), range = Math.max(1, max - min);
    const step = (w - pad*2) / (values.length - 1);
    const pts = values.map((v,i) => `${pad+i*step},${h-pad-((v-min)/range)*(h-pad*2)}`).join(' ');
    const area = `<polygon points="${pts} ${w-pad},${h-pad} ${pad},${h-pad}" fill="rgba(255,255,255,0.06)"/>`;
    const line = `<polyline points="${pts}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    sparkline.innerHTML = area + line;
  }

  // --- Événements ---

  // Click Valider
  validateBtn.addEventListener('click', async () => {
    const query = cityInput.value.trim();
    if (!query) return alert('Tape le nom d’une ville.');

    validateBtn.disabled = true;
    validateBtn.textContent = 'Chargement...';

    try {
      const places = await fetchPlaces(query, 1);
      if (!places.length) return alert('Ville introuvable.');

      const p = places[0];
      const lat = Number(p.lat);
      const lon = Number(p.lon);
      const displayName = `${p.name}${p.state ? ', ' + p.state : ''}, ${p.country}`;
      const weatherData = await fetchWeather(lat, lon);
      showWeather(weatherData, displayName);

    } catch (err) {
      console.error(err);
      alert('Erreur lors de la récupération météo.');
    } finally {
      validateBtn.disabled = false;
      validateBtn.textContent = 'Valider';
    }
  });

  // Click BACK
  backBtn.addEventListener('click', () => {
    weatherPanel.classList.add('hidden');
    document.querySelector('.intro').classList.remove('fadeOut');
    document.getElementById('bgWorld').style.opacity = 1;
    document.getElementById('bgLandscape').style.opacity = 0;
  });

});


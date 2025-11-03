document.addEventListener('DOMContentLoaded', () => {

  const API_KEY = '840f2e7255bcf146931fd21cbbbe7b97';
  const FORECAST_URL = (city) =>
    `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`;

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

  // --- Helpers ---
  async function fetchWeather(city) {
    try {
      const res = await fetch(FORECAST_URL(city));
      if (!res.ok) throw new Error('Erreur API météo');
      return await res.json();
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  function getLocalTime(unixUTC, timezoneOffsetSec) {
    return new Date((unixUTC + timezoneOffsetSec) * 1000);
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

  function drawSparkline(values, times) {
    const w = 300, h = 80, pad = 10;
    if (!values.length) return (sparkline.innerHTML = '');

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    const step = (w - pad*2) / (values.length - 1);

    const pts = values.map((v, i) => `${pad + i*step},${h - pad - ((v - min)/range)*(h - pad*2)}`).join(' ');
    const area = `<polygon points="${pts} ${w-pad},${h-pad} ${pad},${h-pad}" fill="rgba(255,255,255,0.06)"/>`;
    const line = `<polyline points="${pts}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
    sparkline.innerHTML = area + line;
  }

  function showWeather(data) {
    const tzOffset = data.city.timezone; // en secondes
    const now = getLocalTime(Math.floor(Date.now()/1000), tzOffset);

    placeNameEl.textContent = `${data.city.name}, ${data.city.country}`;
    localTimeEl.textContent = `${now.toLocaleDateString()} • ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;

    const firstEntry = data.list[0];
    tempNowEl.textContent = `${Math.round(firstEntry.main.temp)}°C`;
    weatherDescEl.textContent = firstEntry.weather[0].description;

    // Min/Max des prochaines 24h
    const next24h = data.list.slice(0, 8); // toutes les 3h => 8 entrées = 24h
    const minTemp = Math.min(...next24h.map(e => e.main.temp_min));
    const maxTemp = Math.max(...next24h.map(e => e.main.temp_max));
    minMaxEl.textContent = `Min ${Math.round(minTemp)}° / Max ${Math.round(maxTemp)}°`;

    const pop = Math.round((next24h[0].pop || 0) * 100);
    precipInfoEl.textContent = `Probabilité précip. ${pop}%`;
    adviceEl.textContent = clothingAdvice(firstEntry.main.temp, pop);

    drawSparkline(next24h.map(e => e.main.temp), next24h.map(e => e.dt));

    // Next hours (plus grand)
    hourItems.innerHTML = '';
    data.list.slice(0, 12).forEach(h => {
      const d = getLocalTime(h.dt, tzOffset);
      const el = document.createElement('div');
      el.className = 'hourItem';
      el.style.flex = '1 1 70px'; // plus large
      el.innerHTML = `<div style="font-weight:600">${d.getHours()}h</div>
                      <div style="font-size:1.2rem">${Math.round(h.main.temp)}°</div>
                      <div style="opacity:0.8">${Math.round((h.pop||0)*100)}%</div>`;
      hourItems.appendChild(el);
    });

    // Body class météo
    const main = (firstEntry.weather[0].main || '').toLowerCase();
    document.body.setAttribute('data-weather', main.includes('rain') ? 'rain' : main.includes('cloud') ? 'clouds' : main.includes('snow') ? 'snow' : 'clear');

    // Afficher le panneau
    weatherPanel.classList.remove('hidden');
    document.querySelector('.intro').classList.add('fadeOut');
    document.getElementById('bgWorld').style.opacity = 0;
    document.getElementById('bgLandscape').style.opacity = 1;
  }

  // --- Événements ---
  validateBtn.addEventListener('click', async () => {
    const city = cityInput.value.trim();
    if (!city) return alert('Tape le nom d’une ville.');

    validateBtn.disabled = true;
    validateBtn.textContent = 'Chargement...';

    try {
      const weatherData = await fetchWeather(city);
      showWeather(weatherData);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la récupération météo.');
    } finally {
      validateBtn.disabled = false;
      validateBtn.textContent = 'Valider';
    }
  });

  backBtn.addEventListener('click', () => {
    weatherPanel.classList.add('hidden');
    document.querySelector('.intro').classList.remove('fadeOut');
    document.getElementById('bgWorld').style.opacity = 1;
    document.getElementById('bgLandscape').style.opacity = 0;
  });

});

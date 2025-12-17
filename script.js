document.addEventListener('DOMContentLoaded', () => {

  const API_KEY = '840f2e7255bcf146931fd21cbbbe7b97';

  const GEO_URL = (q, limit=1) => 
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=${limit}&appid=${API_KEY}`;

  const FORECAST_URL = (lat, lon) =>
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=fr`;

  const cityInput = document.getElementById('cityInput');
  const validateBtn = document.getElementById('validateBtn');
  const geoBtn = document.getElementById('locBtn');
  const weatherPanel = document.getElementById('weatherPanel');
  const backBtn = document.getElementById('backBtn');
  const suggestionsEl = document.getElementById('suggestions');

  const placeNameEl = document.getElementById('placeName');
  const localTimeEl = document.getElementById('localTime');
  const tempNowEl = document.getElementById('tempNow');
  const weatherDescEl = document.getElementById('weatherDesc');
  const minMaxEl = document.getElementById('minMax');
  const precipInfoEl = document.getElementById('precipInfo');
  const adviceEl = document.getElementById('advice');
  const sparkline = document.getElementById('sparkline');
  const hourItems = document.getElementById('hourItems');
  const unitToggle = document.getElementById('unitToggle');
  const themeToggle = document.getElementById('themeToggle');
  const historyList = document.getElementById('historyList');
  const forecastCards = document.getElementById('forecastCards');
  const forecastChart = document.getElementById('forecastChart');
  const weatherAnimEl = document.getElementById('weatherAnim');

  let debounceTimer;
  let currentUnit = 'C'; // 'C' or 'F'
  let lastFetched = null;

  // load history
  renderHistory();

  // Autocomplétion des villes
  cityInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    
    clearTimeout(debounceTimer);
    
    if (query.length < 2) {
      suggestionsEl.classList.remove('show');
      suggestionsEl.innerHTML = '';
      return;
    }

    debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(GEO_URL(query, 5));
        const cities = await response.json();
        
        if (cities.length > 0) {
          suggestionsEl.innerHTML = cities.map(city => {
            const displayName = `${city.name}${city.state ? ', ' + city.state : ''}, ${city.country}`;
            return `<li data-city="${city.name}" data-country="${city.country}" data-lat="${city.lat}" data-lon="${city.lon}">${displayName}</li>`;
          }).join('');
          suggestionsEl.classList.add('show');
        } else {
          suggestionsEl.classList.remove('show');
          suggestionsEl.innerHTML = '';
        }
      } catch (err) {
        console.error('Erreur autocomplétion:', err);
      }
    }, 300);
  });

  // Sélection d'une suggestion
  suggestionsEl.addEventListener('click', async (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    const lat = li.dataset.lat;
    const lon = li.dataset.lon;
    const displayName = li.textContent;
    cityInput.value = displayName;
    suggestionsEl.classList.remove('show');
    suggestionsEl.innerHTML = '';

    try {
      const data = await fetchWeatherByCoords(lat, lon);
      storeHistory(displayName, lat, lon);
      showWeather(data, displayName);
    } catch (err) {
      console.error(err);
    }
  });

  // Fermer les suggestions si on clique ailleurs
  document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsEl.contains(e.target)) {
      suggestionsEl.classList.remove('show');
    }
  });

  // Theme toggle: cycle through themes [default, sombre, clair]
  if (themeToggle) {
    const themes = ['','theme-sombre','theme-clair'];
    themeToggle.textContent = 'Défaut';
    function getCurrentThemeIndex(){
      for (let i = 1; i < themes.length; i++) {
        if (document.body.classList.contains(themes[i])) return i;
      }
      return 0; // défaut (pas de classe)
    }
    themeToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const idx = getCurrentThemeIndex();
      const next = (idx + 1) % themes.length;
      themes.forEach(t => { if (t) document.body.classList.remove(t); });
      if (themes[next]) document.body.classList.add(themes[next]);
      // update button label
      const labels = { '':'Défaut', 'theme-sombre':'Sombre', 'theme-clair':'Clair' };
      themeToggle.textContent = labels[themes[next]] || 'Thème';
    });
  }

  // Unit toggle - change temperature display only, never validate city
  if (unitToggle) {
    unitToggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      currentUnit = currentUnit === 'C' ? 'F' : 'C';
      unitToggle.textContent = currentUnit === 'C' ? '°C' : '°F';
      // Only update displayed temps if weather panel is currently visible
      if (lastFetched && weatherPanel && !weatherPanel.classList.contains('hidden')) {
        showWeather(lastFetched.data, lastFetched.displayName, true);
      }
    });
  }

  async function fetchWeather(city) {
    try {
      const geoRes = await fetch(GEO_URL(city));
      const geoData = await geoRes.json();
      if (!geoData.length) throw new Error("Ville introuvable");
      const {lat, lon, name, country} = geoData[0];

      const weatherRes = await fetch(FORECAST_URL(lat, lon));
      const data = await weatherRes.json();
      if (data.cod !== "200") throw new Error("Erreur API météo");

      const displayName = `${name}, ${country}`;
      localStorage.setItem('lastWeather', JSON.stringify({ data, displayName }));
      storeHistory(displayName, lat, lon);
      return { data, displayName };
    } catch(err) {
      console.error(err);
      alert("Impossible de récupérer la météo : " + err.message);
      throw err;
    }
  }

  async function fetchWeatherByCoords(lat, lon) {
    const weatherRes = await fetch(FORECAST_URL(lat, lon));
    const data = await weatherRes.json();
    if (data.cod !== "200") throw new Error("Erreur API météo");
    localStorage.setItem('lastWeather', JSON.stringify({ data, displayName: `${data.city.name}, ${data.city.country}` }));
    return data;
  }

  function showWeather(weatherData, displayName, skipStore) {
    const tzOffset = weatherData.city.timezone || 0;
    const now = new Date((weatherData.list[0].dt + tzOffset) * 1000);

    placeNameEl.textContent = displayName;
    localTimeEl.textContent = `${now.toLocaleDateString()} • ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;

    const current = weatherData.list[0];
    tempNowEl.textContent = `${formatTemp(current.main.temp)}`;
    weatherDescEl.textContent = current.weather[0].description;
    minMaxEl.textContent = `Min ${formatTemp(current.main.temp_min)} / Max ${formatTemp(current.main.temp_max)}`;
    const pop = Math.round((current.pop || 0) * 100);
    precipInfoEl.textContent = `Probabilité précip. ${pop}%`;
    adviceEl.textContent = clothingAdvice(current.main.temp, pop);

    drawSparkline(weatherData.list.slice(0, 8).map(h => convertTempForChart(h.main.temp)));

    hourItems.innerHTML = '';
    weatherData.list.slice(0, 12).forEach(h => {
      const d = new Date((h.dt + tzOffset) * 1000);
      const el = document.createElement('div');
      el.className = 'hourItem';
      el.style.flex = '1 0 20%';
      el.innerHTML = `<div>${d.getHours()}h</div><div>${formatTemp(h.main.temp)}</div><div>${Math.round((h.pop||0)*100)}%</div>`;
      hourItems.appendChild(el);
    });

    renderForecast(weatherData);

    const mainWeather = current.weather[0].main || current.weather[0].description;
    setWeatherAnimation(mainWeather);

    weatherPanel.classList.remove('hidden');
    document.querySelector('.intro').classList.add('fadeOut');

    lastFetched = { data: weatherData, displayName };
    if (!skipStore) localStorage.setItem('lastWeather', JSON.stringify(lastFetched));
  }

  function convertTempForChart(tempC) {
    return currentUnit === 'C' ? tempC : (tempC * 9/5) + 32;
  }

  function convertTemp(tempC) {
    return currentUnit === 'C' ? tempC : (tempC * 9/5) + 32;
  }

  function formatTemp(tempC) {
    const v = Math.round(convertTemp(tempC));
    return `${v}°${currentUnit}`;
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

  function drawSparkline(values){
    const svg = sparkline;
    const w = 240, h = 60, pad = 6;
    if(!values.length){ svg.innerHTML=''; return; }
    const min = Math.min(...values), max = Math.max(...values), range = Math.max(1, max - min);
    const step = (w - pad*2) / (values.length - 1);
    const pts = values.map((v,i) => `${pad + i*step},${h - pad - (v - min)/range*(h - pad*2)}`);
    svg.innerHTML = `<polyline fill="none" stroke="#00b4ff" stroke-width="2" points="${pts.join(' ')}" />`;
  }

  validateBtn.addEventListener('click', async () => {
    if(!cityInput.value.trim()) return;
    try{
      const {data, displayName} = await fetchWeather(cityInput.value.trim());
      showWeather(data, displayName);
    }catch{}
  });

  backBtn.addEventListener('click', ()=>{
    weatherPanel.classList.add('hidden');
    document.querySelector('.intro').classList.remove('fadeOut');
    // Remove weather backgrounds when going back to home
    document.body.classList.remove('weather-sun', 'weather-clouds', 'weather-rain', 'weather-snow');
  });

  // Validation avec la touche Entrée
  cityInput.addEventListener('keypress', async (e) => {
    if (e.key === 'Enter' && cityInput.value.trim()) {
      suggestionsEl.classList.remove('show');
      try{
        const {data, displayName} = await fetchWeather(cityInput.value.trim());
        showWeather(data, displayName);
      }catch{}
    }
  });

  // Géolocalisation
  const geoBtnElement = document.getElementById('locBtn');
  console.log('Bouton géolocalisation trouvé:', geoBtnElement);
  
  if (geoBtnElement) {
    geoBtnElement.addEventListener('click', async () => {
      console.log('Clic sur géolocalisation détecté');
      
      if (!navigator.geolocation) {
        alert("La géolocalisation n'est pas supportée par votre navigateur");
        return;
      }

      geoBtnElement.textContent = 'Localisation...';
      geoBtnElement.disabled = true;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          console.log('Position obtenue:', position.coords);
          const { latitude, longitude } = position.coords;
          try {
            const weatherRes = await fetch(FORECAST_URL(latitude, longitude));
            const data = await weatherRes.json();
            console.log('Données météo reçues:', data);
            
            if (data.cod !== "200") throw new Error("Erreur API météo");

            const displayName = `${data.city.name}, ${data.city.country}`;
            storeHistory(displayName, latitude, longitude);
            showWeather(data, displayName);
          } catch (err) {
            console.error('Erreur fetch météo:', err);
            alert("Impossible de récupérer la météo : " + err.message);
          } finally {
            geoBtnElement.textContent = 'Votre position';
            geoBtnElement.disabled = false;
          }
        },
        (error) => {
          console.error('Erreur géolocalisation:', error);
          let message = "Impossible d'accéder à votre position.";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = "Vous avez refusé l'accès à votre position. Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Votre position est indisponible.";
              break;
            case error.TIMEOUT:
              message = "La demande de géolocalisation a expiré.";
              break;
          }
          alert(message);
          geoBtnElement.textContent = 'Votre position';
          geoBtnElement.disabled = false;
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  } else {
    console.error('Le bouton #locBtn n\'a pas été trouvé dans le DOM');
  }

  // ---------- History storage ----------
  function storeHistory(displayName, lat, lon) {
    try {
      const list = JSON.parse(localStorage.getItem('searchHistory') || '[]');
      const entry = { displayName, lat, lon, ts: Date.now() };
      // remove duplicates
      const filtered = list.filter(i => i.displayName !== displayName);
      filtered.unshift(entry);
      const sliced = filtered.slice(0, 8);
      localStorage.setItem('searchHistory', JSON.stringify(sliced));
      renderHistory();
    } catch (e) { console.warn(e); }
  }

  function renderHistory(){
    if (!historyList) return;
    const list = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    historyList.innerHTML = list.map(i => `<button type="button" class="historyBtn" data-lat="${i.lat}" data-lon="${i.lon}">${i.displayName}</button>`).join('');
    historyList.querySelectorAll('.historyBtn').forEach(b => b.addEventListener('click', async (e) => {
      const lat = e.currentTarget.dataset.lat, lon = e.currentTarget.dataset.lon, name = e.currentTarget.textContent;
      try { const data = await fetchWeatherByCoords(lat, lon); showWeather(data, name); } catch(e){console.error(e)}
    }));
  }

  function renderForecast(weatherData){
    if (!forecastCards) return;
    // group by day (local time)
    const tz = weatherData.city.timezone || 0;
    const days = {};
    weatherData.list.forEach(item => {
      const d = new Date((item.dt + tz) * 1000);
      const day = d.toISOString().slice(0,10);
      days[day] = days[day] || [];
      days[day].push(item);
    });
    const keys = Object.keys(days).slice(0,5);
    forecastCards.innerHTML = keys.map(k => {
      const items = days[k];
      const temps = items.map(i => i.main.temp);
      const min = Math.min(...temps), max = Math.max(...temps);
      const icon = items[0].weather[0].icon;
      const label = new Date(k).toLocaleDateString(undefined, {weekday:'short', day:'numeric'});
      return `<div class="forecastCard"><div class="fDay">${label}</div><img src="http://openweathermap.org/img/wn/${icon}@2x.png" alt=""/><div class="fTemp">${Math.round(convertTemp(min))} / ${Math.round(convertTemp(max))}°${currentUnit}</div></div>`;
    }).join('');
    renderForecastChart(keys.map(k => {
      const items = days[k];
      const avg = items.reduce((s,i)=>s+i.main.temp,0)/items.length;
      return convertTempForChart(avg);
    }));
  }

  function renderForecastChart(values){
    if (!forecastChart) return;
    const w = 500, h = 120, pad = 20;
    if (!values.length) { forecastChart.innerHTML = ''; return; }
    const min = Math.min(...values), max = Math.max(...values), range = Math.max(1, max-min);
    const step = (w - pad*2) / (values.length - 1);
    const pts = values.map((v,i)=> `${pad + i*step},${h - pad - (v-min)/range*(h - pad*2)}`);
    forecastChart.innerHTML = `<polyline fill="none" stroke="#fff" stroke-width="2" points="${pts.join(' ')}" />`;
  }

  function setWeatherAnimation(mainWeather){
    if (!weatherAnimEl) return;
    weatherAnimEl.innerHTML = '';
    weatherAnimEl.className = 'weather-anim';
    const w = mainWeather.toLowerCase();
    
    // Remove all weather background classes
    document.body.classList.remove('weather-sun', 'weather-clouds', 'weather-rain', 'weather-snow');
    
    if (w.includes('rain') || w.includes('drizzle') || w.includes('thunder')) {
      weatherAnimEl.classList.add('rain');
      document.body.classList.add('weather-rain');
    } else if (w.includes('snow')) {
      weatherAnimEl.classList.add('clouds');
      document.body.classList.add('weather-snow');
    } else if (w.includes('cloud')) {
      weatherAnimEl.classList.add('clouds');
      document.body.classList.add('weather-clouds');
    } else if (w.includes('clear') || w.includes('sun')) {
      weatherAnimEl.classList.add('sun');
      document.body.classList.add('weather-sun');
    } else {
      weatherAnimEl.classList.add('default');
    }
  }

});

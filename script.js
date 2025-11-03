document.addEventListener('DOMContentLoaded', () => {

  const API_KEY = '840f2e7255bcf146931fd21cbbbe7b97';

  const GEO_URL = (q, limit=1) =>
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=${limit}&appid=${API_KEY}`;

  const FORECAST_URL = (lat, lon) =>
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=fr`;

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

  async function fetchWeather(city) {
    try {
      const geoRes = await fetch(GEO_URL(city));
      const geoData = await geoRes.json();
      if (!geoData.length) throw new Error("Ville introuvable");
      const {lat, lon, name, country} = geoData[0];

      const weatherRes = await fetch(FORECAST_URL(lat, lon));
      const data = await weatherRes.json();
      if (data.cod !== "200") throw new Error("Erreur API météo");

      return { data, displayName: `${name}, ${country}` };
    } catch(err) {
      console.error(err);
      alert("Impossible de récupérer la météo : " + err.message);
      throw err;
    }
  }

  function showWeather(weatherData, displayName) {
    const data = weatherData.list[0];
    const tzOffset = weatherData.city.timezone || 0;
    const now = new Date((data.dt + tzOffset) * 1000);

    placeNameEl.textContent = displayName;
    localTimeEl.textContent = `${now.toLocaleDateString()} • ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
    tempNowEl.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDescEl.textContent = data.weather[0].description;
    minMaxEl.textContent = `Min ${Math.round(data.main.temp_min)}° / Max ${Math.round(data.main.temp_max)}°`;
    const pop = Math.round((data.pop || 0) * 100);
    precipInfoEl.textContent = `Probabilité précip. ${pop}%`;
    adviceEl.textContent = clothingAdvice(data.main.temp, pop);

    drawSparkline(weatherData.list.slice(0, 8).map(h => h.main.temp));

    hourItems.innerHTML = '';
    weatherData.list.slice(0, 12).forEach(h => {
      const d = new Date((h.dt + tzOffset) * 1000);
      const el = document.createElement('div');
      el.className = 'hourItem';
      el.style.flex = '1 0 20%';
      el.innerHTML = `<div>${d.getHours()}h</div><div>${Math.round(h.main.temp)}°</div><div>${Math.round((h.pop||0)*100)}%</div>`;
      hourItems.appendChild(el);
    });

    weatherPanel.classList.remove('hidden');
    document.querySelector('.intro').classList.add('fadeOut');
  }

  function clothingAdvice(temp, pop) {
    const t = Math.round(temp);
    const parts = [];
    if(t<=0) parts.push("Gros manteau et gants ❄️");
    else if(t<=8) parts.push("Manteau chaud");
    else if(t<=15) parts.push("Veste / pull");
    else if(t<=22) parts.push("T-shirt + légère couche");
    else parts.push("Tenue légère 🌞");

    if(pop>=60) parts.push("Parapluie requis");
    else if(pop>=30) parts.push("Parapluie conseillé");

    return parts.join(' — ');
  }

  function drawSparkline(values){
    const w=240,h=60,pad=6;
    if(!values.length){ sparkline.innerHTML=''; return; }
    const min=Math.min(...values), max=Math.max(...values), range=Math.max(1,max-min);
    const step=(w-pad*2)/(values.length-1);
    const pts=values.map((v,i)=>`${pad+i*step},${h-pad-(v-min)/range*(h-pad*2)}`);
    sparkline.innerHTML=`<polyline fill="none" stroke="#00b4ff" stroke-width="2" points="${pts.join(' ')}" />`;
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
  });

});
 document.addEventListener('DOMContentLoaded', () => {

  const API_KEY = '840f2e7255bcf146931fd21cbbbe7b97';

  const GEO_URL = (q, limit=1) =>
    `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=${limit}&appid=${API_KEY}`;

  const FORECAST_URL = (lat, lon) =>
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=fr`;

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

  async function fetchWeather(city) {
    try {
      const geoRes = await fetch(GEO_URL(city));
      const geoData = await geoRes.json();
      if (!geoData.length) throw new Error("Ville introuvable");
      const {lat, lon, name, country} = geoData[0];

      const weatherRes = await fetch(FORECAST_URL(lat, lon));
      const data = await weatherRes.json();
      if (data.cod !== "200") throw new Error("Erreur API météo");

      return { data, displayName: `${name}, ${country}` };
    } catch(err) {
      console.error(err);
      alert("Impossible de récupérer la météo : " + err.message);
      throw err;
    }
  }

  function showWeather(weatherData, displayName) {
    const data = weatherData.list[0];
    const tzOffset = weatherData.city.timezone || 0;
    const now = new Date((data.dt + tzOffset) * 1000);

    placeNameEl.textContent = displayName;
    localTimeEl.textContent = `${now.toLocaleDateString()} • ${now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}`;
    tempNowEl.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDescEl.textContent = data.weather[0].description;
    minMaxEl.textContent = `Min ${Math.round(data.main.temp_min)}° / Max ${Math.round(data.main.temp_max)}°`;
    const pop = Math.round((data.pop || 0) * 100);
    precipInfoEl.textContent = `Probabilité précip. ${pop}%`;
    adviceEl.textContent = clothingAdvice(data.main.temp, pop);

    drawSparkline(weatherData.list.slice(0, 8).map(h => h.main.temp));

    hourItems.innerHTML = '';
    weatherData.list.slice(0, 12).forEach(h => {
      const d = new Date((h.dt + tzOffset) * 1000);
      const el = document.createElement('div');
      el.className = 'hourItem';
      el.style.flex = '1 0 20%';
      el.innerHTML = `<div>${d.getHours()}h</div><div>${Math.round(h.main.temp)}°</div><div>${Math.round((h.pop||0)*100)}%</div>`;
      hourItems.appendChild(el);
    });

    weatherPanel.classList.remove('hidden');
    document.querySelector('.intro').classList.add('fadeOut');
  }

  function clothingAdvice(temp, pop) {
    const t = Math.round(temp);
    const parts = [];
    if(t<=0) parts.push("Gros manteau et gants ❄️");
    else if(t<=8) parts.push("Manteau chaud");
    else if(t<=15) parts.push("Veste / pull");
    else if(t<=22) parts.push("T-shirt + légère couche");
    else parts.push("Tenue légère 🌞");

    if(pop>=60) parts.push("Parapluie requis");
    else if(pop>=30) parts.push("Parapluie conseillé");

    return parts.join(' — ');
  }

  function drawSparkline(values){
    const w=240,h=60,pad=6;
    if(!values.length){ sparkline.innerHTML=''; return; }
    const min=Math.min(...values), max=Math.max(...values), range=Math.max(1,max-min);
    const step=(w-pad*2)/(values.length-1);
    const pts=values.map((v,i)=>`${pad+i*step},${h-pad-(v-min)/range*(h-pad*2)}`);
    sparkline.innerHTML=`<polyline fill="none" stroke="#00b4ff" stroke-width="2" points="${pts.join(' ')}" />`;
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
  });

});
 

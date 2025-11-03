const API_KEY = '840f2e7255bcf146931fd21cbbbe7b97';
const GEOCODING_URL = (q, limit=1) => `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=${limit}&appid=${API_KEY}`;
const FORECAST_URL = (lat, lon) => `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}&lang=fr`;

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

async function fetchPlaces(query) {
  const res = await fetch(GEOCODING_URL(query));
  if(!res.ok) throw new Error("Erreur géocodage");
  return res.json();
}

async function fetchWeather(lat, lon) {
  const res = await fetch(FORECAST_URL(lat, lon));
  if(!res.ok) throw new Error("Erreur API météo");
  return res.json();
}

function toLocalTime(dt, tzOffset) {
  return new Date((dt + tzOffset) * 1000);
}

function showWeather(data, displayName) {
  const tzOffset = data.city.timezone;
  const now = new Date();
  const local = new Date(now.getTime() + tzOffset*1000 - now.getTimezoneOffset()*60000);
  placeNameEl.textContent = displayName;
  localTimeEl.textContent = local.toLocaleDateString() + " • " + local.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

  const first = data.list[0];
  tempNowEl.textContent = Math.round(first.main.temp) + "°C";
  weatherDescEl.textContent = first.weather[0].description;
  minMaxEl.textContent = `Min ${Math.round(first.main.temp_min)}° / Max ${Math.round(first.main.temp_max)}°`;

  const pop = Math.round((first.pop||0)*100);
  precipInfoEl.textContent = `Probabilité précip. ${pop}%`;
  adviceEl.textContent = clothingAdvice(first.main.temp, pop);

  drawSparkline(data.list.slice(0,12).map(h => h.main.temp));

  // Heures
  hourItems.innerHTML='';
  data.list.slice(0,12).forEach(h=>{
    const date = new Date(h.dt*1000 + tzOffset*1000);
    const el = document.createElement('div');
    el.className='hourItem';
    el.innerHTML = `<div>${date.getHours()}h</div><strong>${Math.round(h.main.temp)}°</strong><div>${Math.round((h.pop||0)*100)}%</div>`;
    hourItems.appendChild(el);
  });

  weatherPanel.classList.remove('hidden');
  document.querySelector('.intro').classList.add('fadeOut');
}

function clothingAdvice(temp, pop){
  const parts=[];
  if(temp<=0) parts.push("Gros manteau et gants ❄️");
  else if(temp<=8) parts.push("Manteau chaud");
  else if(temp<=15) parts.push("Veste / pull");
  else if(temp<=22) parts.push("T-shirt + légère couche");
  else parts.push("Tenue légère 🌞");

  if(pop>=60) parts.push("Parapluie requis");
  else if(pop>=30) parts.push("Parapluie conseillé");

  return parts.join(' — ');
}

function drawSparkline(values){
  const w=360, h=80, pad=10;
  if(!values.length) { sparkline.innerHTML=''; return; }
  const min = Math.min(...values), max=Math.max(...values), range=max-min || 1;
  const step = (w - pad*2)/(values.length-1);
  const pts = values.map((v,i)=>`${pad+i*step},${h-pad-((v-min)/range)*(h-pad*2)}`).join(' ');
  const area = `<polygon points="${pts} ${w-pad},${h-pad} ${pad},${h-pad}" fill="rgba(255,255,255,0.06)"/>`;
  const line = `<polyline points="${pts}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  sparkline.innerHTML = area+line;
}

// Événements
validateBtn.addEventListener('click', async ()=>{
  const query = cityInput.value.trim();
  if(!query) return alert("Tape le nom d’une ville.");
  validateBtn.disabled=true;
  validateBtn.textContent='Chargement...';
  try{
    const places = await fetchPlaces(query);
    if(!places.length) throw new Error("Ville introuvable");
    const p = places[0];
    const lat=p.lat, lon=p.lon;
    const displayName = `${p.name}${p.state? ', '+p.state:''}, ${p.country}`;
    const weatherData = await fetchWeather(lat, lon);
    showWeather(weatherData, displayName);
  }catch(err){
    console.error(err);
    alert("Impossible de récupérer la météo : "+err.message);
  }finally{
    validateBtn.disabled=false;
    validateBtn.textContent='Valider';
  }
});

backBtn.addEventListener('click', ()=>{
  weatherPanel.classList.add('hidden');
  document.querySelector('.intro').classList.remove('fadeOut');
});

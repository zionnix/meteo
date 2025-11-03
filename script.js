const apiKey = "VOTRE_API_KEY_ICI"; // remplace par ton API Key
const weatherPanel = document.getElementById("weatherPanel");
const placeName = document.getElementById("placeName");
const localTime = document.getElementById("localTime");
const tempNow = document.getElementById("tempNow");
const weatherDesc = document.getElementById("weatherDesc");
const minMax = document.getElementById("minMax");
const precipInfo = document.getElementById("precipInfo");
const advice = document.getElementById("advice");
const hourItems = document.getElementById("hourItems");
const sparkline = document.getElementById("sparkline");

const cityInput = document.getElementById("cityInput");
const validateBtn = document.getElementById("validateBtn");
const locBtn = document.getElementById("locBtn");
const backBtn = document.getElementById("backBtn");
const intro = document.querySelector(".intro");

async function fetchWeatherByCity(city) {
  try {
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${apiKey}`);
    const geoData = await geoRes.json();
    if (!geoData[0]) throw new Error("Ville non trouvée");
    const { lat, lon, name } = geoData[0];
    return fetchWeather(lat, lon, name);
  } catch (e) { alert(e.message); }
}

async function fetchWeather(lat, lon, name) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}&lang=fr`);
    const data = await res.json();
    if (data.cod !== "200") throw new Error(data.message || "Erreur API météo");

    displayWeather(data, name);
  } catch (e) {
    console.error(e);
    alert("Impossible de récupérer la météo : " + e.message);
  }
}

function displayWeather(data, city) {
  intro.classList.add("fadeOut");
  setTimeout(() => intro.style.display = "none", 400);

  weatherPanel.classList.remove("hidden");
  placeName.textContent = city;
  localTime.textContent = new Date().toLocaleTimeString();

  const first = data.list[0];
  tempNow.textContent = Math.round(first.main.temp) + "°C";
  weatherDesc.textContent = first.weather[0].description;
  minMax.textContent = `Min ${Math.round(first.main.temp_min)}° / Max ${Math.round(first.main.temp_max)}°`;
  precipInfo.textContent = `Précipitations : ${Math.round((first.pop||0)*100)}%`;
  advice.textContent = first.weather[0].main === "Rain" ? "Pense à prendre un parapluie !" : "Bonne journée !";

  // Heure suivantes
  hourItems.innerHTML = '';
  data.list.slice(0, 12).forEach(h => {
    const d = new Date(h.dt * 1000);
    const el = document.createElement("div");
    el.className = "hourItem";
    el.innerHTML = `<div class="hour">${d.getHours()}h</div>
                    <div class="temp">${Math.round(h.main.temp)}°</div>
                    <div class="pop">${Math.round((h.pop||0)*100)}%</div>`;
    hourItems.appendChild(el);
  });

  // Graphique
  drawSparkline(
    data.list.slice(0, 24).map(h => h.main.temp),
    data.list.slice(0, 24).map(h => h.pop||0),
    data.list.slice(0, 24).map(h => new Date(h.dt * 1000).getHours() + 'h')
  );
}

function drawSparkline(values, pops, hours) {
  const w = 600, h = 100, pad = 20;
  if (!values.length) return (sparkline.innerHTML = '');
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const step = (w - pad * 2) / (values.length - 1);

  let linePoints = values.map((v,i)=>{
    const x = pad + i*step;
    const y = h - pad - ((v-min)/range)*(h-pad*2);
    return `${x},${y}`;
  }).join(' ');

  let bars = pops.map((p,i)=>{
    const x = pad + i*step - 5;
    const y = h - pad - p*(h-pad*2);
    const barH = p*(h-pad*2);
    return `<rect x="${x}" y="${y}" width="10" height="${barH}" fill="rgba(0,180,255,0.3)"/>`;
  }).join('');

  let labels = hours.map((hr,i)=>{
    const x = pad + i*step;
    return `<text x="${x}" y="${h-5}" font-size="10" text-anchor="middle" fill="#fff">${hr}</text>`;
  }).join('');

  const polyline = `<polyline points="${linePoints}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round"/>`;
  sparkline.innerHTML = bars + polyline + labels;
}

// Événements
validateBtn.addEventListener("click", ()=>fetchWeatherByCity(cityInput.value));
locBtn.addEventListener("click", ()=>{
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(pos=>{
      fetchWeather(pos.coords.latitude, pos.coords.longitude, "Votre position");
    });
  } else alert("Géolocalisation non supportée");
});
backBtn.addEventListener("click", ()=>{
  weatherPanel.classList.add("hidden");
  intro.style.display = "block";
  intro.classList.remove("fadeOut");
});

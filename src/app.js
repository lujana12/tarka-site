import heritage from './heritage.json';
import './style.css';

const destinations = [
  { id: 'siddhi', name: 'Siddhi Ganesh Temple', area: 'Sorakhutte', coords: [27.7188696, 85.3104511], description: heritage[0].description, image: heritage[0].image },
  { id: 'mhepi', name: 'Mhepi Ajima', area: 'Mhepi', coords: [27.7274733, 85.3085223], description: heritage[2].description, image: heritage[2].image },
  { id: 'balaju', name: 'Balaju 22 Dhara', area: 'Baisdhara', coords: [27.7338701, 85.3022279], description: heritage[4].description, image: heritage[4].image },
  { id: 'nanak', name: 'Nanak Math', area: 'Balaju / Nayabazar', coords: [27.7257958, 85.306675], description: heritage[3].description, image: heritage[3].image }
];
const $ = (id) => document.getElementById(id);
const discovered = new Set(JSON.parse(localStorage.getItem('tarka-discovered') || '[]'));
let map, markers = {}, userMarker, routeLine, watchId = null, routeOrigin = null, selectedId = destinations[0].id, rerouteAt = 0, navigating = false;

function setView(name) {
  document.querySelectorAll('.nav-link').forEach((b) => b.classList.toggle('active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach((el) => { const active = el.id === `view-${name}`; el.hidden = !active; el.classList.toggle('active-view', active); });
  if (name === 'map') { ensureMap(); setTimeout(() => map.invalidateSize(), 100); }
  history.replaceState(null, '', `#${name}`);
}
document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$('open-map-from-game').addEventListener('click', () => setView('map'));
$('game-frame').addEventListener('load', () => $('game-frame').contentWindow.postMessage({ type: 'tarka-mode', mode: document.querySelector('.mode-choice.selected')?.dataset.mode || 'guided' }, location.origin));
document.querySelectorAll('.mode-choice').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.mode-choice').forEach((b) => b.classList.toggle('selected', b === button));
  $('mode-description').textContent = button.dataset.mode === 'free' ? 'Roam freely and revisit any story you have discovered.' : "Follow Aarav's golden wayfinding arrows from place to place.";
  $('game-frame').contentWindow.postMessage({ type: 'tarka-mode', mode: button.dataset.mode }, location.origin);
}));
function forwardGameKey(event, down) {
  if ($('view-adventure').hidden || event.target?.closest?.('input,textarea,select')) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(key)) return;
  if (key.startsWith('Arrow')) event.preventDefault();
  $('game-frame').contentWindow?.postMessage({ type: 'tarka-key', key, down }, location.origin);
}
window.addEventListener('keydown', (event) => forwardGameKey(event, true));
window.addEventListener('keyup', (event) => forwardGameKey(event, false));
$('sound-toggle').addEventListener('click', () => alert('Move Aarav with WASD / arrow keys or the on-screen joystick. Walk into glowing rings to discover places.'));

function imageMarkup(item) { return `<div class="photo-placeholder"><img src="${item.image}" alt="${item.name}" onerror="this.remove();this.nextElementSibling.hidden=false"><span hidden>${item.emoji || '🏛️'}</span><small>PHOTO FROM THE SUPPLIED RESEARCH</small></div>`; }
function renderHeritage() {
  $('heritage-grid').innerHTML = heritage.map((item) => `<article class="heritage-card ${discovered.has(item.id) ? 'is-discovered' : ''}"><button class="card-open" data-id="${item.id}" aria-label="Read about ${item.name}">${imageMarkup(item)}<span class="card-copy"><small class="card-area">${item.area} ${discovered.has(item.id) ? '· DISCOVERED' : ''}</small><b>${item.name}</b><i>${item.subtitle}</i><span>${item.description}</span></span></button><button class="card-route" data-route="${item.destination}">${item.gps ? 'Navigate to place ↗' : 'Navigate to nearby place ↗'}</button></article>`).join('');
  document.querySelectorAll('.card-open').forEach((b) => b.addEventListener('click', () => showStory(b.dataset.id)));
  document.querySelectorAll('.card-route').forEach((b) => b.addEventListener('click', () => { selectedId = b.dataset.route; setView('map'); ensureMap(); $('destination').value = selectedId; selectDestination(selectedId); }));
  const count = discovered.size; $('progress-label').textContent = `${count} of 6 discovered`; $('progress-fill').style.width = `${count / 6 * 100}%`; $('nav-progress').textContent = `${count}/6`;
}
function discover(id) { if (!heritage.some((x) => x.id === id)) return; discovered.add(id); localStorage.setItem('tarka-discovered', JSON.stringify([...discovered])); renderHeritage(); }
function showStory(id) {
  const item = heritage.find((x) => x.id === id); if (!item) return;
  $('dialog-image').innerHTML = imageMarkup(item); $('dialog-area').textContent = `${item.area} · WARD 16`; $('dialog-title').textContent = item.name; $('dialog-subtitle').textContent = item.subtitle; $('dialog-description').textContent = item.description;
  $('dialog-navigate').hidden = !item.gps;
  $('dialog-navigate').onclick = () => { $('site-dialog').close(); selectedId = item.destination; setView('map'); ensureMap(); $('destination').value = selectedId; selectDestination(selectedId); };
  $('dialog-continue').onclick = () => $('site-dialog').close(); $('site-dialog').showModal();
}
$('dialog-close').addEventListener('click', () => $('site-dialog').close());
$('site-dialog').addEventListener('close', () => $('game-frame').contentWindow?.postMessage({ type: 'tarka-continue' }, '*'));
window.addEventListener('message', (event) => {
  if (event.origin !== location.origin) return;
  if (event.data?.type === 'tarka-open-map') {
    selectedId = event.data.destination; setView('map'); ensureMap(); $('destination').value = selectedId; selectDestination(selectedId); return;
  }
  if (event.data?.type !== 'tarka-game-discovery') return;
  const ids = ['siddhi-ganesh', 'koncha-dyo', null, 'mhepi-ajima', 'nanak-math', 'balaju-22-dhara', 'pyatho-ajima'];
  const id = ids[event.data.index]; if (!id) return;
  discover(id); showStory(id);
});
renderHeritage();

function pinIcon() { return L.divIcon({ className: 'pin-wrap', html: '<span class="heritage-pin">✦</span>', iconSize: [34, 42], iconAnchor: [17, 36] }); }
function ensureMap() {
  if (map) return;
  if (!window.L) { $('route-message').textContent = 'Map library did not load. Check your internet connection and refresh.'; return; }
  map = L.map('map', { zoomControl: true }).setView([27.7265, 85.3078], 15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
  destinations.forEach((d) => {
    const marker = L.marker(d.coords, { icon: pinIcon() }).addTo(map);
    marker.bindPopup(`<div class="pin-preview"><div class="pin-photo"><img src="${d.image}" alt="${d.name}" onerror="this.remove()"></div><small>${d.area}</small><b>${d.name}</b><p>${d.description}</p><button onclick="window.tarkaChoose('${d.id}')">Choose destination</button></div>`);
    marker.on('click', () => selectDestination(d.id)); markers[d.id] = marker;
  });
  map.on('click', (e) => { routeOrigin = [e.latlng.lat, e.latlng.lng]; if (userMarker) userMarker.setLatLng(routeOrigin); else userMarker = L.circleMarker(routeOrigin, { radius: 8, color: '#fff', weight: 3, fillColor: '#c55b3b', fillOpacity: 1 }).addTo(map); $('route-message').textContent = 'Manual starting point set. Select Start navigation to request a walking route.'; });
  $('destination').innerHTML = destinations.map((d) => `<option value="${d.id}">${d.name} · ${d.area}</option>`).join(''); $('destination').value = selectedId;
  $('destination').addEventListener('change', (e) => selectDestination(e.target.value));
  window.tarkaChoose = (id) => { $('destination').value = id; selectDestination(id); markers[id].closePopup(); };
  selectDestination(selectedId);
}
function selectDestination(id) {
  selectedId = id; const d = destinations.find((x) => x.id === id); if (!d) return;
  $('destination').value = id; $('route-title').textContent = d.name; $('route-status').textContent = `${d.area} · destination selected`; map?.flyTo(d.coords, 16, { duration: 0.65 }); markers[id]?.openPopup();
}
function message(text, status = '') { $('route-message').textContent = text; $('route-status').textContent = status || (navigating ? 'Navigation active' : 'Ready'); }
function orsKey() { return import.meta.env.VITE_ORS_API_KEY || ''; }
async function requestRoute(origin) {
  const key = orsKey(); if (!key || key.includes('replace_with')) { message('Add VITE_ORS_API_KEY to a .env file in the project folder to request genuine walking directions. Your GPS position can still be shown on the map.', 'Routing key required'); $('status-dot').classList.add('needs-key'); return; }
  const destination = destinations.find((d) => d.id === selectedId); if (!origin || !destination) return;
  message('Requesting a pedestrian route…', 'Calculating walking route'); $('status-dot').classList.add('loading');
  try {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking/geojson', { method: 'POST', headers: { Authorization: key, 'Content-Type': 'application/json', Accept: 'application/geo+json, application/json' }, body: JSON.stringify({ coordinates: [[origin[1], origin[0]], [destination.coords[1], destination.coords[0]]], instructions: true, language: 'en' }) });
    if (!response.ok) throw new Error(`Routing service returned ${response.status}. Check the API key, quota, and network connection.`);
    const result = await response.json(); const feature = result.features?.[0]; if (!feature) throw new Error('No pedestrian route was found for these points. Try setting another starting point.');
    const coords = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon]); if (routeLine) routeLine.remove(); routeLine = L.polyline(coords, { color: '#bd5637', weight: 6, opacity: .9, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    const summary = feature.properties.summary; $('route-distance').textContent = summary.distance >= 1000 ? `${(summary.distance / 1000).toFixed(1)} km` : `${Math.round(summary.distance)} m`; $('route-duration').textContent = `${Math.max(1, Math.round(summary.duration / 60))} min`; $('route-stats').hidden = false;
    const steps = (feature.properties.segments || []).flatMap((s) => s.steps || []).filter((s) => s.instruction && s.distance > 0);
    $('directions').innerHTML = steps.map((s, i) => `<li><span>${i + 1}</span><div><b>${escapeHtml(s.instruction)}</b><small>${s.distance >= 1000 ? `${(s.distance / 1000).toFixed(1)} km` : `${Math.round(s.distance)} m`}</small></div></li>`).join(''); $('directions-title').hidden = !steps.length;
    map.fitBounds(routeLine.getBounds().pad(.12)); $('status-dot').classList.remove('loading', 'needs-key'); message('Follow the mapped walking route. Directions are based on the routing service road and path network.', 'Walking route ready');
  } catch (error) { $('status-dot').classList.remove('loading'); message(error.message || 'Route request failed. Check your connection and try again.', 'Could not calculate route'); }
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function stopNavigation() { if (watchId !== null) navigator.geolocation.clearWatch(watchId); watchId = null; navigating = false; $('start-navigation').hidden = false; $('stop-navigation').hidden = true; $('status-dot').classList.remove('loading'); message('Navigation stopped. Your selected destination is still on the map.', 'Navigation stopped'); }
function positionUpdated(position) {
  const p = [position.coords.latitude, position.coords.longitude]; routeOrigin = p;
  if (userMarker) userMarker.setLatLng(p); else userMarker = L.circleMarker(p, { radius: 8, color: '#fff', weight: 3, fillColor: '#c55b3b', fillOpacity: 1 }).addTo(map).bindTooltip('Your location');
  if (!routeLine) map.panTo(p);
  const now = Date.now();
  if (routeLine && now - rerouteAt > 20000) { const nearest = Math.min(...routeLine.getLatLngs().map((ll) => map.distance(ll, L.latLng(p)))); if (nearest > 55) { rerouteAt = now; message('You appear to be off the route. Recalculating from your current position…', 'Updating route'); requestRoute(p); } }
  $('route-status').textContent = `GPS accuracy ±${Math.round(position.coords.accuracy)} m · live`;
}
function startNavigation() {
  ensureMap(); if (!map) return;
  navigating = true; $('start-navigation').hidden = true; $('stop-navigation').hidden = false;
  if (!navigator.geolocation) { message('This browser does not provide location access. Click the map to set a starting point manually.', 'GPS unavailable'); navigating = false; $('start-navigation').hidden = false; $('stop-navigation').hidden = true; return; }
  if (routeOrigin && !window.confirm('Use the selected manual starting point? Choose Cancel to request your current GPS position.')) { routeOrigin = null; }
  if (routeOrigin) { requestRoute(routeOrigin); return; }
  message('Waiting for your device location…', 'Requesting GPS');
  watchId = navigator.geolocation.watchPosition((p) => { positionUpdated(p); if (!routeLine) requestRoute([p.coords.latitude, p.coords.longitude]); }, (err) => { navigating = false; $('start-navigation').hidden = false; $('stop-navigation').hidden = true; message(err.code === 1 ? 'Location permission was denied. Click the map to choose a starting point, then start navigation again.' : 'Could not get a reliable location. Try again outdoors or choose a starting point on the map.', 'GPS unavailable'); }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 });
}
$('start-navigation').addEventListener('click', startNavigation); $('stop-navigation').addEventListener('click', stopNavigation);
$('locate-me').addEventListener('click', () => { ensureMap(); if (!navigator.geolocation) { message('Geolocation is not available in this browser. Click the map to choose a starting point.'); return; } message('Getting your current location…', 'Requesting GPS'); navigator.geolocation.getCurrentPosition((p) => { positionUpdated(p); map.setView([p.coords.latitude, p.coords.longitude], 17); message(`Location found (accuracy ±${Math.round(p.coords.accuracy)} m). Press Start navigation to request a route.`, 'Location ready'); }, () => message('Location access failed or was denied. You can click the map to set a manual start.'), { enableHighAccuracy: true, timeout: 20000 }); });

const initialView = location.hash.slice(1); if (['adventure', 'map', 'discoveries'].includes(initialView)) setView(initialView);

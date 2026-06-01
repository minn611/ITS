/**
 * app.js — ITS AI Traffic Platform
 * Điều phối toàn bộ: bản đồ, biểu đồ, bộ lọc, cảnh báo, mô phỏng xe và SPA Navigation
 */

/* ===================== STATE ===================== */
const STATE = {
  theme:        'dark',       // 'dark' | 'light'
  map:          null,
  tileLayer:    null,
  roads:        [],           // live road objects
  polylines:    {},           
  hotspotMarkers: [],
  carMarkers:   [],
  isSimulating: false,
  isWeatherBad: false,
  simAnimIds:   [],
  chart:        null,         // Map side panel chart
  dashCharts:   {},           // Dashboard AI view charts
  filters: {
    type:   'all',
    status: 'all',
    search: ''
  },
  selectedRoadId: null,
  alerts: []
};

/* Cấu hình màu theo status */
const COLOR = {
  clear:  '#34d399',
  slow:   '#fbbf24',
  jam:    '#f87171',
  severe: '#c084fc'
};

const STATUS_LABEL = { clear: 'Thông thoáng', slow: 'Chậm', jam: 'Ùn tắc', severe: 'Nghẽn' };
const TYPE_LABEL   = { highway: 'Cao tốc', bridge: 'Cầu', ring: 'Vành đai', main: 'Đường chính', street: 'Phố' };

/* ===================== KHỞI ĐỘNG ===================== */
document.addEventListener('DOMContentLoaded', () => {
  STATE.roads = buildLiveRoads(); 

  initClock();
  initMap();
  initChart();
  initFilters();
  initSearch();
  initTheme();
  initWeatherBtn();
  initSimBtn();
  initHotspotBtn();
  initRecenterBtn();
  initCloseInfoBtn();

  // SPA Navigation
  initNavigation();
  initDashboardCharts();
  renderHistoryTable();

  renderRoadList();
  updateStats();
  generateAlerts();

  setInterval(refreshData, 30_000);
});

/* ===================== CLOCK ===================== */
function initClock() {
  const el = document.getElementById('time-display');
  const tick = () => { el.textContent = new Date().toLocaleTimeString('vi-VN'); };
  tick();
  setInterval(tick, 1000);
}

/* ===================== SPA NAVIGATION ===================== */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.app-view');
  const mapFilters = document.getElementById('map-filters');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Update active menu
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // Hide all views, show target view
      const targetId = item.getAttribute('data-target');
      views.forEach(v => v.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');

      // Hide map filters if not on map view
      if (targetId === 'view-map') {
        mapFilters.style.display = 'flex';
        if (STATE.map) setTimeout(() => STATE.map.invalidateSize(), 100);
      } else {
        mapFilters.style.display = 'none';
      }
    });
  });
}

/* ===================== MAP ===================== */
function initMap() {
  STATE.map = L.map('traffic-map', {
    zoomControl: true,
    attributionControl: false
  }).setView([21.0285, 105.8542], 13);

  loadTile();
  drawAllRoads();
  drawHotspots();
}

function loadTile() {
  if (STATE.tileLayer) STATE.map.removeLayer(STATE.tileLayer);
  const url = STATE.theme === 'dark'
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  STATE.tileLayer = L.tileLayer(url, { maxZoom: 19, subdomains: 'abcd' }).addTo(STATE.map);
}

function drawAllRoads() {
  Object.values(STATE.polylines).forEach(p => {
    if (p.glow) STATE.map.removeLayer(p.glow);
    if (p.core) STATE.map.removeLayer(p.core);
  });
  STATE.polylines = {};

  STATE.roads.forEach(road => {
    if (!isVisible(road)) return;
    drawRoad(road);
  });
}

function drawRoad(road) {
  const col = COLOR[road.status];
  const glow = L.polyline(road.coords, { color: col, weight: 14, opacity: 0.18, lineCap: 'round', lineJoin: 'round' }).addTo(STATE.map);
  const core = L.polyline(road.coords, { color: col, weight: 4.5, opacity: 0.92, lineCap: 'round', lineJoin: 'round' }).addTo(STATE.map);

  core.on('click', () => showRoadInfo(road.id));
  glow.on('click', () => showRoadInfo(road.id));

  STATE.polylines[road.id] = { glow, core };
}

/* Hotspots */
const HOTSPOTS = [
  { name: 'Nút giao Khuất Duy Tiến', lat: 20.9926, lng: 105.8076 },
  { name: 'Cầu Vượt Ngã Tư Sở',     lat: 20.9958, lng: 105.8210 },
  { name: 'Ngã Tư Trường Chinh',     lat: 21.0002, lng: 105.8360 },
  { name: 'Cầu Giấy',                lat: 21.0368, lng: 105.8200 },
  { name: 'Bùng Binh Cầu Giấy',      lat: 21.0302, lng: 105.8018 },
  { name: 'Ngã tư Vọng',             lat: 21.0052, lng: 105.8480 },
];

function drawHotspots() {
  STATE.hotspotMarkers.forEach(m => STATE.map.removeLayer(m));
  STATE.hotspotMarkers = [];
  HOTSPOTS.forEach(h => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="hotspot-marker" title="${h.name}"><i class="fa-solid fa-fire"></i></div>`,
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
    
    // Tạo nội dung popup camera giả lập
    const popupContent = `
      <div style="width:220px">
        <b style="font-family:Inter;font-size:13px;display:flex;align-items:center;gap:5px;">
          <i class="fa-solid fa-video" style="color:red"></i> CCTV: ${h.name}
        </b>
        <div style="margin-top:8px; border: 1px solid var(--border); border-radius: 4px; overflow: hidden; background: #000; position: relative;">
           <img src="https://media.giphy.com/media/xT9IgzoXuwA2yqKj8s/giphy.gif" style="width:100%; display:block; opacity: 0.85;">
           <div style="position:absolute; top:4px; left:4px; color:#fff; font-size:9px; background:rgba(0,0,0,0.5); padding:2px 4px; border-radius:2px;">
             REC <span style="color:red; font-size:10px;">●</span>
           </div>
        </div>
        <span style="font-size:11px;color:#f87171;display:block;margin-top:6px;font-weight:600;">
          ⚠️ Giao thông di chuyển rất chậm.
        </span>
      </div>`;

    const m = L.marker([h.lat, h.lng], { icon })
      .addTo(STATE.map)
      .bindPopup(popupContent, { maxWidth: 250, className: 'cctv-popup' });
    STATE.hotspotMarkers.push(m);
  });
}

function initHotspotBtn() {
  const btn = document.getElementById('btn-show-hotspots');
  btn.addEventListener('click', () => {
    const visible = STATE.hotspotMarkers.length && STATE.map.hasLayer(STATE.hotspotMarkers[0]);
    STATE.hotspotMarkers.forEach(m => visible ? STATE.map.removeLayer(m) : m.addTo(STATE.map));
    btn.classList.toggle('active', !visible);
  });
}

function initRecenterBtn() {
  document.getElementById('btn-recenter').addEventListener('click', () => {
    STATE.map.flyTo([21.0285, 105.8542], 13, { duration: 0.8 });
  });
}

/* ===================== ROAD INFO PANEL ===================== */
function showRoadInfo(roadId) {
  const road = STATE.roads.find(r => r.id === roadId);
  if (!road) return;
  STATE.selectedRoadId = roadId;

  document.getElementById('info-name').textContent     = road.name;
  document.getElementById('info-district').textContent = road.district;
  document.getElementById('info-speed').textContent    = `${road.speed} km/h`;
  document.getElementById('info-density').textContent  = `${road.density} xe/phút`;
  document.getElementById('info-lanes').textContent    = `${road.lanes} làn`;
  document.getElementById('info-ai-pred').textContent  = road.aiPred;
  document.getElementById('info-length').textContent   = `${road.length} km`;

  const badge = document.getElementById('info-status-badge');
  badge.textContent  = STATUS_LABEL[road.status];
  badge.className    = `road-info-badge ${road.status}`;

  document.getElementById('road-info').style.display = 'block';

  Object.entries(STATE.polylines).forEach(([id, p]) => {
    const isSelected = parseInt(id) === roadId;
    if (p.core) p.core.setStyle({ weight: isSelected ? 7 : 4.5, opacity: isSelected ? 1 : 0.92 });
  });

  document.querySelectorAll('.road-list-item').forEach(li => {
    li.classList.toggle('selected', parseInt(li.dataset.id) === roadId);
  });

  const bounds = L.latLngBounds(road.coords);
  STATE.map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 0.7 });
}

function initCloseInfoBtn() {
  document.getElementById('close-road-info').addEventListener('click', () => {
    document.getElementById('road-info').style.display = 'none';
    STATE.selectedRoadId = null;
    Object.values(STATE.polylines).forEach(p => {
      if (p.core) p.core.setStyle({ weight: 4.5, opacity: 0.92 });
    });
    document.querySelectorAll('.road-list-item').forEach(li => li.classList.remove('selected'));
  });
}

/* ===================== STATS & LISTS ===================== */
function updateStats() {
  const total   = STATE.roads.length;
  const jammed  = STATE.roads.filter(r => r.status === 'jam' || r.status === 'severe').length;
  const clear   = STATE.roads.filter(r => r.status === 'clear').length;

  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-jam').textContent      = jammed;
  document.getElementById('stat-clear').textContent    = clear;
  document.getElementById('road-count-sidebar').textContent = total;
}

function isVisible(road) {
  const { type, status, search } = STATE.filters;
  if (type !== 'all' && road.type !== type) return false;
  if (status !== 'all' && road.status !== status) return false;
  if (search && !road.name.toLowerCase().includes(search) && !road.district.toLowerCase().includes(search)) return false;
  return true;
}

function renderRoadList() {
  const ul = document.getElementById('road-list');
  ul.innerHTML = '';
  let count = 0;

  STATE.roads.forEach(road => {
    const visible = isVisible(road);
    if (visible) count++;

    const li = document.createElement('li');
    li.className = `road-list-item${visible ? '' : ' hidden'}`;
    li.dataset.id = road.id;
    li.innerHTML = `
      <span class="road-dot ${road.status}"></span>
      <div class="road-item-info">
        <div class="road-item-name">${road.name}</div>
        <div class="road-item-meta">${road.district} · ${TYPE_LABEL[road.type]}</div>
      </div>
      <div class="road-item-speed">${road.speed} km/h</div>
    `;
    li.addEventListener('click', () => showRoadInfo(road.id));
    ul.appendChild(li);
  });

  document.getElementById('visible-count').textContent = `${count} tuyến`;

  Object.entries(STATE.polylines).forEach(([id, p]) => {
    const road = STATE.roads.find(r => r.id === parseInt(id));
    const show = road && isVisible(road);
    if (p.glow) show ? p.glow.addTo(STATE.map) : STATE.map.removeLayer(p.glow);
    if (p.core) show ? p.core.addTo(STATE.map) : STATE.map.removeLayer(p.core);
  });
}

function initFilters() {
  document.getElementById('type-filters').addEventListener('click', e => {
    const pill = e.target.closest('[data-filter-type]');
    if (!pill) return;
    document.querySelectorAll('[data-filter-type]').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    STATE.filters.type = pill.dataset.filterType;
    renderRoadList();
  });

  document.getElementById('status-filters').addEventListener('click', e => {
    const pill = e.target.closest('[data-filter-status]');
    if (!pill) return;
    document.querySelectorAll('[data-filter-status]').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    STATE.filters.status = pill.dataset.filterStatus;
    renderRoadList();
  });
}

function initSearch() {
  const input = document.getElementById('road-search');
  const clear = document.getElementById('search-clear');

  input.addEventListener('input', () => {
    STATE.filters.search = input.value.toLowerCase().trim();
    clear.style.display  = STATE.filters.search ? 'block' : 'none';
    renderRoadList();
  });

  clear.addEventListener('click', () => {
    input.value = '';
    STATE.filters.search = '';
    clear.style.display = 'none';
    renderRoadList();
  });
}

/* ===================== ALERTS ===================== */
const ALERT_TEMPLATES = [
  { type: 'severe', icon: 'fa-car-burst',        title: 'Tai nạn liên hoàn',   desc: 'Nút giao Khuất Duy Tiến - Nguyễn Trãi' },
  { type: 'jam',    icon: 'fa-road-barrier',      title: 'Ùn tắc do công trình',desc: 'Vành đai 3 đoạn Thanh Xuân' },
  { type: 'jam',    icon: 'fa-road-spikes',       title: 'Tắc kéo dài',         desc: 'Đường Nguyễn Trãi hướng Hà Đông' },
  { type: 'slow',   icon: 'fa-traffic-cone',      title: 'Sửa đường',           desc: 'Phạm Hùng đoạn Mỹ Đình' },
  { type: 'severe', icon: 'fa-fire',              title: 'Cháy xe ô tô',        desc: 'Cầu Vĩnh Tuy hướng Gia Lâm' },
];

function generateAlerts() {
  const now = new Date();
  const count = 4;
  const chosen = [...ALERT_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, count);

  STATE.alerts = chosen.map((a, i) => ({
    ...a,
    minutesAgo: i * 8 + Math.floor(Math.random() * 5),
    statusStr: i === 0 ? 'Chưa xử lý' : 'Đang giải quyết',
    source: i % 2 === 0 ? 'AI Camera' : 'User Report'
  }));

  // Render Map Panel Alerts
  const ul = document.getElementById('alert-list');
  ul.innerHTML = '';
  STATE.alerts.forEach(a => {
    ul.innerHTML += `
      <li class="alert-item ${a.type}">
        <div class="alert-icon"><i class="fa-solid ${a.icon}"></i></div>
        <div>
          <div class="alert-title">${a.title}</div>
          <div class="alert-desc">${a.desc}</div>
          <div class="alert-time">${a.minutesAgo} phút trước</div>
        </div>
      </li>
    `;
  });

  // Render Alert Table View
  const tbody = document.getElementById('alerts-table-body');
  if (tbody) {
    tbody.innerHTML = '';
    STATE.alerts.forEach(a => {
      const badgeStyle = a.type === 'severe' ? 'background:rgba(192,132,252,0.2);color:#c084fc' : 
                         a.type === 'jam' ? 'background:rgba(248,113,113,0.2);color:#f87171' : 
                         'background:rgba(251,191,36,0.2);color:#fbbf24';
      
      tbody.innerHTML += `
        <tr>
          <td>${now.getHours()}:${String(now.getMinutes() - a.minutesAgo).padStart(2,'0')}</td>
          <td><span class="badge-status" style="${badgeStyle}">${STATUS_LABEL[a.type].toUpperCase()}</span></td>
          <td style="font-weight:500">${a.desc.split(' đoạn')[0]}</td>
          <td>${a.title}</td>
          <td>${a.source}</td>
          <td><span style="color:${a.statusStr==='Chưa xử lý'?'#f87171':'#34d399'}">${a.statusStr}</span></td>
        </tr>
      `;
    });
  }

  document.getElementById('nav-alert-count').textContent = count;
}

/* ===================== HISTORY TABLE ===================== */
function renderHistoryTable() {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  const roads = ['Đại lộ Thăng Long', 'Cầu Nhật Tân', 'Vành đai 3', 'Nguyễn Trãi', 'Trường Chinh'];
  const times = ['07:00', '08:00', '09:00', '10:00'];
  
  roads.forEach(r => {
    times.forEach((t, i) => {
      const speed = i === 1 ? Math.floor(Math.random()*15+5) : Math.floor(Math.random()*30+30);
      const density = i === 1 ? Math.floor(Math.random()*50+150) : Math.floor(Math.random()*50+40);
      const jamIdx = i === 1 ? 'Nghiêm trọng' : 'Bình thường';
      
      tbody.innerHTML += `
        <tr>
          <td>${t}</td>
          <td style="font-weight:500">${r}</td>
          <td style="color:${speed < 20 ? '#f87171' : 'inherit'}">${speed}</td>
          <td>${density}</td>
          <td><span class="badge-status" style="background:${jamIdx==='Nghiêm trọng'?'rgba(248,113,113,0.2)':'rgba(52,211,153,0.2)'};color:${jamIdx==='Nghiêm trọng'?'#f87171':'#34d399'}">${jamIdx}</span></td>
        </tr>
      `;
    });
  });
}

/* ===================== CHARTS ===================== */
Chart.defaults.color = '#7b8fb5';
Chart.defaults.font.family = 'Inter';

function initChart() {
  const ctx = document.getElementById('predictionChart').getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 130);
  g.addColorStop(0, 'rgba(248,113,113,0.4)'); g.addColorStop(1, 'rgba(248,113,113,0.0)');

  STATE.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Bây giờ', '+5p', '+10p', '+15p', '+20p', '+25p', '+30p'],
      datasets: [{
        data: genPredictionData(), borderColor: '#f87171', backgroundColor: g,
        borderWidth: 2, pointBackgroundColor: '#fff', fill: true, tension: 0.45
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.05)' } }, y: { grid: { color: 'rgba(255,255,255,0.05)' } } }
    }
  });
}

function initDashboardCharts() {
  // 1. Line Chart 24h
  const ctx24 = document.getElementById('chart-24h');
  if (ctx24) {
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
    const data = hours.map((_, i) => {
      if (i>=7 && i<=9) return 150 + Math.random()*50;
      if (i>=17 && i<=19) return 180 + Math.random()*40;
      if (i<5) return 20 + Math.random()*10;
      return 60 + Math.random()*30;
    });
    
    STATE.dashCharts.c24 = new Chart(ctx24, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [{ label: 'Lưu lượng trung bình', data, backgroundColor: '#38bdf8', borderRadius: 4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  // 2. Pie Chart
  const ctxPie = document.getElementById('chart-pie');
  if (ctxPie) {
    STATE.dashCharts.pie = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['Thông', 'Chậm', 'Ùn tắc', 'Nghẽn'],
        datasets: [{ data: [60, 20, 15, 5], backgroundColor: ['#34d399', '#fbbf24', '#f87171', '#c084fc'], borderWidth: 0 }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { position: 'bottom' } } }
    });
  }

  // 3. Bar chart (Top tắc)
  const ctxBar = document.getElementById('chart-bar');
  if (ctxBar) {
    STATE.dashCharts.bar = new Chart(ctxBar, {
      type: 'bar',
      indexAxis: 'y',
      data: {
        labels: ['Khuất Duy Tiến', 'Ngã Tư Sở', 'Vành đai 3', 'Cầu Giấy', 'Trường Chinh'],
        datasets: [{ data: [98, 92, 85, 80, 75], backgroundColor: '#f87171', borderRadius: 4 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }
}

function genPredictionData() {
  return Array.from({ length: 7 }, () => Math.floor(Math.random() * 100 + 40));
}

/* ===================== SIMULATION ===================== */
function initSimBtn() {
  const btn = document.getElementById('btn-simulate');
  btn.addEventListener('click', () => {
    STATE.isSimulating = !STATE.isSimulating;
    btn.classList.toggle('simulating', STATE.isSimulating);
    if (STATE.isSimulating) {
      startSimulation(); showToast('🚗 Mô phỏng xe chạy đã bật', 'info');
    } else stopSimulation();
  });
}

function startSimulation() {
  STATE.roads.forEach(road => {
    if (!isVisible(road)) return;
    const carCount = { clear: 2, slow: 3, jam: 5, severe: 7 }[road.status] || 3;
    for (let i = 0; i < carCount; i++) spawnCar(road, i / carCount);
  });
}

function spawnCar(road, startProgress) {
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:6px;height:6px;border-radius:50%;background:${COLOR[road.status]};box-shadow:0 0 6px ${COLOR[road.status]};"></div>`,
    iconSize: [6, 6], iconAnchor: [3, 3]
  });
  const marker = L.marker(road.coords[0], { icon, interactive: false }).addTo(STATE.map);
  STATE.carMarkers.push(marker);

  const SPEED = { clear: 0.045, slow: 0.018, jam: 0.007, severe: 0.002 };
  const speed = SPEED[road.status] || 0.02;
  let seg = 0, prog = startProgress, maxSeg = road.coords.length - 1;

  function step() {
    if (!STATE.isSimulating) return;
    prog += speed;
    if (prog >= 1) { prog = 0; seg = (seg + 1) % maxSeg; }
    const [lat1, lng1] = road.coords[seg];
    const [lat2, lng2] = road.coords[seg + 1] ?? road.coords[0];
    marker.setLatLng([lat1 + (lat2 - lat1) * prog, lng1 + (lng2 - lng1) * prog]);
    STATE.simAnimIds.push(requestAnimationFrame(step));
  }
  requestAnimationFrame(step);
}

function stopSimulation() {
  STATE.simAnimIds.forEach(cancelAnimationFrame);
  STATE.simAnimIds = [];
  STATE.carMarkers.forEach(m => STATE.map.removeLayer(m));
  STATE.carMarkers = [];
}

/* ===================== THEME TOGGLE ===================== */
function initTheme() {
  const btn = document.getElementById('theme-toggle');
  btn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    STATE.theme = isLight ? 'light' : 'dark';
    btn.querySelector('i').className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    loadTile(); 
    
    // Đổi màu chữ chart
    Chart.defaults.color = isLight ? '#475569' : '#7b8fb5';
    if(STATE.chart) STATE.chart.update();
    Object.values(STATE.dashCharts).forEach(c => c.update());
  });
}

function initWeatherBtn() {
  const btn = document.getElementById('weather-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    STATE.isWeatherBad = !STATE.isWeatherBad;
    document.body.classList.toggle('weather-bad', STATE.isWeatherBad);
    if (STATE.isWeatherBad) {
      btn.style.color = '#38bdf8';
      showToast('🌧️ Bão đổ bộ! Cảnh báo kẹt xe toàn thành phố.', 'severe');
    } else {
      btn.style.color = '';
      showToast('🌤️ Thời tiết quang đãng.', 'info');
    }
    refreshData();
  });
}

function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.innerHTML = `<i class="fa-solid ${type === 'jam' ? 'fa-triangle-exclamation' : type === 'severe' ? 'fa-fire' : 'fa-circle-info'}"></i> ${msg}`;
  c.appendChild(div);
  setTimeout(() => { div.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => div.remove(), 300); }, 4000);
}

function refreshData() {
  const wasSimulating = STATE.isSimulating;
  if (wasSimulating) stopSimulation();

  STATE.roads = buildLiveRoads(STATE.isWeatherBad);
  drawAllRoads(); drawHotspots(); renderRoadList(); updateStats();
  if (STATE.chart) STATE.chart.data.datasets[0].data = genPredictionData();
  if (STATE.chart) STATE.chart.update('active');

  if (STATE.selectedRoadId) showRoadInfo(STATE.selectedRoadId);
  if (Math.random() > 0.5) generateAlerts();
  if (wasSimulating) { STATE.isSimulating = true; startSimulation(); }
}

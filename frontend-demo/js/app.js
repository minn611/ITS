/**
 * app.js — ITS AI Traffic Platform v2.0
 * Nâng cấp: Count-up animation, Rain CSS, Alert filter, History hoàn chỉnh,
 * CSV export, Pagination, Sidebar mini stats, Slider live, Settings save, Uptime
 */

/* ===================== STATE ===================== */
const STATE = {
  theme:        'dark',
  map:          null,
  tileLayer:    null,
  roads:        [],
  polylines:    {},
  hotspotMarkers: [],
  carMarkers:   [],
  isSimulating: false,
  isWeatherBad: false,
  simAnimIds:   [],
  chart:        null,
  dashCharts:   {},
  filters: { type: 'all', status: 'all', search: '' },
  selectedRoadId: null,
  alerts: [],
  alertFilter: 'all',       // 'all' | 'pending' | 'resolved'
  historyData: [],           // Full history rows
  historyPage: 1,
  historyRowsPerPage: 15,
  historyRoadFilter: 'all',
  startTime: Date.now(),
};

/* Cấu hình màu */
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
  initNavigation();
  initDashboardCharts();
  initAlertFilters();
  initHistoryView();
  initSettings();
  initUptime();
  initRainDrops();

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

/* ===================== UPTIME ===================== */
let sysUptime = 0;
function initUptime() {
  const el = document.getElementById('uptime-display');
  if(!el) return;
  setInterval(() => {
    sysUptime++;
    const h = Math.floor(sysUptime / 60);
    const m = sysUptime % 60;
    el.textContent = `${h} giờ ${m} phút`;
  }, 60000); // 1 phút 1 lần
}

/* ===================== SPA NAVIGATION ===================== */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const views    = document.querySelectorAll('.app-view');
  const mapFilters = document.getElementById('map-filters');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      const targetId = item.getAttribute('data-target');
      views.forEach(v => { v.classList.remove('active'); v.style.display = 'none'; });
      const target = document.getElementById(targetId);
      target.style.display = 'flex';
      // trigger animation
      requestAnimationFrame(() => target.classList.add('active'));

      mapFilters.style.display = targetId === 'view-map' ? 'flex' : 'none';
      if (targetId === 'view-map' && STATE.map) setTimeout(() => STATE.map.invalidateSize(), 100);
      if (targetId === 'view-history') renderHistoryTable();
    });
  });

  // Quick links from road info panel
  document.getElementById('info-go-history')?.addEventListener('click', () => {
    document.querySelector('[data-target="view-history"]').click();
  });
  document.getElementById('info-go-dashboard')?.addEventListener('click', () => {
    document.querySelector('[data-target="view-dashboard"]').click();
  });
}

/* ===================== MAP ===================== */
function initMap() {
  STATE.map = L.map('traffic-map', { zoomControl: true, attributionControl: false })
    .setView([21.0285, 105.8542], 13);
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
  STATE.roads.forEach(road => { if (isVisible(road)) drawRoad(road); });
}

function drawRoad(road) {
  const col = COLOR[road.status];
  const glow = L.polyline(road.coords, { color: col, weight: 14, opacity: 0.16, lineCap: 'round', lineJoin: 'round' }).addTo(STATE.map);
  const core = L.polyline(road.coords, { color: col, weight: 4.5, opacity: 0.92, lineCap: 'round', lineJoin: 'round' }).addTo(STATE.map);
  core.on('click', () => showRoadInfo(road.id));
  glow.on('click', () => showRoadInfo(road.id));
  STATE.polylines[road.id] = { glow, core };
}

/* Hotspots */
const HOTSPOTS = [
  { name: 'Nút giao Khuất Duy Tiến', lat: 20.9926, lng: 105.8076, status: 'jam', density: 185 },
  { name: 'Cầu Vượt Ngã Tư Sở',     lat: 20.9958, lng: 105.8210, status: 'severe', density: 210 },
  { name: 'Ngã Tư Trường Chinh',     lat: 21.0002, lng: 105.8360, status: 'jam', density: 162 },
  { name: 'Cầu Giấy',                lat: 21.0368, lng: 105.8200, status: 'slow', density: 98 },
  { name: 'Bùng Binh Cầu Giấy',      lat: 21.0302, lng: 105.8018, status: 'jam', density: 145 },
  { name: 'Ngã tư Vọng',             lat: 21.0052, lng: 105.8480, status: 'slow', density: 110 },
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

    const statusColor = COLOR[h.status];
    const popupContent = `
      <div style="width:230px; font-family:Inter;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <i class="fa-solid fa-video" style="color:#f87171;font-size:13px;"></i>
          <b style="font-size:13px;">CCTV: ${h.name}</b>
        </div>
        <div style="background:#000;border-radius:6px;overflow:hidden;position:relative;margin-bottom:8px;">
          <img src="https://media.giphy.com/media/xT9IgzoXuwA2yqKj8s/giphy.gif" style="width:100%;display:block;opacity:0.8;">
          <div style="position:absolute;top:5px;left:5px;color:#fff;font-size:9px;background:rgba(0,0,0,0.6);padding:2px 5px;border-radius:3px;">
            REC <span style="color:red;">●</span>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;">
          <span style="color:var(--text-2)">Trạng thái:</span>
          <span style="color:${statusColor};font-weight:600;">${STATUS_LABEL[h.status]}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:4px;">
          <span style="color:var(--text-2)">Mật độ:</span>
          <span style="font-weight:600;">${h.density} xe/phút</span>
        </div>
        <div style="font-size:11px;color:#f87171;margin-top:7px;font-weight:600;">
          ⚠️ AI: Giao thông ${STATUS_LABEL[h.status].toLowerCase()}, cần chú ý!
        </div>
      </div>`;

    const m = L.marker([h.lat, h.lng], { icon })
      .addTo(STATE.map)
      .bindPopup(popupContent, { maxWidth: 260, className: 'cctv-popup' });
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
  badge.textContent = STATUS_LABEL[road.status];
  badge.className   = `road-info-badge ${road.status}`;
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

/* ===================== STATS & SIDEBAR MINI STATS ===================== */
function updateStats() {
  const total   = STATE.roads.length;
  const jammed  = STATE.roads.filter(r => r.status === 'jam' || r.status === 'severe').length;
  const clear   = STATE.roads.filter(r => r.status === 'clear').length;

  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-jam').textContent      = jammed;
  document.getElementById('stat-clear').textContent    = clear;
  document.getElementById('road-count-sidebar').textContent = total;
  
  const miniJam = document.getElementById('mini-stat-jam');
  const miniClear = document.getElementById('mini-stat-clear');
  if (miniJam) miniJam.textContent = jammed;
  if (miniClear) miniClear.textContent = clear;
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

    // Tính % lưu lượng (density max ~250)
    const densityPct = Math.min(100, Math.round((road.density / 250) * 100));

    const li = document.createElement('li');
    li.className = `road-list-item${visible ? '' : ' hidden'}`;
    li.dataset.id = road.id;
    li.innerHTML = `
      <span class="road-dot ${road.status}"></span>
      <div class="road-item-info">
        <div class="road-item-name">${road.name}</div>
        <div class="road-item-meta">${road.district} · ${TYPE_LABEL[road.type]}</div>
      </div>
      <div class="road-item-right">
        <span class="road-item-speed">${road.speed} km/h</span>
        <div class="road-item-progress">
          <div class="road-item-progress-fill ${road.status}" style="width:${densityPct}%"></div>
        </div>
      </div>
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
    clear.style.display = STATE.filters.search ? 'block' : 'none';
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
  { type: 'severe', icon: 'fa-car-burst',        title: 'Tai nạn liên hoàn',    desc: 'Nút giao Khuất Duy Tiến - Nguyễn Trãi',   road: 'Đường Nguyễn Trãi' },
  { type: 'jam',    icon: 'fa-road-barrier',      title: 'Ùn tắc do công trình', desc: 'Vành đai 3 đoạn Thanh Xuân',               road: 'Vành đai 3' },
  { type: 'jam',    icon: 'fa-road-spikes',       title: 'Tắc kéo dài',          desc: 'Đường Nguyễn Trãi hướng Hà Đông',          road: 'Đường Nguyễn Trãi' },
  { type: 'slow',   icon: 'fa-traffic-cone',      title: 'Sửa đường',            desc: 'Phạm Hùng đoạn Mỹ Đình',                  road: 'Đường Phạm Hùng' },
  { type: 'severe', icon: 'fa-fire',              title: 'Cháy xe ô tô',         desc: 'Cầu Vĩnh Tuy hướng Gia Lâm',              road: 'Cầu Vĩnh Tuy' },
  { type: 'jam',    icon: 'fa-person-running',    title: 'Biểu tình/Sự kiện',    desc: 'Đinh Tiên Hoàng - Hồ Hoàn Kiếm',          road: 'Đinh Tiên Hoàng' },
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
  if (ul) {
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
  }
  
  const navCount = document.getElementById('nav-alert-count');
  if (navCount) navCount.textContent = count;

  renderAlertsTable();
}

function initAlertFilters() {
  const btns = document.querySelectorAll('[data-alert-filter]');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      STATE.alertFilter = btn.getAttribute('data-alert-filter');
      renderAlertsTable();
    });
  });
}

function renderAlertsTable() {
  const tbody = document.getElementById('alerts-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  let pendingCount = 0;
  let resolvedCount = 0;
  const now = new Date();
  
  STATE.alerts.forEach(a => {
    if (a.statusStr === 'Chưa xử lý') pendingCount++;
    else resolvedCount++;
    
    // Áp dụng bộ lọc
    if (STATE.alertFilter === 'pending' && a.statusStr !== 'Chưa xử lý') return;
    if (STATE.alertFilter === 'resolved' && a.statusStr === 'Chưa xử lý') return;

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
        <td><button class="btn btn-outline" style="padding:4px 8px;font-size:11px">Chi tiết</button></td>
      </tr>
    `;
  });
  
  // Cập nhật số liệu trên Badge
  const bAll = document.getElementById('badge-all');
  const bPen = document.getElementById('badge-pending');
  const bRes = document.getElementById('badge-resolved');
  if (bAll) bAll.textContent = STATE.alerts.length;
  if (bPen) bPen.textContent = pendingCount;
  if (bRes) bRes.textContent = resolvedCount;
}

/* ===================== HISTORY TABLE ===================== */
function initHistoryView() {
  const select = document.getElementById('history-road');
  const dateInput = document.getElementById('history-date');
  if (select) {
    select.innerHTML = '<option value="all">Tất cả tuyến đường</option>';
    HANOI_ROADS.forEach(r => {
      select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
    select.addEventListener('change', renderHistoryTable);
  }
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    dateInput.addEventListener('change', renderHistoryTable);
  }
}

function renderHistoryTable() {
  const tbody = document.getElementById('history-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const selRoad = document.getElementById('history-road')?.value || 'all';
  
  let targetRoads = HANOI_ROADS;
  if (selRoad !== 'all') {
    targetRoads = HANOI_ROADS.filter(r => r.id === parseInt(selRoad));
  } else {
    targetRoads = HANOI_ROADS.slice(0, 5); // Hiển thị mẫu 5 đường nếu chọn "Tất cả"
  }
  
  const times = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00', '19:00'];
  let count = 0;
  
  targetRoads.forEach(r => {
    times.forEach((t, i) => {
      count++;
      if(count > 20) return; // Paginate giả lập
      
      const isPeak = t === '08:00' || t === '17:00' || t === '18:00';
      const speed = isPeak ? Math.floor(Math.random()*15+5) : Math.floor(Math.random()*30+30);
      const density = isPeak ? Math.floor(Math.random()*50+150) : Math.floor(Math.random()*50+40);
      const jamIdx = isPeak ? 'Nghiêm trọng' : 'Bình thường';
      const loadStr = isPeak ? '<div class="metric-bar"><div class="metric-bar-fill warning" style="width:85%"></div></div>' : '<div class="metric-bar"><div class="metric-bar-fill success" style="width:30%"></div></div>';
      
      tbody.innerHTML += `
        <tr>
          <td>${t}</td>
          <td style="font-weight:500">${r.name}</td>
          <td style="color:${speed < 20 ? '#f87171' : 'inherit'}">${speed}</td>
          <td>${density}</td>
          <td><span class="badge-status" style="background:${jamIdx==='Nghiêm trọng'?'rgba(248,113,113,0.2)':'rgba(52,211,153,0.2)'};color:${jamIdx==='Nghiêm trọng'?'#f87171':'#34d399'}">${jamIdx}</span></td>
          <td style="width:100px">${loadStr}</td>
        </tr>
      `;
    });
  });
  
  const pgInfo = document.getElementById('pagination-info');
  if(pgInfo) pgInfo.textContent = `Hiển thị 1-${Math.min(count, 20)} / ${count} bản ghi`;
  
  const pgBtns = document.getElementById('pagination-buttons');
  if(pgBtns) {
    pgBtns.innerHTML = `
      <button class="btn btn-outline" disabled><i class="fa-solid fa-chevron-left"></i></button>
      <button class="btn btn-primary">1</button>
      <button class="btn btn-outline" ${count <= 20 ? 'disabled' : ''}><i class="fa-solid fa-chevron-right"></i></button>
    `;
  }
}

/* ===================== CHARTS ===================== */
Chart.defaults.color = '#7b8fb5';
Chart.defaults.font.family = 'Inter';

function initChart() {
  const ctx = document.getElementById('predictionChart').getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 110);
  g.addColorStop(0, 'rgba(248,113,113,0.4)');
  g.addColorStop(1, 'rgba(248,113,113,0.0)');

  STATE.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Bây giờ', '+5p', '+10p', '+15p', '+20p', '+25p', '+30p'],
      datasets: [{
        data: genPredictionData(),
        borderColor: '#f87171',
        backgroundColor: g,
        borderWidth: 2,
        pointBackgroundColor: '#fff',
        pointRadius: 3,
        fill: true,
        tension: 0.45
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: {
        callbacks: {
          label: ctx => `Chỉ số tắc: ${ctx.raw}`,
        }
      }},
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 10 } } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 10 } }, min: 0, max: 180 }
      }
    }
  });
}

function initDashboardCharts() {
  // 1. Bar+Line combo 24h
  const ctx24 = document.getElementById('chart-24h');
  if (ctx24) {
    const hours   = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const barData = hours.map((_, i) => {
      if (i >= 7 && i <= 9)  return 150 + Math.random() * 50;
      if (i >= 17 && i <= 19) return 180 + Math.random() * 40;
      if (i < 5) return 20 + Math.random() * 10;
      return 60 + Math.random() * 30;
    });
    const predLine = barData.map(v => Math.min(220, v * (1 + (Math.random() - 0.4) * 0.2)));

    STATE.dashCharts.c24 = new Chart(ctx24, {
      type: 'bar',
      data: {
        labels: hours,
        datasets: [
          { label: 'Lưu lượng thực', data: barData, backgroundColor: 'rgba(56,189,248,0.5)', borderRadius: 3 },
          { label: 'Dự đoán AI', data: predLine, type: 'line', borderColor: '#f87171', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 0, tension: 0.45, borderDash: [4, 3] }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { maxRotation: 0, font: { size: 9 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' } }
        }
      }
    });
  }

  // 2. Donut Chart
  const ctxPie = document.getElementById('chart-pie');
  if (ctxPie) {
    const clear  = STATE.roads.filter(r => r.status === 'clear').length;
    const slow   = STATE.roads.filter(r => r.status === 'slow').length;
    const jam    = STATE.roads.filter(r => r.status === 'jam').length;
    const severe = STATE.roads.filter(r => r.status === 'severe').length;

    STATE.dashCharts.pie = new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['Thông', 'Chậm', 'Ùn tắc', 'Nghẽn'],
        datasets: [{
          data: [clear, slow, jam, severe],
          backgroundColor: ['#34d399', '#fbbf24', '#f87171', '#c084fc'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '72%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } }
        }
      }
    });
  }

  // 3. Horizontal Bar — Top tắc
  const ctxBar = document.getElementById('chart-bar');
  if (ctxBar) {
    STATE.dashCharts.bar = new Chart(ctxBar, {
      type: 'bar',
      indexAxis: 'y',
      data: {
        labels: ['Khuất Duy Tiến', 'Ngã Tư Sở', 'Vành đai 3', 'Cầu Giấy', 'Trường Chinh'],
        datasets: [{
          data: [98, 92, 85, 80, 75],
          backgroundColor: ['#c084fc', '#f87171', '#f87171', '#fbbf24', '#fbbf24'],
          borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, max: 100, ticks: { callback: v => v + '%' } },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } }
        }
      }
    });
  }
}

function genPredictionData() {
  return Array.from({ length: 7 }, (_, i) => {
    const base = 60 + Math.random() * 80;
    return Math.round(base + (i % 2 === 0 ? 10 : -5));
  });
}

/* ===================== SIMULATION ===================== */
function initSimBtn() {
  const btn = document.getElementById('btn-simulate');
  btn.addEventListener('click', () => {
    STATE.isSimulating = !STATE.isSimulating;
    btn.classList.toggle('simulating', STATE.isSimulating);
    if (STATE.isSimulating) {
      startSimulation();
      showToast('🚗 Mô phỏng xe chạy đã bật', 'info');
    } else {
      stopSimulation();
      showToast('⏹️ Đã tắt mô phỏng', 'info');
    }
  });
}

function updateSimCount() {
  const el = document.getElementById('sim-count');
  if (el) el.textContent = STATE.carMarkers.length;
}

function startSimulation() {
  let count = 0;
  STATE.roads.forEach(road => {
    if (!isVisible(road)) return;
    const carCount = { clear: 2, slow: 3, jam: 5, severe: 7 }[road.status] || 3;
    for (let i = 0; i < carCount; i++) { spawnCar(road, i / carCount); count++; }
  });
  const badge = document.getElementById('sim-count');
  if(badge) badge.textContent = count;
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
  const badge = document.getElementById('sim-count');
  if(badge) badge.textContent = '0';
}

/* ===================== THEME TOGGLE ===================== */
function initTheme() {
  const btn = document.getElementById('theme-toggle');
  btn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-mode');
    STATE.theme = isLight ? 'light' : 'dark';
    btn.querySelector('i').className = isLight ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
    loadTile();
    Chart.defaults.color = isLight ? '#475569' : '#7b8fb5';
    if (STATE.chart) STATE.chart.update();
    Object.values(STATE.dashCharts).forEach(c => c.update());
    showToast(isLight ? '☀️ Đã chuyển sang chế độ sáng' : '🌙 Đã chuyển sang chế độ tối', 'info');
  });
}

/* ===================== WEATHER ===================== */
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

function initSettings() {
  const slider = document.getElementById('slider-threshold');
  const val = document.getElementById('val-threshold');
  if(slider && val) {
    slider.addEventListener('input', (e) => {
      val.textContent = e.target.value + '%';
    });
  }
  
  const btnSave = document.getElementById('btn-save-settings');
  if(btnSave) {
    btnSave.addEventListener('click', () => {
      showToast('Đã lưu cấu hình hệ thống', 'success');
    });
  }
}

function scheduleLightning() {
  if (!STATE.isWeatherBad) return;
  const delay = 3000 + Math.random() * 7000;
  setTimeout(() => {
    if (!STATE.isWeatherBad) return;
    triggerLightning();
    scheduleLightning();
  }, delay);
}

function triggerLightning() {
  const el = document.createElement('div');
  el.className = 'lightning-flash';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 200);
}

/* ===================== RAIN DROPS CSS ===================== */
function initRainDrops() {
  const container = document.getElementById('rain-overlay');
  if (!container) return;

  // Tạo 80 giọt mưa CSS thuần
  for (let i = 0; i < 80; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    const left     = Math.random() * 100;
    const delay    = Math.random() * 2;
    const duration = 0.5 + Math.random() * 0.8;
    const height   = 15 + Math.random() * 25;
    drop.style.cssText = `
      left: ${left}%;
      height: ${height}px;
      animation-duration: ${duration}s;
      animation-delay: ${delay}s;
      opacity: ${0.4 + Math.random() * 0.5};
    `;
    container.appendChild(drop);
  }
}

/* ===================== SETTINGS ===================== */
function initSettings() {
  // Live range slider
  const slider = document.getElementById('slider-threshold');
  const valEl  = document.getElementById('val-threshold');
  if (slider && valEl) {
    slider.addEventListener('input', () => {
      valEl.textContent = slider.value + '%';
    });
  }

  // Save button
  document.getElementById('btn-save-settings')?.addEventListener('click', () => {
    const btn = document.getElementById('btn-save-settings');
    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Lưu thay đổi';
      btn.disabled = false;
      showToast('✅ Đã lưu cấu hình thành công!', 'success');
    }, 1200);
  });
}

/* ===================== TOAST ===================== */
function showToast(msg, type = 'info') {
  const c   = document.getElementById('toast-container');
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  const icon = type === 'jam' ? 'fa-triangle-exclamation'
    : type === 'severe' ? 'fa-fire'
    : type === 'success' ? 'fa-circle-check'
    : 'fa-circle-info';
  div.innerHTML = `<i class="fa-solid ${icon}"></i> ${msg}`;
  c.appendChild(div);
  setTimeout(() => {
    div.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => div.remove(), 300);
  }, 4000);
}

/* ===================== REFRESH DATA ===================== */
function refreshData() {
  const wasSimulating = STATE.isSimulating;
  if (wasSimulating) stopSimulation();

  STATE.roads = buildLiveRoads(STATE.isWeatherBad);
  drawAllRoads();
  drawHotspots();
  renderRoadList();
  updateStats();

  if (STATE.chart) {
    STATE.chart.data.datasets[0].data = genPredictionData();
    STATE.chart.update('active');
  }

  if (STATE.selectedRoadId) showRoadInfo(STATE.selectedRoadId);
  if (Math.random() > 0.6) generateAlerts();
  if (wasSimulating) { STATE.isSimulating = true; startSimulation(); }
}

// Or-care-stra Ensemble v1.0
// Digital Twin Hospital Equipment Tracking System

// ============================================================================
// MEDICAL EQUIPMENT SVG ICONS
// ============================================================================

const Icons = {
  // Patient Monitor - High Value Asset
  patientMonitor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M2 10h4l2-4 3 8 2-4h9" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="8" y="20" width="8" height="2" rx="1"/>
    <path d="M12 18v2"/>
  </svg>`,

  // Infusion Pump
  infusionPump: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="6" y="2" width="12" height="20" rx="2"/>
    <rect x="8" y="5" width="8" height="6" rx="1"/>
    <circle cx="12" cy="15" r="2"/>
    <path d="M10 15h4"/>
    <path d="M3 6h3M18 6h3"/>
  </svg>`,

  // Defibrillator
  defibrillator: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="6" width="18" height="14" rx="2"/>
    <path d="M7 13h3l1-3 2 6 1-3h3" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="7" cy="9" r="1" fill="currentColor"/>
    <circle cx="17" cy="9" r="1" fill="currentColor"/>
    <path d="M9 3v3M15 3v3"/>
  </svg>`,

  // Ventilator
  ventilator: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="4" y="8" width="16" height="12" rx="2"/>
    <path d="M8 8V6a4 4 0 0 1 8 0v2"/>
    <circle cx="12" cy="14" r="3"/>
    <path d="M12 11v6M9 14h6"/>
    <path d="M7 20v2M17 20v2"/>
  </svg>`,

  // Wheelchair
  wheelchair: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="8" cy="18" r="3"/>
    <circle cx="18" cy="18" r="3"/>
    <path d="M8 15V8a2 2 0 0 1 2-2h4"/>
    <path d="M14 6v6h4l2 6"/>
    <path d="M8 12h6"/>
  </svg>`,

  // Hospital Bed
  hospitalBed: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6"/>
    <path d="M3 10V8"/>
    <path d="M21 10V8"/>
    <circle cx="5" cy="20" r="2"/>
    <circle cx="19" cy="20" r="2"/>
    <path d="M7 10V7a2 2 0 0 1 2-2h2"/>
    <circle cx="8" cy="7" r="2"/>
  </svg>`,

  // Ultrasound Machine
  ultrasound: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="4" y="4" width="16" height="12" rx="2"/>
    <ellipse cx="12" cy="10" rx="4" ry="3"/>
    <path d="M8 20h8"/>
    <path d="M12 16v4"/>
    <path d="M6 7h2M16 7h2"/>
  </svg>`,

  // ECG Machine
  ecgMachine: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="2" y="6" width="20" height="14" rx="2"/>
    <path d="M2 12h4l1.5-4 2 8 1.5-4h4l1.5 4 2-8 1.5 4H22" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M6 4v2M18 4v2"/>
  </svg>`,

  // Location Pin
  location: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
    <circle cx="12" cy="9" r="2.5"/>
  </svg>`,

  // Alert Triangle
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13" stroke-linecap="round"/>
    <circle cx="12" cy="17" r="1" fill="currentColor"/>
  </svg>`,

  // Dashboard Grid
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>`,

  // Hospital Building
  hospital: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="6" width="18" height="16" rx="2"/>
    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/>
    <path d="M12 10v6M9 13h6" stroke-linecap="round"/>
    <path d="M7 22v-4h4v4M13 22v-4h4v4"/>
  </svg>`,

  // Blockchain/Chain Link
  blockchain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="3" y="8" width="6" height="8" rx="1"/>
    <rect x="15" y="8" width="6" height="8" rx="1"/>
    <path d="M9 12h6"/>
    <path d="M9 10h6M9 14h6" stroke-dasharray="2 2"/>
  </svg>`,

  // Settings Gear
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
  </svg>`,

  // Scan/Search
  scan: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 8v8M8 12h8"/>
  </svg>`,

  // BLE/Bluetooth Tag
  bleTag: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <path d="M6.5 6.5l11 11L12 22V2l5.5 5.5-11 11"/>
    <circle cx="18" cy="6" r="2"/>
    <circle cx="20" cy="4" r="1"/>
  </svg>`,

  // Geofence
  geofence: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="12" cy="12" r="8" stroke-dasharray="4 2"/>
    <circle cx="12" cy="12" r="4"/>
    <path d="M12 4v2M12 18v2M4 12h2M18 12h2"/>
  </svg>`,

  // Ward/Room
  ward: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M2 10h20"/>
    <path d="M8 4v16"/>
    <path d="M16 4v16"/>
  </svg>`,

  // Clock/History
  history: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2" stroke-linecap="round"/>
  </svg>`,

  // Checkmark
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // X/Close
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`
};

// ============================================================================
// APPLICATION STATE
// ============================================================================

const AppState = {
  currentView: 'dashboard',
  assets: [],
  locations: [],
  alerts: [],
  users: [],
  loading: true,
  offlineMode: false,
  lastSync: null
};

// ============================================================================
// API LAYER
// ============================================================================

const API = {
  baseURL: '/api',

  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`);
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      AppState.offlineMode = false;
      return response.json();
    } catch (error) {
      console.error('API GET error:', error);
      AppState.offlineMode = true;
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      AppState.offlineMode = false;
      return response.json();
    } catch (error) {
      console.error('API POST error:', error);
      AppState.offlineMode = true;
      throw error;
    }
  },

  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      return response.json();
    } catch (error) {
      console.error('API PUT error:', error);
      throw error;
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(amount, currency = 'ZAR') {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency
  }).format(amount);
}

function formatNumber(num) {
  return new Intl.NumberFormat('en-ZA').format(num);
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat('en-ZA', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(date));
}

function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getAssetStatusColor(status) {
  const colors = {
    online: '#10b981',
    offline: '#94a3b8',
    moving: '#00fff7',
    alert: '#ef4444',
    maintenance: '#f97316'
  };
  return colors[status] || colors.offline;
}

function getAssetTypeIcon(type) {
  const icons = {
    patient_monitor: Icons.patientMonitor,
    infusion_pump: Icons.infusionPump,
    defibrillator: Icons.defibrillator,
    ventilator: Icons.ventilator,
    wheelchair: Icons.wheelchair,
    hospital_bed: Icons.hospitalBed,
    ultrasound: Icons.ultrasound,
    ecg_machine: Icons.ecgMachine
  };
  return icons[type] || Icons.patientMonitor;
}

// ============================================================================
// TIME DISPLAY
// ============================================================================

function updateTime() {
  const timeEl = document.getElementById('current-time');
  const dateEl = document.getElementById('current-date');

  if (timeEl) {
    timeEl.textContent = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }

  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  }
}

// ============================================================================
// OFFLINE INDICATOR
// ============================================================================

function renderOfflineIndicator() {
  if (!AppState.offlineMode) return '';

  return `
    <div class="offline-indicator">
      <span class="offline-dot"></span>
      Offline Mode - Changes will sync when connection is restored
    </div>
  `;
}

// ============================================================================
// NAVIGATION
// ============================================================================

function renderNavigation() {
  const navItems = [
    { id: 'dashboard', icon: Icons.dashboard, label: 'Dashboard' },
    { id: 'assets', icon: Icons.patientMonitor, label: 'Assets' },
    { id: 'floor-plan', icon: Icons.ward, label: 'Floor Plan' },
    { id: 'alerts', icon: Icons.alert, label: 'Alerts' },
    { id: 'geofences', icon: Icons.geofence, label: 'Geofences' },
    { id: 'audit-log', icon: Icons.blockchain, label: 'Audit Log' },
    { id: 'settings', icon: Icons.settings, label: 'Settings' }
  ];

  return `
    <nav class="top-nav">
      <div class="nav-inner">
        <a href="/" class="nav-brand">
          <div class="nav-logo">
            <div class="logo-equipment">
              <div class="pulse"></div>
              <div class="pulse"></div>
              <div class="pulse"></div>
              <div class="pulse"></div>
              <div class="pulse"></div>
              <div class="pulse"></div>
              <div class="pulse"></div>
            </div>
          </div>
          <div class="nav-brand-text">
            <span class="nav-brand-name">Or-care-stra Ensemble</span>
            <span class="nav-brand-sub">Digital Twin Asset Tracking</span>
          </div>
        </a>

        <div class="nav-links">
          ${navItems.map(item => `
            <a href="#${item.id}"
               class="nav-link ${AppState.currentView === item.id ? 'active' : ''}"
               data-view="${item.id}">
              <i class="nav-icon">${item.icon}</i>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </div>

        <div class="nav-right">
          <div class="nav-time">
            <div class="time-display" id="current-time">--:--</div>
            <div class="date-display" id="current-date">Loading...</div>
          </div>
        </div>
      </div>
    </nav>
  `;
}

// ============================================================================
// INITIALIZE
// ============================================================================

function initApp() {
  // Start time updates
  updateTime();
  setInterval(updateTime, 1000);

  // Setup navigation clicks
  document.addEventListener('click', (e) => {
    const navLink = e.target.closest('.nav-link');
    if (navLink) {
      e.preventDefault();
      const viewId = navLink.dataset.view;
      if (viewId) {
        navigateTo(viewId);
      }
    }
  });

  console.log('Or-care-stra Ensemble initialized');
}

// ============================================================================
// VIEW ROUTER
// ============================================================================

async function navigateTo(view) {
  AppState.currentView = view;

  // Update URL hash without reload
  window.location.hash = view;

  // Re-render navigation to update active state
  const navContainer = document.querySelector('.top-nav');
  if (navContainer) {
    navContainer.outerHTML = renderNavigation();
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);

// Export for use in other modules
window.Icons = Icons;
window.AppState = AppState;
window.API = API;
window.formatCurrency = formatCurrency;
window.formatNumber = formatNumber;
window.formatDateTime = formatDateTime;
window.formatRelativeTime = formatRelativeTime;
window.getAssetStatusColor = getAssetStatusColor;
window.getAssetTypeIcon = getAssetTypeIcon;

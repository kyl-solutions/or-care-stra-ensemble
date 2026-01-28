# Or-care-stra Ensemble

**Digital Twin Hospital Equipment Tracking System**

A real-time location system (RTLS) for tracking billions of Rands worth of hospital equipment. Built to save clinicians critical time, save the taxpayer billions, and create aligned incentives through profit-sharing rewards.

---

## The Problem

South African hospitals face a crisis in equipment management:

| Metric | Value |
|--------|-------|
| **Daily Equipment Loss** | R585,000 |
| **Annual Financial Bleed** | R213.8M |
| **Nurse Hours Wasted Monthly** | 6,000 searching for equipment |
| **Patient Suffering** | 273 hours daily from delayed care |

The most commonly lost items are patient monitors (R30,000 each), infusion pumps (R50,000), and portable ECG machines (R120,000).

---

## The Solution

Or-care-stra Ensemble provides **100% asset visibility** through:

- **Real-Time BLE Tracking** - Sub-meter accuracy across every ward
- **Blockchain Audit Trail** - Tamper-proof, immutable movement logs
- **AI Anomaly Detection** - Spot theft and hoarding before it happens
- **Smart Geofencing** - Instant alerts when equipment leaves designated zones
- **Offline Resilience** - 24-48 hour operation during load-shedding
- **Ensemble Rewards** - Profit-sharing for everyone who prevents loss

**Target Outcome:**
- R60-109M annual savings (conservative)
- 100% asset visibility
- 273 hours of patient suffering prevented daily

---

## Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/kylsolutions/or-care-stra-ensemble.git
cd or-care-stra-ensemble

# Install dependencies
npm install

# Initialize and seed the database
npm run db:init
npm run db:seed

# Start the server
npm run dev
```

### Access Points

| Endpoint | Description |
|----------|-------------|
| `http://localhost:3457` | Landing page |
| `http://localhost:3457/dashboard` | Command Center |
| `http://localhost:3457/api/health` | API health check |
| `ws://localhost:3457/ws` | WebSocket for real-time updates |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Landing Page     │  Command Center    │  Schematic Diagrams    │
│  (landing.html)   │  (command-center)  │  (schematics/)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER (Hono.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  REST Endpoints   │  WebSocket Server  │  Blockchain API        │
│  /api/assets      │  /ws               │  /api/blockchain/*     │
│  /api/alerts      │  Real-time events  │  Audit trail queries   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  SQLite Database  │  Blockchain Store  │  IoT Simulator         │
│  (better-sqlite3) │  (audit-chain.js)  │  (iot-simulator.js)    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
or-care-stra-ensemble/
├── public/                    # Frontend assets
│   ├── landing.html           # Marketing landing page
│   ├── index.html             # Classic 2D dashboard
│   ├── command-center.html    # 3D isometric command center
│   ├── assets/
│   │   ├── command-center.css # Glassmorphism design system
│   │   └── app.js             # Shared utilities
│   └── schematics/            # Presentation diagrams
│       ├── system-architecture.html
│       └── asset-identity-certificate.html
├── database/
│   ├── init.js                # Database schema initialization
│   ├── seed.js                # Sample data seeding
│   └── ensemble.db            # SQLite database (generated)
├── blockchain/
│   └── audit-chain.js         # Blockchain audit trail implementation
├── simulator/
│   └── iot-simulator.js       # BLE tag event simulator
├── workers/
│   └── auth-notify/           # Cloudflare Worker for notifications
│       ├── src/index.js
│       └── wrangler.toml
├── electron/                  # Desktop app configuration
│   ├── main.js                # Electron main process
│   ├── preload.js             # Security bridge
│   ├── entitlements.mac.plist # macOS permissions
│   └── icons/                 # App icons
├── server.js                  # Hono.js server entry point
├── package.json               # Dependencies and build scripts
├── .env.example               # Environment template
└── README.md                  # This file
```

---

## Features

### 1. Real-Time Asset Tracking

BLE-powered tracking with sub-meter accuracy. Every asset has a digital twin showing:
- Current location (ward, zone, room)
- Battery level and signal strength
- Movement history
- Maintenance status

### 2. Blockchain Audit Trail

Tamper-evident logging using SHA-256 cryptographic chaining:

```javascript
// Every movement is recorded immutably
{
  hash: "a1b2c3...",
  previous_hash: "z9y8x7...",
  timestamp: "2026-01-28T10:30:00Z",
  asset_id: 42,
  event_type: "movement",
  from_zone: "ICU Bay 1",
  to_zone: "Storage Room A"
}
```

### 3. Smart Geofencing

Define zone boundaries and rules:
- ICU perimeter alerts
- Operating Theatre sterile zones
- Exit boundary detection
- Equipment hoarding patterns

### 4. IoT Simulator

Test the system without hardware:

```bash
# Start simulation via API
curl -X POST http://localhost:3457/api/simulator/start \
  -H "Content-Type: application/json" \
  -d '{"scenario": "normal"}'
```

**Available Scenarios:**
| Scenario | Description |
|----------|-------------|
| `normal` | Standard operations, 15% movement probability |
| `busy` | High activity shift, 30% movement |
| `quiet` | Night shift, 5% movement |
| `theft` | Equipment leaving facility boundaries |
| `hoarding` | Equipment accumulating in unexpected locations |

### 5. Ensemble Rewards

Profit-sharing for everyone who helps prevent loss:
- **Staff Rewards**: R50-R500 per verified report
- **Supplier Partnership**: 10-20% of verified annual savings
- **Savings Pool**: R60-109M potential annual pool

---

## API Reference

### Assets

```bash
# List all assets
GET /api/assets

# Get asset with movement history
GET /api/assets/:id

# Get real-time positions
GET /api/assets/positions
```

### Alerts

```bash
# List alerts
GET /api/alerts?status=open&severity=critical

# Acknowledge alert
POST /api/alerts/:id/acknowledge
{ "user_id": "nurse-001" }

# Resolve alert
POST /api/alerts/:id/resolve
{ "user_id": "security-001", "notes": "Equipment returned" }
```

### Blockchain

```bash
# Chain status
GET /api/blockchain/status

# Verify integrity
GET /api/blockchain/verify

# Browse blocks
GET /api/blockchain/blocks?limit=10

# Asset audit history
GET /api/blockchain/asset/:id/history
```

### Simulator

```bash
# Start simulator
POST /api/simulator/start
{ "scenario": "normal" }

# Stop simulator
POST /api/simulator/stop

# Change scenario
POST /api/simulator/scenario
{ "scenario": "theft" }

# Get status
GET /api/simulator/status
```

### WebSocket Events

Connect to `ws://localhost:3457/ws` for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:3457/ws');

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  switch (msg.type) {
    case 'asset_events':    // Asset movements
    case 'alert':           // New alerts
    case 'new_block':       // Blockchain block created
    case 'tick':            // Simulator heartbeat
  }
};

// Commands
ws.send(JSON.stringify({ type: 'start_simulator', scenario: 'normal' }));
ws.send(JSON.stringify({ type: 'stop_simulator' }));
ws.send(JSON.stringify({ type: 'ping' }));
```

---

## Desktop App

### Build for Your Platform

```bash
# macOS (DMG + ZIP)
npm run electron:build:mac

# Windows (NSIS installer + Portable)
npm run electron:build:win

# Linux (AppImage + DEB)
npm run electron:build:linux

# All platforms
npm run electron:build:all
```

### Desktop Features

- **Movable Window**: Drag anywhere on screen
- **Collapsible**: Compact mode (Cmd/Ctrl+M) for minimal footprint
- **System Tray**: Minimize to tray, quick access menu
- **Offline Mode**: Embedded server runs locally
- **Cross-Platform**: Windows, macOS (Intel + Apple Silicon), Linux

---

## Authentication

The Command Center uses partner codes for access:

| Code | Partner |
|------|---------|
| `ENSEMBLE2026` | KYL Solutions (Admin) |
| `KYLSOLUTIONS` | KYL Solutions (Internal) |
| `CHBAH-PILOT` | Chris Hani Baragwanath Hospital |
| `GAUTENG-DOH` | Gauteng Department of Health |
| `MEDTECH-SA` | MedTech SA (Supplier) |
| `PHILIPS-RSA` | Philips Healthcare SA |
| `PARTNER-DEMO` | Demo Partner |

Authentication triggers a push notification via ntfy.sh for real-time access monitoring.

---

## Database Schema

### Core Tables

```sql
-- Assets: Equipment catalog with BLE tag mapping
CREATE TABLE assets (
  id INTEGER PRIMARY KEY,
  asset_tag TEXT UNIQUE,
  name TEXT,
  asset_type TEXT,        -- monitor, pump, defibrillator, ventilator, etc.
  status TEXT,            -- online, offline, alert, maintenance
  current_zone_id INTEGER,
  current_x REAL,
  current_y REAL,
  battery_level INTEGER,
  last_seen DATETIME
);

-- Locations: Wards, zones, rooms hierarchy
CREATE TABLE locations (
  id INTEGER PRIMARY KEY,
  name TEXT,
  location_type TEXT,     -- ward, zone, room
  floor INTEGER,
  parent_id INTEGER
);

-- Alerts: Geofence violations, anomalies
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY,
  asset_id INTEGER,
  alert_type TEXT,
  severity TEXT,          -- critical, high, warning
  status TEXT,            -- open, acknowledged, resolved
  created_at DATETIME
);

-- Blockchain transactions (audit trail)
CREATE TABLE blockchain_transactions (
  id INTEGER PRIMARY KEY,
  hash TEXT UNIQUE,
  block_number INTEGER,
  asset_id INTEGER,
  event_type TEXT,
  from_zone_name TEXT,
  to_zone_name TEXT,
  timestamp DATETIME
);
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server
PORT=3457
NODE_ENV=development

# Database
DB_PATH=./database/ensemble.db

# Notifications (optional)
NTFY_TOPIC=ensemble-kyl-auth
```

---

## Development

### NPM Scripts

```bash
npm start           # Production server
npm run dev         # Development with auto-reload
npm run db:init     # Initialize database schema
npm run db:seed     # Seed sample data
npm run db:reset    # Reset database completely
npm run electron:dev      # Run desktop app in dev mode
npm run electron:build    # Build for current platform
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Backend | Hono.js |
| Database | SQLite + better-sqlite3 |
| Real-time | WebSocket (ws) |
| Desktop | Electron |
| Blockchain | Custom SHA-256 chain |
| Frontend | Vanilla JS + CSS3 |
| Design | Glassmorphism |
| Fonts | Inter + JetBrains Mono |

---

## Pilot Success Criteria

### Phase 1 (Month 0-3)

| Metric | Target |
|--------|--------|
| Tag Uptime | >70% |
| Staff Compliance | >60% |
| Validated Savings | >R500K |
| False Alert Rate | <5% |

### Pilot Scope

- 50 high-value assets
- 10 BLE gateways
- 1 ward (ICU or OR)
- Focus: Patient monitors (R30K each, #1 most-commonly-lost)

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Copyright 2026 KYL Solutions. All rights reserved.

---

## Contact

**KYL Solutions**
- Website: [kylsolutions.co.za](https://kylsolutions.co.za)
- Email: projects@kylsolutions.co.za
- GitHub: [@kylsolutions](https://github.com/kylsolutions)

---

*Built with care for South African healthcare. Every asset tracked is a patient served faster.*

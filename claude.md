# Or-Care-Stra Ensemble - Build Plan

## Project Overview

**Purpose:** Hospital equipment tracking and digital twin platform for Chris Hani Baragwanath Hospital

**Problem Solved:**
- R585,000 in medical equipment vanishes daily
- 6,000 nurse hours/month wasted searching for equipment
- R213.8M annual financial bleed
- Direct patient safety risks

**Target Outcome:**
- R60-109M annual savings (conservative)
- 273 hours of patient suffering prevented daily
- 100% asset visibility

## Reference Project

**Or-care-stra (original):** Located at `/Users/kylsolutions/Library/Mobile Documents/com~apple~CloudDocs/1 - KYL Solutions/04 - Build Projects/1. KYL Solutions Build Projects - 2026/or-care-stra`

Target this build for:
- **Aesthetic:** Glassmorphism design system, teal palette, Inter + JetBrains Mono fonts
- **Architecture:** Hono.js + SQLite + Electron + Vanilla JS
- **Completeness:** ~85-90% production-ready standard

## Tech Stack (Matching Or-care-stra)

| Layer | Technology | Purpose |
|-------|------------|---------|
| Runtime | Node.js ≥18 | Server runtime |
| Backend | Hono.js | REST API |
| Database | SQLite + better-sqlite3 | Embedded local DB |
| Frontend | Vanilla JS + CSS3 | No framework dependencies |
| Desktop | Electron | Cross-platform app |
| Blockchain | TBD (Hyperledger/Custom) | Immutable audit trail |
| Charts | Chart.js | Data visualization |
| Icons | Font Awesome 6.4 | Icon library |

## Build Phases

### Phase 0: Foundation
**Status:** COMPLETE ✓

- [x] Project scaffolding matching Or-care-stra structure
- [x] Package.json with dependencies (Hono, better-sqlite3, dotenv, Electron)
- [x] Folder structure (public/, database/, electron/, server.js)
- [x] Base CSS with glassmorphism design system (command-center.css)
- [x] Shared app.js utilities with medical equipment icons
- [x] Landing page template with hero, stats, features
- [x] Server.js with Hono framework and API scaffolding
- [x] .env.example configuration template

**Files Created:**
- `/package.json` - Dependencies and build scripts
- `/server.js` - Hono REST API server
- `/.env.example` - Configuration template
- `/public/landing.html` - Landing page
- `/public/assets/command-center.css` - Glassmorphism design system
- `/public/assets/app.js` - Shared utilities and icons

**To run:** `npm install && npm run dev` (port 3457)

### Phase 1: Core Data Model & Backend
**Status:** COMPLETE ✓

- [x] Database schema design
  - `assets` - Equipment catalog with BLE tag mapping
  - `locations` - Wards, zones, rooms hierarchy
  - `asset_events` - Movement/status change log (blockchain-ready)
  - `users` - Staff with roles (nurse, security, admin)
  - `alerts` - Geofence violations, anomalies
  - `geofences` - Zone boundary rules
  - `gateways` - IoT infrastructure
  - `tag_readings` - Raw BLE data
  - `maintenance_records` - Service history
  - `savings_metrics` - ROI tracking
- [x] Core API endpoints (all functional)
  - GET /api/assets, GET /api/assets/:id
  - GET /api/locations, GET /api/locations/:id
  - GET /api/dashboard/stats
  - GET /api/alerts, POST /api/alerts/:id/acknowledge, POST /api/alerts/:id/resolve
  - GET /api/audit-log
  - GET /api/geofences
- [x] Database initialization (`database/init.js`)
- [x] Seed data for pilot (`database/seed.js`)

**Seed Data Created:**
- 10 Wards + 13 Zones (Chris Hani Baragwanath layout)
- 10 IoT Gateways (pilot infrastructure)
- 50 High-Value Assets (monitors, pumps, defibs, ventilators)
- 10 Staff Users (admin, nurses, security, technicians)
- 5 Geofence Rules (ICU perimeter, OT sterile zone, etc.)
- 5 Sample Alerts
- 30 Days of Savings/ROI Data

### Phase 2: IoT Simulation Layer
**Status:** COMPLETE ✓

- [x] BLE tag event simulator (`/simulator/iot-simulator.js`)
- [x] Gateway mock infrastructure (integrated with seed data)
- [x] Real-time location update stream via WebSocket
- [x] Configurable scenarios:
  - `normal` - 15% movement probability, standard operations
  - `theft` - Equipment leaving facility boundaries
  - `hoarding` - Equipment accumulating in unexpected locations
  - `busy` - 30% movement probability (high activity)
  - `quiet` - 5% movement probability (night shift)
- [x] WebSocket server at `/ws` for live updates

**Implementation Details:**
- EventEmitter-based simulator with 5-second tick rate
- SHA-256 event hashing for blockchain audit trail preparation
- Geofence violation detection with zone-based rules
- Battery level simulation with degradation
- Alert generation: CRITICAL, HIGH, WARNING severity levels
- WebSocket commands: `start_simulator`, `stop_simulator`, `set_scenario`, `get_status`, `ping`

**API Endpoints Added:**
- `POST /api/simulator/start` - Start simulation with scenario
- `POST /api/simulator/stop` - Stop simulation
- `POST /api/simulator/scenario` - Change scenario mid-run
- `GET /api/simulator/status` - Get simulator state
- `GET /api/assets/positions` - Get real-time asset positions

**Files Created:**
- `/simulator/iot-simulator.js` - Core simulation engine

### Phase 3: Blockchain Integration
**Status:** COMPLETE ✓

- [x] SQLite with cryptographic chaining (Merkle-like structure) chosen for offline resilience
- [x] Immutable audit trail for asset movements
- [x] Tamper-evident logging with SHA-256 hashing
- [x] Full chain verification capability
- [x] Transaction and block query interfaces

**Implementation Details:**
- Genesis block created on first run
- Automatic block creation every 30 seconds (or 100 transactions)
- Merkle root calculation for each block
- Previous hash chaining for tamper detection
- Full chain integrity verification endpoint

**Blockchain API Endpoints:**
- `GET /api/blockchain/status` - Chain height, transaction counts
- `GET /api/blockchain/verify` - Full chain integrity check
- `GET /api/blockchain/blocks` - Browse blocks with pagination
- `GET /api/blockchain/blocks/:number` - Get specific block with transactions
- `GET /api/blockchain/transactions` - Recent transactions
- `GET /api/blockchain/transactions/:hash` - Verify specific transaction
- `GET /api/blockchain/asset/:id/history` - Asset audit trail
- `POST /api/blockchain/search` - Search transactions with filters
- `POST /api/blockchain/create-block` - Force block creation

**Files Created:**
- `/blockchain/audit-chain.js` - Core blockchain implementation

### Phase 4: Frontend Dashboard
**Status:** COMPLETE ✓

- [x] Command center overview (glassmorphism aesthetic)
- [x] Real-time asset location map (hospital floor plan)
- [x] Asset search and filtering
- [x] Live alert management panel
- [x] Blockchain status visualization
- [x] Simulator controls (start/stop, scenario selection)
- [x] WebSocket integration for live updates

**Dashboard Features:**
- Three-column layout: Assets sidebar, Floor plan, Alerts/Blockchain
- Header stats: Total assets, Online count, Active alerts, Monthly savings
- Floor plan with zone rendering (ICU, OT, ED, Storage color-coded)
- Asset markers with real-time movement animation
- Asset filtering by status (All, Online, Alert, Moving)
- Search by asset name or tag
- Floor tabs (Ground, First, Second)
- Live alert feed with severity indicators
- Blockchain chain visual showing recent blocks
- Simulator controls with scenario switcher
- Connection status indicator
- Status bar with clock, gateway status, last update time

**Files Created:**
- `/public/index.html` - Command Center Dashboard

**Routes Added:**
- `/dashboard` - Command Center
- `/command-center` - Alternative route

### Phase 5: Offline Resilience
**Status:** Not Started

- [ ] Service worker for static asset caching
- [ ] IndexedDB for local data replication
- [ ] Sync queue for offline writes
- [ ] Conflict resolution logic
- [ ] 24-48 hour offline operation capability
- [ ] Graceful degradation indicators

### Phase 6: AI/ML Scaffolding
**Status:** Not Started

- [ ] Anomaly detection framework
- [ ] Movement pattern analysis
- [ ] Predictive maintenance alerts
- [ ] Equipment utilization optimization
- [ ] Hoarding behavior detection

## Key Requirements from Pitch Deck

### Pilot Phase (Month 0-3) Success Criteria
- Tag Uptime: >70%
- Staff Compliance: >60%
- Validated Savings: >R500K
- False Alerts: <5%

### Technical Requirements
- POPIA compliance (data encryption)
- 24-48 hour offline resilience
- Integration-ready for HIS/LIS systems
- Blockchain-backed audit trail

### Target Assets for Pilot
- 50 high-value assets
- 10 gateways
- 1 ward (ICU or OR)
- Focus: Patient monitors (R30,000 each, #1 most-commonly-lost)

## Inputs & Assets

Located at: `./Inputs and assets/`
- `digital_twin_baragwanath_hospital_20260116153408.pptx` - Full pitch deck with business case

## Notes

- Blockchain layer is critical for feasibility assessment (transaction throughput, storage costs, query performance)
- IoT simulation needed before real hardware procurement
- Offline resilience is non-negotiable given SA infrastructure realities

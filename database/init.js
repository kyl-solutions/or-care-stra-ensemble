// Or-care-stra Ensemble - Database Initialization
// Creates all tables for the Digital Twin Asset Tracking System

import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'ensemble.db');

// Ensure database directory exists
if (!existsSync(__dirname)) {
  mkdirSync(__dirname, { recursive: true });
}

console.log('Initializing Or-care-stra Ensemble database...');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// ============================================================================
// ASSETS TABLE - Core equipment registry
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_tag VARCHAR(50) UNIQUE NOT NULL,
    ble_tag_id VARCHAR(100),
    asset_type VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_value DECIMAL(12,2),
    current_value DECIMAL(12,2),
    warranty_expiry DATE,

    -- Location tracking
    current_zone_id INTEGER,
    current_x DECIMAL(10,4),
    current_y DECIMAL(10,4),
    current_floor INTEGER DEFAULT 0,
    last_seen DATETIME,

    -- Status
    status VARCHAR(20) DEFAULT 'offline',
    battery_level INTEGER,
    signal_strength INTEGER,

    -- Maintenance
    last_maintenance DATE,
    next_maintenance DATE,
    maintenance_interval_days INTEGER DEFAULT 365,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (current_zone_id) REFERENCES locations(id)
  );
`);

console.log('✓ Created assets table');

// ============================================================================
// LOCATIONS TABLE - Wards, zones, rooms hierarchy
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    location_type VARCHAR(30) NOT NULL,
    parent_id INTEGER,
    ward_id INTEGER,
    zone_id INTEGER,
    floor INTEGER DEFAULT 0,
    building VARCHAR(50),

    -- Boundaries for floor plan visualization
    boundary_x1 DECIMAL(10,4),
    boundary_y1 DECIMAL(10,4),
    boundary_x2 DECIMAL(10,4),
    boundary_y2 DECIMAL(10,4),

    -- Capacity and occupancy
    capacity INTEGER,
    current_occupancy INTEGER DEFAULT 0,

    -- Gateway coverage
    gateway_count INTEGER DEFAULT 0,
    coverage_quality VARCHAR(20) DEFAULT 'good',

    -- Metadata
    color VARCHAR(20),
    icon VARCHAR(50),
    is_restricted BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_id) REFERENCES locations(id)
  );
`);

console.log('✓ Created locations table');

// ============================================================================
// ASSET_EVENTS TABLE - Movement and status change log (Blockchain audit trail)
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS asset_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    event_type VARCHAR(50) NOT NULL,

    -- Location data
    from_zone_id INTEGER,
    to_zone_id INTEGER,
    from_x DECIMAL(10,4),
    from_y DECIMAL(10,4),
    to_x DECIMAL(10,4),
    to_y DECIMAL(10,4),

    -- Event details
    old_status VARCHAR(20),
    new_status VARCHAR(20),
    triggered_by VARCHAR(50),
    notes TEXT,

    -- Blockchain audit fields (Phase 3)
    event_hash VARCHAR(64),
    previous_hash VARCHAR(64),
    block_number INTEGER,
    chain_verified BOOLEAN DEFAULT 0,

    -- Timestamp
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (from_zone_id) REFERENCES locations(id),
    FOREIGN KEY (to_zone_id) REFERENCES locations(id)
  );
`);

console.log('✓ Created asset_events table');

// ============================================================================
// USERS TABLE - Staff with roles
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(20),
    role VARCHAR(30) NOT NULL,
    department VARCHAR(100),
    ward_id INTEGER,

    -- Permissions
    can_view_assets BOOLEAN DEFAULT 1,
    can_edit_assets BOOLEAN DEFAULT 0,
    can_manage_alerts BOOLEAN DEFAULT 0,
    can_configure_geofences BOOLEAN DEFAULT 0,
    can_view_audit_log BOOLEAN DEFAULT 0,
    is_admin BOOLEAN DEFAULT 0,

    -- Status
    is_active BOOLEAN DEFAULT 1,
    last_login DATETIME,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (ward_id) REFERENCES locations(id)
  );
`);

console.log('✓ Created users table');

// ============================================================================
// ALERTS TABLE - Geofence violations, anomalies, system alerts
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,

    -- Related entities
    asset_id INTEGER,
    zone_id INTEGER,
    geofence_id INTEGER,
    user_id INTEGER,

    -- Status workflow
    status VARCHAR(20) DEFAULT 'open',
    acknowledged_by INTEGER,
    acknowledged_at DATETIME,
    resolved_by INTEGER,
    resolved_at DATETIME,
    resolution_notes TEXT,

    -- AI/ML fields
    confidence_score DECIMAL(5,4),
    is_false_positive BOOLEAN DEFAULT 0,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (asset_id) REFERENCES assets(id),
    FOREIGN KEY (zone_id) REFERENCES locations(id),
    FOREIGN KEY (geofence_id) REFERENCES geofences(id),
    FOREIGN KEY (acknowledged_by) REFERENCES users(id),
    FOREIGN KEY (resolved_by) REFERENCES users(id)
  );
`);

console.log('✓ Created alerts table');

// ============================================================================
// GEOFENCES TABLE - Zone boundary rules
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS geofences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Zone reference
    zone_id INTEGER,

    -- Boundary definition (polygon points stored as JSON)
    boundary_points TEXT,

    -- Rules
    rule_type VARCHAR(30) NOT NULL,
    asset_types TEXT,
    time_restrictions TEXT,

    -- Alert configuration
    alert_on_enter BOOLEAN DEFAULT 0,
    alert_on_exit BOOLEAN DEFAULT 1,
    alert_severity VARCHAR(20) DEFAULT 'warning',
    cooldown_minutes INTEGER DEFAULT 5,

    -- Status
    is_active BOOLEAN DEFAULT 1,

    -- Metadata
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (zone_id) REFERENCES locations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
`);

console.log('✓ Created geofences table');

// ============================================================================
// MAINTENANCE_RECORDS TABLE - Service history
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    asset_id INTEGER NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL,
    description TEXT,

    -- Service details
    performed_by VARCHAR(100),
    vendor VARCHAR(100),
    cost DECIMAL(12,2),

    -- Dates
    scheduled_date DATE,
    completed_date DATE,
    next_due_date DATE,

    -- Status
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,

    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (asset_id) REFERENCES assets(id)
  );
`);

console.log('✓ Created maintenance_records table');

// ============================================================================
// GATEWAYS TABLE - IoT infrastructure
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS gateways (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gateway_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),

    -- Location
    zone_id INTEGER,
    x_position DECIMAL(10,4),
    y_position DECIMAL(10,4),
    floor INTEGER DEFAULT 0,

    -- Technical specs
    mac_address VARCHAR(20),
    ip_address VARCHAR(50),
    firmware_version VARCHAR(50),

    -- Status
    status VARCHAR(20) DEFAULT 'offline',
    last_heartbeat DATETIME,
    uptime_seconds INTEGER DEFAULT 0,

    -- Coverage
    coverage_radius DECIMAL(10,2),
    signal_strength INTEGER,

    -- Metadata
    installed_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (zone_id) REFERENCES locations(id)
  );
`);

console.log('✓ Created gateways table');

// ============================================================================
// TAG_READINGS TABLE - Raw BLE tag data (for analytics)
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS tag_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ble_tag_id VARCHAR(100) NOT NULL,
    gateway_id INTEGER,

    -- Signal data
    rssi INTEGER,
    tx_power INTEGER,
    distance_estimate DECIMAL(10,4),

    -- Calculated position
    x_position DECIMAL(10,4),
    y_position DECIMAL(10,4),
    position_confidence DECIMAL(5,4),

    -- Battery
    battery_level INTEGER,

    -- Timestamp
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (gateway_id) REFERENCES gateways(id)
  );
`);

console.log('✓ Created tag_readings table');

// ============================================================================
// SAVINGS_METRICS TABLE - Track ROI and savings
// ============================================================================

db.exec(`
  CREATE TABLE IF NOT EXISTS savings_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_date DATE NOT NULL,

    -- Loss prevention
    assets_recovered INTEGER DEFAULT 0,
    recovery_value DECIMAL(12,2) DEFAULT 0,
    theft_prevented INTEGER DEFAULT 0,
    theft_value_prevented DECIMAL(12,2) DEFAULT 0,

    -- Time savings
    search_time_saved_minutes INTEGER DEFAULT 0,
    nurse_hours_saved DECIMAL(10,2) DEFAULT 0,

    -- Equipment utilization
    utilization_rate DECIMAL(5,4),
    idle_assets INTEGER DEFAULT 0,

    -- Maintenance
    predictive_maintenance_alerts INTEGER DEFAULT 0,
    breakdowns_prevented INTEGER DEFAULT 0,

    -- Calculated savings
    daily_savings DECIMAL(12,2) DEFAULT 0,
    cumulative_savings DECIMAL(12,2) DEFAULT 0,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('✓ Created savings_metrics table');

// ============================================================================
// INDEXES for performance
// ============================================================================

db.exec(`
  -- Assets indexes
  CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(asset_type);
  CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
  CREATE INDEX IF NOT EXISTS idx_assets_zone ON assets(current_zone_id);
  CREATE INDEX IF NOT EXISTS idx_assets_ble_tag ON assets(ble_tag_id);
  CREATE INDEX IF NOT EXISTS idx_assets_last_seen ON assets(last_seen);

  -- Locations indexes
  CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
  CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_id);
  CREATE INDEX IF NOT EXISTS idx_locations_ward ON locations(ward_id);

  -- Asset events indexes
  CREATE INDEX IF NOT EXISTS idx_events_asset ON asset_events(asset_id);
  CREATE INDEX IF NOT EXISTS idx_events_type ON asset_events(event_type);
  CREATE INDEX IF NOT EXISTS idx_events_timestamp ON asset_events(timestamp);
  CREATE INDEX IF NOT EXISTS idx_events_from_zone ON asset_events(from_zone_id);
  CREATE INDEX IF NOT EXISTS idx_events_to_zone ON asset_events(to_zone_id);

  -- Alerts indexes
  CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
  CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
  CREATE INDEX IF NOT EXISTS idx_alerts_asset ON alerts(asset_id);
  CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);

  -- Geofences indexes
  CREATE INDEX IF NOT EXISTS idx_geofences_zone ON geofences(zone_id);
  CREATE INDEX IF NOT EXISTS idx_geofences_active ON geofences(is_active);

  -- Tag readings indexes
  CREATE INDEX IF NOT EXISTS idx_readings_tag ON tag_readings(ble_tag_id);
  CREATE INDEX IF NOT EXISTS idx_readings_gateway ON tag_readings(gateway_id);
  CREATE INDEX IF NOT EXISTS idx_readings_timestamp ON tag_readings(timestamp);

  -- Gateways indexes
  CREATE INDEX IF NOT EXISTS idx_gateways_zone ON gateways(zone_id);
  CREATE INDEX IF NOT EXISTS idx_gateways_status ON gateways(status);
`);

console.log('✓ Created indexes');

// ============================================================================
// DONE
// ============================================================================

db.close();

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  Database initialized successfully!                          ║');
console.log('║  Run: npm run db:seed to populate with sample data           ║');
console.log('╚══════════════════════════════════════════════════════════════╝');

// Or-care-stra Ensemble - Database Seed Data
// Sample data for Chris Hani Baragwanath Hospital pilot

import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'ensemble.db');

console.log('Seeding Or-care-stra Ensemble database...');

const db = new Database(dbPath);

// ============================================================================
// LOCATIONS - Chris Hani Baragwanath Hospital Structure
// ============================================================================

const locationInsert = db.prepare(`
  INSERT INTO locations (name, location_type, parent_id, floor, building, boundary_x1, boundary_y1, boundary_x2, boundary_y2, capacity, color, icon, is_restricted)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Building
const building = db.prepare(`INSERT INTO locations (name, location_type, floor, building, capacity) VALUES (?, ?, ?, ?, ?)`);
building.run('Main Hospital Building', 'building', 0, 'Main', 500);
const buildingId = db.prepare('SELECT last_insert_rowid() as id').get().id;

// Wards
const wards = [
  { name: 'ICU Ward A', type: 'ward', floor: 2, capacity: 24, color: '#ef4444', restricted: 1 },
  { name: 'ICU Ward B', type: 'ward', floor: 2, capacity: 20, color: '#f97316', restricted: 1 },
  { name: 'Operating Theatre 1', type: 'ward', floor: 3, capacity: 8, color: '#a855f7', restricted: 1 },
  { name: 'Operating Theatre 2', type: 'ward', floor: 3, capacity: 8, color: '#a855f7', restricted: 1 },
  { name: 'Emergency Department', type: 'ward', floor: 1, capacity: 50, color: '#ef4444', restricted: 0 },
  { name: 'Maternity Ward', type: 'ward', floor: 4, capacity: 40, color: '#ec4899', restricted: 0 },
  { name: 'Pediatric Ward', type: 'ward', floor: 4, capacity: 30, color: '#3b82f6', restricted: 0 },
  { name: 'General Ward A', type: 'ward', floor: 5, capacity: 60, color: '#14b8a6', restricted: 0 },
  { name: 'General Ward B', type: 'ward', floor: 5, capacity: 60, color: '#10b981', restricted: 0 },
  { name: 'Radiology', type: 'ward', floor: 1, capacity: 15, color: '#6366f1', restricted: 1 },
];

const wardIds = {};
for (const ward of wards) {
  locationInsert.run(
    ward.name, ward.type, buildingId, ward.floor, 'Main',
    Math.random() * 100, Math.random() * 100,
    Math.random() * 100 + 100, Math.random() * 100 + 100,
    ward.capacity, ward.color, 'fa-hospital', ward.restricted
  );
  wardIds[ward.name] = db.prepare('SELECT last_insert_rowid() as id').get().id;
}

// Zones within wards (sub-areas)
const zones = [
  { name: 'ICU A - Bed Bay 1', parent: 'ICU Ward A', capacity: 6 },
  { name: 'ICU A - Bed Bay 2', parent: 'ICU Ward A', capacity: 6 },
  { name: 'ICU A - Nurses Station', parent: 'ICU Ward A', capacity: 4 },
  { name: 'ICU A - Equipment Storage', parent: 'ICU Ward A', capacity: 20 },
  { name: 'ICU B - Bed Bay 1', parent: 'ICU Ward B', capacity: 5 },
  { name: 'ICU B - Bed Bay 2', parent: 'ICU Ward B', capacity: 5 },
  { name: 'OT1 - Main Theatre', parent: 'Operating Theatre 1', capacity: 4 },
  { name: 'OT1 - Prep Room', parent: 'Operating Theatre 1', capacity: 2 },
  { name: 'OT1 - Recovery', parent: 'Operating Theatre 1', capacity: 4 },
  { name: 'ED - Triage', parent: 'Emergency Department', capacity: 10 },
  { name: 'ED - Resuscitation', parent: 'Emergency Department', capacity: 6 },
  { name: 'ED - Treatment Bay', parent: 'Emergency Department', capacity: 20 },
  { name: 'Equipment Store - Central', parent: 'General Ward A', capacity: 50 },
];

const zoneIds = {};
for (const zone of zones) {
  const parentId = wardIds[zone.parent];
  locationInsert.run(
    zone.name, 'zone', parentId, 0, 'Main',
    Math.random() * 50, Math.random() * 50,
    Math.random() * 50 + 50, Math.random() * 50 + 50,
    zone.capacity, '#14b8a6', 'fa-square', 0
  );
  zoneIds[zone.name] = db.prepare('SELECT last_insert_rowid() as id').get().id;
}

console.log('✓ Created locations (wards and zones)');

// ============================================================================
// GATEWAYS - IoT Infrastructure (10 for pilot)
// ============================================================================

const gatewayInsert = db.prepare(`
  INSERT INTO gateways (gateway_id, name, zone_id, x_position, y_position, floor, mac_address, ip_address, firmware_version, status, last_heartbeat, coverage_radius, installed_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, date('now'))
`);

const gateways = [
  { id: 'GW-ICU-A-001', name: 'ICU A Gateway 1', zone: 'ICU A - Bed Bay 1', floor: 2 },
  { id: 'GW-ICU-A-002', name: 'ICU A Gateway 2', zone: 'ICU A - Bed Bay 2', floor: 2 },
  { id: 'GW-ICU-B-001', name: 'ICU B Gateway 1', zone: 'ICU B - Bed Bay 1', floor: 2 },
  { id: 'GW-OT1-001', name: 'OT1 Main Gateway', zone: 'OT1 - Main Theatre', floor: 3 },
  { id: 'GW-OT1-002', name: 'OT1 Prep Gateway', zone: 'OT1 - Prep Room', floor: 3 },
  { id: 'GW-ED-001', name: 'ED Triage Gateway', zone: 'ED - Triage', floor: 1 },
  { id: 'GW-ED-002', name: 'ED Resus Gateway', zone: 'ED - Resuscitation', floor: 1 },
  { id: 'GW-ED-003', name: 'ED Treatment Gateway', zone: 'ED - Treatment Bay', floor: 1 },
  { id: 'GW-STORE-001', name: 'Central Store Gateway', zone: 'Equipment Store - Central', floor: 5 },
  { id: 'GW-ICU-A-003', name: 'ICU A Storage Gateway', zone: 'ICU A - Equipment Storage', floor: 2 },
];

for (let i = 0; i < gateways.length; i++) {
  const gw = gateways[i];
  const zoneId = zoneIds[gw.zone];
  gatewayInsert.run(
    gw.id, gw.name, zoneId,
    Math.random() * 100, Math.random() * 100, gw.floor,
    `00:1A:2B:3C:4D:${(i + 10).toString(16).toUpperCase()}`,
    `192.168.1.${100 + i}`,
    '2.1.0',
    'online',
    15.0 // 15 meter coverage radius
  );
}

console.log('✓ Created gateways (10 for pilot)');

// ============================================================================
// ASSETS - 50 High-Value Equipment for Pilot
// ============================================================================

const assetInsert = db.prepare(`
  INSERT INTO assets (
    asset_tag, ble_tag_id, asset_type, name, description, manufacturer, model, serial_number,
    purchase_date, purchase_value, current_value, warranty_expiry,
    current_zone_id, current_x, current_y, current_floor, last_seen,
    status, battery_level, signal_strength,
    last_maintenance, next_maintenance
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), ?, ?, ?, ?, ?)
`);

const assetTypes = [
  { type: 'patient_monitor', name: 'Patient Monitor', manufacturer: 'Philips', model: 'IntelliVue MX800', value: 30000 },
  { type: 'patient_monitor', name: 'Patient Monitor', manufacturer: 'GE Healthcare', model: 'CARESCAPE B650', value: 35000 },
  { type: 'infusion_pump', name: 'Infusion Pump', manufacturer: 'B. Braun', model: 'Infusomat Space', value: 8500 },
  { type: 'infusion_pump', name: 'Syringe Pump', manufacturer: 'B. Braun', model: 'Perfusor Space', value: 6500 },
  { type: 'defibrillator', name: 'Defibrillator', manufacturer: 'Philips', model: 'HeartStart MRx', value: 45000 },
  { type: 'defibrillator', name: 'AED', manufacturer: 'Zoll', model: 'AED Plus', value: 18000 },
  { type: 'ventilator', name: 'ICU Ventilator', manufacturer: 'Dräger', model: 'Evita V500', value: 85000 },
  { type: 'ventilator', name: 'Transport Ventilator', manufacturer: 'Hamilton', model: 'T1', value: 55000 },
  { type: 'ultrasound', name: 'Portable Ultrasound', manufacturer: 'GE Healthcare', model: 'Venue Go', value: 75000 },
  { type: 'ecg_machine', name: 'ECG Machine', manufacturer: 'GE Healthcare', model: 'MAC 2000', value: 12000 },
  { type: 'wheelchair', name: 'Wheelchair', manufacturer: 'Invacare', model: 'Tracer SX5', value: 4500 },
  { type: 'hospital_bed', name: 'ICU Bed', manufacturer: 'Stryker', model: 'InTouch', value: 65000 },
];

// Generate 50 assets
const allZoneIds = Object.values(zoneIds);
let assetCount = 0;

for (let i = 0; i < 50; i++) {
  const template = assetTypes[i % assetTypes.length];
  const zoneId = allZoneIds[Math.floor(Math.random() * allZoneIds.length)];
  const daysAgo = Math.floor(Math.random() * 60); // Last seen within 60 days
  const batteryLevel = Math.floor(Math.random() * 100);
  const status = batteryLevel < 10 ? 'alert' : (Math.random() > 0.1 ? 'online' : 'offline');

  assetInsert.run(
    `AST-${String(i + 1).padStart(5, '0')}`,
    `BLE-${String(i + 1).padStart(8, '0')}`,
    template.type,
    `${template.name} #${i + 1}`,
    `${template.manufacturer} ${template.model}`,
    template.manufacturer,
    template.model,
    `SN-${Date.now()}-${i}`,
    '2023-06-15',
    template.value,
    template.value * 0.85, // 15% depreciation
    '2026-06-15',
    zoneId,
    Math.random() * 100,
    Math.random() * 100,
    Math.floor(Math.random() * 5) + 1,
    `-${daysAgo} minutes`, // SQLite datetime modifier
    status,
    batteryLevel,
    Math.floor(Math.random() * 100) - 100, // RSSI: -100 to 0
    '2025-06-15',
    '2026-06-15'
  );
  assetCount++;
}

console.log(`✓ Created assets (${assetCount} for pilot)`);

// ============================================================================
// USERS - Hospital Staff
// ============================================================================

const userInsert = db.prepare(`
  INSERT INTO users (employee_id, first_name, last_name, email, phone, role, department, ward_id, can_view_assets, can_edit_assets, can_manage_alerts, can_configure_geofences, can_view_audit_log, is_admin)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const users = [
  { emp: 'EMP001', first: 'Thabo', last: 'Molefe', role: 'admin', dept: 'IT', permissions: [1,1,1,1,1,1] },
  { emp: 'EMP002', first: 'Nomvula', last: 'Dlamini', role: 'nurse_manager', dept: 'ICU', ward: 'ICU Ward A', permissions: [1,1,1,0,1,0] },
  { emp: 'EMP003', first: 'Sipho', last: 'Nkosi', role: 'nurse', dept: 'ICU', ward: 'ICU Ward A', permissions: [1,0,1,0,0,0] },
  { emp: 'EMP004', first: 'Lindiwe', last: 'Zulu', role: 'nurse', dept: 'ICU', ward: 'ICU Ward B', permissions: [1,0,1,0,0,0] },
  { emp: 'EMP005', first: 'Mpho', last: 'Khumalo', role: 'nurse_manager', dept: 'Emergency', ward: 'Emergency Department', permissions: [1,1,1,0,1,0] },
  { emp: 'EMP006', first: 'Zanele', last: 'Mthembu', role: 'security', dept: 'Security', permissions: [1,0,1,0,1,0] },
  { emp: 'EMP007', first: 'Bongani', last: 'Sithole', role: 'technician', dept: 'Biomedical', permissions: [1,1,0,0,1,0] },
  { emp: 'EMP008', first: 'Precious', last: 'Mokoena', role: 'nurse', dept: 'Maternity', ward: 'Maternity Ward', permissions: [1,0,1,0,0,0] },
  { emp: 'EMP009', first: 'Andile', last: 'Ndaba', role: 'nurse', dept: 'OR', ward: 'Operating Theatre 1', permissions: [1,0,1,0,0,0] },
  { emp: 'EMP010', first: 'Themba', last: 'Mahlangu', role: 'store_manager', dept: 'Equipment', permissions: [1,1,1,1,1,0] },
];

for (const user of users) {
  const wardId = user.ward ? wardIds[user.ward] : null;
  userInsert.run(
    user.emp, user.first, user.last,
    `${user.first.toLowerCase()}.${user.last.toLowerCase()}@bara.org.za`,
    `+27${Math.floor(Math.random() * 900000000) + 100000000}`,
    user.role, user.dept, wardId,
    ...user.permissions
  );
}

console.log('✓ Created users (10 staff members)');

// ============================================================================
// GEOFENCES - Zone rules for pilot
// ============================================================================

const geofenceInsert = db.prepare(`
  INSERT INTO geofences (name, description, zone_id, rule_type, asset_types, alert_on_enter, alert_on_exit, alert_severity, is_active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const geofences = [
  { name: 'ICU A Perimeter', zone: 'ICU A - Bed Bay 1', rule: 'containment', types: 'patient_monitor,ventilator,defibrillator', enter: 0, exit: 1, severity: 'critical' },
  { name: 'ICU B Perimeter', zone: 'ICU B - Bed Bay 1', rule: 'containment', types: 'patient_monitor,ventilator,defibrillator', enter: 0, exit: 1, severity: 'critical' },
  { name: 'OT1 Sterile Zone', zone: 'OT1 - Main Theatre', rule: 'containment', types: 'all', enter: 1, exit: 1, severity: 'critical' },
  { name: 'ED Resus Zone', zone: 'ED - Resuscitation', rule: 'containment', types: 'defibrillator,patient_monitor', enter: 0, exit: 1, severity: 'high' },
  { name: 'Equipment Store Exit', zone: 'Equipment Store - Central', rule: 'exit_control', types: 'all', enter: 0, exit: 1, severity: 'warning' },
];

for (const gf of geofences) {
  const zoneId = zoneIds[gf.zone];
  geofenceInsert.run(
    gf.name, `Monitoring ${gf.zone}`, zoneId,
    gf.rule, gf.types,
    gf.enter ? 1 : 0, gf.exit ? 1 : 0,
    gf.severity, 1
  );
}

console.log('✓ Created geofences (5 zone rules)');

// ============================================================================
// ALERTS - Sample alerts
// ============================================================================

const alertInsert = db.prepare(`
  INSERT INTO alerts (alert_type, severity, title, description, asset_id, zone_id, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
`);

const alerts = [
  { type: 'geofence_exit', severity: 'critical', title: 'Patient Monitor left ICU A', desc: 'AST-00001 detected outside ICU A perimeter', asset: 1, zone: zoneIds['ICU A - Bed Bay 1'], status: 'open', ago: '-5 minutes' },
  { type: 'low_battery', severity: 'warning', title: 'Low battery on Infusion Pump', desc: 'AST-00003 battery at 8%', asset: 3, zone: null, status: 'open', ago: '-15 minutes' },
  { type: 'geofence_exit', severity: 'high', title: 'Defibrillator moved from ED', desc: 'AST-00005 no longer in ED Resuscitation zone', asset: 5, zone: zoneIds['ED - Resuscitation'], status: 'acknowledged', ago: '-2 hours' },
  { type: 'offline', severity: 'warning', title: 'Equipment offline for 24+ hours', desc: 'AST-00012 last seen 26 hours ago', asset: 12, zone: null, status: 'open', ago: '-1 hour' },
  { type: 'anomaly', severity: 'warning', title: 'Unusual movement pattern detected', desc: 'AST-00008 moved between 5 zones in 10 minutes', asset: 8, zone: null, status: 'open', ago: '-30 minutes' },
];

for (const alert of alerts) {
  alertInsert.run(
    alert.type, alert.severity, alert.title, alert.desc,
    alert.asset, alert.zone, alert.status, alert.ago
  );
}

console.log('✓ Created alerts (5 sample alerts)');

// ============================================================================
// ASSET_EVENTS - Sample movement history
// ============================================================================

const eventInsert = db.prepare(`
  INSERT INTO asset_events (asset_id, event_type, from_zone_id, to_zone_id, old_status, new_status, triggered_by, notes, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
`);

// Generate some movement events for the first 10 assets
for (let assetId = 1; assetId <= 10; assetId++) {
  const numEvents = Math.floor(Math.random() * 5) + 3; // 3-7 events per asset

  for (let e = 0; e < numEvents; e++) {
    const fromZone = allZoneIds[Math.floor(Math.random() * allZoneIds.length)];
    const toZone = allZoneIds[Math.floor(Math.random() * allZoneIds.length)];
    const eventType = fromZone === toZone ? 'status_change' : 'movement';
    const hoursAgo = Math.floor(Math.random() * 72); // Within last 72 hours

    eventInsert.run(
      assetId,
      eventType,
      fromZone,
      toZone,
      'online',
      'online',
      'system',
      eventType === 'movement' ? 'Automatic position update from gateway' : 'Status check',
      `-${hoursAgo} hours`
    );
  }
}

console.log('✓ Created asset events (movement history)');

// ============================================================================
// SAVINGS_METRICS - Simulated ROI data
// ============================================================================

const savingsInsert = db.prepare(`
  INSERT INTO savings_metrics (metric_date, assets_recovered, recovery_value, theft_prevented, theft_value_prevented, search_time_saved_minutes, nurse_hours_saved, daily_savings, cumulative_savings)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let cumulative = 0;
for (let d = 30; d >= 0; d--) {
  const date = new Date();
  date.setDate(date.getDate() - d);
  const dateStr = date.toISOString().split('T')[0];

  const recovered = Math.floor(Math.random() * 3);
  const recoveryValue = recovered * 15000;
  const prevented = Math.random() > 0.7 ? 1 : 0;
  const preventedValue = prevented * 30000;
  const searchMinutes = Math.floor(Math.random() * 300) + 100;
  const nurseHours = searchMinutes / 60;
  const dailySavings = recoveryValue + preventedValue + (nurseHours * 250); // R250/hour nurse cost

  cumulative += dailySavings;

  savingsInsert.run(
    dateStr, recovered, recoveryValue, prevented, preventedValue,
    searchMinutes, nurseHours, dailySavings, cumulative
  );
}

console.log('✓ Created savings metrics (30 days of ROI data)');

// ============================================================================
// DONE
// ============================================================================

db.close();

console.log('');
console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║  Database seeded successfully!                               ║');
console.log('║                                                              ║');
console.log('║  Summary:                                                    ║');
console.log('║  • 10 Wards + 13 Zones                                       ║');
console.log('║  • 10 IoT Gateways                                           ║');
console.log('║  • 50 High-Value Assets                                      ║');
console.log('║  • 10 Staff Users                                            ║');
console.log('║  • 5 Geofence Rules                                          ║');
console.log('║  • 5 Sample Alerts                                           ║');
console.log('║  • 30 Days of Savings Data                                   ║');
console.log('║                                                              ║');
console.log('║  Run: npm run dev to start the server                        ║');
console.log('╚══════════════════════════════════════════════════════════════╝');

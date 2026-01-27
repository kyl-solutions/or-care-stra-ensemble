// Or-care-stra Ensemble - IoT Simulator
// Simulates BLE tag readings and asset movements

import Database from 'better-sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// SIMULATOR CLASS
// ============================================================================

export class IoTSimulator extends EventEmitter {
  constructor(dbPath) {
    super();
    this.db = new Database(dbPath || join(__dirname, '..', 'database', 'ensemble.db'));
    this.running = false;
    this.interval = null;
    this.tickRate = 5000; // 5 seconds between updates
    this.scenario = 'normal';
    this.movementProbability = 0.15; // 15% chance of movement per tick
    this.alertProbability = 0.02; // 2% chance of triggering alert

    // Cache for performance
    this.assets = [];
    this.zones = [];
    this.gateways = [];
    this.geofences = [];

    this.loadData();
  }

  // Load reference data from database
  loadData() {
    this.assets = this.db.prepare('SELECT * FROM assets').all();
    this.zones = this.db.prepare('SELECT * FROM locations WHERE location_type = ?').all('zone');
    this.gateways = this.db.prepare('SELECT * FROM gateways').all();
    this.geofences = this.db.prepare('SELECT * FROM geofences WHERE is_active = 1').all();

    console.log(`[Simulator] Loaded ${this.assets.length} assets, ${this.zones.length} zones, ${this.gateways.length} gateways`);
  }

  // Start simulation
  start(scenario = 'normal') {
    if (this.running) {
      console.log('[Simulator] Already running');
      return;
    }

    this.scenario = scenario;
    this.running = true;

    // Adjust probabilities based on scenario
    switch (scenario) {
      case 'theft':
        this.movementProbability = 0.3;
        this.alertProbability = 0.15;
        break;
      case 'hoarding':
        this.movementProbability = 0.25;
        this.alertProbability = 0.08;
        break;
      case 'busy':
        this.movementProbability = 0.4;
        this.alertProbability = 0.05;
        break;
      case 'quiet':
        this.movementProbability = 0.05;
        this.alertProbability = 0.01;
        break;
      default:
        this.movementProbability = 0.15;
        this.alertProbability = 0.02;
    }

    console.log(`[Simulator] Starting with scenario: ${scenario}`);
    console.log(`[Simulator] Movement probability: ${this.movementProbability * 100}%`);

    this.interval = setInterval(() => this.tick(), this.tickRate);
    this.emit('started', { scenario });
  }

  // Stop simulation
  stop() {
    if (!this.running) return;

    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    console.log('[Simulator] Stopped');
    this.emit('stopped');
  }

  // Single simulation tick
  tick() {
    const events = [];
    const timestamp = new Date().toISOString();

    // Reload assets to get current state
    this.assets = this.db.prepare('SELECT * FROM assets').all();

    for (const asset of this.assets) {
      // Decide if this asset moves
      if (Math.random() < this.movementProbability) {
        const event = this.simulateMovement(asset, timestamp);
        if (event) {
          events.push(event);
        }
      }

      // Simulate battery drain
      if (Math.random() < 0.1) {
        this.updateBattery(asset);
      }

      // Update signal strength (simulated RSSI)
      this.updateSignalStrength(asset);
    }

    // Scenario-specific behaviors
    if (this.scenario === 'theft' && Math.random() < 0.1) {
      const event = this.simulateTheftAttempt();
      if (event) events.push(event);
    }

    if (this.scenario === 'hoarding' && Math.random() < 0.15) {
      this.simulateHoarding();
    }

    // Emit events
    if (events.length > 0) {
      this.emit('events', events);
    }

    this.emit('tick', {
      timestamp,
      eventCount: events.length,
      scenario: this.scenario
    });
  }

  // Simulate asset movement
  simulateMovement(asset, timestamp) {
    const currentZone = this.zones.find(z => z.id === asset.current_zone_id);
    if (!currentZone) return null;

    // Pick a new zone (weighted towards nearby zones in real implementation)
    const newZone = this.zones[Math.floor(Math.random() * this.zones.length)];
    if (newZone.id === currentZone.id) return null;

    // Calculate new position within zone
    const newX = (newZone.boundary_x1 || 0) + Math.random() * 50;
    const newY = (newZone.boundary_y1 || 0) + Math.random() * 50;

    // Update asset in database
    this.db.prepare(`
      UPDATE assets
      SET current_zone_id = ?,
          current_x = ?,
          current_y = ?,
          current_floor = ?,
          last_seen = datetime('now'),
          status = 'online'
      WHERE id = ?
    `).run(newZone.id, newX, newY, newZone.floor || 0, asset.id);

    // Create event record
    const eventHash = this.generateEventHash(asset.id, currentZone.id, newZone.id, timestamp);

    this.db.prepare(`
      INSERT INTO asset_events (
        asset_id, event_type, from_zone_id, to_zone_id,
        from_x, from_y, to_x, to_y,
        old_status, new_status, triggered_by, notes, event_hash, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      asset.id, 'movement', currentZone.id, newZone.id,
      asset.current_x, asset.current_y, newX, newY,
      asset.status, 'online', 'iot_simulator',
      `Simulated movement from ${currentZone.name} to ${newZone.name}`,
      eventHash
    );

    // Check geofence violations
    this.checkGeofenceViolation(asset, currentZone, newZone);

    // Create tag reading
    this.createTagReading(asset, newX, newY);

    const event = {
      type: 'movement',
      assetId: asset.id,
      assetTag: asset.asset_tag,
      assetName: asset.name,
      fromZone: currentZone.name,
      toZone: newZone.name,
      position: { x: newX, y: newY },
      timestamp
    };

    return event;
  }

  // Check if movement violates geofence
  checkGeofenceViolation(asset, fromZone, toZone) {
    for (const geofence of this.geofences) {
      // Check exit violations
      if (geofence.alert_on_exit && geofence.zone_id === fromZone.id) {
        // Check if asset type is covered
        const assetTypes = geofence.asset_types?.split(',') || ['all'];
        if (assetTypes.includes('all') || assetTypes.includes(asset.asset_type)) {
          this.createAlert(
            'geofence_exit',
            geofence.alert_severity || 'warning',
            `${asset.name} left ${fromZone.name}`,
            `Asset ${asset.asset_tag} was detected leaving the ${geofence.name} zone`,
            asset.id,
            fromZone.id,
            geofence.id
          );
        }
      }

      // Check entry violations
      if (geofence.alert_on_enter && geofence.zone_id === toZone.id) {
        const assetTypes = geofence.asset_types?.split(',') || ['all'];
        if (assetTypes.includes('all') || assetTypes.includes(asset.asset_type)) {
          this.createAlert(
            'geofence_enter',
            geofence.alert_severity || 'info',
            `${asset.name} entered ${toZone.name}`,
            `Asset ${asset.asset_tag} was detected entering the ${geofence.name} zone`,
            asset.id,
            toZone.id,
            geofence.id
          );
        }
      }
    }
  }

  // Create alert
  createAlert(type, severity, title, description, assetId, zoneId, geofenceId = null) {
    this.db.prepare(`
      INSERT INTO alerts (alert_type, severity, title, description, asset_id, zone_id, geofence_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'open')
    `).run(type, severity, title, description, assetId, zoneId, geofenceId);

    const alert = {
      type,
      severity,
      title,
      description,
      assetId,
      zoneId,
      timestamp: new Date().toISOString()
    };

    this.emit('alert', alert);
    console.log(`[Simulator] Alert: ${severity.toUpperCase()} - ${title}`);
  }

  // Simulate theft attempt (rapid movement toward exit)
  simulateTheftAttempt() {
    // Pick a high-value asset
    const highValueAssets = this.assets.filter(a =>
      a.purchase_value > 20000 &&
      ['patient_monitor', 'defibrillator', 'ventilator', 'ultrasound'].includes(a.asset_type)
    );

    if (highValueAssets.length === 0) return null;

    const asset = highValueAssets[Math.floor(Math.random() * highValueAssets.length)];

    // Create anomaly alert
    this.createAlert(
      'anomaly',
      'critical',
      `Suspicious movement: ${asset.name}`,
      `Asset ${asset.asset_tag} (value: R${asset.purchase_value.toLocaleString()}) showing rapid movement pattern consistent with potential theft`,
      asset.id,
      asset.current_zone_id
    );

    // Update asset status
    this.db.prepare(`UPDATE assets SET status = 'alert' WHERE id = ?`).run(asset.id);

    return {
      type: 'theft_alert',
      assetId: asset.id,
      assetTag: asset.asset_tag,
      assetName: asset.name,
      value: asset.purchase_value,
      timestamp: new Date().toISOString()
    };
  }

  // Simulate equipment hoarding (multiple assets moving to same zone)
  simulateHoarding() {
    // Pick a random zone as hoarding destination
    const targetZone = this.zones[Math.floor(Math.random() * this.zones.length)];

    // Move 2-4 assets to that zone
    const numAssets = Math.floor(Math.random() * 3) + 2;
    const assetsToMove = this.assets
      .filter(a => a.current_zone_id !== targetZone.id)
      .slice(0, numAssets);

    for (const asset of assetsToMove) {
      const newX = (targetZone.boundary_x1 || 0) + Math.random() * 30;
      const newY = (targetZone.boundary_y1 || 0) + Math.random() * 30;

      this.db.prepare(`
        UPDATE assets
        SET current_zone_id = ?, current_x = ?, current_y = ?, last_seen = datetime('now')
        WHERE id = ?
      `).run(targetZone.id, newX, newY, asset.id);
    }

    // Check if zone is now over capacity
    const assetsInZone = this.db.prepare(`
      SELECT COUNT(*) as count FROM assets WHERE current_zone_id = ?
    `).get(targetZone.id).count;

    if (assetsInZone > (targetZone.capacity || 10)) {
      this.createAlert(
        'hoarding',
        'warning',
        `Equipment accumulation in ${targetZone.name}`,
        `${assetsInZone} assets detected in ${targetZone.name} (capacity: ${targetZone.capacity || 10}). Possible hoarding behavior.`,
        null,
        targetZone.id
      );
    }
  }

  // Update battery level
  updateBattery(asset) {
    let newBattery = (asset.battery_level || 100) - Math.floor(Math.random() * 3);
    newBattery = Math.max(0, newBattery);

    this.db.prepare(`UPDATE assets SET battery_level = ? WHERE id = ?`).run(newBattery, asset.id);

    // Low battery alert
    if (newBattery < 10 && newBattery > 0) {
      this.createAlert(
        'low_battery',
        'warning',
        `Low battery: ${asset.name}`,
        `Asset ${asset.asset_tag} battery at ${newBattery}%`,
        asset.id,
        asset.current_zone_id
      );
    }
  }

  // Update signal strength
  updateSignalStrength(asset) {
    // RSSI typically ranges from -100 (weak) to -30 (strong)
    const rssi = Math.floor(Math.random() * 70) - 100;
    this.db.prepare(`UPDATE assets SET signal_strength = ? WHERE id = ?`).run(rssi, asset.id);
  }

  // Create simulated tag reading
  createTagReading(asset, x, y) {
    // Pick a random gateway
    const gateway = this.gateways[Math.floor(Math.random() * this.gateways.length)];
    if (!gateway) return;

    const rssi = Math.floor(Math.random() * 50) - 80;
    const distance = Math.random() * 15; // 0-15 meters

    this.db.prepare(`
      INSERT INTO tag_readings (ble_tag_id, gateway_id, rssi, tx_power, distance_estimate, x_position, y_position, position_confidence, battery_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      asset.ble_tag_id,
      gateway.id,
      rssi,
      -59, // Standard TX power
      distance,
      x, y,
      Math.random() * 0.3 + 0.7, // 70-100% confidence
      asset.battery_level
    );
  }

  // Generate event hash (for blockchain audit trail)
  generateEventHash(assetId, fromZoneId, toZoneId, timestamp) {
    const data = `${assetId}:${fromZoneId}:${toZoneId}:${timestamp}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Get simulation status
  getStatus() {
    return {
      running: this.running,
      scenario: this.scenario,
      tickRate: this.tickRate,
      movementProbability: this.movementProbability,
      alertProbability: this.alertProbability,
      assetCount: this.assets.length,
      zoneCount: this.zones.length,
      gatewayCount: this.gateways.length
    };
  }

  // Change scenario on the fly
  setScenario(scenario) {
    this.scenario = scenario;
    console.log(`[Simulator] Scenario changed to: ${scenario}`);
    this.emit('scenario_changed', { scenario });
  }

  // Close database connection
  close() {
    this.stop();
    this.db.close();
  }
}

// ============================================================================
// STANDALONE EXECUTION
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  const simulator = new IoTSimulator();

  simulator.on('events', (events) => {
    console.log(`[Events] ${events.length} movement(s)`);
  });

  simulator.on('alert', (alert) => {
    console.log(`[Alert] ${alert.severity}: ${alert.title}`);
  });

  simulator.on('tick', (info) => {
    console.log(`[Tick] ${info.timestamp} - ${info.eventCount} events`);
  });

  // Start with scenario from command line or default to 'normal'
  const scenario = process.argv[2] || 'normal';
  simulator.start(scenario);

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down simulator...');
    simulator.close();
    process.exit(0);
  });
}

export default IoTSimulator;

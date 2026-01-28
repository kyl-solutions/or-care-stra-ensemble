// Or-care-stra Ensemble v1.0
// Digital Twin Hospital Equipment Tracking System
// Server Entry Point

import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from '@hono/node-server/serve-static';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Hono app
const app = new Hono();

// Enable CORS
app.use('/*', cors());

// Request logging middleware
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} - ${c.res.status} (${ms}ms)`);
});

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

let db = null;

async function initDatabase() {
  try {
    const Database = (await import('better-sqlite3')).default;
    const dbPath = process.env.DB_PATH || './database/ensemble.db';

    // Check if database exists
    if (!existsSync(dbPath)) {
      console.log('Database not found. Run: npm run db:init && npm run db:seed');
      return null;
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    console.log('Database connected:', dbPath);
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    return null;
  }
}

// ============================================================================
// WEBSOCKET & IOT SIMULATOR
// ============================================================================

let wss = null;
let simulator = null;
let auditChain = null;
const wsClients = new Set();

function broadcastToClients(message) {
  const data = JSON.stringify(message);
  for (const client of wsClients) {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(data);
    }
  }
}

async function initSimulator() {
  try {
    const { IoTSimulator } = await import('./simulator/iot-simulator.js');
    simulator = new IoTSimulator();

    // Forward simulator events to WebSocket clients
    simulator.on('events', (events) => {
      broadcastToClients({ type: 'asset_events', data: events });

      // Record events in blockchain
      if (auditChain) {
        for (const event of events) {
          // Map simulator event fields to blockchain transaction fields
          auditChain.addTransaction({
            event_type: event.type || 'movement',  // simulator uses 'type' not 'event_type'
            asset_id: event.assetId,               // simulator uses camelCase
            asset_tag: event.assetTag,
            from_zone_id: null,                    // simulator doesn't include zone IDs
            from_zone_name: event.fromZone,
            to_zone_id: null,
            to_zone_name: event.toZone,
            metadata: {
              triggered_by: 'simulator',
              position: event.position,
              timestamp: event.timestamp
            }
          });
        }
      }
    });

    simulator.on('alert', (alert) => {
      broadcastToClients({ type: 'alert', data: alert });
    });

    simulator.on('tick', (info) => {
      broadcastToClients({ type: 'tick', data: info });
    });

    simulator.on('started', (info) => {
      broadcastToClients({ type: 'simulator_started', data: info });
    });

    simulator.on('stopped', () => {
      broadcastToClients({ type: 'simulator_stopped' });
    });

    console.log('IoT Simulator initialized');
    return simulator;
  } catch (error) {
    console.error('Simulator initialization error:', error);
    return null;
  }
}

async function initBlockchain() {
  try {
    const { AuditChain } = await import('./blockchain/audit-chain.js');
    const dbPath = process.env.DB_PATH || './database/ensemble.db';
    auditChain = new AuditChain(dbPath);

    // Start block timer for automatic block creation
    auditChain.startBlockTimer();

    // Forward blockchain events to WebSocket clients
    auditChain.on('block', (block) => {
      broadcastToClients({ type: 'new_block', data: block });
    });

    auditChain.on('transaction', (tx) => {
      broadcastToClients({ type: 'new_transaction', data: tx });
    });

    console.log('Blockchain audit trail initialized');
    return auditChain;
  } catch (error) {
    console.error('Blockchain initialization error:', error);
    return null;
  }
}

function setupWebSocket(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('[WebSocket] Client connected');
    wsClients.add(ws);

    // Mark connection as alive
    ws.isAlive = true;

    // Send current status on connect
    ws.send(JSON.stringify({
      type: 'connected',
      data: {
        simulator: simulator ? simulator.getStatus() : null,
        timestamp: new Date().toISOString()
      }
    }));

    // Handle pong responses (browser sends pong in response to ping)
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const msg = JSON.parse(message);
        // Any message keeps connection alive
        ws.isAlive = true;
        handleWebSocketMessage(ws, msg);
      } catch (e) {
        console.error('[WebSocket] Invalid message:', e);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
      wsClients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Error:', error);
      wsClients.delete(ws);
    });
  });

  // Heartbeat interval - ping all clients every 30 seconds
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        wsClients.delete(ws);
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping(); // Browser will respond with pong automatically
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('WebSocket server initialized at /ws');
}

function handleWebSocketMessage(ws, msg) {
  switch (msg.type) {
    case 'start_simulator':
      if (simulator) {
        simulator.start(msg.scenario || 'normal');
        ws.send(JSON.stringify({ type: 'ack', action: 'start_simulator' }));
      }
      break;

    case 'stop_simulator':
      if (simulator) {
        simulator.stop();
        ws.send(JSON.stringify({ type: 'ack', action: 'stop_simulator' }));
      }
      break;

    case 'set_scenario':
      if (simulator && msg.scenario) {
        simulator.setScenario(msg.scenario);
        ws.send(JSON.stringify({ type: 'ack', action: 'set_scenario', scenario: msg.scenario }));
      }
      break;

    case 'get_status':
      ws.send(JSON.stringify({
        type: 'status',
        data: simulator ? simulator.getStatus() : null
      }));
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;

    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

// ============================================================================
// API ROUTES - HEALTH
// ============================================================================

app.get('/api/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'or-care-stra-ensemble',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected',
    simulator: simulator ? simulator.getStatus() : null,
    websocket: wss ? { clients: wsClients.size } : null
  });
});

// ============================================================================
// API ROUTES - SIMULATOR CONTROL
// ============================================================================

app.get('/api/simulator/status', (c) => {
  if (!simulator) {
    return c.json({ error: 'Simulator not initialized' }, 503);
  }
  return c.json(simulator.getStatus());
});

app.post('/api/simulator/start', async (c) => {
  if (!simulator) {
    return c.json({ error: 'Simulator not initialized' }, 503);
  }

  try {
    const body = await c.req.json().catch(() => ({}));
    const scenario = body.scenario || 'normal';
    simulator.start(scenario);
    return c.json({ success: true, scenario });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/simulator/stop', (c) => {
  if (!simulator) {
    return c.json({ error: 'Simulator not initialized' }, 503);
  }
  simulator.stop();
  return c.json({ success: true });
});

app.post('/api/simulator/scenario', async (c) => {
  if (!simulator) {
    return c.json({ error: 'Simulator not initialized' }, 503);
  }

  try {
    const body = await c.req.json();
    if (!body.scenario) {
      return c.json({ error: 'Scenario required' }, 400);
    }
    simulator.setScenario(body.scenario);
    return c.json({ success: true, scenario: body.scenario });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// API ROUTES - DASHBOARD
// ============================================================================

app.get('/api/dashboard/stats', (c) => {
  if (!db) {
    return c.json({
      assets: { total: 0, online: 0, offline: 0, alert: 0 },
      locations: { zones: 0, wards: 0 },
      alerts: { open: 0, critical: 0 },
      savings: { monthly: 0, potential: 0 }
    });
  }

  try {
    const assetStats = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'online' THEN 1 ELSE 0 END) as online,
        SUM(CASE WHEN status = 'offline' THEN 1 ELSE 0 END) as offline,
        SUM(CASE WHEN status = 'alert' THEN 1 ELSE 0 END) as alert
      FROM assets
    `).get();

    const locationStats = db.prepare(`
      SELECT
        COUNT(CASE WHEN location_type = 'zone' THEN 1 END) as zones,
        COUNT(CASE WHEN location_type = 'ward' THEN 1 END) as wards
      FROM locations
    `).get();

    const alertStats = db.prepare(`
      SELECT
        COUNT(*) as open,
        SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) as critical
      FROM alerts WHERE status = 'open'
    `).get();

    // Get recent savings data
    const recentSavings = db.prepare(`
      SELECT SUM(daily_savings) as monthly_savings
      FROM savings_metrics
      WHERE metric_date >= date('now', '-30 days')
    `).get();

    return c.json({
      assets: assetStats || { total: 0, online: 0, offline: 0, alert: 0 },
      locations: locationStats || { zones: 0, wards: 0 },
      alerts: alertStats || { open: 0, critical: 0 },
      savings: {
        monthly: recentSavings?.monthly_savings || 8500000,
        potential: 109000000
      },
      simulator: simulator ? simulator.getStatus() : null
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// API ROUTES - REAL-TIME ASSET POSITIONS
// ============================================================================

app.get('/api/assets/positions', (c) => {
  if (!db) {
    return c.json({ positions: [] });
  }

  try {
    const positions = db.prepare(`
      SELECT
        a.id,
        a.asset_tag,
        a.name,
        a.asset_type,
        a.status,
        a.manufacturer,
        a.model,
        a.serial_number,
        a.purchase_date,
        a.purchase_value,
        a.current_value,
        a.warranty_expiry,
        a.last_maintenance,
        a.next_maintenance,
        a.maintenance_interval_days,
        a.current_zone_id,
        a.current_x,
        a.current_y,
        a.current_floor,
        a.battery_level,
        a.signal_strength,
        a.last_seen,
        l.name as zone_name
      FROM assets a
      LEFT JOIN locations l ON a.current_zone_id = l.id
      ORDER BY a.last_seen DESC
    `).all();

    return c.json({ positions, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Asset positions error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// API ROUTES - ASSETS
// ============================================================================

app.get('/api/assets', (c) => {
  if (!db) {
    return c.json({ assets: [], total: 0 });
  }

  try {
    const { type, status, zone, limit = 100, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM assets WHERE 1=1';
    const params = [];

    if (type) {
      query += ' AND asset_type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (zone) {
      query += ' AND current_zone_id = ?';
      params.push(zone);
    }

    query += ' ORDER BY last_seen DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const assets = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM assets').get().count;

    return c.json({ assets, total });
  } catch (error) {
    console.error('Assets fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/assets/:id', (c) => {
  if (!db) {
    return c.json({ error: 'Database not connected' }, 503);
  }

  try {
    const { id } = c.req.param();
    const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);

    if (!asset) {
      return c.json({ error: 'Asset not found' }, 404);
    }

    // Get recent events for this asset
    const events = db.prepare(`
      SELECT * FROM asset_events
      WHERE asset_id = ?
      ORDER BY timestamp DESC
      LIMIT 50
    `).all(id);

    return c.json({ asset, events });
  } catch (error) {
    console.error('Asset fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// API ROUTES - LOCATIONS
// ============================================================================

app.get('/api/locations', (c) => {
  if (!db) {
    return c.json({ locations: [] });
  }

  try {
    const locations = db.prepare(`
      SELECT
        l.*,
        COUNT(a.id) as asset_count
      FROM locations l
      LEFT JOIN assets a ON a.current_zone_id = l.id
      GROUP BY l.id
      ORDER BY l.name
    `).all();

    return c.json({ locations });
  } catch (error) {
    console.error('Locations fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/api/locations/:id', (c) => {
  if (!db) {
    return c.json({ error: 'Database not connected' }, 503);
  }

  try {
    const { id } = c.req.param();
    const location = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);

    if (!location) {
      return c.json({ error: 'Location not found' }, 404);
    }

    // Get assets in this location
    const assets = db.prepare(`
      SELECT * FROM assets WHERE current_zone_id = ?
    `).all(id);

    return c.json({ location, assets });
  } catch (error) {
    console.error('Location fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// API ROUTES - ALERTS
// ============================================================================

app.get('/api/alerts', (c) => {
  if (!db) {
    return c.json({ alerts: [] });
  }

  try {
    const { status, severity, limit = 50 } = c.req.query();

    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (severity) {
      query += ' AND severity = ?';
      params.push(severity);
    }

    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const alerts = db.prepare(query).all(...params);
    return c.json({ alerts });
  } catch (error) {
    console.error('Alerts fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/alerts/:id/acknowledge', async (c) => {
  if (!db) {
    return c.json({ error: 'Database not connected' }, 503);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    db.prepare(`
      UPDATE alerts
      SET status = 'acknowledged',
          acknowledged_by = ?,
          acknowledged_at = datetime('now')
      WHERE id = ?
    `).run(body.user_id || 'system', id);

    return c.json({ success: true });
  } catch (error) {
    console.error('Alert acknowledge error:', error);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/alerts/:id/resolve', async (c) => {
  if (!db) {
    return c.json({ error: 'Database not connected' }, 503);
  }

  try {
    const { id } = c.req.param();
    const body = await c.req.json();

    db.prepare(`
      UPDATE alerts
      SET status = 'resolved',
          resolved_by = ?,
          resolved_at = datetime('now'),
          resolution_notes = ?
      WHERE id = ?
    `).run(body.user_id || 'system', body.notes || '', id);

    return c.json({ success: true });
  } catch (error) {
    console.error('Alert resolve error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// API ROUTES - BLOCKCHAIN AUDIT TRAIL
// ============================================================================

app.get('/api/blockchain/status', (c) => {
  if (!auditChain) {
    return c.json({ error: 'Blockchain not initialized' }, 503);
  }
  return c.json(auditChain.getChainStatus());
});

app.get('/api/blockchain/verify', (c) => {
  if (!auditChain) {
    return c.json({ error: 'Blockchain not initialized' }, 503);
  }
  return c.json(auditChain.verifyChain());
});

app.get('/api/blockchain/blocks', (c) => {
  if (!auditChain) {
    return c.json({ error: 'Blockchain not initialized' }, 503);
  }

  const { limit = 10, offset = 0 } = c.req.query();
  const blocks = auditChain.getBlocks(parseInt(limit), parseInt(offset));
  return c.json({ blocks });
});

app.get('/api/blockchain/blocks/:number', (c) => {
  if (!auditChain) {
    return c.json({ error: 'Blockchain not initialized' }, 503);
  }

  const { number } = c.req.param();
  const block = auditChain.getBlock(parseInt(number));

  if (!block) {
    return c.json({ error: 'Block not found' }, 404);
  }

  return c.json(block);
});

app.get('/api/blockchain/transactions', (c) => {
  if (!auditChain) {
    return c.json({ error: 'Blockchain not initialized' }, 503);
  }

  const { limit = 50 } = c.req.query();
  const transactions = auditChain.getRecentTransactions(parseInt(limit));
  return c.json({ transactions });
});

app.get('/api/blockchain/transactions/:hash', (c) => {
  if (!auditChain) {
    return c.json({ error: 'Blockchain not initialized' }, 503);
  }

  const { hash } = c.req.param();
  const result = auditChain.verifyTransaction(hash);
  return c.json(result);
});

app.get('/api/blockchain/asset/:id/history', (c) => {
  if (!auditChain) {
    return c.json({ error: 'Blockchain not initialized' }, 503);
  }

  const { id } = c.req.param();
  const { limit = 50 } = c.req.query();
  const history = auditChain.getAssetHistory(parseInt(id), parseInt(limit));
  return c.json({ history });
});

app.post('/api/blockchain/search', async (c) => {
  if (!auditChain) {
    return c.json({ error: 'Blockchain not initialized' }, 503);
  }

  try {
    const filters = await c.req.json();
    const transactions = auditChain.searchTransactions(filters);
    return c.json({ transactions });
  } catch (error) {
    return c.json({ error: error.message }, 500);
  }
});

app.post('/api/blockchain/create-block', (c) => {
  if (!auditChain) {
    return c.json({ error: 'Blockchain not initialized' }, 503);
  }

  const block = auditChain.createBlock();
  if (!block) {
    return c.json({ message: 'No pending transactions' });
  }
  return c.json(block);
});

// ============================================================================
// API ROUTES - AUDIT LOG (Legacy + Blockchain)
// ============================================================================

app.get('/api/audit-log', (c) => {
  if (!db) {
    return c.json({ events: [], total: 0 });
  }

  try {
    const { asset_id, event_type, limit = 100, offset = 0 } = c.req.query();

    let query = 'SELECT * FROM asset_events WHERE 1=1';
    const params = [];

    if (asset_id) {
      query += ' AND asset_id = ?';
      params.push(asset_id);
    }

    if (event_type) {
      query += ' AND event_type = ?';
      params.push(event_type);
    }

    query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const events = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM asset_events').get().count;

    return c.json({
      events,
      total,
      blockchain: auditChain ? auditChain.getChainStatus() : { enabled: false }
    });
  } catch (error) {
    console.error('Audit log error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// API ROUTES - GEOFENCES
// ============================================================================

app.get('/api/geofences', (c) => {
  if (!db) {
    return c.json({ geofences: [] });
  }

  try {
    const geofences = db.prepare('SELECT * FROM geofences ORDER BY name').all();
    return c.json({ geofences });
  } catch (error) {
    console.error('Geofences fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// API ROUTES - GATEWAYS
// ============================================================================

app.get('/api/gateways', (c) => {
  if (!db) {
    return c.json({ gateways: [] });
  }

  try {
    const gateways = db.prepare(`
      SELECT g.*, l.name as zone_name
      FROM gateways g
      LEFT JOIN locations l ON g.zone_id = l.id
      ORDER BY g.name
    `).all();
    return c.json({ gateways });
  } catch (error) {
    console.error('Gateways fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

// ============================================================================
// STATIC FILE SERVING
// ============================================================================

// Serve static files from public directory
app.use('/assets/*', serveStatic({ root: './public' }));
app.use('/static/*', serveStatic({ root: './public' }));

// Serve desktop app downloads from dist-electron/ directory
app.get('/downloads/:filename', async (c) => {
  const fs = await import('fs/promises');
  const filename = c.req.param('filename');

  // Map friendly names to actual versioned files in dist-electron/
  const fileMap = {
    'Or-care-stra Ensemble-macos.dmg': 'Or-care-stra Ensemble-1.0.0.dmg',
    'Or-care-stra Ensemble-macos-intel.dmg': 'Or-care-stra Ensemble-1.0.0.dmg',
    'Or-care-stra Ensemble-macos.zip': 'Or-care-stra Ensemble-1.0.0-mac.zip',
    'Or-care-stra Ensemble-windows.exe': 'Or-care-stra Ensemble Setup 1.0.0.exe',
    'Or-care-stra Ensemble-windows-portable.exe': 'Or-care-stra Ensemble 1.0.0.exe'
  };

  const actualFile = fileMap[filename] || filename;
  const filePath = join(__dirname, 'dist-electron', actualFile);

  if (!existsSync(filePath)) {
    return c.json({ error: 'File not found', requested: filename, resolved: actualFile }, 404);
  }

  const stat = await fs.stat(filePath);
  const content = await fs.readFile(filePath);

  return c.body(content, 200, {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${actualFile}"`,
    'Content-Length': stat.size.toString()
  });
});

// Serve main pages
app.get('/', (c) => {
  const html = readFileSync(join(__dirname, 'public', 'landing.html'), 'utf-8');
  return c.html(html);
});

app.get('/index.html', (c) => {
  const indexPath = join(__dirname, 'public', 'index.html');
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf-8');
    return c.html(html);
  }
  // Fallback to landing page if index doesn't exist yet
  const html = readFileSync(join(__dirname, 'public', 'landing.html'), 'utf-8');
  return c.html(html);
});

app.get('/dashboard', (c) => {
  // Serve the new isometric command center as primary dashboard
  const ccPath = join(__dirname, 'public', 'command-center.html');
  if (existsSync(ccPath)) {
    const html = readFileSync(ccPath, 'utf-8');
    return c.html(html);
  }
  const html = readFileSync(join(__dirname, 'public', 'index.html'), 'utf-8');
  return c.html(html);
});

app.get('/command-center', (c) => {
  // Primary isometric 3D command center
  const ccPath = join(__dirname, 'public', 'command-center.html');
  if (existsSync(ccPath)) {
    const html = readFileSync(ccPath, 'utf-8');
    return c.html(html);
  }
  const html = readFileSync(join(__dirname, 'public', 'index.html'), 'utf-8');
  return c.html(html);
});

app.get('/dashboard-classic', (c) => {
  // Legacy 2D blueprint dashboard
  const html = readFileSync(join(__dirname, 'public', 'index.html'), 'utf-8');
  return c.html(html);
});

app.get('/landing', (c) => {
  const html = readFileSync(join(__dirname, 'public', 'landing.html'), 'utf-8');
  return c.html(html);
});

app.get('/landing.html', (c) => {
  const html = readFileSync(join(__dirname, 'public', 'landing.html'), 'utf-8');
  return c.html(html);
});

// Schematics - Presentation-ready visual diagrams
app.get('/schematics/architecture', (c) => {
  const html = readFileSync(join(__dirname, 'public', 'schematics', 'system-architecture.html'), 'utf-8');
  return c.html(html);
});

app.get('/schematics/certificate', (c) => {
  const html = readFileSync(join(__dirname, 'public', 'schematics', 'asset-identity-certificate.html'), 'utf-8');
  return c.html(html);
});

// Favicon - Serve from file with brand colors
app.get('/favicon.svg', (c) => {
  const faviconPath = join(__dirname, 'public', 'favicon.svg');
  if (existsSync(faviconPath)) {
    const svg = readFileSync(faviconPath, 'utf-8');
    return c.body(svg, 200, { 'Content-Type': 'image/svg+xml' });
  }
  // Fallback with brand gradient
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#25b59a"/><stop offset="100%" style="stop-color:#f5ac5d"/>
    </linearGradient></defs>
    <rect width="64" height="64" rx="14" fill="url(#bg)"/>
    <g transform="translate(8, 32)">
      <rect x="0" y="-5" width="4" height="10" rx="2" fill="white"/>
      <rect x="7" y="-8" width="4" height="16" rx="2" fill="white"/>
      <rect x="14" y="-12" width="4" height="24" rx="2" fill="white"/>
      <rect x="21" y="-16" width="4" height="32" rx="2" fill="white"/>
      <rect x="28" y="-14" width="4" height="28" rx="2" fill="white"/>
      <rect x="35" y="-10" width="4" height="20" rx="2" fill="white"/>
      <rect x="42" y="-7" width="4" height="14" rx="2" fill="white"/>
      <rect x="49" y="-4" width="4" height="8" rx="2" fill="white"/>
    </g>
  </svg>`;
  return c.body(svg, 200, { 'Content-Type': 'image/svg+xml' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

const PORT = parseInt(process.env.PORT || '3457');

async function startServer() {
  // Initialize database
  await initDatabase();

  // Initialize blockchain audit trail
  await initBlockchain();

  // Initialize simulator
  await initSimulator();

  // Create HTTP server
  const server = createServer((req, res) => {
    // Let Hono handle HTTP requests
    app.fetch(new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: req.headers
    })).then(async (response) => {
      res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
      const body = await response.text();
      res.end(body);
    }).catch((error) => {
      console.error('Request error:', error);
      res.writeHead(500);
      res.end('Internal Server Error');
    });
  });

  // Setup WebSocket
  setupWebSocket(server);

  // Start server
  server.listen(PORT, () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                                                              ║');
    console.log('║   OR-CARE-STRA ENSEMBLE                                      ║');
    console.log('║   Digital Twin Hospital Equipment Tracking                   ║');
    console.log('║                                                              ║');
    console.log('╠══════════════════════════════════════════════════════════════╣');
    console.log(`║   Server:    http://localhost:${PORT}                          ║`);
    console.log(`║   API:       http://localhost:${PORT}/api                      ║`);
    console.log(`║   WebSocket: ws://localhost:${PORT}/ws                         ║`);
    console.log(`║   Health:    http://localhost:${PORT}/api/health               ║`);
    console.log('║                                                              ║');
    console.log('║   Simulator Commands:                                        ║');
    console.log('║   POST /api/simulator/start  {"scenario":"normal"}           ║');
    console.log('║   POST /api/simulator/stop                                   ║');
    console.log('║   Scenarios: normal, theft, hoarding, busy, quiet            ║');
    console.log('║                                                              ║');
    console.log('║   Blockchain:                                                ║');
    console.log('║   GET  /api/blockchain/status     Chain status               ║');
    console.log('║   GET  /api/blockchain/verify     Verify integrity           ║');
    console.log('║   GET  /api/blockchain/blocks     Browse blocks              ║');
    console.log('║                                                              ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

startServer().catch(console.error);

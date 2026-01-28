/**
 * Or-care-stra Ensemble Desktop App - Electron Main Process
 *
 * Cross-platform desktop application for hospital equipment tracking.
 * Features: Movable window, system tray, collapsible to tray, embedded server.
 */

import { app, BrowserWindow, Menu, Tray, shell, dialog, nativeImage, ipcMain } from 'electron';
import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import net from 'net';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Keep references to prevent garbage collection
let mainWindow = null;
let tray = null;
let serverProcess = null;
let isQuitting = false;
let isCollapsed = false;

// Window size presets
const WINDOW_SIZES = {
  full: { width: 1400, height: 900 },
  compact: { width: 480, height: 600 },
  collapsed: { width: 320, height: 80 }
};

// Server configuration
const SERVER_PORT = 3457;
const LOCAL_SERVER_URL = `http://localhost:${SERVER_PORT}`;
const CLOUD_SERVER_URL = 'https://ensemble.kyl.solutions';

// Will be set based on whether local server starts successfully
let SERVER_URL = LOCAL_SERVER_URL;
let useCloudFallback = false;

// Detect if we're running in a packaged app or development
const IS_PACKAGED = app.isPackaged;

// App paths - different for packaged vs development
let APP_ROOT, SERVER_SCRIPT, ICON_PATH;

if (IS_PACKAGED) {
  APP_ROOT = path.join(process.resourcesPath, 'app');
  if (!fs.existsSync(APP_ROOT)) {
    APP_ROOT = app.getAppPath();
  }
  SERVER_SCRIPT = path.join(APP_ROOT, 'server.js');
  ICON_PATH = path.join(process.resourcesPath, 'app', 'electron', 'icons', 'icon.png');
} else {
  APP_ROOT = path.join(__dirname, '..');
  SERVER_SCRIPT = path.join(APP_ROOT, 'server.js');
  ICON_PATH = path.join(APP_ROOT, 'electron', 'icons', 'icon.png');
}

console.log('[Ensemble] Paths:', { IS_PACKAGED, APP_ROOT, SERVER_SCRIPT });

/**
 * Check if a port is available
 */
async function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port, '127.0.0.1');
  });
}

/**
 * Check if the cloud server is available
 */
function checkCloudServer() {
  return new Promise((resolve) => {
    const req = https.get(`${CLOUD_SERVER_URL}/api/health`, { timeout: 5000 }, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

/**
 * Start the embedded Node.js server
 * Uses fork() to run server.js using Electron's bundled Node.js runtime
 * Falls back to cloud server if local server fails (e.g., native module issues on Windows)
 */
async function startServer() {
  console.log('[Ensemble] Starting embedded server...');

  // First, check if port is available
  const portAvailable = await isPortAvailable(SERVER_PORT);
  if (!portAvailable) {
    console.log('[Ensemble] Port', SERVER_PORT, 'is already in use');
    // Try cloud fallback immediately
    const cloudAvailable = await checkCloudServer();
    if (cloudAvailable) {
      console.log('[Ensemble] Port in use, using cloud fallback');
      SERVER_URL = CLOUD_SERVER_URL;
      useCloudFallback = true;
      return;
    } else {
      throw new Error(`Port ${SERVER_PORT} is already in use and cloud server is not available`);
    }
  }

  return new Promise((resolve, reject) => {
    console.log('[Ensemble] Port available, starting local server...');

    // Determine database path for packaged app
    let dbPath;
    if (IS_PACKAGED) {
      dbPath = path.join(process.resourcesPath, 'database', 'ensemble.db');
    } else {
      dbPath = path.join(APP_ROOT, 'database', 'ensemble.db');
    }
    console.log('[Ensemble] Database path:', dbPath);

    const env = {
      ...process.env,
      PORT: SERVER_PORT.toString(),
      NODE_ENV: 'production',
      ELECTRON_APP: 'true',
      DB_PATH: dbPath,
      // Ensure native modules are loaded correctly
      ELECTRON_RUN_AS_NODE: '1'
    };

    console.log('[Ensemble] Starting server with fork:', SERVER_SCRIPT);
    console.log('[Ensemble] Using Electron execPath:', process.execPath);

    // Use fork() which uses Electron's bundled Node.js runtime
    // This ensures native modules compiled for Electron work correctly
    serverProcess = fork(SERVER_SCRIPT, [], {
      cwd: APP_ROOT,
      env,
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      execPath: process.execPath,
      execArgv: [] // Clear any debug flags
    });

    let started = false;
    let serverFailed = false;

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[Server]', output.trim());

      if (!started && (output.includes('listening') || output.includes('Server running') || output.includes('localhost'))) {
        started = true;
        SERVER_URL = LOCAL_SERVER_URL;
        useCloudFallback = false;
        console.log('[Ensemble] Local server started successfully');
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      const errorMsg = data.toString().trim();
      console.error('[Server Error]', errorMsg);

      // Check for errors that indicate we need cloud fallback
      if (errorMsg.includes('NODE_MODULE_VERSION') ||
          errorMsg.includes('was compiled against') ||
          errorMsg.includes('ERR_DLOPEN_FAILED') ||
          errorMsg.includes('not a valid Win32 application') ||
          errorMsg.includes('module was not found') ||
          errorMsg.includes('EADDRINUSE') ||
          errorMsg.includes('address already in use')) {
        console.log('[Ensemble] Server error detected, will try cloud fallback:', errorMsg.substring(0, 100));
        serverFailed = true;

        // If port is in use, fall back to cloud immediately
        if (errorMsg.includes('EADDRINUSE') || errorMsg.includes('address already in use')) {
          console.log('[Ensemble] Port already in use, switching to cloud mode');
          if (serverProcess) {
            serverProcess.kill('SIGTERM');
          }
          checkCloudServer().then((cloudAvailable) => {
            if (cloudAvailable && !started) {
              SERVER_URL = CLOUD_SERVER_URL;
              useCloudFallback = true;
              started = true;
              resolve();
            }
          });
        }
      }
    });

    serverProcess.on('error', (err) => {
      console.error('[Server] Failed to start:', err);
      serverFailed = true;
    });

    serverProcess.on('exit', (code) => {
      console.log(`[Server] Exited with code ${code}`);

      // If already using cloud fallback, don't show error
      if (useCloudFallback) {
        console.log('[Ensemble] Server exited but already using cloud fallback');
        return;
      }

      if (!started && !isQuitting) {
        // Server exited before starting - try cloud fallback
        console.log('[Ensemble] Local server failed to start, attempting cloud fallback...');
        serverFailed = true;

        checkCloudServer().then((cloudAvailable) => {
          if (cloudAvailable) {
            console.log('[Ensemble] Cloud server available, using cloud fallback');
            SERVER_URL = CLOUD_SERVER_URL;
            useCloudFallback = true;
            resolve();
          } else {
            console.error('[Ensemble] Cloud server not available');
            dialog.showErrorBox(
              'Server Error',
              'Could not start local server and cloud server is not available.\n\n' +
              'Please check your internet connection and try again.\n\n' +
              'For best results, ensure https://ensemble.kyl.solutions is accessible.'
            );
            app.quit();
          }
        });
      } else if (!isQuitting && started && !serverFailed) {
        // Server was running but crashed unexpectedly - try cloud fallback
        console.log('[Ensemble] Server crashed, attempting cloud fallback...');
        checkCloudServer().then((cloudAvailable) => {
          if (cloudAvailable) {
            console.log('[Ensemble] Switching to cloud mode after crash');
            SERVER_URL = CLOUD_SERVER_URL;
            useCloudFallback = true;
            // Reload the window with cloud URL
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.loadURL(SERVER_URL);
              dialog.showMessageBox(mainWindow, {
                type: 'info',
                title: 'Switched to Cloud Mode',
                message: 'Local server stopped',
                detail: 'The app has automatically switched to cloud mode for uninterrupted operation.',
                buttons: ['OK']
              });
            }
          } else {
            dialog.showErrorBox('Server Error', 'The Ensemble server has stopped unexpectedly and cloud backup is not available.\n\nPlease check your internet connection and try again.');
            app.quit();
          }
        });
      }
    });

    // Timeout fallback - check cloud if local doesn't start in time
    setTimeout(() => {
      if (!started && !serverFailed) {
        console.log('[Ensemble] Local server timeout, checking cloud fallback...');
        checkCloudServer().then((cloudAvailable) => {
          if (cloudAvailable && !started) {
            console.log('[Ensemble] Using cloud fallback due to timeout');
            SERVER_URL = CLOUD_SERVER_URL;
            useCloudFallback = true;
            // Kill the stuck local server
            if (serverProcess) {
              serverProcess.kill('SIGTERM');
            }
            resolve();
          } else if (!started) {
            // Give it a bit more time
            setTimeout(() => {
              if (!started) {
                started = true;
                resolve();
              }
            }, 4000);
          }
        });
      }
    }, 8000);
  });
}

/**
 * Stop the embedded server
 */
function stopServer() {
  if (serverProcess) {
    console.log('[Ensemble] Stopping server...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_SIZES.full.width,
    height: WINDOW_SIZES.full.height,
    minWidth: 320,
    minHeight: 80,
    title: 'Or-care-stra Ensemble - Digital Twin Asset Tracking',
    icon: ICON_PATH,
    frame: true,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    backgroundColor: '#0f172a',
    show: false
  });

  // Load the app
  mainWindow.loadURL(SERVER_URL);

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith(SERVER_URL)) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Handle window close - minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();

      // Show notification on first minimize (Windows)
      if (tray && process.platform === 'win32') {
        tray.displayBalloon({
          title: 'Or-care-stra Ensemble',
          content: 'Application minimized to system tray. Click the icon to restore.'
        });
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

/**
 * Toggle window between full and collapsed states
 */
function toggleCollapse() {
  if (!mainWindow) return;

  if (isCollapsed) {
    // Expand
    mainWindow.setSize(WINDOW_SIZES.full.width, WINDOW_SIZES.full.height);
    mainWindow.center();
    isCollapsed = false;
  } else {
    // Collapse to compact bar
    const currentBounds = mainWindow.getBounds();
    mainWindow.setSize(WINDOW_SIZES.collapsed.width, WINDOW_SIZES.collapsed.height);
    // Move to top-right corner
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: screenWidth } = primaryDisplay.workAreaSize;
    mainWindow.setPosition(screenWidth - WINDOW_SIZES.collapsed.width - 20, 20);
    isCollapsed = true;
  }

  // Notify renderer of collapse state
  mainWindow.webContents.send('collapse-state', isCollapsed);
}

/**
 * Create the application menu
 */
function createMenu() {
  const template = [
    {
      label: 'Ensemble',
      submenu: [
        { label: 'About Or-care-stra Ensemble', role: 'about' },
        { type: 'separator' },
        {
          label: 'Command Center',
          accelerator: 'CmdOrCtrl+D',
          click: () => mainWindow?.loadURL(`${SERVER_URL}/dashboard`)
        },
        {
          label: 'Landing Page',
          accelerator: 'CmdOrCtrl+L',
          click: () => mainWindow?.loadURL(SERVER_URL)
        },
        { type: 'separator' },
        {
          label: 'Toggle Compact Mode',
          accelerator: 'CmdOrCtrl+M',
          click: () => toggleCollapse()
        },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'CmdOrCtrl+Q', click: () => { isQuitting = true; app.quit(); } }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        { type: 'separator' },
        {
          label: 'Compact Mode',
          accelerator: 'CmdOrCtrl+Shift+M',
          click: () => toggleCollapse()
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        {
          label: 'Restore Full Size',
          click: () => {
            if (mainWindow) {
              mainWindow.setSize(WINDOW_SIZES.full.width, WINDOW_SIZES.full.height);
              mainWindow.center();
              isCollapsed = false;
            }
          }
        },
        { type: 'separator' },
        { role: 'front' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation',
          click: () => shell.openExternal('https://github.com/kylsolutions/or-care-stra-ensemble')
        },
        {
          label: 'Report Issue',
          click: () => shell.openExternal('https://github.com/kylsolutions/or-care-stra-ensemble/issues')
        },
        { type: 'separator' },
        {
          label: 'KYL Solutions',
          click: () => shell.openExternal('https://kylsolutions.co.za')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * Create system tray icon
 */
function createTray() {
  const trayIconPath = path.join(__dirname, 'icons', 'icon.png');
  const iconPath = fs.existsSync(trayIconPath) ? trayIconPath : ICON_PATH;

  if (!fs.existsSync(iconPath)) {
    console.log('[Tray] Icon not found, skipping tray creation');
    return;
  }

  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Ensemble',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Command Center',
      click: () => {
        mainWindow?.show();
        mainWindow?.loadURL(`${SERVER_URL}/dashboard`);
      }
    },
    {
      label: 'Landing Page',
      click: () => {
        mainWindow?.show();
        mainWindow?.loadURL(SERVER_URL);
      }
    },
    { type: 'separator' },
    {
      label: 'Toggle Compact Mode',
      click: () => toggleCollapse()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('Or-care-stra Ensemble - Digital Twin Asset Tracking');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });

  // Double-click to toggle collapse
  tray.on('double-click', () => {
    toggleCollapse();
  });
}

// ========== IPC Handlers ==========

ipcMain.handle('get-window-state', () => {
  return {
    isCollapsed,
    isMaximized: mainWindow?.isMaximized() || false,
    isFullScreen: mainWindow?.isFullScreen() || false
  };
});

ipcMain.on('toggle-collapse', () => {
  toggleCollapse();
});

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window-close', () => {
  mainWindow?.close();
});

// ========== App Lifecycle Events ==========

app.whenReady().then(async () => {
  console.log('[Ensemble] Starting desktop application...');

  try {
    // Start the embedded server first (or fall back to cloud)
    await startServer();

    if (useCloudFallback) {
      console.log('[Ensemble] Using cloud server at:', SERVER_URL);
    } else {
      console.log('[Ensemble] Local server started successfully at:', SERVER_URL);
    }

    // Create the main window
    createWindow();

    // Create system tray
    createTray();

    // If using cloud fallback, show a notification
    if (useCloudFallback && mainWindow) {
      mainWindow.webContents.once('did-finish-load', () => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'Cloud Mode',
          message: 'Running in Cloud Mode',
          detail: 'The desktop app is connected to the cloud server at ensemble.kyl.solutions.\n\nThis provides full functionality with real-time data.',
          buttons: ['OK']
        });
      });
    }

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      } else if (mainWindow) {
        mainWindow.show();
      }
    });

  } catch (err) {
    console.error('[Ensemble] Failed to start:', err);
    dialog.showErrorBox('Startup Error', `Failed to start Or-care-stra Ensemble: ${err.message}`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep app running in menu bar
  if (process.platform !== 'darwin') {
    isQuitting = true;
    app.quit();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  stopServer();
});

app.on('quit', () => {
  stopServer();
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[Ensemble] Uncaught exception:', err);
  dialog.showErrorBox('Error', `An unexpected error occurred: ${err.message}`);
});

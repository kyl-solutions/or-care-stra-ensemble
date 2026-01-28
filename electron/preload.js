/**
 * Or-care-stra Ensemble Desktop App - Preload Script
 *
 * Secure bridge between the web app and Electron APIs.
 * Runs in the renderer process before web content loads.
 */

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  isElectron: true,
  platform: process.platform,
  appVersion: process.env.npm_package_version || '1.0.0',
  appName: 'Or-care-stra Ensemble',

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  toggleCollapse: () => ipcRenderer.send('toggle-collapse'),

  // Get window state
  getWindowState: () => ipcRenderer.invoke('get-window-state'),

  // Listen for collapse state changes
  onCollapseState: (callback) => {
    ipcRenderer.on('collapse-state', (event, isCollapsed) => callback(isCollapsed));
  },

  // System notifications
  showNotification: (title, body) => {
    ipcRenderer.send('show-notification', { title, body });
  },

  // File dialogs
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),

  // Database backup
  backupDatabase: () => ipcRenderer.invoke('backup-database'),
  restoreDatabase: (filePath) => ipcRenderer.invoke('restore-database', filePath),

  // App events
  onServerStatus: (callback) => {
    ipcRenderer.on('server-status', (event, status) => callback(status));
  },

  // Remove listener
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// Log that we're running in Electron
console.log('[Ensemble] Running in Electron desktop mode');
console.log('[Ensemble] Platform:', process.platform);

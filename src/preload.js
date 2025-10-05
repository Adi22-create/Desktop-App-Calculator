const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // App state management
  getAppState: () => ipcRenderer.invoke('get-app-state'),
  saveAppState: (state) => ipcRenderer.invoke('save-app-state', state),
  
  // CSV file operations
  readCSVFile: (filename) => ipcRenderer.invoke('read-csv-file', filename),
  writeCSVFile: (filename, data) => ipcRenderer.invoke('write-csv-file', filename, data),
  checkFileExists: (filename) => ipcRenderer.invoke('check-file-exists', filename),
  
  // Dialog operations
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showOpenDialog: (options) => ipcRenderer.invoke('show-open-dialog', options),
  
  // Utility functions
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// DOM Content Loaded event
window.addEventListener('DOMContentLoaded', () => {
  // Any initialization code for the renderer process
  console.log('Preload script loaded successfully');
});
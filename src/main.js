const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const fs = require('fs');

const __dirname = __dirname;

// Initialize electron store for state persistence
const store = new Store();

let mainWindow;

function createWindow() {
  // Get saved window state or use defaults
  const windowState = store.get('windowState', {
    width: 1200,
    height: 800,
    x: undefined,
    y: undefined,
    maximized: false
  });

  mainWindow = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    x: windowState.x,
    y: windowState.y,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: add app icon
    show: false // Don't show until ready
  });

  // Load the HTML file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Restore maximized state
    if (windowState.maximized) {
      mainWindow.maximize();
    }
  });

  // Save window state on close
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    const isMaximized = mainWindow.isMaximized();
    
    store.set('windowState', {
      ...bounds,
      maximized: isMaximized
    });
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  
  // Initialize data directory
  initializeDataDirectory();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Initialize data directory and CSV files
function initializeDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data');
  const backupDir = path.join(dataDir, 'backup');
  
  // Create directories if they don't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // Initialize CSV files with headers if they don't exist
  const csvFiles = {
    'projects.csv': 'Project Name,Description\n',
    'resources.csv': 'Resource Name,Assigned Projects,Description\n',
    'productivity.csv': 'Project Name,Productivity Value,Rate\n',
    'master.csv': 'Project,Resource,Productivity,Rate,Description\n',
    'calculator_history.csv': 'Timestamp,Project,Resource,Productivity,Transactions,Rate,Total\n'
  };
  
  Object.entries(csvFiles).forEach(([filename, headers]) => {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, headers, 'utf8');
    }
  });
}

// IPC Handlers for CSV operations
ipcMain.handle('get-app-state', () => {
  return {
    lastActiveTab: store.get('lastActiveTab', 'projects'),
    dataPath: path.join(process.cwd(), 'data')
  };
});

ipcMain.handle('save-app-state', (event, state) => {
  store.set('lastActiveTab', state.lastActiveTab);
  return true;
});

ipcMain.handle('read-csv-file', async (event, filename) => {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-csv-file', async (event, filename, data) => {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    
    // Create backup before writing
    const backupPath = path.join(process.cwd(), 'data', 'backup', `${Date.now()}_${filename}`);
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
    }
    
    fs.writeFileSync(filePath, data, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-file-exists', async (event, filename) => {
  try {
    const filePath = path.join(process.cwd(), 'data', filename);
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
});

ipcMain.handle('show-save-dialog', async (event, options) => {
  const { dialog } = await import('electron');
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-open-dialog', async (event, options) => {
  const { dialog } = await import('electron');
  const result = await dialog.showOpenDialog(mainWindow, options);
  return result;
});
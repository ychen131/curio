import { app, BrowserWindow, ipcMain, nativeTheme, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

interface ThemeResponse {
  success: boolean;
  theme: string;
}

function getPreloadPath(): string {
  // If running from dist, use dist/preload.js; otherwise, use src/preload.js
  if (__dirname.endsWith('dist')) {
    return path.join(__dirname, 'preload.js');
  } else {
    return path.join(__dirname, '../src/preload.js');
  }
}

function createWindow(): void {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getPreloadPath(),
    },
    show: false, // Don't show until ready
    titleBarStyle: 'hiddenInset', // Native macOS title bar
    vibrancy: 'sidebar', // macOS vibrancy effect
    backgroundColor: '#ffffff',
  });

  // Load the index.html file
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    if (mainWindow) {
      mainWindow.show();
    }
  });

  // Open DevTools in development
  if (process.env['NODE_ENV'] === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle('get-theme', (): string => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

ipcMain.handle('set-theme', (_event: IpcMainInvokeEvent, theme: string): ThemeResponse => {
  // For now, just return success - theme switching will be implemented later
  return { success: true, theme };
});

ipcMain.handle('app:getVersion', (): string => {
  return app.getVersion();
});

ipcMain.handle('app:getPlatform', (): string => {
  return process.platform;
});

// Placeholder handlers for future implementation
ipcMain.handle('dialog:openFile', (): null => {
  // Will be implemented later
  return null;
});

ipcMain.handle('dialog:saveFile', (_event: IpcMainInvokeEvent, _data: any): null => {
  // Will be implemented later
  return null;
});

ipcMain.handle(
  'db:operation',
  (_event: IpcMainInvokeEvent, _operation: string, _data: any): null => {
    // Will be implemented later
    return null;
  },
);

// Listen for system theme changes and notify renderer
nativeTheme.on('updated', () => {
  if (mainWindow && mainWindow.webContents) {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mainWindow.webContents.send('theme-updated', theme);
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  // On macOS it is common for applications to stay open until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (_event, contents) => {
  contents.on('new-window', (event, _navigationUrl) => {
    event.preventDefault();
  });
});

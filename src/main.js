const { app, BrowserWindow, ipcMain, nativeTheme } = require("electron");
const path = require("path");

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, "preload.js"),
    },
    show: false, // Don't show until ready
    titleBarStyle: "hiddenInset", // Native macOS title bar
    vibrancy: "sidebar", // macOS vibrancy effect
    backgroundColor: "#ffffff",
  });

  // Load the index.html file
  mainWindow.loadFile("src/index.html");

  // Show window when ready to prevent visual flash
  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closed
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// IPC Handlers
ipcMain.handle("get-theme", () => {
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
});

ipcMain.handle("set-theme", (event, theme) => {
  // For now, just return success - theme switching will be implemented later
  return { success: true, theme };
});

ipcMain.handle("app:getVersion", () => {
  return app.getVersion();
});

ipcMain.handle("app:getPlatform", () => {
  return process.platform;
});

// Placeholder handlers for future implementation
ipcMain.handle("dialog:openFile", () => {
  // Will be implemented later
  return null;
});

ipcMain.handle("dialog:saveFile", (event, data) => {
  // Will be implemented later
  return null;
});

ipcMain.handle("db:operation", (event, operation, data) => {
  // Will be implemented later
  return null;
});

// This method will be called when Electron has finished initialization
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on("window-all-closed", () => {
  // On macOS it is common for applications to stay open until explicitly quit
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window when the dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on("web-contents-created", (event, contents) => {
  contents.on("new-window", (event, navigationUrl) => {
    event.preventDefault();
  });
});

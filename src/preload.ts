import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Theme management
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme: string) => ipcRenderer.invoke('set-theme', theme),

  // Listen for theme changes
  onThemeUpdated: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme-updated', (_event, theme) => callback(theme));
  },

  // File operations (for future use)
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: any) => ipcRenderer.invoke('dialog:saveFile', data),

  // Database operations (for future use)
  dbOperation: (operation: string, data: any) =>
    ipcRenderer.invoke('db:operation', operation, data),

  // Database test function
  testDatabase: () => ipcRenderer.invoke('db:test'),

  // OpenAI test function
  testOpenAI: () => ipcRenderer.invoke('openai:test'),

  // TEMPORARY: CRUD test panel
  createContent: (doc: any) => ipcRenderer.invoke('db:createContent', doc),
  getAllContent: () => ipcRenderer.invoke('db:getAllContent'),
  updateContent: (doc: any) => ipcRenderer.invoke('db:updateContent', doc),
  deleteContent: (id: string) => ipcRenderer.invoke('db:deleteContent', id),

  // App information
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
});

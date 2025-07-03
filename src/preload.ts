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

  // Learning request operations
  createLearningRequest: (doc: any) => ipcRenderer.invoke('db:createLearningRequest', doc),
  getAllLearningRequests: () => ipcRenderer.invoke('db:getAllLearningRequests'),

  // Lesson planner agent
  invokeLessonPlanner: (learningRequest: any) =>
    ipcRenderer.invoke('invoke-lesson-planner', learningRequest),

  // App information
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),

  // Securely expose OpenAI API key to renderer
  getOpenAIKey: () => ipcRenderer.invoke('getOpenAIKey'),

  // Secure storage methods
  setSecureValue: (key: string, value: string) =>
    ipcRenderer.invoke('secure-storage:set', key, value),
  getSecureValue: (key: string) => ipcRenderer.invoke('secure-storage:get', key),
  hasSecureValue: (key: string) => ipcRenderer.invoke('secure-storage:has', key),
  deleteSecureValue: (key: string) => ipcRenderer.invoke('secure-storage:delete', key),
  getSecureKeys: () => ipcRenderer.invoke('secure-storage:keys'),
  clearSecureStorage: () => ipcRenderer.invoke('secure-storage:clear'),

  // LangSmith status
  getLangSmithStatus: () => ipcRenderer.invoke('langsmith:status'),
  getLangSmithConfig: () => ipcRenderer.invoke('langsmith:config'),
});

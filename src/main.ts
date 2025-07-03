import { config } from 'dotenv';

// Load environment variables from .env file FIRST, before any other imports
config();

import { app, BrowserWindow, ipcMain, nativeTheme, IpcMainInvokeEvent } from 'electron';
import * as path from 'path';
import { initializeDatabases, closeDatabases } from './services/database';
import { createContent, getAllContent, updateContent, deleteContent } from './services/database';
import {
  createLearningRequest,
  getAllLearningRequests,
  deleteLearningRequest,
} from './services/database';
import {
  createLessonPlan,
  getAllLessonPlans,
  getLessonPlan,
  getLessonPlansByLearningRequestId,
  deleteLessonPlan,
  updateLessonPlan,
} from './services/database';
import { secureStorage } from './utils/secure-storage';
import { langSmithService } from './services/langsmith';
import { lessonPlannerAgent } from './agents/lessonPlanner';
import { LearningRequestDoc } from './services/schemas';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;

interface ThemeResponse {
  success: boolean;
  theme: string;
}

function getPreloadPath(): string {
  // Use the correct path for the built preload script
  return path.join(__dirname, 'preload.js');
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
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

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

ipcMain.handle('getOpenAIKey', (): string | null => {
  return process.env['OPENAI_API_KEY'] || null;
});

// LangSmith status handler
ipcMain.handle('langsmith:status', () => {
  return {
    isReady: langSmithService.isReady(),
    project: langSmithService.getClient() ? 'curio' : null,
  };
});

// LangSmith config handler
ipcMain.handle('langsmith:config', () => {
  return {
    apiKey: process.env['LANGSMITH_API_KEY'],
    project: process.env['LANGSMITH_PROJECT'] || 'curio',
    tracing: process.env['LANGSMITH_TRACING'] === 'true',
    endpoint: process.env['LANGSMITH_ENDPOINT'] || 'https://api.smith.langchain.com',
  };
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

// Database test handler
ipcMain.handle('db:test', async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { getDatabaseInfo, DB_NAMES } = await import('./services/database');
    const info = await getDatabaseInfo(DB_NAMES.CONTENT);
    return {
      success: true,
      message: `Database test successful! Content DB has ${info.doc_count} documents.`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
});

// OpenAI integration test handler
ipcMain.handle('openai:test', async (): Promise<{ success: boolean; message: string }> => {
  try {
    const { testOpenAIIntegration } = await import('./services/test-openai-integration');
    await testOpenAIIntegration();
    return {
      success: true,
      message: 'OpenAI integration test completed successfully! Check console for details.',
    };
  } catch (error) {
    return {
      success: false,
      message: `OpenAI test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
});

// TEMPORARY: CRUD test panel handlers
ipcMain.handle('db:createContent', async (_event, doc) => {
  return await createContent(doc);
});
ipcMain.handle('db:getAllContent', async () => {
  return await getAllContent();
});
ipcMain.handle('db:updateContent', async (_event, doc) => {
  return await updateContent(doc);
});
ipcMain.handle('db:deleteContent', async (_event, id) => {
  return await deleteContent(id);
});

// Learning request handlers
ipcMain.handle('db:createLearningRequest', async (_event, doc) => {
  return await createLearningRequest(doc);
});
ipcMain.handle('db:getAllLearningRequests', async () => {
  return await getAllLearningRequests();
});
ipcMain.handle('db:deleteLearningRequest', async (_event, id) => {
  try {
    // First, find and delete any associated lesson plans
    const lessonPlans = await getLessonPlansByLearningRequestId(id);
    for (const lessonPlan of lessonPlans) {
      await deleteLessonPlan(lessonPlan._id);
    }

    // Then delete the learning request itself
    const result = await deleteLearningRequest(id);

    console.log(`Deleted learning request ${id} and ${lessonPlans.length} associated lesson plans`);
    return result;
  } catch (error) {
    console.error('Failed to delete learning request and associated data:', error);
    throw error;
  }
});

// Lesson plan handlers
ipcMain.handle('db:createLessonPlan', async (_event, doc) => {
  return await createLessonPlan(doc);
});
ipcMain.handle('db:getAllLessonPlans', async () => {
  return await getAllLessonPlans();
});
ipcMain.handle('db:getLessonPlan', async (_event, id) => {
  return await getLessonPlan(id);
});
ipcMain.handle('db:getLessonPlansByLearningRequestId', async (_event, learningRequestId) => {
  return await getLessonPlansByLearningRequestId(learningRequestId);
});
ipcMain.handle('db:updateLessonPlan', async (_event, doc) => {
  return await updateLessonPlan(doc);
});

// Lesson planner agent handler
ipcMain.handle('invoke-lesson-planner', async (_event, learningRequest: LearningRequestDoc) => {
  try {
    console.log('Received lesson planner request:', learningRequest);

    // Execute the agent with the learning request
    const result = await lessonPlannerAgent.invoke({
      learningRequest,
      searchQuery: '',
      searchResults: [],
      curatedPlan: [],
    });

    console.log('Agent execution completed:', result);

    // Return both success status and the lesson plan document
    return {
      success: true,
      lessonPlan: result.curatedPlan, // The curated resources from the agent
      learningRequestId: learningRequest._id,
    };
  } catch (error) {
    console.error('Agent execution failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

// Secure storage IPC handlers
ipcMain.handle(
  'secure-storage:set',
  async (_event: IpcMainInvokeEvent, key: string, value: string) => {
    try {
      await secureStorage.set(key, value);
    } catch (error) {
      console.error('Failed to set secure value:', error);
      throw error;
    }
  },
);

ipcMain.handle('secure-storage:get', async (_event: IpcMainInvokeEvent, key: string) => {
  try {
    return await secureStorage.get(key);
  } catch (error) {
    console.error('Failed to get secure value:', error);
    return null;
  }
});

ipcMain.handle('secure-storage:has', async (_event: IpcMainInvokeEvent, key: string) => {
  try {
    return await secureStorage.has(key);
  } catch (error) {
    console.error('Failed to check secure value:', error);
    return false;
  }
});

ipcMain.handle('secure-storage:delete', async (_event: IpcMainInvokeEvent, key: string) => {
  try {
    return await secureStorage.delete(key);
  } catch (error) {
    console.error('Failed to delete secure value:', error);
    return false;
  }
});

ipcMain.handle('secure-storage:keys', async () => {
  try {
    return await secureStorage.keys();
  } catch (error) {
    console.error('Failed to get secure keys:', error);
    return [];
  }
});

ipcMain.handle('secure-storage:clear', async () => {
  try {
    await secureStorage.clear();
  } catch (error) {
    console.error('Failed to clear secure storage:', error);
    throw error;
  }
});

// Listen for system theme changes and notify renderer
nativeTheme.on('updated', () => {
  if (mainWindow && mainWindow.webContents) {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    mainWindow.webContents.send('theme-updated', theme);
  }
});

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
  try {
    // Initialize databases before creating the window
    await initializeDatabases();
    console.log('Databases initialized successfully');

    // Initialize LangSmith service
    await langSmithService.initialize();
    console.log('LangSmith service initialized');

    // Auto-populate secure storage with API key from .env if not already set
    const envKey = process.env['OPENAI_API_KEY'];
    if (envKey) {
      const hasKey = await secureStorage.has('openai_api_key');
      if (!hasKey) {
        await secureStorage.set(
          'openai_api_key',
          JSON.stringify({
            key: envKey,
            name: 'OpenAI API Key',
            description: 'API key for OpenAI services',
            createdAt: new Date(),
          }),
        );
        console.log('Populated secure storage with API key from .env');
      }
    }
  } catch (error) {
    console.error('Failed to initialize services:', error);
  }

  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', async () => {
  // Close database connections before quitting
  try {
    await closeDatabases();
  } catch (error) {
    console.error('Error closing databases:', error);
  }

  // Shutdown LangSmith service
  try {
    await langSmithService.shutdown();
  } catch (error) {
    console.error('Error shutting down LangSmith:', error);
  }

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

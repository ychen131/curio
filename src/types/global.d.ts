export {};

declare global {
  interface Window {
    electronAPI: {
      getOpenAIKey: () => Promise<string | null>;
      getTheme: () => Promise<string>;
      setTheme: (theme: string) => Promise<{ success: boolean; theme: string }>;
      onThemeUpdated: (callback: (theme: string) => void) => void;
      openFile: () => Promise<any>;
      saveFile: (data: any) => Promise<any>;
      dbOperation: (operation: string, data: any) => Promise<any>;
      testDatabase: () => Promise<{ success: boolean; message: string }>;
      testOpenAI: () => Promise<{ success: boolean; message: string }>;
      createContent: (doc: any) => Promise<any>;
      getAllContent: () => Promise<any>;
      updateContent: (doc: any) => Promise<any>;
      deleteContent: (id: string) => Promise<any>;
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
    };
  }
}

// Database model types (re-exported from @/services/schemas for global use)
declare global {
  type BaseDoc = import('@/services/schemas').BaseDoc;
  type ContentDoc = import('@/services/schemas').ContentDoc;
  type ProjectDoc = import('@/services/schemas').ProjectDoc;
  type CategoryDoc = import('@/services/schemas').CategoryDoc;
  type LearningPathDoc = import('@/services/schemas').LearningPathDoc;
  type QuizDoc = import('@/services/schemas').QuizDoc;
  type QuizQuestion = import('@/services/schemas').QuizQuestion;
  type UserSettingsDoc = import('@/services/schemas').UserSettingsDoc;
}

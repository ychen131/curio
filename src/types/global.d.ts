export interface ElectronAPI {
  getTheme(): Promise<string>;
  setTheme(theme: string): Promise<{ success: boolean; theme: string }>;
  getVersion(): Promise<string>;
  getPlatform(): Promise<string>;
  onThemeUpdated(callback: (theme: string) => void): void;
  testDatabase(): Promise<{ success: boolean; message: string }>;
  // TEMPORARY: CRUD test panel
  createContent(doc: any): Promise<any>;
  getAllContent(): Promise<any[]>;
  updateContent(doc: any): Promise<any>;
  deleteContent(id: string): Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
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

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

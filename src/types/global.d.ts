export interface ElectronAPI {
  getTheme(): Promise<string>;
  setTheme(theme: string): Promise<{ success: boolean; theme: string }>;
  getVersion(): Promise<string>;
  getPlatform(): Promise<string>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

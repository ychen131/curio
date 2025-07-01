export interface ElectronAPI {
  getTheme(): Promise<string>;
  setTheme(theme: string): Promise<{ success: boolean; theme: string }>;
  getVersion(): Promise<string>;
  getPlatform(): Promise<string>;
  onThemeUpdated(callback: (theme: string) => void): void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

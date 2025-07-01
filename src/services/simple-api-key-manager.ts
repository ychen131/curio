export class SimpleAPIKeyManager {
  private static instance: SimpleAPIKeyManager;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): SimpleAPIKeyManager {
    if (!SimpleAPIKeyManager.instance) {
      SimpleAPIKeyManager.instance = new SimpleAPIKeyManager();
    }
    return SimpleAPIKeyManager.instance;
  }

  /**
   * Get API key from main process via preload script
   */
  async getAPIKey(): Promise<string> {
    if (this.apiKey) {
      return this.apiKey;
    }

    try {
      // Get API key from main process via preload script
      const electronAPI = (window as any).electronAPI;
      if (electronAPI && typeof electronAPI.getOpenAIKey === 'function') {
        this.apiKey = await electronAPI.getOpenAIKey();
        return this.apiKey || '';
      } else {
        console.warn('electronAPI.getOpenAIKey not available');
        return '';
      }
    } catch (error) {
      console.error('Failed to get API key:', error);
      return '';
    }
  }

  /**
   * Set API key in memory
   */
  setAPIKey(key: string): void {
    this.apiKey = key;
  }

  /**
   * Clear API key from memory
   */
  clearAPIKey(): void {
    this.apiKey = null;
  }

  /**
   * Check if API key exists
   */
  hasAPIKey(): boolean {
    return !!this.apiKey;
  }

  /**
   * Validate OpenAI API key format
   */
  validateOpenAIKey(apiKey: string): boolean {
    return Boolean(apiKey && apiKey.trim().length > 0 && apiKey.startsWith('sk-'));
  }
}

// Export a singleton instance
export const simpleAPIKeyManager = SimpleAPIKeyManager.getInstance();

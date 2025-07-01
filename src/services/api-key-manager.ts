import { secureStorage } from '../utils/secure-storage';

export interface APIKeyConfig {
  key: string;
  name?: string;
  description?: string;
  createdAt: Date;
  lastUsed?: Date;
}

export class APIKeyManager {
  private static readonly OPENAI_API_KEY = 'openai_api_key';
  private static readonly API_KEYS_PREFIX = 'api_keys_';
  private static instance: APIKeyManager;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): APIKeyManager {
    if (!APIKeyManager.instance) {
      APIKeyManager.instance = new APIKeyManager();
    }
    return APIKeyManager.instance;
  }

  /**
   * Store OpenAI API key securely
   */
  async setOpenAIKey(apiKey: string): Promise<void> {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }

    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format. Must start with "sk-"');
    }

    const config: APIKeyConfig = {
      key: apiKey,
      name: 'OpenAI API Key',
      description: 'API key for OpenAI services',
      createdAt: new Date(),
    };

    await secureStorage.set(APIKeyManager.OPENAI_API_KEY, JSON.stringify(config));
  }

  /**
   * Get OpenAI API key
   */
  async getOpenAIKey(): Promise<string | null> {
    try {
      const stored = await secureStorage.get(APIKeyManager.OPENAI_API_KEY);
      if (!stored) {
        return null;
      }

      const config: APIKeyConfig = JSON.parse(stored);
      return config.key;
    } catch (error) {
      console.warn('Failed to retrieve OpenAI API key:', error);
      return null;
    }
  }

  /**
   * Check if OpenAI API key exists
   */
  async hasOpenAIKey(): Promise<boolean> {
    return await secureStorage.has(APIKeyManager.OPENAI_API_KEY);
  }

  /**
   * Remove OpenAI API key
   */
  async removeOpenAIKey(): Promise<boolean> {
    return await secureStorage.delete(APIKeyManager.OPENAI_API_KEY);
  }

  /**
   * Store a custom API key
   */
  async setCustomKey(
    keyName: string,
    apiKey: string,
    config?: Partial<APIKeyConfig>,
  ): Promise<void> {
    if (!keyName || keyName.trim().length === 0) {
      throw new Error('Key name cannot be empty');
    }

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }

    const keyConfig: APIKeyConfig = {
      key: apiKey,
      name: config?.name || keyName,
      description: config?.description || `API key for ${keyName}`,
      createdAt: config?.createdAt || new Date(),
      ...(config?.lastUsed && { lastUsed: config.lastUsed }),
    };

    const storageKey = `${APIKeyManager.API_KEYS_PREFIX}${keyName}`;
    await secureStorage.set(storageKey, JSON.stringify(keyConfig));
  }

  /**
   * Get a custom API key
   */
  async getCustomKey(keyName: string): Promise<string | null> {
    try {
      const storageKey = `${APIKeyManager.API_KEYS_PREFIX}${keyName}`;
      const stored = await secureStorage.get(storageKey);

      if (!stored) {
        return null;
      }

      const config: APIKeyConfig = JSON.parse(stored);
      return config.key;
    } catch (error) {
      console.warn(`Failed to retrieve API key '${keyName}':`, error);
      return null;
    }
  }

  /**
   * Get API key configuration
   */
  async getKeyConfig(keyName: string): Promise<APIKeyConfig | null> {
    try {
      const storageKey =
        keyName === 'openai'
          ? APIKeyManager.OPENAI_API_KEY
          : `${APIKeyManager.API_KEYS_PREFIX}${keyName}`;

      const stored = await secureStorage.get(storageKey);

      if (!stored) {
        return null;
      }

      return JSON.parse(stored);
    } catch (error) {
      console.warn(`Failed to retrieve API key config '${keyName}':`, error);
      return null;
    }
  }

  /**
   * Update last used timestamp for an API key
   */
  async updateLastUsed(keyName: string): Promise<void> {
    try {
      const config = await this.getKeyConfig(keyName);
      if (config) {
        config.lastUsed = new Date();

        const storageKey =
          keyName === 'openai'
            ? APIKeyManager.OPENAI_API_KEY
            : `${APIKeyManager.API_KEYS_PREFIX}${keyName}`;

        await secureStorage.set(storageKey, JSON.stringify(config));
      }
    } catch (error) {
      console.warn(`Failed to update last used for '${keyName}':`, error);
    }
  }

  /**
   * List all stored API keys (without revealing the actual keys)
   */
  async listKeys(): Promise<
    Array<{ name: string; description?: string; createdAt: Date; lastUsed?: Date }>
  > {
    try {
      const keys = await secureStorage.keys();
      const keyList: Array<{
        name: string;
        description?: string;
        createdAt: Date;
        lastUsed?: Date;
      }> = [];

      for (const key of keys) {
        if (key === APIKeyManager.OPENAI_API_KEY) {
          const config = await this.getKeyConfig('openai');
          if (config) {
            keyList.push({
              name: 'OpenAI',
              ...(config.description && { description: config.description }),
              createdAt: config.createdAt,
              ...(config.lastUsed && { lastUsed: config.lastUsed }),
            });
          }
        } else if (key.startsWith(APIKeyManager.API_KEYS_PREFIX)) {
          const keyName = key.replace(APIKeyManager.API_KEYS_PREFIX, '');
          const config = await this.getKeyConfig(keyName);
          if (config) {
            keyList.push({
              name: config.name || keyName,
              ...(config.description && { description: config.description }),
              createdAt: config.createdAt,
              ...(config.lastUsed && { lastUsed: config.lastUsed }),
            });
          }
        }
      }

      return keyList;
    } catch (error) {
      console.warn('Failed to list API keys:', error);
      return [];
    }
  }

  /**
   * Remove a custom API key
   */
  async removeCustomKey(keyName: string): Promise<boolean> {
    const storageKey = `${APIKeyManager.API_KEYS_PREFIX}${keyName}`;
    return await secureStorage.delete(storageKey);
  }

  /**
   * Clear all stored API keys
   */
  async clearAllKeys(): Promise<void> {
    await secureStorage.clear();
  }

  /**
   * Validate API key format
   */
  validateOpenAIKey(apiKey: string): boolean {
    return Boolean(apiKey && apiKey.trim().length > 0 && apiKey.startsWith('sk-'));
  }

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

  setAPIKey(key: string): void {
    this.apiKey = key;
  }

  clearAPIKey(): void {
    this.apiKey = null;
  }

  hasAPIKey(): boolean {
    return !!this.apiKey;
  }
}

// Export a singleton instance
export const apiKeyManager = APIKeyManager.getInstance();

export interface APIKeyConfig {
  key: string;
  name?: string;
  description?: string;
  createdAt: Date;
  lastUsed?: Date;
}

export class RendererAPIKeyManager {
  private static readonly OPENAI_API_KEY = 'openai_api_key';
  private static readonly API_KEYS_PREFIX = 'api_keys_';
  private static instance: RendererAPIKeyManager;
  private apiKey: string | null = null;

  private constructor() {}

  static getInstance(): RendererAPIKeyManager {
    if (!RendererAPIKeyManager.instance) {
      RendererAPIKeyManager.instance = new RendererAPIKeyManager();
    }
    return RendererAPIKeyManager.instance;
  }

  /**
   * Store OpenAI API key securely via IPC
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

    await (window as any).electronAPI.setSecureValue(
      RendererAPIKeyManager.OPENAI_API_KEY,
      JSON.stringify(config),
    );
  }

  /**
   * Get OpenAI API key via IPC
   */
  async getOpenAIKey(): Promise<string | null> {
    try {
      const stored = await (window as any).electronAPI.getSecureValue(
        RendererAPIKeyManager.OPENAI_API_KEY,
      );
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
   * Check if OpenAI API key exists via IPC
   */
  async hasOpenAIKey(): Promise<boolean> {
    try {
      return await (window as any).electronAPI.hasSecureValue(RendererAPIKeyManager.OPENAI_API_KEY);
    } catch (error) {
      console.warn('Failed to check OpenAI API key existence:', error);
      return false;
    }
  }

  /**
   * Remove OpenAI API key via IPC
   */
  async removeOpenAIKey(): Promise<boolean> {
    try {
      return await (window as any).electronAPI.deleteSecureValue(
        RendererAPIKeyManager.OPENAI_API_KEY,
      );
    } catch (error) {
      console.warn('Failed to remove OpenAI API key:', error);
      return false;
    }
  }

  /**
   * Store a custom API key via IPC
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

    const storageKey = `${RendererAPIKeyManager.API_KEYS_PREFIX}${keyName}`;
    await (window as any).electronAPI.setSecureValue(storageKey, JSON.stringify(keyConfig));
  }

  /**
   * Get a custom API key via IPC
   */
  async getCustomKey(keyName: string): Promise<string | null> {
    try {
      const storageKey = `${RendererAPIKeyManager.API_KEYS_PREFIX}${keyName}`;
      const stored = await (window as any).electronAPI.getSecureValue(storageKey);

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
   * Get API key configuration via IPC
   */
  async getKeyConfig(keyName: string): Promise<APIKeyConfig | null> {
    try {
      const storageKey =
        keyName === 'openai'
          ? RendererAPIKeyManager.OPENAI_API_KEY
          : `${RendererAPIKeyManager.API_KEYS_PREFIX}${keyName}`;

      const stored = await (window as any).electronAPI.getSecureValue(storageKey);

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
   * Update last used timestamp for an API key via IPC
   */
  async updateLastUsed(keyName: string): Promise<void> {
    try {
      const config = await this.getKeyConfig(keyName);
      if (config) {
        config.lastUsed = new Date();

        const storageKey =
          keyName === 'openai'
            ? RendererAPIKeyManager.OPENAI_API_KEY
            : `${RendererAPIKeyManager.API_KEYS_PREFIX}${keyName}`;

        await (window as any).electronAPI.setSecureValue(storageKey, JSON.stringify(config));
      }
    } catch (error) {
      console.warn(`Failed to update last used for '${keyName}':`, error);
    }
  }

  /**
   * List all stored API keys via IPC
   */
  async listKeys(): Promise<
    Array<{ name: string; description?: string; createdAt: Date; lastUsed?: Date }>
  > {
    try {
      const keys = await (window as any).electronAPI.getSecureKeys();
      const keyList: Array<{
        name: string;
        description?: string;
        createdAt: Date;
        lastUsed?: Date;
      }> = [];

      for (const key of keys) {
        if (key === RendererAPIKeyManager.OPENAI_API_KEY) {
          const config = await this.getKeyConfig('openai');
          if (config) {
            keyList.push({
              name: 'OpenAI',
              ...(config.description && { description: config.description }),
              createdAt: config.createdAt,
              ...(config.lastUsed && { lastUsed: config.lastUsed }),
            });
          }
        } else if (key.startsWith(RendererAPIKeyManager.API_KEYS_PREFIX)) {
          const keyName = key.replace(RendererAPIKeyManager.API_KEYS_PREFIX, '');
          const config = await this.getKeyConfig(keyName);
          if (config) {
            keyList.push({
              name: keyName,
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
   * Remove a custom API key via IPC
   */
  async removeCustomKey(keyName: string): Promise<boolean> {
    try {
      const storageKey = `${RendererAPIKeyManager.API_KEYS_PREFIX}${keyName}`;
      return await (window as any).electronAPI.deleteSecureValue(storageKey);
    } catch (error) {
      console.warn(`Failed to remove API key '${keyName}':`, error);
      return false;
    }
  }

  /**
   * Clear all stored API keys via IPC
   */
  async clearAllKeys(): Promise<void> {
    try {
      await (window as any).electronAPI.clearSecureStorage();
    } catch (error) {
      throw new Error(`Failed to clear all API keys: ${error}`);
    }
  }

  /**
   * Validate OpenAI API key format
   */
  validateOpenAIKey(apiKey: string): boolean {
    return Boolean(apiKey && apiKey.startsWith('sk-') && apiKey.length > 10);
  }

  /**
   * Get API key (for backward compatibility)
   */
  async getAPIKey(): Promise<string> {
    const key = await this.getOpenAIKey();
    if (!key) {
      throw new Error('OpenAI API key not found. Please set your API key first.');
    }
    return key;
  }

  /**
   * Set API key (for backward compatibility)
   */
  setAPIKey(key: string): void {
    // This is a synchronous method for backward compatibility
    // In the renderer, we need to handle this asynchronously
    this.setOpenAIKey(key).catch(console.error);
  }

  /**
   * Clear API key (for backward compatibility)
   */
  clearAPIKey(): void {
    this.removeOpenAIKey().catch(console.error);
  }

  /**
   * Check if API key exists (for backward compatibility)
   */
  hasAPIKey(): boolean {
    // This is a synchronous method for backward compatibility
    // In the renderer, we need to handle this asynchronously
    return this.apiKey !== null;
  }
}

// Export a singleton instance
export const rendererAPIKeyManager = RendererAPIKeyManager.getInstance();

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

export interface SecureStorageConfig {
  storagePath?: string;
}

export class SecureStorage {
  private storagePath: string;
  private isInitialized: boolean = false;

  constructor(config: SecureStorageConfig = {}) {
    this.storagePath = config.storagePath || this.getDefaultStoragePath();
  }

  /**
   * Initialize secure storage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Ensure storage directory exists
      await this.ensureStorageDirectory();
      this.isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize secure storage: ${error}`);
    }
  }

  /**
   * Store a value securely
   */
  async set(key: string, value: string): Promise<void> {
    await this.initialize();

    try {
      // Simple base64 encoding for now - can be enhanced with proper encryption later
      const encodedValue = Buffer.from(value, 'utf8').toString('base64');
      const data = {
        value: encodedValue,
        timestamp: Date.now(),
      };

      const filePath = this.getFilePath(key);
      await fs.promises.writeFile(filePath, JSON.stringify(data), 'utf8');
    } catch (error) {
      throw new Error(`Failed to store value for key '${key}': ${error}`);
    }
  }

  /**
   * Retrieve a value securely
   */
  async get(key: string): Promise<string | null> {
    await this.initialize();

    try {
      const filePath = this.getFilePath(key);

      if (!fs.existsSync(filePath)) {
        return null;
      }

      const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'));
      return Buffer.from(data.value, 'base64').toString('utf8');
    } catch (error) {
      console.warn(`Failed to retrieve value for key '${key}': ${error}`);
      return null;
    }
  }

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    await this.initialize();

    try {
      const filePath = this.getFilePath(key);
      return fs.existsSync(filePath);
    } catch (error) {
      return false;
    }
  }

  /**
   * Delete a stored value
   */
  async delete(key: string): Promise<boolean> {
    await this.initialize();

    try {
      const filePath = this.getFilePath(key);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }

      return false;
    } catch (error) {
      console.warn(`Failed to delete value for key '${key}': ${error}`);
      return false;
    }
  }

  /**
   * Clear all stored values
   */
  async clear(): Promise<void> {
    await this.initialize();

    try {
      const files = await fs.promises.readdir(this.storagePath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          await fs.promises.unlink(path.join(this.storagePath, file));
        }
      }
    } catch (error) {
      throw new Error(`Failed to clear secure storage: ${error}`);
    }
  }

  /**
   * Get all stored keys
   */
  async keys(): Promise<string[]> {
    await this.initialize();

    try {
      const files = await fs.promises.readdir(this.storagePath);
      return files
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }

  /**
   * Get the default storage path
   */
  private getDefaultStoragePath(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'secure-storage');
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDirectory(): Promise<void> {
    if (!fs.existsSync(this.storagePath)) {
      await fs.promises.mkdir(this.storagePath, { recursive: true });
    }
  }

  /**
   * Get file path for a key
   */
  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(this.storagePath, `${safeKey}.json`);
  }
}

// Export a singleton instance
export const secureStorage = new SecureStorage();

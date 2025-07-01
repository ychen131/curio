import { simpleAPIKeyManager } from './simple-api-key-manager';

/**
 * Initialize the API key from environment variable
 * This should be called during app startup
 */
export async function initializeAPIKey(): Promise<void> {
  try {
    // Try to get API key from environment variable via IPC
    const apiKey = await (window as any).electronAPI?.getOpenAIKey();

    if (apiKey && simpleAPIKeyManager.validateOpenAIKey(apiKey)) {
      // Store the API key in the manager
      simpleAPIKeyManager.setAPIKey(apiKey);
      console.log('API key initialized successfully');
    } else {
      console.warn('No valid API key found in environment');
    }
  } catch (error) {
    console.error('Failed to initialize API key:', error);
  }
}

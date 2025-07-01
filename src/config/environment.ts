// import * as dotenv from 'dotenv';

// Remove dotenv.config();

export interface EnvironmentConfig {
  // OpenAI Configuration
  openai: {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };

  // Application Configuration
  app: {
    name: string;
    version: string;
    environment: string;
  };

  // Feature Flags
  features: {
    enableAI: boolean;
    enableStreaming: boolean;
    enableOfflineMode: boolean;
  };
}

function isRenderer(): boolean {
  return typeof window !== 'undefined' && typeof window.process === 'undefined';
}

async function getEnvVarAsync(key: string, fallback: string = ''): Promise<string> {
  if (isRenderer()) {
    // In renderer process, try to get from electronAPI
    if (key === 'OPENAI_API_KEY') {
      try {
        // Use type assertion to access electronAPI
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && typeof electronAPI.getOpenAIKey === 'function') {
          const result = await electronAPI.getOpenAIKey();
          return result || fallback;
        }
      } catch (error) {
        console.warn('Failed to get OpenAI API key from electronAPI:', error);
      }
    }
    // For other vars, fallback to injected (if any)
    return (window as any)[key] || fallback;
  } else {
    // In main process, use process.env
    return process.env[key] || fallback;
  }
}

function getEnvVar(key: string, fallback: string = ''): string {
  if (isRenderer()) {
    // In renderer process, try to get from electronAPI
    if (key === 'OPENAI_API_KEY') {
      // For synchronous access, return empty string - will be handled by async version
      return '';
    }
    // For other vars, fallback to injected (if any)
    return (window as any)[key] || fallback;
  } else {
    // In main process, use process.env
    return process.env[key] || fallback;
  }
}

function getBoolEnvVar(key: string, fallback: boolean = false): boolean {
  const value = getEnvVar(key);
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

function getNumberEnvVar(key: string, fallback: number): number {
  const value = getEnvVar(key);
  if (value === undefined) return fallback;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Application environment configuration
 */
export const config: EnvironmentConfig = {
  openai: {
    apiKey: getEnvVar('OPENAI_API_KEY'),
    model: getEnvVar('OPENAI_MODEL', 'gpt-4o'),
    temperature: getNumberEnvVar('OPENAI_TEMPERATURE', 0.7),
    maxTokens: getNumberEnvVar('OPENAI_MAX_TOKENS', 4000),
  },

  app: {
    name: getEnvVar('APP_NAME', 'Curio'),
    version: getEnvVar('APP_VERSION', '1.0.0'),
    environment: getEnvVar('NODE_ENV', 'development'),
  },

  features: {
    enableAI: getBoolEnvVar('ENABLE_AI_FEATURES', true),
    enableStreaming: getBoolEnvVar('ENABLE_STREAMING', true),
    enableOfflineMode: getBoolEnvVar('ENABLE_OFFLINE_MODE', true),
  },
};

/**
 * Validate required configuration
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!config.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (config.openai.temperature < 0 || config.openai.temperature > 2) {
    errors.push('OPENAI_TEMPERATURE must be between 0 and 2');
  }

  if (config.openai.maxTokens <= 0) {
    errors.push('OPENAI_MAX_TOKENS must be greater than 0');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return config.features.enableAI && !!config.openai.apiKey;
}

/**
 * Get OpenAI configuration for agents
 */
export function getOpenAIConfig() {
  return {
    modelName: config.openai.model,
    temperature: config.openai.temperature,
    maxTokens: config.openai.maxTokens,
  };
}

/**
 * Get environment variable asynchronously (for renderer process)
 */
export { getEnvVarAsync };

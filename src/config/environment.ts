import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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

/**
 * Get environment variable with fallback
 */
function getEnvVar(key: string, fallback: string = ''): string {
  return process.env[key] || fallback;
}

/**
 * Get boolean environment variable
 */
function getBoolEnvVar(key: string, fallback: boolean = false): boolean {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return value.toLowerCase() === 'true';
}

/**
 * Get number environment variable
 */
function getNumberEnvVar(key: string, fallback: number): number {
  const value = process.env[key];
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
    model: getEnvVar('OPENAI_MODEL', 'gpt-4o-mini'),
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

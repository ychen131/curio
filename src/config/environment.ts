import * as dotenv from 'dotenv';

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

  // Tavily Configuration
  tavily: {
    apiKey: string;
    maxResults: number;
  };

  // LangSmith Configuration
  langsmith: {
    apiKey: string;
    project: string;
    tracing: boolean;
    endpoint: string;
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
    enableTracing: boolean;
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
    // For Tavily variables, try to get from electronAPI
    if (key.startsWith('TAVILY_')) {
      try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && typeof electronAPI.getTavilyConfig === 'function') {
          const config = await electronAPI.getTavilyConfig();
          switch (key) {
            case 'TAVILY_API_KEY':
              return config.apiKey || fallback;
            case 'TAVILY_MAX_RESULTS':
              return config.maxResults.toString() || fallback;
          }
        }
      } catch (error) {
        console.warn(`Failed to get ${key} from electronAPI:`, error);
      }
    }
    // For LangSmith variables, try to get from electronAPI
    if (key.startsWith('LANGSMITH_')) {
      try {
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && typeof electronAPI.getLangSmithConfig === 'function') {
          const config = await electronAPI.getLangSmithConfig();
          switch (key) {
            case 'LANGSMITH_API_KEY':
              return config.apiKey || fallback;
            case 'LANGSMITH_PROJECT':
              return config.project || fallback;
            case 'LANGSMITH_TRACING':
              return config.tracing ? 'true' : 'false';
            case 'LANGSMITH_ENDPOINT':
              return config.endpoint || fallback;
          }
        }
      } catch (error) {
        console.warn(`Failed to get ${key} from electronAPI:`, error);
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
    // For Tavily variables, return empty string - will be handled by async version
    if (key.startsWith('TAVILY_')) {
      return '';
    }
    // For LangSmith variables, return empty string - will be handled by async version
    if (key.startsWith('LANGSMITH_')) {
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

  tavily: {
    apiKey: getEnvVar('TAVILY_API_KEY'),
    maxResults: getNumberEnvVar('TAVILY_MAX_RESULTS', 10),
  },

  langsmith: {
    apiKey: getEnvVar('LANGSMITH_API_KEY'),
    project: getEnvVar('LANGSMITH_PROJECT', 'curio'),
    tracing: getBoolEnvVar('LANGSMITH_TRACING', false),
    endpoint: getEnvVar('LANGSMITH_ENDPOINT', 'https://api.smith.langchain.com'),
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
    enableTracing: getBoolEnvVar('LANGSMITH_TRACING', false),
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
 * Get Tavily configuration for search
 */
export function getTavilyConfig() {
  return {
    apiKey: config.tavily.apiKey,
    maxResults: config.tavily.maxResults,
  };
}

/**
 * Get LangSmith configuration for tracing
 */
export function getLangSmithConfig() {
  return {
    apiKey: config.langsmith.apiKey,
    project: config.langsmith.project,
    tracing: config.langsmith.tracing,
    endpoint: config.langsmith.endpoint,
  };
}

/**
 * Check if LangSmith tracing is enabled
 */
export function isTracingEnabled(): boolean {
  return config.features.enableTracing && !!config.langsmith.apiKey;
}

/**
 * Get environment variable asynchronously (for renderer process)
 */
export { getEnvVarAsync };

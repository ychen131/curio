import { Client } from 'langsmith';
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';
import { getLangSmithConfig } from '../config/environment';

/**
 * LangSmith service for managing tracing and observability
 */
export class LangSmithService {
  private client: Client | null = null;
  private tracer: LangChainTracer | null = null;
  private isInitialized = false;

  /**
   * Initialize LangSmith client and tracer
   */
  async initialize(): Promise<void> {
    // Check if tracing is enabled using async method
    const tracingEnabled = await this.checkTracingEnabled();
    if (!tracingEnabled) {
      console.log('LangSmith tracing is disabled');
      return;
    }

    try {
      const config = await this.getLangSmithConfigAsync();

      if (!config.apiKey) {
        console.warn('LangSmith API key not found, tracing will be disabled');
        return;
      }

      // Initialize LangSmith client
      this.client = new Client({
        apiKey: config.apiKey,
        apiUrl: config.endpoint,
      });

      // Initialize LangChain tracer
      this.tracer = new LangChainTracer({
        client: this.client,
        projectName: config.project,
      });

      this.isInitialized = true;
      console.log(`LangSmith tracing initialized for project: ${config.project}`);
    } catch (error) {
      console.error('Failed to initialize LangSmith:', error);
      this.isInitialized = false;
    }
  }

  private async checkTracingEnabled(): Promise<boolean> {
    try {
      const { getEnvVarAsync } = await import('../config/environment');
      const tracing = await getEnvVarAsync('LANGSMITH_TRACING', 'false');
      const apiKey = await getEnvVarAsync('LANGSMITH_API_KEY', '');
      return tracing === 'true' && !!apiKey;
    } catch (error) {
      console.error('Error checking tracing enabled:', error);
      return false;
    }
  }

  private async getLangSmithConfigAsync() {
    try {
      const { getEnvVarAsync } = await import('../config/environment');
      return {
        apiKey: await getEnvVarAsync('LANGSMITH_API_KEY'),
        project: await getEnvVarAsync('LANGSMITH_PROJECT', 'curio'),
        tracing: (await getEnvVarAsync('LANGSMITH_TRACING', 'false')) === 'true',
        endpoint: await getEnvVarAsync('LANGSMITH_ENDPOINT', 'https://api.smith.langchain.com'),
      };
    } catch (error) {
      console.error('Error getting LangSmith config:', error);
      return {
        apiKey: '',
        project: 'curio',
        tracing: false,
        endpoint: 'https://api.smith.langchain.com',
      };
    }
  }

  /**
   * Get the LangChain tracer instance
   */
  getTracer(): LangChainTracer | null {
    return this.tracer;
  }

  /**
   * Get the LangSmith client instance
   */
  getClient(): Client | null {
    return this.client;
  }

  /**
   * Check if LangSmith is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.tracer !== null;
  }

  /**
   * Create a new tracer instance for specific use cases
   */
  createTracer(projectName?: string): LangChainTracer | null {
    if (!this.client) {
      return null;
    }

    const config = getLangSmithConfig();
    return new LangChainTracer({
      client: this.client,
      projectName: projectName || config.project,
    });
  }

  /**
   * Get callback configuration for LangChain operations
   */
  getCallbacks(): { callbacks: LangChainTracer[] } | {} {
    if (!this.isReady()) {
      return {};
    }

    return {
      callbacks: [this.tracer!],
    };
  }

  /**
   * Shutdown LangSmith service
   */
  async shutdown(): Promise<void> {
    if (this.client) {
      try {
        // Ensure all traces are submitted before exiting
        await this.client.flush();
        console.log('LangSmith traces flushed successfully');
      } catch (error) {
        console.error('Error flushing LangSmith traces:', error);
      }
    }

    this.client = null;
    this.tracer = null;
    this.isInitialized = false;
  }
}

// Export singleton instance
export const langSmithService = new LangSmithService();

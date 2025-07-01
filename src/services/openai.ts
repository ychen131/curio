import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { AgentError, AgentErrorType } from '../agents/types';
import { config, validateConfig } from '../config/environment';

export interface OpenAIRequest {
  messages: BaseMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
}

export interface OpenAIResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason?: string;
}

export interface OpenAIError {
  type: AgentErrorType;
  message: string;
  retryable: boolean;
  retryAfter?: number;
  originalError?: Error;
}

export class OpenAIService {
  private model: ChatOpenAI;
  private isInitialized: boolean = false;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.model = new ChatOpenAI({
      modelName: config.openai.model,
      temperature: config.openai.temperature,
      maxTokens: config.openai.maxTokens,
    });
  }

  /**
   * Initialize the OpenAI service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate configuration
      validateConfig();

      // Test the connection
      await this.testConnection();

      this.isInitialized = true;
    } catch (error) {
      throw this.createServiceError(error, 'Failed to initialize OpenAI service');
    }
  }

  /**
   * Send a chat completion request
   */
  async chatCompletion(request: OpenAIRequest): Promise<OpenAIResponse> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Validate request
      this.validateRequest(request);

      // Send request with retry logic
      return await this.sendWithRetry(request);
    } catch (error) {
      throw this.createServiceError(error, 'Chat completion failed');
    }
  }

  /**
   * Send a simple text completion
   */
  async completeText(prompt: string, options?: Partial<OpenAIRequest>): Promise<string> {
    const request: OpenAIRequest = {
      messages: [new HumanMessage(prompt)],
      ...options,
    };

    const response = await this.chatCompletion(request);
    return response.content;
  }

  /**
   * Stream chat completion responses
   */
  async *streamChatCompletion(request: OpenAIRequest): AsyncGenerator<string> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      this.validateRequest(request);

      const streamingRequest = {
        ...request,
        stream: true,
      };

      // For now, we'll implement a simple streaming approach
      // In a full implementation, you'd use the actual streaming API
      const response = await this.chatCompletion(streamingRequest);

      // Simulate streaming by yielding chunks
      const chunks = response.content.split(' ');
      for (const chunk of chunks) {
        yield chunk + ' ';
        await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate delay
      }
    } catch (error) {
      throw this.createServiceError(error, 'Streaming chat completion failed');
    }
  }

  /**
   * Test the OpenAI connection
   */
  private async testConnection(): Promise<void> {
    try {
      const testRequest: OpenAIRequest = {
        messages: [new HumanMessage('Hello')],
        maxTokens: 10,
      };

      await this.model.invoke(testRequest.messages);
    } catch (error) {
      throw new Error(`OpenAI connection test failed: ${error}`);
    }
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: OpenAIRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new Error('At least one message is required');
    }

    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      throw new Error('Temperature must be between 0 and 2');
    }

    if (request.maxTokens !== undefined && request.maxTokens <= 0) {
      throw new Error('Max tokens must be greater than 0');
    }
  }

  /**
   * Send request with retry logic
   */
  private async sendWithRetry(request: OpenAIRequest): Promise<OpenAIResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.model.invoke(request.messages);

        return {
          content: response.content as string,
          model: config.openai.model,
          finishReason: 'stop',
        };
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === this.retryAttempts) {
          break;
        }

        // Wait before retrying
        const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const errorMessage = error?.message?.toLowerCase() || '';

    return (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      error?.status === 429 || // Rate limit
      error?.status === 500 || // Server error
      error?.status === 502 || // Bad gateway
      error?.status === 503 || // Service unavailable
      error?.status === 504 // Gateway timeout
    );
  }

  /**
   * Create a service error
   */
  private createServiceError(error: any, message: string): AgentError {
    let errorType = AgentErrorType.UNKNOWN_ERROR;
    let retryable = false;
    let retryAfter: number | undefined;

    if (this.isRetryableError(error)) {
      errorType = AgentErrorType.API_ERROR;
      retryable = true;
      retryAfter = 60; // 1 minute
    }

    return {
      type: errorType,
      message: message,
      originalError: error instanceof Error ? error : new Error(String(error)),
      retryable,
      ...(retryAfter !== undefined && { retryAfter }),
    };
  }

  /**
   * Get service status
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      model: config.openai.model,
      temperature: config.openai.temperature,
      maxTokens: config.openai.maxTokens,
      retryAttempts: this.retryAttempts,
    };
  }

  /**
   * Update retry configuration
   */
  setRetryConfig(attempts: number, delay: number): void {
    this.retryAttempts = attempts;
    this.retryDelay = delay;
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();

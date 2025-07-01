import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage } from '@langchain/core/messages';
import { AgentError, AgentErrorType } from '../agents/types';
import { config } from '../config/environment';
import { rendererAPIKeyManager } from './renderer-api-key-manager';
import { requestHandler } from '../utils/request-handler';
import { OpenAIRequest, OpenAIServiceResponse } from '../types/openai';

// Use imported types from ../types/openai

export class OpenAIService {
  private model: ChatOpenAI | null = null;
  private isInitialized: boolean = false;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    // Model will be initialized with the real API key in initialize()
    this.model = null;
  }

  /**
   * Initialize the OpenAI service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Always get API key from secure storage/IPC
      const apiKey = await rendererAPIKeyManager.getOpenAIKey();

      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set your API key first.');
      }

      // Update the model with the actual API key
      this.model = new ChatOpenAI({
        modelName: config.openai.model,
        temperature: config.openai.temperature,
        maxTokens: config.openai.maxTokens,
        openAIApiKey: apiKey,
      });

      // Test the connection
      await this.testConnection();

      // Update last used timestamp
      await rendererAPIKeyManager.updateLastUsed('openai');

      this.isInitialized = true;
    } catch (error) {
      throw this.createServiceError(error, 'Failed to initialize OpenAI service');
    }
  }

  /**
   * Send a chat completion request
   */
  async chatCompletion(request: OpenAIRequest): Promise<OpenAIServiceResponse> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Always get the latest API key before sending a request
      const apiKey = await rendererAPIKeyManager.getOpenAIKey();
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set your API key first.');
      }

      // Update the model with the latest API key
      this.model = new ChatOpenAI({
        modelName: config.openai.model,
        temperature: config.openai.temperature,
        maxTokens: config.openai.maxTokens,
        openAIApiKey: apiKey,
      });

      // Validate request
      this.validateRequest(request);

      // Send request with retry logic
      return await this.sendWithRetry(request);
    } catch (error) {
      throw this.createServiceError(error, 'Chat completion failed');
    }
  }

  /**
   * Set OpenAI API key
   */
  async setAPIKey(apiKey: string): Promise<void> {
    try {
      await rendererAPIKeyManager.setOpenAIKey(apiKey);

      // Re-initialize if already initialized
      if (this.isInitialized) {
        this.isInitialized = false;
        await this.initialize();
      }
    } catch (error) {
      throw this.createServiceError(error, 'Failed to set API key');
    }
  }

  /**
   * Check if API key is set
   */
  async hasAPIKey(): Promise<boolean> {
    return await rendererAPIKeyManager.hasOpenAIKey();
  }

  /**
   * Remove API key
   */
  async removeAPIKey(): Promise<boolean> {
    const removed = await rendererAPIKeyManager.removeOpenAIKey();
    if (removed) {
      this.isInitialized = false;
    }
    return removed;
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

      // Always get the latest API key before streaming
      const apiKey = await rendererAPIKeyManager.getOpenAIKey();
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please set your API key first.');
      }

      // Update the model with the latest API key
      this.model = new ChatOpenAI({
        modelName: config.openai.model,
        temperature: config.openai.temperature,
        maxTokens: config.openai.maxTokens,
        openAIApiKey: apiKey,
      });

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
   * Real streaming chat completion using OpenAI API and fetch
   */
  async *streamChatCompletionReal(request: OpenAIRequest): AsyncGenerator<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    this.validateRequest(request);

    // Always get the latest API key before streaming
    const apiKey = await rendererAPIKeyManager.getOpenAIKey();
    if (!apiKey) throw new Error('OpenAI API key not found.');

    const url = 'https://api.openai.com/v1/chat/completions';
    const body = JSON.stringify({
      model: request.model || config.openai.model,
      messages: request.messages.map((msg) => {
        const dict = msg.toDict() as any;
        // Map LangChain type to OpenAI role
        let role = dict.type;
        if (role === 'human') role = 'user';
        if (role === 'ai') role = 'assistant';
        return { role, content: dict.data.content };
      }),
      temperature: request.temperature ?? config.openai.temperature,
      max_tokens: request.maxTokens ?? config.openai.maxTokens,
      stream: true,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });

    if (!response.body) throw new Error('No response body from OpenAI API');
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let done = false;
    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      buffer += decoder.decode(value);
      let lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const data = trimmed.replace('data: ', '');
        if (data === '[DONE]') return;
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) yield content;
        } catch (e) {
          // Ignore JSON parse errors for non-data lines
        }
      }
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

      await this.model?.invoke(testRequest.messages);
    } catch (error) {
      throw new Error(`OpenAI connection test failed: ${error}`);
    }
  }

  /**
   * Validate request parameters
   */
  private validateRequest(request: OpenAIRequest): void {
    const validation = requestHandler.validateRequest(request);

    if (!validation.isValid) {
      throw new Error(`Request validation failed: ${validation.errors.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      console.warn('Request validation warnings:', validation.warnings);
    }
  }

  /**
   * Send request with retry logic
   */
  private async sendWithRetry(request: OpenAIRequest): Promise<OpenAIServiceResponse> {
    const metadata = requestHandler.createRequestMetadata();
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.model?.invoke(request.messages);

        // Calculate duration
        metadata.duration = requestHandler.calculateDuration(startTime);
        metadata.model = config.openai.model;

        // Create standardized response
        return requestHandler.createServiceResponse(response, metadata);
      } catch (error: any) {
        lastError = error;

        // Parse error using request handler
        const parsedError = requestHandler.parseError(error, metadata.requestId);

        // Check if error is retryable
        if (!requestHandler.isRetryableError(parsedError) || attempt === this.retryAttempts) {
          break;
        }

        // Wait before retrying with exponential backoff
        const delay = requestHandler.calculateRetryDelay(attempt, this.retryDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If we get here, all retries failed
    const finalError = lastError || new Error('Request failed after all retry attempts');
    const parsedError = requestHandler.parseError(finalError, metadata.requestId);
    throw this.createServiceError(parsedError, 'Request failed after all retry attempts');
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: any): boolean {
    const parsedError = requestHandler.parseError(error);
    return requestHandler.isRetryableError(parsedError);
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

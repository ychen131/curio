import {
  BaseAgent,
  AgentInput,
  AgentOutput,
  AgentConfig,
  AgentError,
  AgentErrorType,
} from './types';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage } from '@langchain/core/messages';
import { getOpenAIConfig, isAIEnabled } from '../config/environment';

export abstract class BaseAgentImpl implements BaseAgent {
  protected config: AgentConfig;
  protected model: ChatOpenAI;
  protected isInitialized: boolean = false;

  constructor(config: AgentConfig) {
    this.validateConfig(config); // Validate immediately
    this.config = config;

    // Use environment configuration if AI is enabled
    if (isAIEnabled()) {
      const openAIConfig = getOpenAIConfig();
      this.model = new ChatOpenAI({
        modelName: openAIConfig.modelName,
        temperature: openAIConfig.temperature,
        maxTokens: openAIConfig.maxTokens,
      });
    } else {
      // Create a dummy model for offline mode
      this.model = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 4000,
      });
    }
  }

  abstract name: string;
  abstract description: string;

  /**
   * Initialize the agent with required setup
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate configuration
      this.validateConfig(this.config);
      // Perform any agent-specific initialization
      await this.onInitialize();
      this.isInitialized = true;
    } catch (error) {
      throw this.createAgentError(
        error,
        AgentErrorType.UNKNOWN_ERROR,
        'Failed to initialize agent',
      );
    }
  }

  /**
   * Process input and return output
   */
  async process(input: AgentInput): Promise<AgentOutput> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      // Validate input
      this.validateInput(input);
      // Check if this agent can handle the input
      if (!this.canHandle(input)) {
        throw this.createAgentError(
          new Error('Input not supported by this agent'),
          AgentErrorType.VALIDATION_ERROR,
          'Input not supported by this agent',
        );
      }
      // Process the input
      const result = await this.processInput(input);
      return {
        response: result.response,
        success: true,
        ...(result.metadata && { metadata: result.metadata }),
        ...(result.actions && { actions: result.actions }),
      };
    } catch (error: any) {
      // If error is an AgentError, surface its message
      if (error && error.message) {
        return {
          response: this.getErrorMessage(error),
          success: false,
          error: error.message,
          metadata: { errorType: error.type || AgentErrorType.UNKNOWN_ERROR },
        };
      }
      return this.handleError(error);
    }
  }

  abstract canHandle(input: AgentInput): boolean;

  protected async onInitialize(): Promise<void> {}

  protected abstract processInput(input: AgentInput): Promise<{
    response: string;
    metadata?: Record<string, any>;
    actions?: any[];
  }>;

  protected validateConfig(config: AgentConfig): void {
    if (!config.name) {
      throw new Error('Agent name is required');
    }
    if (!config.model) {
      throw new Error('Model name is required');
    }
    if (config.temperature < 0 || config.temperature > 2) {
      throw new Error('Temperature must be between 0 and 2');
    }
    if (config.maxTokens <= 0) {
      throw new Error('Max tokens must be greater than 0');
    }
  }

  protected validateInput(input: AgentInput): void {
    if (!input.message || input.message.trim().length === 0) {
      throw this.createAgentError(
        new Error('Message is required'),
        AgentErrorType.VALIDATION_ERROR,
        'Message is required',
      );
    }
  }

  protected createMessage(input: AgentInput): BaseMessage {
    return new HumanMessage(input.message);
  }

  protected handleError(error: any): AgentOutput {
    const agentError = this.createAgentError(
      error,
      AgentErrorType.UNKNOWN_ERROR,
      'Unknown error occurred',
    );
    return {
      response: this.getErrorMessage(agentError),
      success: false,
      error: agentError.message,
      metadata: { errorType: agentError.type },
    };
  }

  protected createAgentError(
    originalError: any,
    type: AgentErrorType,
    message: string,
  ): AgentError {
    const retryAfter = this.getRetryAfter(type);
    return {
      type,
      message,
      originalError:
        originalError instanceof Error ? originalError : new Error(String(originalError)),
      retryable: this.isRetryableError(type),
      ...(retryAfter !== undefined && { retryAfter }),
    };
  }

  protected isRetryableError(type: AgentErrorType): boolean {
    return [
      AgentErrorType.API_ERROR,
      AgentErrorType.TIMEOUT_ERROR,
      AgentErrorType.RATE_LIMIT_ERROR,
    ].includes(type);
  }

  protected getRetryAfter(type: AgentErrorType): number | undefined {
    switch (type) {
      case AgentErrorType.RATE_LIMIT_ERROR:
        return 60; // 1 minute
      case AgentErrorType.TIMEOUT_ERROR:
        return 5; // 5 seconds
      default:
        return undefined;
    }
  }

  protected getErrorMessage(error: AgentError): string {
    switch (error.type) {
      case AgentErrorType.API_ERROR:
        return 'I encountered an issue connecting to my AI service. Please try again in a moment.';
      case AgentErrorType.VALIDATION_ERROR:
        return error.message || "I couldn't understand your request. Could you please rephrase it?";
      case AgentErrorType.TIMEOUT_ERROR:
        return 'The request took too long to process. Please try again.';
      case AgentErrorType.RATE_LIMIT_ERROR:
        return "I'm processing too many requests right now. Please wait a moment and try again.";
      default:
        return 'I encountered an unexpected error. Please try again.';
    }
  }

  getConfig(): AgentConfig {
    return { ...this.config };
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

import {
  OpenAIRequest,
  OpenAIServiceResponse,
  OpenAIError,
  OpenAIErrorType,
  OpenAIValidationResult,
  OpenAIRequestOptions,
  OpenAIResponseMetadata,
  DEFAULT_OPENAI_CONFIG,
} from '../types/openai';

export class RequestHandler {
  private defaultOptions: OpenAIRequestOptions;

  constructor(options: OpenAIRequestOptions = {}) {
    this.defaultOptions = {
      timeout: DEFAULT_OPENAI_CONFIG.timeout || 30000,
      retries: DEFAULT_OPENAI_CONFIG.maxRetries || 3,
      retryDelay: DEFAULT_OPENAI_CONFIG.retryDelay || 1000,
      stream: false,
      ...options,
    };
  }

  /**
   * Validate an OpenAI request
   */
  validateRequest(request: OpenAIRequest): OpenAIValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!request.messages || request.messages.length === 0) {
      errors.push('At least one message is required');
    }

    // Validate temperature
    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        errors.push('Temperature must be between 0 and 2');
      }
    }

    // Validate max tokens
    if (request.maxTokens !== undefined) {
      if (request.maxTokens <= 0) {
        errors.push('Max tokens must be greater than 0');
      }
      if (request.maxTokens > 8192) {
        warnings.push('Max tokens exceeds recommended limit of 8192');
      }
    }

    // Validate top_p
    if (request.topP !== undefined) {
      if (request.topP < 0 || request.topP > 1) {
        errors.push('Top_p must be between 0 and 1');
      }
    }

    // Validate frequency penalty
    if (request.frequencyPenalty !== undefined) {
      if (request.frequencyPenalty < -2 || request.frequencyPenalty > 2) {
        errors.push('Frequency penalty must be between -2 and 2');
      }
    }

    // Validate presence penalty
    if (request.presencePenalty !== undefined) {
      if (request.presencePenalty < -2 || request.presencePenalty > 2) {
        errors.push('Presence penalty must be between -2 and 2');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Create a standardized response from OpenAI response
   */
  createServiceResponse(
    openAIResponse: any,
    metadata: Partial<OpenAIResponseMetadata> = {},
  ): OpenAIServiceResponse {
    const content =
      openAIResponse.content ||
      (openAIResponse.choices && openAIResponse.choices[0]?.message?.content) ||
      '';

    const usage = openAIResponse.usage
      ? {
          promptTokens: openAIResponse.usage.prompt_tokens || 0,
          completionTokens: openAIResponse.usage.completion_tokens || 0,
          totalTokens: openAIResponse.usage.total_tokens || 0,
        }
      : undefined;

    const finishReason =
      openAIResponse.finish_reason ||
      (openAIResponse.choices && openAIResponse.choices[0]?.finish_reason);

    const response: OpenAIServiceResponse = {
      content,
      model: openAIResponse.model || metadata.model || 'unknown',
    };

    if (usage) {
      response.usage = usage;
    }

    if (finishReason) {
      response.finishReason = finishReason;
    }

    if (openAIResponse.id || metadata.requestId) {
      response.responseId = openAIResponse.id || metadata.requestId;
    }

    if (openAIResponse.created || metadata.timestamp) {
      response.created = openAIResponse.created || metadata.timestamp;
    }

    return response;
  }

  /**
   * Parse and categorize OpenAI errors
   */
  parseError(error: any, requestId?: string): OpenAIError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const statusCode = error?.status || error?.statusCode || error?.response?.status;

    // Determine error type based on message and status code
    let errorType = OpenAIErrorType.UNKNOWN;
    let retryable = false;
    let retryAfter: number | undefined;

    if (statusCode === 401) {
      errorType = OpenAIErrorType.INVALID_API_KEY;
      retryable = false;
    } else if (statusCode === 429) {
      errorType = OpenAIErrorType.RATE_LIMIT_EXCEEDED;
      retryable = true;
      retryAfter = this.extractRetryAfter(error);
    } else if (statusCode === 402) {
      errorType = OpenAIErrorType.QUOTA_EXCEEDED;
      retryable = false;
    } else if (statusCode === 404) {
      errorType = OpenAIErrorType.MODEL_NOT_FOUND;
      retryable = false;
    } else if (statusCode >= 400 && statusCode < 500) {
      errorType = OpenAIErrorType.INVALID_REQUEST;
      retryable = false;
    } else if (statusCode >= 500) {
      errorType = OpenAIErrorType.SERVER_ERROR;
      retryable = true;
    } else if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND') {
      errorType = OpenAIErrorType.NETWORK_ERROR;
      retryable = true;
    } else if (error.code === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
      errorType = OpenAIErrorType.TIMEOUT;
      retryable = true;
    }

    const parsedError: OpenAIError = {
      type: errorType,
      message: errorMessage,
      retryable,
      originalError: error,
    };

    if (retryAfter) {
      parsedError.retryAfter = retryAfter;
    }

    if (statusCode) {
      parsedError.statusCode = statusCode;
    }

    if (requestId) {
      parsedError.requestId = requestId;
    }

    return parsedError;
  }

  /**
   * Extract retry-after header from error response
   */
  private extractRetryAfter(error: any): number | undefined {
    const retryAfter = error?.response?.headers?.['retry-after'] || error?.headers?.['retry-after'];

    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      return isNaN(seconds) ? undefined : seconds * 1000; // Convert to milliseconds
    }

    return undefined;
  }

  /**
   * Create request metadata
   */
  createRequestMetadata(): OpenAIResponseMetadata {
    return {
      requestId: this.generateRequestId(),
      timestamp: Date.now(),
      duration: 0,
      model: '',
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };
  }

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Calculate request duration
   */
  calculateDuration(startTime: number): number {
    return Date.now() - startTime;
  }

  /**
   * Merge request options with defaults
   */
  mergeOptions(options?: OpenAIRequestOptions): OpenAIRequestOptions {
    return {
      ...this.defaultOptions,
      ...options,
    };
  }

  /**
   * Check if an error is retryable
   */
  isRetryableError(error: OpenAIError): boolean {
    return error.retryable;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt: number, baseDelay: number = 1000): number {
    return baseDelay * Math.pow(2, attempt - 1);
  }

  /**
   * Sanitize request for logging (remove sensitive data)
   */
  sanitizeRequest(request: OpenAIRequest): any {
    return {
      messageCount: request.messages?.length || 0,
      temperature: request.temperature,
      maxTokens: request.maxTokens,
      model: request.model,
      stream: request.stream,
      // Don't include API keys or message content for security
    };
  }
}

// Export a singleton instance
export const requestHandler = new RequestHandler();

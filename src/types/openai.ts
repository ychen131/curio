import { BaseMessage } from '@langchain/core/messages';

// ============================================================================
// REQUEST TYPES
// ============================================================================

export interface OpenAIRequest {
  messages: BaseMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
  user?: string;
}

export interface OpenAIChatRequest extends OpenAIRequest {
  messages: BaseMessage[];
}

export interface OpenAITextRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  stream?: boolean;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string | string[];
  user?: string;
}

export interface OpenAIEmbeddingRequest {
  input: string | string[];
  model?: string;
  user?: string;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface OpenAIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface OpenAIChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finishReason: string;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: OpenAIUsage;
}

export interface OpenAIServiceResponse {
  content: string;
  usage?: OpenAIUsage;
  model: string;
  finishReason?: string;
  responseId?: string;
  created?: number;
}

export interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: OpenAIUsage;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export enum OpenAIErrorType {
  INVALID_API_KEY = 'INVALID_API_KEY',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  MODEL_NOT_FOUND = 'MODEL_NOT_FOUND',
  INVALID_REQUEST = 'INVALID_REQUEST',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export interface OpenAIError {
  type: OpenAIErrorType;
  message: string;
  retryable: boolean;
  retryAfter?: number;
  originalError?: Error;
  statusCode?: number;
  requestId?: string;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  baseURL?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

export interface OpenAIStreamConfig {
  enableStreaming: boolean;
  chunkSize?: number;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: OpenAIError) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface OpenAIRequestOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  stream?: boolean;
}

export interface OpenAIResponseMetadata {
  requestId: string;
  timestamp: number;
  duration: number;
  model: string;
  usage: OpenAIUsage;
}

export type OpenAIStreamCallback = (chunk: string, isComplete: boolean) => void;

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface OpenAIValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const OPENAI_MODELS = {
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4_TURBO: 'gpt-4-turbo',
  GPT_4: 'gpt-4',
  GPT_3_5_TURBO: 'gpt-3.5-turbo',
} as const;

export const OPENAI_FINISH_REASONS = {
  STOP: 'stop',
  LENGTH: 'length',
  CONTENT_FILTER: 'content_filter',
  TOOL_CALLS: 'tool_calls',
} as const;

export const DEFAULT_OPENAI_CONFIG: Partial<OpenAIConfig> = {
  model: OPENAI_MODELS.GPT_4O,
  temperature: 0.7,
  maxTokens: 4000,
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};

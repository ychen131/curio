// Minimal types for LangChain.js agents
export interface AgentInput {
  message: string;
  sessionId?: string;
  context?: Record<string, any>;
}

export interface AgentOutput {
  response: string;
  success: boolean;
  error?: string;
}

export interface BaseAgent {
  name: string;
  process(input: AgentInput): Promise<AgentOutput>;
}

// Legacy types still needed by OpenAI service
export enum AgentErrorType {
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AgentError {
  type: AgentErrorType;
  message: string;
  originalError?: Error;
  retryable: boolean;
  retryAfter?: number;
}

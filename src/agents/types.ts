import { BaseMessage } from '@langchain/core/messages';

// Base agent interface that all agents must implement
export interface BaseAgent {
  name: string;
  description: string;
  process(input: AgentInput): Promise<AgentOutput>;
  canHandle(input: AgentInput): boolean;
}

// Input structure for agents
export interface AgentInput {
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

// Output structure for agents
export interface AgentOutput {
  response: string;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
  actions?: AgentAction[];
}

// Action that an agent can take
export interface AgentAction {
  type: string;
  payload: any;
  description: string;
}

// Conversation state management
export interface ConversationState {
  sessionId: string;
  userId?: string;
  messages: BaseMessage[];
  context: Record<string, any>;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Agent configuration
export interface AgentConfig {
  name: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  retryAttempts: number;
  timeout: number;
}

// Agent registry for managing multiple agents
export interface AgentRegistry {
  register(agent: BaseAgent): void;
  getAgent(name: string): BaseAgent | undefined;
  getAllAgents(): BaseAgent[];
  canHandle(input: AgentInput): BaseAgent | undefined;
}

// Error types for agent operations
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

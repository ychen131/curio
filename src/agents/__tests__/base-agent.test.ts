import { BaseAgentImpl } from '../base-agent';
import { AgentInput } from '../types';
import { globalAgentRegistry } from '../registry';

// Mock the environment configuration
jest.mock('../../config/environment', () => ({
  isAIEnabled: () => false, // Test in offline mode
  getOpenAIConfig: () => ({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4000,
  }),
}));

// Create a simple test agent that extends BaseAgentImpl
class TestAgent extends BaseAgentImpl {
  name = 'test-agent';
  description = 'A simple test agent for validation';

  canHandle(input: AgentInput): boolean {
    return input.message.toLowerCase().includes('test');
  }

  protected async processInput(input: AgentInput): Promise<{
    response: string;
    metadata?: Record<string, any>;
    actions?: any[];
  }> {
    return {
      response: `Test agent processed: "${input.message}"`,
      metadata: { processed: true, agent: this.name },
      actions: [
        { type: 'test_action', payload: { message: input.message }, description: 'Test action' },
      ],
    };
  }
}

describe('Base Agent Framework (Task 5.1)', () => {
  let testAgent: TestAgent;

  beforeEach(() => {
    testAgent = new TestAgent({
      name: 'test-agent',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4000,
      systemPrompt: 'You are a test agent.',
      retryAttempts: 3,
      timeout: 30000,
    });
  });

  describe('Agent Configuration', () => {
    test('should create agent with valid configuration', () => {
      expect(testAgent.name).toBe('test-agent');
      expect(testAgent.description).toBe('A simple test agent for validation');
      expect(testAgent.getConfig().model).toBe('gpt-4o-mini');
    });

    test('should validate configuration on initialization', async () => {
      await expect(testAgent.initialize()).resolves.not.toThrow();
      expect(testAgent.isReady()).toBe(true);
    });

    test('should reject invalid configuration', () => {
      expect(() => {
        new TestAgent({
          name: '', // Invalid: empty name
          model: 'gpt-4o-mini',
          temperature: 0.7,
          maxTokens: 4000,
          systemPrompt: 'You are a test agent.',
          retryAttempts: 3,
          timeout: 30000,
        });
      }).toThrow('Agent name is required');
    });
  });

  describe('Input Processing', () => {
    beforeEach(async () => {
      await testAgent.initialize();
    });

    test('should process valid input', async () => {
      const input: AgentInput = {
        message: 'This is a test message',
        context: { test: true },
      };

      const output = await testAgent.process(input);

      expect(output.success).toBe(true);
      expect(output.response).toContain('Test agent processed: "This is a test message"');
      expect(output.metadata?.['processed']).toBe(true);
      expect(output.actions).toHaveLength(1);
    });

    test('should handle input that agent cannot process', async () => {
      const input: AgentInput = {
        message: 'Hello world', // does not contain 'test'
      };

      const output = await testAgent.process(input);

      expect(output.success).toBe(false);
      expect(output.error).toBe('Input not supported by this agent');
    });

    test('should reject empty input', async () => {
      const input: AgentInput = {
        message: '',
      };

      const output = await testAgent.process(input);

      expect(output.success).toBe(false);
      expect(output.error).toBe('Message is required');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await testAgent.initialize();
    });

    test('should provide user-friendly error messages', async () => {
      // Create an agent that throws an error
      class ErrorAgent extends BaseAgentImpl {
        name = 'error-agent';
        description = 'An agent that throws errors';

        canHandle(): boolean {
          return true;
        }

        protected async processInput(): Promise<{ response: string }> {
          throw new Error('API connection failed');
        }
      }

      const errorAgent = new ErrorAgent({
        name: 'error-agent',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: 'You are an error agent.',
        retryAttempts: 3,
        timeout: 30000,
      });

      await errorAgent.initialize();

      const output = await errorAgent.process({ message: 'test' });

      expect(output.success).toBe(false);
      expect(output.response).toContain('I encountered an unexpected error');
    });
  });

  describe('Agent Registry', () => {
    beforeEach(() => {
      globalAgentRegistry.clear();
    });

    test('should register and retrieve agents', () => {
      globalAgentRegistry.register(testAgent);

      expect(globalAgentRegistry.hasAgent('test-agent')).toBe(true);
      expect(globalAgentRegistry.getAgent('test-agent')).toBe(testAgent);
      expect(globalAgentRegistry.getAgentCount()).toBe(1);
    });

    test('should find agent that can handle input', () => {
      globalAgentRegistry.register(testAgent);

      const input: AgentInput = { message: 'This is a test message' };
      const foundAgent = globalAgentRegistry.canHandle(input);

      expect(foundAgent).toBe(testAgent);
    });

    test('should return undefined for input no agent can handle', () => {
      globalAgentRegistry.register(testAgent);

      const input: AgentInput = { message: 'Hello world' }; // does not contain 'test'
      const foundAgent = globalAgentRegistry.canHandle(input);

      expect(foundAgent).toBeUndefined();
    });

    test('should prevent duplicate agent registration', () => {
      globalAgentRegistry.register(testAgent);

      expect(() => {
        globalAgentRegistry.register(testAgent);
      }).toThrow("Agent with name 'test-agent' is already registered");
    });
  });

  describe('Type System', () => {
    test('should enforce proper types', () => {
      // This test ensures TypeScript compilation works correctly
      const input: AgentInput = {
        message: 'test message',
        context: { key: 'value' },
        userId: 'user123',
        sessionId: 'session456',
        metadata: { timestamp: Date.now() },
      };

      expect(input.message).toBe('test message');
      expect(input.context?.['key']).toBe('value');
      expect(input.userId).toBe('user123');
    });
  });
});

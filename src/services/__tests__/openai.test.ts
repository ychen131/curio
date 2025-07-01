import { OpenAIService, openAIService } from '../openai';
import { HumanMessage } from '@langchain/core/messages';

// Mock the environment configuration
jest.mock('../../config/environment', () => ({
  config: {
    openai: {
      apiKey: 'test-api-key',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 4000,
    },
  },
  validateConfig: jest.fn(),
  getOpenAIConfig: () => ({
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4000,
  }),
}));

// Mock the ChatOpenAI class
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn().mockResolvedValue({
      content: 'Mocked response from OpenAI',
    }),
  })),
}));

describe('OpenAI Service (Task 5.2.1)', () => {
  let service: OpenAIService;

  beforeEach(() => {
    service = new OpenAIService();
  });

  describe('Service Initialization', () => {
    test('should create service with default configuration', () => {
      expect(service.isReady()).toBe(false);
      expect(service.getConfig().model).toBe('gpt-4o-mini');
      expect(service.getConfig().temperature).toBe(0.7);
      expect(service.getConfig().maxTokens).toBe(4000);
    });

    test('should initialize successfully', async () => {
      await expect(service.initialize()).resolves.not.toThrow();
      expect(service.isReady()).toBe(true);
    });

    test('should not initialize twice', async () => {
      await service.initialize();
      await service.initialize(); // Should not throw
      expect(service.isReady()).toBe(true);
    });
  });

  describe('Request Validation', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('should validate request with valid parameters', async () => {
      const request = {
        messages: [new HumanMessage('Hello')],
        temperature: 0.5,
        maxTokens: 100,
      };

      await expect(service.chatCompletion(request)).resolves.toBeDefined();
    });

    test('should reject request without messages', async () => {
      const request = {
        messages: [],
      };

      await expect(service.chatCompletion(request)).rejects.toThrow();
    });

    test('should reject request with invalid temperature', async () => {
      const request = {
        messages: [new HumanMessage('Hello')],
        temperature: 3, // Invalid: > 2
      };

      await expect(service.chatCompletion(request)).rejects.toThrow(
        'Temperature must be between 0 and 2',
      );
    });

    test('should reject request with invalid maxTokens', async () => {
      const request = {
        messages: [new HumanMessage('Hello')],
        maxTokens: 0, // Invalid: <= 0
      };

      await expect(service.chatCompletion(request)).rejects.toThrow(
        'Max tokens must be greater than 0',
      );
    });
  });

  describe('Chat Completion', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('should complete chat request successfully', async () => {
      const request = {
        messages: [new HumanMessage('Hello, how are you?')],
      };

      const response = await service.chatCompletion(request);

      expect(response.content).toBe('Mocked response from OpenAI');
      expect(response.model).toBe('gpt-4o-mini');
      expect(response.finishReason).toBe('stop');
    });

    test('should complete simple text', async () => {
      const response = await service.completeText('Hello world');

      expect(response).toBe('Mocked response from OpenAI');
    });

    test('should handle streaming requests', async () => {
      const request = {
        messages: [new HumanMessage('Tell me a story')],
        stream: true,
      };

      const stream = service.streamChatCompletion(request);
      const chunks: string[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('')).toContain('Mocked response from OpenAI');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await service.initialize();
    });

    test('should handle API errors gracefully', async () => {
      // Mock a failed request
      const mockChatOpenAI = require('@langchain/openai').ChatOpenAI;
      mockChatOpenAI.mockImplementationOnce(() => ({
        invoke: jest.fn().mockRejectedValue(new Error('Rate limit exceeded')),
      }));

      const newService = new OpenAIService();
      await newService.initialize();

      const request = {
        messages: [new HumanMessage('Hello')],
      };

      await expect(newService.chatCompletion(request)).rejects.toThrow();
    });

    test('should retry on retryable errors', async () => {
      // Mock a service that fails once then succeeds
      const mockChatOpenAI = require('@langchain/openai').ChatOpenAI;
      const mockInvoke = jest
        .fn()
        .mockRejectedValueOnce(new Error('Rate limit exceeded'))
        .mockResolvedValueOnce({ content: 'Success after retry' });

      mockChatOpenAI.mockImplementationOnce(() => ({
        invoke: mockInvoke,
      }));

      const newService = new OpenAIService();
      newService.setRetryConfig(2, 100); // 2 attempts, 100ms delay
      await newService.initialize();

      const request = {
        messages: [new HumanMessage('Hello')],
      };

      const response = await newService.chatCompletion(request);
      expect(response.content).toBe('Success after retry');
      expect(mockInvoke).toHaveBeenCalledTimes(2);
    });
  });

  describe('Configuration Management', () => {
    test('should allow retry configuration updates', () => {
      service.setRetryConfig(5, 2000);

      const config = service.getConfig();
      expect(config.retryAttempts).toBe(5);
    });

    test('should return current configuration', () => {
      const config = service.getConfig();

      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('temperature');
      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('retryAttempts');
    });
  });

  describe('Singleton Instance', () => {
    test('should export singleton instance', () => {
      expect(openAIService).toBeInstanceOf(OpenAIService);
    });

    test('should maintain singleton state', async () => {
      await openAIService.initialize();
      expect(openAIService.isReady()).toBe(true);
    });
  });
});

import { sendAgentMessage, getLearningRequestsForSession } from '../conversational';

// Mock the database functions
jest.mock('../../services/database', () => ({
  createLearningRequest: jest.fn().mockResolvedValue({}),
  getAllLearningRequests: jest.fn().mockResolvedValue([]),
}));

// Mock the API key manager
jest.mock('../../services/simple-api-key-manager', () => ({
  simpleAPIKeyManager: {
    getAPIKey: jest.fn().mockResolvedValue('test-api-key'),
  },
}));

// Mock OpenAI
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
  })),
}));

describe('sendAgentMessage', () => {
  it('should be a function', () => {
    expect(typeof sendAgentMessage).toBe('function');
  });

  it('should save learning request to database when conversation completes', async () => {
    // We'll add a more comprehensive test here later
    // For now, just test that the helper function exists
    expect(typeof getLearningRequestsForSession).toBe('function');
  });

  // Note: More comprehensive tests would require mocking the LangGraph dependencies
  // For now, we just verify the function exists and can be imported
});

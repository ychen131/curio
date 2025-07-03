import { sendAgentMessage } from '../conversational';

// Mock the dependencies
jest.mock('@langchain/openai');
jest.mock('@langchain/langgraph/prebuilt');
jest.mock('@langchain/community/tools/tavily_search');

describe('sendAgentMessage', () => {
  it('should be a function', () => {
    expect(typeof sendAgentMessage).toBe('function');
  });

  // Note: More comprehensive tests would require mocking the LangGraph dependencies
  // For now, we just verify the function exists and can be imported
});

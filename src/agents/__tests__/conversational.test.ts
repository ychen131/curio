import { ConversationalAgent } from '../conversational';
import { AgentInput } from '../types';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

describe('ConversationalAgent', () => {
  let agent: ConversationalAgent;

  beforeEach(() => {
    agent = new ConversationalAgent();
  });

  describe('initialization', () => {
    it('should initialize with correct name and description', () => {
      expect(agent.name).toBe('conversational');
      expect(agent.description).toBe(
        'Main conversational agent for user interaction and content management',
      );
    });

    it('should handle any input', () => {
      const input: AgentInput = { message: 'Hello' };
      expect(agent.canHandle(input)).toBe(true);
    });
  });

  describe('intent detection', () => {
    it('should detect content input intent', () => {
      const input: AgentInput = { message: 'I want to add an article about React' };
      const result = agent['determineIntent'](input.message);
      expect(result).toBe('content_input');
    });

    it('should detect project context intent', () => {
      const input: AgentInput = { message: 'I have a project deadline next week' };
      const result = agent['determineIntent'](input.message);
      expect(result).toBe('project_context');
    });

    it('should detect general conversation intent', () => {
      const input: AgentInput = { message: 'Hello, how are you?' };
      const result = agent['determineIntent'](input.message);
      expect(result).toBe('general_conversation');
    });
  });

  describe('conversation state management', () => {
    it('should create new conversation state for new session', () => {
      const sessionId = 'test-session';
      const state = agent['getOrCreateConversationState'](sessionId, 'test-user');

      expect(state.sessionId).toBe(sessionId);
      expect(state.userId).toBe('test-user');
      expect(state.messages).toEqual([]);
      expect(state.context).toEqual({});
    });

    it('should return existing conversation state for existing session', () => {
      const sessionId = 'test-session-2';
      const state1 = agent['getOrCreateConversationState'](sessionId, 'test-user');
      const state2 = agent['getOrCreateConversationState'](sessionId, 'test-user');

      expect(state1).toBe(state2);
    });

    it('should generate unique session IDs', () => {
      const sessionId1 = agent['generateSessionId']();
      const sessionId2 = agent['generateSessionId']();

      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
    });
  });

  describe('conversation history', () => {
    it('should get conversation history for session', () => {
      const sessionId = 'test-session-history';
      const state = agent['getOrCreateConversationState'](sessionId);

      // Add some messages
      state.messages.push(new HumanMessage('Hello'));
      state.messages.push(new AIMessage('Hi there!'));

      const history = agent.getConversationHistory(sessionId);
      expect(history).toHaveLength(2);
      expect(history[0]).toBeInstanceOf(HumanMessage);
      expect(history[1]).toBeInstanceOf(AIMessage);
    });

    it('should clear conversation for session', () => {
      const sessionId = 'test-session-clear';
      agent['getOrCreateConversationState'](sessionId);

      expect(agent.getActiveSessions()).toContain(sessionId);

      const cleared = agent.clearConversation(sessionId);
      expect(cleared).toBe(true);
      expect(agent.getActiveSessions()).not.toContain(sessionId);
    });

    it('should get all active sessions', () => {
      const sessionId1 = 'test-session-1';
      const sessionId2 = 'test-session-2';

      agent['getOrCreateConversationState'](sessionId1);
      agent['getOrCreateConversationState'](sessionId2);

      const activeSessions = agent.getActiveSessions();
      expect(activeSessions).toContain(sessionId1);
      expect(activeSessions).toContain(sessionId2);
    });
  });

  describe('action extraction', () => {
    it('should extract content input actions', () => {
      const actions = agent['extractActions']('content_input', 'Add this article');

      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        type: 'suggest_content',
        payload: { message: 'Add this article', intent: 'content_input' },
        description: 'Suggested content for user to add',
      });
    });

    it('should extract project context actions', () => {
      const actions = agent['extractActions']('project_context', 'I have a project deadline');

      expect(actions).toHaveLength(1);
      expect(actions[0]).toEqual({
        type: 'suggest_project',
        payload: { message: 'I have a project deadline', intent: 'project_context' },
        description: 'Suggested project context',
      });
    });

    it('should return empty actions for general conversation', () => {
      const actions = agent['extractActions']('general_conversation', 'Hello');
      expect(actions).toEqual([]);
    });
  });

  describe('prompt creation', () => {
    it('should create appropriate prompt for content input', () => {
      const sessionId = 'test-prompt';
      const state = agent['getOrCreateConversationState'](sessionId);
      const input: AgentInput = { message: 'Add this article' };

      const prompt = agent['createPrompt']('content_input', state, input);

      expect(prompt).toContain('You are helping the user add learning content');
      expect(prompt).toContain('Content title');
      expect(prompt).toContain('Content type');
      expect(prompt).toContain('Add this article');
    });

    it('should create appropriate prompt for project context', () => {
      const sessionId = 'test-prompt-project';
      const state = agent['getOrCreateConversationState'](sessionId);
      const input: AgentInput = { message: 'I have a project deadline' };

      const prompt = agent['createPrompt']('project_context', state, input);

      expect(prompt).toContain('You are helping the user set up project context');
      expect(prompt).toContain('Project name or topic');
      expect(prompt).toContain('Goals or objectives');
      expect(prompt).toContain('I have a project deadline');
    });

    it('should create appropriate prompt for general conversation', () => {
      const sessionId = 'test-prompt-general';
      const state = agent['getOrCreateConversationState'](sessionId);
      const input: AgentInput = { message: 'Hello' };

      const prompt = agent['createPrompt']('general_conversation', state, input);

      expect(prompt).toContain('Provide a helpful, conversational response');
      expect(prompt).toContain('Hello');
    });
  });
});

import { BaseAgentImpl } from './base-agent';
import { AgentInput, AgentConfig, ConversationState, AgentErrorType } from './types';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { getOpenAIConfig } from '../config/environment';

export class ConversationalAgent extends BaseAgentImpl {
  private conversationStates: Map<string, ConversationState> = new Map();

  constructor() {
    const config: AgentConfig = {
      name: 'conversational',
      model: getOpenAIConfig().modelName,
      temperature: 0.7,
      maxTokens: 4000,
      systemPrompt: `You are Curio, an AI assistant designed to help users manage their learning content and productivity. You are helpful, friendly, and knowledgeable about learning strategies, content organization, and productivity techniques.

Your capabilities include:
- Helping users add and organize learning content
- Assisting with project planning and context gathering
- Providing guidance on learning paths and study strategies
- Answering questions about productivity and learning

Always be conversational, helpful, and focused on the user's learning goals.`,
      retryAttempts: 3,
      timeout: 30000,
    };

    super(config);
  }

  get name(): string {
    return 'conversational';
  }

  get description(): string {
    return 'Main conversational agent for user interaction and content management';
  }

  canHandle(_input: AgentInput): boolean {
    // This agent can handle most conversational inputs
    // It will be the default agent for general conversation
    return true;
  }

  protected async processInput(input: AgentInput): Promise<{
    response: string;
    metadata?: Record<string, any>;
    actions?: any[];
  }> {
    try {
      // Get or create conversation state
      const sessionId = input.sessionId || this.generateSessionId();
      const conversationState = this.getOrCreateConversationState(sessionId, input.userId);

      // Add user message to conversation
      const userMessage = new HumanMessage(input.message);
      conversationState.messages.push(userMessage);

      // Determine intent and create appropriate prompt
      const intent = this.determineIntent(input.message);
      const prompt = this.createPrompt(intent, conversationState, input);

      // Generate response using the model
      const response = await this.generateResponse(prompt, conversationState);

      // Add AI response to conversation
      const aiMessage = new AIMessage(response);
      conversationState.messages.push(aiMessage);

      // Update conversation state
      conversationState.context = { ...conversationState.context, ...input.context };
      conversationState.metadata = { ...conversationState.metadata, ...input.metadata };
      conversationState.updatedAt = new Date();

      return {
        response,
        metadata: {
          sessionId,
          intent,
          messageCount: conversationState.messages.length,
        },
        actions: this.extractActions(intent, input.message),
      };
    } catch (error) {
      throw this.createAgentError(
        error,
        AgentErrorType.API_ERROR,
        'Failed to process conversational input',
      );
    }
  }

  private determineIntent(message: string): string {
    const content = message.toLowerCase();

    if (
      content.includes('add') ||
      content.includes('article') ||
      content.includes('video') ||
      content.includes('book') ||
      content.includes('course') ||
      content.includes('content')
    ) {
      return 'content_input';
    }

    if (
      content.includes('project') ||
      content.includes('deadline') ||
      content.includes('goal') ||
      content.includes('timeline') ||
      content.includes('plan')
    ) {
      return 'project_context';
    }

    return 'general_conversation';
  }

  private createPrompt(
    intent: string,
    conversationState: ConversationState,
    input: AgentInput,
  ): string {
    const systemPrompt = this.config.systemPrompt;
    const messageHistory = conversationState.messages
      .slice(-6) // Last 6 messages for context
      .map((msg) => `${msg.constructor.name}: ${msg.content}`)
      .join('\n');

    let intentSpecificPrompt = '';

    switch (intent) {
      case 'content_input':
        intentSpecificPrompt = `
You are helping the user add learning content to their collection. Extract relevant information and provide guidance.

Extract and suggest:
1. Content title (if mentioned)
2. Content type (article, video, book, course, etc.)
3. Source/URL (if mentioned)
4. Description or key points (if mentioned)

Provide a helpful response that acknowledges their content and asks for any missing information.`;
        break;

      case 'project_context':
        intentSpecificPrompt = `
You are helping the user set up project context and learning goals. Extract relevant information and provide guidance.

Extract and suggest:
1. Project name or topic
2. Goals or objectives
3. Timeline or deadlines (if mentioned)
4. Key learning areas or skills needed

Provide a helpful response that acknowledges their project and asks for any missing information.`;
        break;

      default:
        intentSpecificPrompt =
          "Provide a helpful, conversational response that addresses the user's needs. Be friendly and supportive.";
    }

    return `${systemPrompt}

Current conversation context:
${JSON.stringify(conversationState.context, null, 2)}

Previous messages:
${messageHistory}

${intentSpecificPrompt}

User's latest message: ${input.message}

Response:`;
  }

  private async generateResponse(
    prompt: string,
    _conversationState: ConversationState,
  ): Promise<string> {
    try {
      const response = await this.model.invoke([new HumanMessage(prompt)]);
      return response.content as string;
    } catch (error) {
      console.error('Error generating response:', error);
      return 'I apologize, but I encountered an issue processing your request. Please try again.';
    }
  }

  private getOrCreateConversationState(sessionId: string, userId?: string): ConversationState {
    if (!this.conversationStates.has(sessionId)) {
      const newState: ConversationState = {
        sessionId,
        ...(userId && { userId }),
        messages: [],
        context: {},
        metadata: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.conversationStates.set(sessionId, newState);
    }
    return this.conversationStates.get(sessionId)!;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private extractActions(intent: string, message: string): any[] {
    const actions: any[] = [];

    // Extract potential actions based on intent
    if (intent === 'content_input') {
      actions.push({
        type: 'suggest_content',
        payload: { message, intent },
        description: 'Suggested content for user to add',
      });
    }

    if (intent === 'project_context') {
      actions.push({
        type: 'suggest_project',
        payload: { message, intent },
        description: 'Suggested project context',
      });
    }

    return actions;
  }

  /**
   * Get conversation history for a session
   */
  getConversationHistory(sessionId: string): BaseMessage[] {
    const state = this.conversationStates.get(sessionId);
    return state ? state.messages : [];
  }

  /**
   * Clear conversation history for a session
   */
  clearConversation(sessionId: string): boolean {
    return this.conversationStates.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.conversationStates.keys());
  }
}

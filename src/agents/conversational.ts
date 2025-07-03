import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { simpleAPIKeyManager } from '../services/simple-api-key-manager';

// Enhanced conversation state management
interface ConversationState {
  step: 'initial' | 'identifying' | 'clarifying' | 'confirmed' | 'learning_preference';
  subject_candidate?: string;
  subject?: string;
  category?: string;
  learning_preference?: 'basics' | 'getting_started' | 'core_concepts';
  needs_clarification: boolean;
  clarification_context?: string; // Store what we're clarifying about
}

// In-memory state storage (simple session management)
const conversationStates = new Map<string, ConversationState>();

// Get or initialize conversation state
function getConversationState(sessionId: string): ConversationState {
  if (!conversationStates.has(sessionId)) {
    conversationStates.set(sessionId, {
      step: 'initial',
      needs_clarification: false,
    });
  }
  return conversationStates.get(sessionId)!;
}

// Update conversation state
function updateConversationState(sessionId: string, updates: Partial<ConversationState>) {
  const currentState = getConversationState(sessionId);
  conversationStates.set(sessionId, { ...currentState, ...updates });
}

// Main agent function with state-aware logic
export async function sendAgentMessage({
  message,
  sessionId,
}: {
  message: string;
  sessionId?: string;
}) {
  try {
    const apiKey = await simpleAPIKeyManager.getAPIKey();
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please set your API key in the settings.');
    }

    const model = new ChatOpenAI({
      temperature: 0,
      openAIApiKey: apiKey,
    });

    const session = sessionId || 'default';
    let state = getConversationState(session);

    // Since the UI starts with "What do you want to learn about?",
    // the first user message should be treated as subject identification
    if (state.step === 'initial') {
      updateConversationState(session, { step: 'identifying' });
      state = getConversationState(session); // Get updated state
    }

    if (state.step === 'identifying') {
      // Analyze user input for subject identification
      const systemPrompt = `Analyze this user input for a learning subject.

If clear and unambiguous, respond with: "IDENTIFIED: [subject name] | [category]"
If unclear or ambiguous (like "Swift", "Python", "Java"), respond with: "CLARIFY: [ambiguous term] | [possible categories]"
If unclear, respond with: "UNCLEAR"

Examples:
- "Swift" → "CLARIFY: Swift | Programming Language, Bird Species, Taylor Swift"
- "Python" → "CLARIFY: Python | Programming Language, Snake Species"
- "Machine Learning" → "IDENTIFIED: Machine Learning | Computer Science"
- "React" → "CLARIFY: React | JavaScript Library, Chemical Reaction"

User input: ${message}`;

      const response = await model.invoke([new SystemMessage(systemPrompt)]);
      const content = response.content as string;

      if (content.startsWith('IDENTIFIED:')) {
        const parts = content.replace('IDENTIFIED:', '').trim().split(' | ');
        const subject = parts[0]?.trim();
        const category = parts[1]?.trim() || 'General';

        if (subject) {
          updateConversationState(session, {
            step: 'learning_preference',
            subject: subject,
            category: category,
            needs_clarification: false,
          });
          return `I identified the subject: ${subject} in the category: ${category}

Now, what would you like to learn about ${subject}?
1. Just the basics
2. How to get started quickly
3. Core concepts

Please choose 1, 2, or 3, or tell me which option you prefer.`;
        }
      }

      if (content.startsWith('CLARIFY:')) {
        const parts = content.replace('CLARIFY:', '').trim().split(' | ');
        const ambiguousTerm = parts[0]?.trim();
        const possibleCategories = parts[1]?.trim() || 'multiple categories';

        if (ambiguousTerm) {
          updateConversationState(session, {
            step: 'clarifying',
            subject_candidate: ambiguousTerm,
            needs_clarification: true,
            clarification_context: possibleCategories,
          });
          return `I see you mentioned "${ambiguousTerm}". This could refer to ${possibleCategories}. Could you clarify which one you're interested in?`;
        }
      }

      // Unclear case
      updateConversationState(session, { step: 'confirmed' });
      return 'I could not identify a clear subject from your input. Could you be more specific?';
    }

    if (state.step === 'clarifying') {
      // Use the agent to process clarification response
      const systemPrompt = `The user previously mentioned "${state.subject_candidate}" which could refer to ${state.clarification_context}.

Now they responded with: "${message}"

Based on their clarification, determine the final subject and category.

Respond with: "RESOLVED: [final subject] | [category]"

Examples:
- If they said "PL" or "programming" or "language" → "RESOLVED: ${state.subject_candidate} | Programming Language"
- If they said "yeah" or "yes" to the first option → "RESOLVED: ${state.subject_candidate} | Programming Language"
- If they said "animal" or "snake" → "RESOLVED: ${state.subject_candidate} | Animal/Biology"

User clarification: ${message}`;

      const response = await model.invoke([new SystemMessage(systemPrompt)]);
      const content = response.content as string;

      if (content.startsWith('RESOLVED:')) {
        const parts = content.replace('RESOLVED:', '').trim().split(' | ');
        const finalSubject = parts[0]?.trim();
        const finalCategory = parts[1]?.trim() || 'General';

        if (finalSubject) {
          updateConversationState(session, {
            step: 'learning_preference',
            subject: finalSubject,
            category: finalCategory,
            needs_clarification: false,
          });
          return `Perfect! I identified the subject: ${finalSubject} in the category: ${finalCategory}

Now, what would you like to learn about ${finalSubject}?
1. Just the basics
2. How to get started quickly  
3. Core concepts

Please choose 1, 2, or 3, or tell me which option you prefer.`;
        }
      }

      // Fallback if resolution fails
      if (state.subject_candidate) {
        updateConversationState(session, {
          step: 'learning_preference',
          subject: state.subject_candidate,
          category: 'General',
          needs_clarification: false,
        });
        return `I'll go with: ${state.subject_candidate} in the General category

Now, what would you like to learn about ${state.subject_candidate}?
1. Just the basics
2. How to get started quickly
3. Core concepts

Please choose 1, 2, or 3, or tell me which option you prefer.`;
      }
    }

    if (state.step === 'learning_preference') {
      // Process learning preference selection
      const systemPrompt = `The user is choosing what they want to learn about "${state.subject}".

The options are:
1. Just the basics
2. How to get started quickly
3. Core concepts

User response: "${message}"

Based on their response, determine which option they chose.
Respond with: "PREFERENCE: [basics|getting_started|core_concepts]"

Examples:
- "1" or "basics" or "basic" → "PREFERENCE: basics"
- "2" or "getting started" or "quick" or "start" → "PREFERENCE: getting_started"  
- "3" or "core concepts" or "concepts" or "core" → "PREFERENCE: core_concepts"
- "the basics" → "PREFERENCE: basics"
- "how to get started" → "PREFERENCE: getting_started"

User input: ${message}`;

      const response = await model.invoke([new SystemMessage(systemPrompt)]);
      const content = response.content as string;

      if (content.startsWith('PREFERENCE:')) {
        const preference = content.replace('PREFERENCE:', '').trim() as
          | 'basics'
          | 'getting_started'
          | 'core_concepts';

        updateConversationState(session, {
          step: 'confirmed',
          learning_preference: preference,
        });

        const preferenceLabels = {
          basics: 'just the basics',
          getting_started: 'how to get started quickly',
          core_concepts: 'core concepts',
        };

        return `Excellent! I have all the information I need:
- Subject: ${state.subject}
- Category: ${state.category}
- Learning focus: ${preferenceLabels[preference]}

I'm ready to help you learn about ${state.subject} with a focus on ${preferenceLabels[preference]}!`;
      }

      // Fallback - ask them to clarify their preference
      return `I didn't quite understand your preference. Please choose:
1. Just the basics
2. How to get started quickly
3. Core concepts

You can respond with the number (1, 2, or 3) or describe which option you prefer.`;
    }

    // If confirmed, reset for new conversation
    if (state.step === 'confirmed') {
      updateConversationState(session, {
        step: 'identifying',
        needs_clarification: false,
      });
      // Clear the previous conversation data
      const newState = getConversationState(session);
      delete newState.subject_candidate;
      delete newState.subject;
      delete newState.category;
      delete newState.learning_preference;
      delete newState.clarification_context;
      conversationStates.set(session, newState);
      return 'What do you want to learn about?';
    }

    // Default fallback
    return 'What do you want to learn about?';
  } catch (error) {
    console.error('Conversation agent error:', error);
    throw new Error(error instanceof Error ? error.message : 'Unknown error occurred');
  }
}

// Export function to get current conversation state (for debugging/testing)
export function getSessionState(sessionId: string = 'default'): ConversationState {
  return getConversationState(sessionId);
}

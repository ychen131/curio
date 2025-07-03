import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ChatOpenAI } from '@langchain/openai';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { LearningRequestDoc, LessonPlanDoc, CuratedResource } from '../services/schemas';

// Define the state for our graph (keep interface for typing)
interface LessonPlannerState {
  learningRequest: LearningRequestDoc;
  searchQuery: string;
  searchResults: any[]; // Or a more specific Tavily result type
  curatedPlan: CuratedResource[];
  error?: string;
}

// Define the state for LangGraph using Annotation.Root (v0.3.6 syntax)
const LessonPlannerGraphState = Annotation.Root({
  learningRequest: Annotation<LearningRequestDoc>({
    reducer: (x, y) => y ?? x,
    default: () => ({}) as LearningRequestDoc,
  }),
  searchQuery: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
  searchResults: Annotation<any[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  curatedPlan: Annotation<CuratedResource[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  error: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => '',
  }),
});

// Node A: formulate_query
// This node creates the search query for Tavily.
const formulate_query = async (state: LessonPlannerState): Promise<Partial<LessonPlannerState>> => {
  console.log('--- formulating search query ---');
  const { subject, category, learningPreference } = state.learningRequest;
  const searchQuery = `tutorial for ${learningPreference} of ${subject} in ${category}`;
  console.log('Generated search query:', searchQuery);
  return { searchQuery };
};

// Export for testing
export { formulate_query };

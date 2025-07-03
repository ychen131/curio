import { StateGraph, END } from '@langchain/langgraph';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ChatOpenAI } from '@langchain/openai';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { LearningRequestDoc, LessonPlanDoc, CuratedResource } from '../services/schemas';

// Define the state for our graph
interface LessonPlannerState {
  learningRequest: LearningRequestDoc;
  searchQuery: string;
  searchResults: any[]; // Or a more specific Tavily result type
  curatedPlan: CuratedResource[];
  error?: string;
}

// Node A: formulate_query
// This node creates the search query for Tavily.
const formulate_query = async (state: LessonPlannerState): Promise<Partial<LessonPlannerState>> => {
  console.log('--- formulating search query ---');
  const { subject, category, learningPreference } = state.learningRequest;
  const searchQuery = `tutorial for ${learningPreference} of ${subject} in ${category}`;
  console.log('Generated search query:', searchQuery);
  return { searchQuery };
};

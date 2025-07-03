import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ChatOpenAI } from '@langchain/openai';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { LearningRequestDoc, LessonPlanDoc, CuratedResource } from '../services/schemas';
import { getTavilyConfig } from '../config/environment';

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

// Node B: call_tavily
// This node uses the Tavily tool to search the web.
const call_tavily = async (state: LessonPlannerState): Promise<Partial<LessonPlannerState>> => {
  console.log('--- calling tavily ---');

  try {
    // Get Tavily configuration
    const tavilyConfig = getTavilyConfig();

    // Create Tavily search tool with API key and max results
    const tavilyTool = new TavilySearchResults({
      maxResults: tavilyConfig.maxResults,
      apiKey: tavilyConfig.apiKey,
    });

    console.log(`Searching Tavily for: "${state.searchQuery}"`);

    // Make the search request - Tavily returns a JSON string
    const searchResultsString = await tavilyTool.invoke(state.searchQuery);

    // Parse the JSON string to get the actual results array
    const searchResults = JSON.parse(searchResultsString);

    console.log(`Found ${searchResults.length} search results`);

    // Log first result for debugging
    if (searchResults.length > 0) {
      console.log('First result:', {
        title: searchResults[0].title,
        url: searchResults[0].url,
        score: searchResults[0].score,
      });
    }

    return { searchResults };
  } catch (error) {
    console.error('Tavily search failed:', error);
    return {
      error: `Tavily search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      searchResults: [],
    };
  }
};

// Export for testing
export { formulate_query, call_tavily };

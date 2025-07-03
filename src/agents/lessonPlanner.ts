import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { TavilySearchResults } from '@langchain/community/tools/tavily_search';
import { ChatOpenAI } from '@langchain/openai';
import { JsonOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { LearningRequestDoc, LessonPlanDoc, CuratedResource } from '../services/schemas';
import { getTavilyConfig, getOpenAIConfig } from '../config/environment';

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

// Node C: curate_with_llm
// This node prepares the prompt and calls GPT-4o to select the best resources.
const curate_with_llm = async (state: LessonPlannerState): Promise<Partial<LessonPlannerState>> => {
  console.log('--- curating with llm ---');

  try {
    // Check if we have search results
    if (!state.searchResults || state.searchResults.length === 0) {
      console.log('No search results to curate');
      return {
        curatedPlan: [],
        error: 'No search results available for curation',
      };
    }

    // Get OpenAI configuration
    const openaiConfig = getOpenAIConfig();

    // Create ChatOpenAI instance
    const llm = new ChatOpenAI({
      modelName: openaiConfig.modelName,
      temperature: openaiConfig.temperature,
      maxTokens: openaiConfig.maxTokens,
    });

    // Create the curation prompt
    const curationPrompt = new PromptTemplate({
      template: `You are an expert curriculum developer creating a lesson plan for a user.
The user wants to learn about: '{subject}'
Their goal is to learn the: '{learningPreference}'

Based on the following search results, please select the top 3-5 resources that are most relevant, high-quality, and suitable for this learning goal. For each resource, provide a one-sentence summary explaining why it's a good choice.

Return your response ONLY as a valid JSON array of objects, where each object has 'title', 'url', and 'summary' keys.

SEARCH RESULTS:
{tavily_results}`,
      inputVariables: ['subject', 'learningPreference', 'tavily_results'],
    });

    // Format the prompt with our data
    const formattedPrompt = await curationPrompt.format({
      subject: state.learningRequest.subject,
      learningPreference: state.learningRequest.learningPreference,
      tavily_results: JSON.stringify(state.searchResults, null, 2),
    });

    console.log(
      `Asking GPT-4o to curate ${state.searchResults.length} search results for: ${state.learningRequest.subject}`,
    );

    // Call the LLM with JSON output format
    const response = await llm.invoke(formattedPrompt);

    // Extract the content from the response
    const responseContent =
      typeof response.content === 'string' ? response.content : JSON.stringify(response.content);

    console.log('LLM response received, parsing JSON...');

    // Parse the JSON response to get curated resources
    const parser = new JsonOutputParser<CuratedResource[]>();
    let curatedPlan: CuratedResource[];

    try {
      // Clean the response content by removing markdown code blocks if present
      let cleanedContent = responseContent.trim();

      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedContent.startsWith('```')) {
        cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      // Try to parse the cleaned response as JSON
      curatedPlan = JSON.parse(cleanedContent);

      // Validate that it's an array
      if (!Array.isArray(curatedPlan)) {
        throw new Error('LLM response is not an array');
      }

      // Validate each resource has required fields
      curatedPlan.forEach((resource, index) => {
        if (!resource.title || !resource.url || !resource.summary) {
          throw new Error(`Resource ${index} missing required fields`);
        }
      });
    } catch (parseError) {
      console.error('Failed to parse LLM response as JSON:', parseError);
      console.error('Raw response:', responseContent);
      throw new Error(
        `Failed to parse LLM response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
      );
    }

    console.log(`Successfully curated ${curatedPlan.length} resources`);

    // Log the curated results for debugging
    curatedPlan.forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.title}`);
      console.log(`   URL: ${resource.url}`);
      console.log(`   Summary: ${resource.summary}`);
    });

    return { curatedPlan };
  } catch (error) {
    console.error('LLM curation failed:', error);
    return {
      error: `LLM curation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      curatedPlan: [],
    };
  }
};

// Export for testing
export { formulate_query, call_tavily, curate_with_llm };

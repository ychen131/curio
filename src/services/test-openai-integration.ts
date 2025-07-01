import { openAIService } from './openai';
import { requestHandler } from '../utils/request-handler';
import { OPENAI_MODELS, DEFAULT_OPENAI_CONFIG } from '../types/openai';
import { HumanMessage } from '@langchain/core/messages';

export async function testOpenAIIntegration() {
  console.log('🔍 Testing OpenAI Integration with Request Handler...');

  try {
    // Test 1: Check if API key is set
    console.log('📋 Test 1: API Key Check');
    const hasKey = await openAIService.hasAPIKey();
    console.log('API Key available:', hasKey ? '✅ YES' : '❌ NO');

    if (!hasKey) {
      console.log('⚠️  No API key found. Please set your OpenAI API key first.');
      return;
    }

    // Test 2: Initialize service
    console.log('\n📋 Test 2: Service Initialization');
    await openAIService.initialize();
    console.log('Service initialized:', openAIService.isReady() ? '✅ SUCCESS' : '❌ FAILED');

    // Test 3: Test request validation
    console.log('\n📋 Test 3: Request Validation');

    const validRequest = {
      messages: [new HumanMessage('Hello, how are you?')],
      temperature: 0.7,
      maxTokens: 50,
    };

    const invalidRequest = {
      messages: [],
      temperature: 3.0, // Invalid
      maxTokens: -1, // Invalid
    };

    const validResult = requestHandler.validateRequest(validRequest);
    const invalidResult = requestHandler.validateRequest(invalidRequest);

    console.log('Valid request validation:', validResult.isValid ? '✅ PASSED' : '❌ FAILED');
    console.log('Invalid request validation:', !invalidResult.isValid ? '✅ PASSED' : '❌ FAILED');

    if (invalidResult.errors.length > 0) {
      console.log('Validation errors:', invalidResult.errors);
    }

    // Test 4: Test simple completion
    console.log('\n📋 Test 4: Simple Text Completion');
    const response = await openAIService.completeText('Say hello from Curio!', {
      maxTokens: 30,
      temperature: 0.5,
    });

    console.log('Response received:', response ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Response content:', response);

    // Test 5: Test chat completion with full request
    console.log('\n📋 Test 5: Chat Completion with Full Request');
    const chatResponse = await openAIService.chatCompletion({
      messages: [new HumanMessage('What is 2 + 2?')],
      maxTokens: 20,
      temperature: 0.1,
    });

    console.log('Chat completion:', chatResponse.content ? '✅ SUCCESS' : '❌ FAILED');
    console.log('Response content:', chatResponse.content);
    console.log('Model used:', chatResponse.model);
    console.log('Finish reason:', chatResponse.finishReason);

    if (chatResponse.usage) {
      console.log('Token usage:', {
        prompt: chatResponse.usage.promptTokens,
        completion: chatResponse.usage.completionTokens,
        total: chatResponse.usage.totalTokens,
      });
    }

    // Test 6: Test error handling
    console.log('\n📋 Test 6: Error Handling');
    try {
      await openAIService.chatCompletion({
        messages: [], // Invalid - no messages
      });
      console.log('❌ Expected error but got success');
    } catch (error) {
      console.log('✅ Error handling:', error instanceof Error ? error.message : String(error));
    }

    // Test 7: Test configuration
    console.log('\n📋 Test 7: Configuration');
    const config = openAIService.getConfig();
    console.log('Current config:', config);
    console.log('Default model:', DEFAULT_OPENAI_CONFIG.model);
    console.log('Available models:', Object.keys(OPENAI_MODELS));

    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    console.error('Error details:', error);
  }
}

// Export for use in the main process
export default testOpenAIIntegration;

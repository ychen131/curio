console.log('🔍 Simple LangChain + OpenAI Test...');

// Load environment
require('dotenv').config();

console.log('📋 Environment check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET');
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL || 'gpt-4o-mini');

// Test LangChain imports
async function testLangChain() {
  try {
    console.log('📦 Testing LangChain imports...');

    // Test if we can import LangChain modules
    const { ChatOpenAI } = require('@langchain/openai');
    const { HumanMessage } = require('@langchain/core/messages');

    console.log('✅ LangChain imports successful');

    // Test creating a model instance
    console.log('🔧 Creating ChatOpenAI instance...');
    const model = new ChatOpenAI({
      modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 100,
    });

    console.log('✅ ChatOpenAI instance created');

    // Test a simple completion
    console.log('📤 Testing completion...');
    const response = await model.invoke([new HumanMessage('Say hello from Curio with LangChain!')]);

    console.log('📥 Response received:');
    console.log('Content:', response.content);
    console.log('Model:', response.model);

    console.log('✅ LangChain + OpenAI test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testLangChain();

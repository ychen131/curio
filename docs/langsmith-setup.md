# LangSmith Tracing Setup

This document explains how to set up and use LangSmith tracing in the Curio project.

## Overview

LangSmith provides observability and tracing for LangChain applications. It helps you monitor, debug, and optimize your AI agent interactions.

## Environment Variables

Add the following environment variables to your `.env` file:

```bash
# LangSmith Configuration
LANGSMITH_API_KEY=your_langsmith_api_key_here
LANGSMITH_PROJECT=curio
LANGSMITH_TRACING=true
LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

### Configuration Options

- `LANGSMITH_API_KEY`: Your LangSmith API key (required for tracing)
- `LANGSMITH_PROJECT`: Project name for organizing traces (default: "curio")
- `LANGSMITH_TRACING`: Enable/disable tracing (default: false)
- `LANGSMITH_ENDPOINT`: LangSmith API endpoint (default: production endpoint)

## Getting Started

1. **Get a LangSmith API Key**:
   - Sign up at [https://smith.langchain.com](https://smith.langchain.com)
   - Navigate to your account settings
   - Copy your API key

2. **Set Environment Variables**:

   ```bash
   export LANGSMITH_API_KEY=your_api_key_here
   export LANGSMITH_TRACING=true
   export LANGSMITH_PROJECT=curio
   ```

3. **Start the Application**:
   ```bash
   npm run dev
   ```

## How It Works

### Automatic Tracing

Once configured, LangSmith will automatically trace:

- All LangChain model invocations
- Agent interactions
- Conversation flows
- Error handling

### Manual Tracing

You can also manually control tracing for specific operations:

```typescript
import { langSmithService } from './services/langsmith';

// Get callbacks for specific operations
const callbacks = langSmithService.getCallbacks();

// Use with LangChain operations
const response = await model.invoke(messages, callbacks);
```

### Viewing Traces

1. Open [https://smith.langchain.com](https://smith.langchain.com)
2. Navigate to your project
3. View traces in real-time as you interact with the application

## Features

### Trace Information

Each trace includes:

- Input/output messages
- Model parameters
- Execution time
- Token usage
- Error details (if any)

### Project Organization

Traces are organized by:

- Project name
- Run type (LLM, Chain, Agent)
- Timestamp
- User session

### Debugging

Use LangSmith to:

- Debug failed agent interactions
- Optimize prompt performance
- Monitor token usage and costs
- Analyze conversation patterns

## Troubleshooting

### Common Issues

1. **Tracing not working**:
   - Check that `LANGSMITH_TRACING=true`
   - Verify your API key is correct
   - Ensure network connectivity

2. **No traces appearing**:
   - Wait a few minutes for traces to appear
   - Check the correct project is selected
   - Verify the agent is making API calls

3. **Performance impact**:
   - Tracing adds minimal overhead
   - Disable tracing in production if needed
   - Use sampling for high-volume applications

### Logs

Check the console for LangSmith-related messages:

- "LangSmith tracing initialized for project: curio"
- "LangSmith traces flushed successfully"
- Any error messages during initialization

## Advanced Configuration

### Custom Projects

Create different projects for different environments:

```bash
# Development
export LANGSMITH_PROJECT=curio-dev

# Production
export LANGSMITH_PROJECT=curio-prod

# Testing
export LANGSMITH_PROJECT=curio-test
```

### Sampling

For high-volume applications, you can implement sampling:

```typescript
// Only trace 10% of requests
const shouldTrace = Math.random() < 0.1;
if (shouldTrace) {
  const callbacks = langSmithService.getCallbacks();
  // Use callbacks
}
```

### Custom Metadata

Add custom metadata to traces:

```typescript
import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain';

const tracer = new LangChainTracer({
  projectName: 'curio',
  tags: ['production', 'user-feedback'],
  metadata: {
    userId: 'user123',
    sessionId: 'session456',
  },
});
```

## Integration with Existing Code

The LangSmith integration is designed to be non-intrusive:

- **Base Agent**: Automatically includes tracing callbacks
- **Conversational Agent**: Uses tracing for all model invocations
- **Main Process**: Initializes and manages LangSmith service lifecycle
- **Error Handling**: Gracefully handles tracing failures

## Security Considerations

- API keys are stored securely using Electron's secure storage
- No sensitive data is logged in traces by default
- Network requests are made over HTTPS
- Traces can be filtered and managed through LangSmith dashboard

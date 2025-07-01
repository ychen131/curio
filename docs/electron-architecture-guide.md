# Electron Architecture Guide: Preventing Node.js Module Import Issues

## Problem Summary

The error `Uncaught ReferenceError: require is not defined` occurs when the renderer process tries to import Node.js modules (like `electron`, `fs`, `path`) that are only available in the main process. This is a common issue in Electron applications.

## Root Cause

In Electron, there are two processes:

- **Main Process**: Has access to Node.js APIs (`require`, `fs`, `path`, etc.)
- **Renderer Process**: Runs in a browser-like environment and cannot directly access Node.js modules

When the renderer process tries to import files that use Node.js modules, webpack attempts to bundle them, causing the `require is not defined` error.

## Solution Architecture

### 1. Proper Module Separation

**Main Process Only (Node.js APIs available):**

- `src/utils/secure-storage.ts` - Uses `electron`, `fs`, `path`
- `src/services/api-key-manager.ts` - Uses secure storage
- `src/main.ts` - Main process entry point

**Renderer Process Only (Browser APIs only):**

- `src/services/renderer-api-key-manager.ts` - Uses IPC to communicate with main process
- `src/components/*.tsx` - React components
- `src/agents/*.ts` - Agent logic (no Node.js dependencies)

### 2. IPC Communication Pattern

```typescript
// Main Process (src/main.ts)
ipcMain.handle('secure-storage:set', async (_event, key: string, value: string) => {
  await secureStorage.set(key, value);
});

// Preload Script (src/preload.ts)
contextBridge.exposeInMainWorld('electronAPI', {
  setSecureValue: (key: string, value: string) => ipcRenderer.invoke('secure-storage:set', key, value),
});

// Renderer Process (src/services/renderer-api-key-manager.ts)
async setOpenAIKey(apiKey: string): Promise<void> {
  await (window as any).electronAPI.setSecureValue(key, value);
}
```

### 3. Webpack Configuration

```javascript
// webpack.config.cjs
module.exports = {
  target: 'electron-renderer',
  externals: {
    electron: 'commonjs electron',
    fs: 'commonjs fs',
    path: 'commonjs path',
    crypto: 'commonjs crypto',
  },
  resolve: {
    fallback: {
      fs: false,
      path: false,
      crypto: false,
    },
  },
};
```

## Best Practices

### 1. Import Organization

**✅ Good:**

```typescript
// Renderer process - uses IPC
import { rendererAPIKeyManager } from './renderer-api-key-manager';

// Main process - uses Node.js APIs
import { secureStorage } from './utils/secure-storage';
```

**❌ Bad:**

```typescript
// Renderer process - tries to import Node.js modules
import { secureStorage } from './utils/secure-storage';
```

### 2. Type Safety

Use type assertions for `window.electronAPI` in renderer process:

```typescript
await (window as any).electronAPI.setSecureValue(key, value);
```

Or define proper types in `src/types/global.d.ts`:

```typescript
declare global {
  interface Window {
    electronAPI: {
      setSecureValue: (key: string, value: string) => Promise<void>;
      // ... other methods
    };
  }
}
```

### 3. Error Handling

Always wrap IPC calls in try-catch blocks:

```typescript
async getOpenAIKey(): Promise<string | null> {
  try {
    const stored = await (window as any).electronAPI.getSecureValue(key);
    return stored ? JSON.parse(stored).key : null;
  } catch (error) {
    console.warn('Failed to retrieve API key:', error);
    return null;
  }
}
```

## Common Pitfalls to Avoid

### 1. Direct Node.js Imports in Renderer

```typescript
// ❌ This will cause the require error
import { app } from 'electron';
import * as fs from 'fs';
```

### 2. Mixed Process Dependencies

```typescript
// ❌ Don't import main process modules in renderer
import { secureStorage } from '../utils/secure-storage';
```

### 3. Missing Webpack Configuration

```javascript
// ❌ Missing externals and fallbacks
module.exports = {
  target: 'electron-renderer',
  // Missing externals and fallbacks
};
```

## Debugging Tips

### 1. Check Import Chain

When you see the `require is not defined` error, trace the import chain:

```
conversational.ts → openai.ts → api-key-manager.ts → secure-storage.ts
```

### 2. Verify Webpack Bundle

Check the webpack output to see if Node.js modules are being bundled:

```bash
npm run build:renderer
```

### 3. Use Process-Specific Imports

Create separate files for main and renderer processes:

- `src/services/api-key-manager.ts` (main process)
- `src/services/renderer-api-key-manager.ts` (renderer process)

## Testing the Fix

1. **Build Test:**

   ```bash
   npm run build
   ```

2. **Runtime Test:**

   ```bash
   npm start
   ```

3. **Check for Errors:**
   - No `require is not defined` errors in console
   - App loads without hanging on loading page
   - IPC communication works properly

## Future Prevention

1. **Code Review Checklist:**
   - [ ] No Node.js imports in renderer process files
   - [ ] All Node.js operations go through IPC
   - [ ] Webpack configuration includes proper externals
   - [ ] Type definitions are up to date

2. **Linting Rules:**
   Consider adding ESLint rules to prevent Node.js imports in renderer files.

3. **Documentation:**
   Keep this guide updated as the architecture evolves.

## Related Files

- `src/main.ts` - Main process with IPC handlers
- `src/preload.ts` - Preload script exposing IPC methods
- `src/services/renderer-api-key-manager.ts` - Renderer-safe API key manager
- `src/utils/secure-storage.ts` - Main process secure storage
- `webpack.config.cjs` - Webpack configuration with externals
- `src/types/global.d.ts` - Type definitions for electronAPI

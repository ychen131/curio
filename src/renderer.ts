import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './components/App';

// Renderer process entry point
document.addEventListener('DOMContentLoaded', () => {
  console.log('Curio renderer process loaded');

  // Initialize React application
  initializeReactApp();

  // Set initial theme and listen for theme changes
  if (window.electronAPI) {
    window.electronAPI.getTheme().then((theme: string) => {
      setBodyTheme(theme);
      console.log('Current theme:', theme);
    });
    window.electronAPI.onThemeUpdated((theme: string) => {
      setBodyTheme(theme);
      console.log('Theme updated:', theme);
    });
  }
});

// Global types are declared in src/types/global.d.ts

function setBodyTheme(theme: string) {
  if (theme === 'dark') {
    document.body.classList.add('dark');
  } else {
    document.body.classList.remove('dark');
  }
  console.log('Setting theme:', theme, 'Body class:', document.body.className);
}

function initializeReactApp(): void {
  const appElement = document.getElementById('app');

  if (!appElement) {
    console.error('App element not found');
    return;
  }

  // Clear the loading screen
  appElement.innerHTML = '';

  // Create React root and render the app
  const root = createRoot(appElement);
  root.render(React.createElement(App));

  // Test electronAPI availability
  if (window.electronAPI) {
    console.log('Electron API is available');
  } else {
    console.log('Electron API not available');
  }
}

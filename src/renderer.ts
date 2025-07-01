// Renderer process entry point
document.addEventListener("DOMContentLoaded", () => {
  console.log("Curio renderer process loaded");

  // Initialize the application
  initializeApp();
});

// Global types are declared in src/types/global.d.ts

function initializeApp(): void {
  const appElement = document.getElementById("app");

  if (!appElement) {
    console.error("App element not found");
    return;
  }

  // Replace loading screen with main app content
  appElement.innerHTML = `
    <div class="app-container">
      <header class="app-header">
        <h1>Curio</h1>
        <p>AI-powered learning productivity tool</p>
      </header>
      <main class="app-main">
        <div class="three-pane-layout">
          <aside class="sidebar">
            <h2>Navigation</h2>
            <p>Sidebar content will go here</p>
          </aside>
          <section class="content-list">
            <h2>Content List</h2>
            <p>Content list will go here</p>
          </section>
          <section class="detail-pane">
            <h2>Detail View</h2>
            <p>Detail view will go here</p>
          </section>
        </div>
      </main>
    </div>
  `;

  // Test electronAPI availability
  if (window.electronAPI) {
    console.log("Electron API is available");
    // Test theme functionality
    window.electronAPI
      .getTheme()
      .then((theme: string) => {
        console.log("Current theme:", theme);
      })
      .catch((err: Error) => {
        console.log("Theme not implemented yet:", err);
      });
  } else {
    console.log("Electron API not available");
  }
}

# Curio - AI-Powered Learning Productivity Tool

Curio is a desktop productivity tool that automates the categorization, prioritization, and learning path creation for new technical content. The tool uses AI to intelligently organize learning materials, create personalized learning plans, and track progress to help users become experts in unfamiliar domains quickly.

## Features

- **AI-Powered Content Organization**: Automatically categorize and tag learning content
- **Intelligent Prioritization**: Prioritize content based on project relevance and goals
- **Personalized Learning Paths**: Generate structured learning plans with dependencies
- **Progress Tracking**: Monitor learning progress and provide timely reminders
- **Knowledge Assessment**: Test user knowledge retention through interactive quizzes
- **Native macOS Design**: Beautiful, native macOS appearance with modern design principles

## Development Setup

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- macOS (for development and testing)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd curio
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start the application in development mode
- `npm start` - Start the application
- `npm run package` - Package the application for distribution
- `npm run make` - Make distributable packages
- `npm test` - Run tests (to be implemented)

## Project Structure

```
curio/
├── src/
│   ├── main.js              # Main Electron process
│   ├── preload.js           # Preload script for secure API exposure
│   ├── renderer.js          # Renderer process entry point
│   ├── index.html           # Main HTML file
│   └── styles/
│       └── global.css       # Global styles
├── assets/                  # Application assets (icons, etc.)
├── tasks/                   # Project documentation and task lists
├── package.json             # Project dependencies and scripts
├── forge.config.js          # Electron Forge configuration
└── README.md               # This file
```

## Architecture

- **Electron Framework**: Cross-platform desktop application (initially macOS only)
- **LangGraph Integration**: AI agent workflows for content categorization, prioritization, and learning path generation
- **Local Storage**: PouchDB for local data persistence and offline-first operation
- **Native macOS Design**: Hidden title bar, vibrancy effects, and native appearance

## Development Guidelines

- Follow the task list in `tasks/tasks-curio-learning-productivity-tool.md`
- Implement features one sub-task at a time
- Test thoroughly before moving to the next task
- Maintain native macOS appearance and behavior
- Ensure proper error handling and user feedback

## License

MIT License - see LICENSE file for details

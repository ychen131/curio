# Database Service

This directory contains the database service layer for the Curio app, powered by PouchDB.

## Structure

- `database.ts` — Main database service, handles initialization, connection, and CRUD helpers for all app data.
- `__tests__/` — Unit and integration tests for the database service.

## Usage

Import and use the exported functions from `database.ts` to interact with the app's databases. See code comments for details.

## Adapters

- Uses LevelDB for Electron main process.
- IndexedDB adapter is available for renderer process if needed.

## Adding Tests

Place all test files for the database service in the `__tests__/` directory.

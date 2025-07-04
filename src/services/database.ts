import PouchDB from 'pouchdb';
import leveldb from 'pouchdb-adapter-leveldb';
import idb from 'pouchdb-adapter-idb';
import {
  ContentDoc,
  ProjectDoc,
  CategoryDoc,
  LearningPathDoc,
  QuizDoc,
  UserSettingsDoc,
  LearningRequestDoc,
  LessonPlanDoc,
  BaseDoc,
} from './schemas';

// Register adapters
PouchDB.plugin(leveldb);
PouchDB.plugin(idb);

// Database configuration for Electron
const DB_CONFIG = {
  name: 'curio-db',
  adapter: 'leveldb', // Use leveldb for Electron main process
  auto_compaction: true,
  revs_limit: 1000,
};

// Database names for different collections
export const DB_NAMES = {
  CONTENT: 'curio-content',
  PROJECTS: 'curio-projects',
  CATEGORIES: 'curio-categories',
  LEARNING_PATHS: 'curio-learning-paths',
  QUIZZES: 'curio-quizzes',
  USER_SETTINGS: 'curio-user-settings',
  LEARNING_REQUESTS: 'curio-learning-requests',
  LESSON_PLANS: 'curio-lesson-plans',
} as const;

// Database instance cache
const dbInstances = new Map<string, PouchDB.Database<any>>();

/**
 * Get or create a PouchDB database instance
 * @param dbName - Name of the database
 * @returns PouchDB database instance
 */
export function getDatabase<T extends {}>(dbName: string): PouchDB.Database<T> {
  if (!dbInstances.has(dbName)) {
    const db = new PouchDB<T>(dbName, DB_CONFIG);
    dbInstances.set(dbName, db);

    // Log database creation
    console.log(`Database initialized: ${dbName}`);
  }

  return dbInstances.get(dbName)!;
}

// --- Database Versioning & Migration ---
export const DB_VERSION = 1;
const VERSION_DOC_ID = 'curio-db-version';

interface VersionDoc {
  _id: string;
  version: number;
  migratedAt: string;
}

/**
 * Get the current database version from the special version doc.
 */
async function getCurrentDbVersion(): Promise<number> {
  try {
    const db = getDatabase<VersionDoc>(DB_NAMES.CONTENT); // Use content DB for version tracking
    const doc = await db.get(VERSION_DOC_ID);
    return doc.version;
  } catch (e) {
    return 0; // Not set yet
  }
}

/**
 * Set the current database version in the special version doc.
 */
async function setCurrentDbVersion(version: number): Promise<void> {
  const db = getDatabase<VersionDoc>(DB_NAMES.CONTENT);
  const now = new Date().toISOString();
  try {
    let doc: VersionDoc;
    try {
      doc = await db.get(VERSION_DOC_ID);
      await db.put({ ...doc, version, migratedAt: now });
    } catch (e) {
      // Not found, create new
      await db.put({ _id: VERSION_DOC_ID, version, migratedAt: now });
    }
    console.log(`Database version set to ${version}`);
  } catch (e) {
    console.error('Failed to set database version:', e);
  }
}

/**
 * Run database migrations if needed.
 */
async function runMigrationsIfNeeded(): Promise<void> {
  const current = await getCurrentDbVersion();
  if (current < DB_VERSION) {
    console.log(`Migrating database from version ${current} to ${DB_VERSION}`);
    // Add migration steps here as needed for future versions
    // For v1, no migration needed
    await setCurrentDbVersion(DB_VERSION);
  } else {
    console.log(`Database is up to date (version ${current})`);
  }
}

/**
 * Initialize all databases
 */
export async function initializeDatabases(): Promise<void> {
  try {
    const databases = Object.values(DB_NAMES);
    for (const dbName of databases) {
      const db = getDatabase<any>(dbName);
      await db.info();
      console.log(`Database ${dbName} is ready`);
    }
    await runMigrationsIfNeeded();
    console.log('All databases initialized successfully');
  } catch (error) {
    console.error('Failed to initialize databases:', error);
    throw error;
  }
}

/**
 * Close all database connections
 */
export async function closeDatabases(): Promise<void> {
  try {
    const closePromises = Array.from(dbInstances.values()).map((db) => db.close());
    await Promise.all(closePromises);
    dbInstances.clear();
    console.log('All database connections closed');
  } catch (error) {
    console.error('Error closing databases:', error);
    throw error;
  }
}

/**
 * Get database info for debugging
 */
export async function getDatabaseInfo(dbName: string): Promise<PouchDB.Core.DatabaseInfo> {
  const db = getDatabase<any>(dbName);
  return await db.info();
}

// Export default database instance for content (most commonly used)
export const contentDB = (): PouchDB.Database<ContentDoc> =>
  getDatabase<ContentDoc>(DB_NAMES.CONTENT);
export const projectsDB = (): PouchDB.Database<ProjectDoc> =>
  getDatabase<ProjectDoc>(DB_NAMES.PROJECTS);
export const categoriesDB = (): PouchDB.Database<CategoryDoc> =>
  getDatabase<CategoryDoc>(DB_NAMES.CATEGORIES);
export const learningPathsDB = (): PouchDB.Database<LearningPathDoc> =>
  getDatabase<LearningPathDoc>(DB_NAMES.LEARNING_PATHS);
export const quizzesDB = (): PouchDB.Database<QuizDoc> => getDatabase<QuizDoc>(DB_NAMES.QUIZZES);
export const userSettingsDB = (): PouchDB.Database<UserSettingsDoc> =>
  getDatabase<UserSettingsDoc>(DB_NAMES.USER_SETTINGS);
export const learningRequestsDB = (): PouchDB.Database<LearningRequestDoc> =>
  getDatabase<LearningRequestDoc>(DB_NAMES.LEARNING_REQUESTS);
export const lessonPlansDB = (): PouchDB.Database<LessonPlanDoc> =>
  getDatabase<LessonPlanDoc>(DB_NAMES.LESSON_PLANS);

// --- CRUD HELPERS ---

// Generic helpers
async function createDoc<T extends BaseDoc>(db: PouchDB.Database<T>, doc: T): Promise<T> {
  const now = new Date().toISOString();
  doc.createdAt = doc.createdAt || now;
  doc.updatedAt = now;
  const result = await db.put(doc);
  return { ...doc, _rev: result.rev };
}

async function getDoc<T extends BaseDoc>(db: PouchDB.Database<T>, id: string): Promise<T | null> {
  try {
    return await db.get(id);
  } catch (e) {
    if ((e as any).status === 404) return null;
    throw e;
  }
}

async function getAllDocs<T extends BaseDoc>(db: PouchDB.Database<T>): Promise<T[]> {
  const result = await db.allDocs({ include_docs: true });
  return result.rows.map((row) => row.doc as T).filter(Boolean);
}

async function updateDoc<T extends BaseDoc>(db: PouchDB.Database<T>, doc: T): Promise<T> {
  doc.updatedAt = new Date().toISOString();
  const result = await db.put(doc);
  return { ...doc, _rev: result.rev };
}

async function deleteDoc<T extends BaseDoc>(db: PouchDB.Database<T>, id: string): Promise<void> {
  const doc = await db.get(id);
  await db.remove(doc);
}

// --- Content ---
export const createContent = (doc: ContentDoc) => createDoc(contentDB(), doc);
export const getContent = (id: string) => getDoc(contentDB(), id);
export const getAllContent = () => getAllDocs(contentDB());
export const updateContent = (doc: ContentDoc) => updateDoc(contentDB(), doc);
export const deleteContent = (id: string) => deleteDoc(contentDB(), id);

// --- Project ---
export const createProject = (doc: ProjectDoc) => createDoc(projectsDB(), doc);
export const getProject = (id: string) => getDoc(projectsDB(), id);
export const getAllProjects = () => getAllDocs(projectsDB());
export const updateProject = (doc: ProjectDoc) => updateDoc(projectsDB(), doc);
export const deleteProject = (id: string) => deleteDoc(projectsDB(), id);

// --- Category ---
export const createCategory = (doc: CategoryDoc) => createDoc(categoriesDB(), doc);
export const getCategory = (id: string) => getDoc(categoriesDB(), id);
export const getAllCategories = () => getAllDocs(categoriesDB());
export const updateCategory = (doc: CategoryDoc) => updateDoc(categoriesDB(), doc);
export const deleteCategory = (id: string) => deleteDoc(categoriesDB(), id);

// --- Learning Path ---
export const createLearningPath = (doc: LearningPathDoc) => createDoc(learningPathsDB(), doc);
export const getLearningPath = (id: string) => getDoc(learningPathsDB(), id);
export const getAllLearningPaths = () => getAllDocs(learningPathsDB());
export const updateLearningPath = (doc: LearningPathDoc) => updateDoc(learningPathsDB(), doc);
export const deleteLearningPath = (id: string) => deleteDoc(learningPathsDB(), id);

// --- Quiz ---
export const createQuiz = (doc: QuizDoc) => createDoc(quizzesDB(), doc);
export const getQuiz = (id: string) => getDoc(quizzesDB(), id);
export const getAllQuizzes = () => getAllDocs(quizzesDB());
export const updateQuiz = (doc: QuizDoc) => updateDoc(quizzesDB(), doc);
export const deleteQuiz = (id: string) => deleteDoc(quizzesDB(), id);

// --- User Settings ---
export const createUserSettings = (doc: UserSettingsDoc) => createDoc(userSettingsDB(), doc);
export const getUserSettings = (id: string) => getDoc(userSettingsDB(), id);
export const getAllUserSettings = () => getAllDocs(userSettingsDB());
export const updateUserSettings = (doc: UserSettingsDoc) => updateDoc(userSettingsDB(), doc);
export const deleteUserSettings = (id: string) => deleteDoc(userSettingsDB(), id);

// --- Learning Request ---
export const createLearningRequest = (doc: LearningRequestDoc) =>
  createDoc(learningRequestsDB(), doc);
export const getLearningRequest = (id: string) => getDoc(learningRequestsDB(), id);
export const getAllLearningRequests = () => getAllDocs(learningRequestsDB());
export const updateLearningRequest = (doc: LearningRequestDoc) =>
  updateDoc(learningRequestsDB(), doc);
export const deleteLearningRequest = (id: string) => deleteDoc(learningRequestsDB(), id);

// --- Lesson Plan ---
export const createLessonPlan = (doc: LessonPlanDoc) => createDoc(lessonPlansDB(), doc);
export const getLessonPlan = (id: string) => getDoc(lessonPlansDB(), id);
export const getAllLessonPlans = () => getAllDocs(lessonPlansDB());
export const updateLessonPlan = (doc: LessonPlanDoc) => updateDoc(lessonPlansDB(), doc);
export const deleteLessonPlan = (id: string) => deleteDoc(lessonPlansDB(), id);

// --- Helper function to get lesson plans by learning request ID ---
export async function getLessonPlansByLearningRequestId(
  learningRequestId: string,
): Promise<LessonPlanDoc[]> {
  const db = lessonPlansDB();
  const result = await db.allDocs({
    include_docs: true,
    startkey: `${learningRequestId}`,
    endkey: `${learningRequestId}\ufff0`,
  });
  return result.rows
    .map((row) => row.doc as LessonPlanDoc)
    .filter(Boolean)
    .filter((doc) => doc.learningRequestId === learningRequestId);
}

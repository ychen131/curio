// PouchDB document base
export interface BaseDoc {
  _id: string;
  _rev?: string;
  createdAt: string;
  updatedAt: string;
}

// Content item (article, video, etc.)
export interface ContentDoc extends BaseDoc {
  type: 'content';
  title: string;
  description: string;
  url?: string;
  categoryIds: string[];
  projectId?: string;
  tags?: string[];
  priority?: number;
  status?: 'inbox' | 'active' | 'completed';
}

// Project (learning project or goal)
export interface ProjectDoc extends BaseDoc {
  type: 'project';
  name: string;
  description?: string;
  deadline?: string;
  contentIds: string[];
  status?: 'active' | 'archived' | 'completed';
}

// Category (topic or tag)
export interface CategoryDoc extends BaseDoc {
  type: 'category';
  name: string;
  color?: string;
  description?: string;
}

// Learning Path (sequence of content)
export interface LearningPathDoc extends BaseDoc {
  type: 'learningPath';
  name: string;
  description?: string;
  contentIds: string[];
  dependencies?: string[];
}

// Quiz (generated from content)
export interface QuizDoc extends BaseDoc {
  type: 'quiz';
  contentId: string;
  questions: QuizQuestion[];
  score?: number;
  takenAt?: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

// User Settings
export interface UserSettingsDoc extends BaseDoc {
  type: 'userSettings';
  theme: 'light' | 'dark' | 'system';
  notificationEnabled: boolean;
  email?: string;
}
